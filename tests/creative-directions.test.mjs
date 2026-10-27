import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CREATIVE_DIRECTIONS, creativeDirectionConfig } from '../web/creative-directions.js';
import { DEFAULT, SCRIPT_FILES, generate, normalize, toRBXLX, validate } from '../web/engine.js';
import { PART_BUDGET, TYCOON_PASSES, TYCOON_PRODUCTS, UPGRADES } from '../web/tycoon.js';

const changedFields = new Set(['mode', 'theme', 'layout', 'detail', 'polish', 'pacing', 'stages', 'difficulty', 'gap', 'rise', 'checkpointEvery', 'seed', 'concept', 'storyId']);
const idFields = ['boostId', 'coinsId', ...TYCOON_PRODUCTS.map(item => item.field), ...TYCOON_PASSES.map(item => item.field)];

test('twelve immutable directions cover both modes, all themes and genuinely different configurations', () => {
  assert.equal(CREATIVE_DIRECTIONS.length, 12);
  assert.equal(new Set(CREATIVE_DIRECTIONS.map(direction => direction.id)).size, 12);
  assert.equal(new Set(CREATIVE_DIRECTIONS.map(direction => direction.title)).size, 12);
  const factories = CREATIVE_DIRECTIONS.filter(direction => direction.mode === 'tycoon');
  const courses = CREATIVE_DIRECTIONS.filter(direction => direction.mode === 'obby');
  assert.equal(factories.length, 6); assert.equal(courses.length, 6);
  assert.equal(new Set(factories.map(direction => direction.config.layout)).size, 3);
  for (const group of [factories, courses]) assert.deepEqual(new Set(group.map(direction => direction.config.theme)), new Set(['sky', 'neon', 'lava', 'jungle']));
  for (const field of ['stages', 'rise']) assert.equal(new Set(courses.map(direction => direction.config[field])).size, 6, field);
  assert.equal(new Set(courses.map(direction => direction.config.difficulty)).size, 3);
  assert.equal(new Set(CREATIVE_DIRECTIONS.map(direction => JSON.stringify(direction.config))).size, 12);
  for (const direction of CREATIVE_DIRECTIONS) {
    assert.equal(direction.mode, direction.config.mode);
    for (const field of ['title', 'hook', 'shape', 'scope']) assert.ok(typeof direction[field] === 'string' && direction[field].length > 8, direction.id + '/' + field);
    assert.ok(Object.keys(direction.config).every(field => changedFields.has(field)));
    assert.equal(direction.sources.length, 2);
    for (const source of direction.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'create.roblox.com');
      assert.ok(url.pathname.startsWith('/docs/tutorials/'));
    }
    assert.ok(Object.isFrozen(direction) && Object.isFrozen(direction.config) && Object.isFrozen(direction.sources));
  }
  assert.throws(() => { CREATIVE_DIRECTIONS[0].config.mode = 'obby'; }, TypeError);
});

test('applying any direction preserves the project identity, product IDs and every unrelated setting', () => {
  const input = {
    ...DEFAULT, mode: 'tycoon', name: 'Creators eigene Welt', autoName: false, plots: 6,
    seed: 'CURRENT-SEED', shop: false, persistence: false, analytics: false,
    shopHints: false, shopHintDelay: 777, shopFocus: 'designs',
    concept: { schema: 1, title: 'Alte Idee', hook: 'Vorheriger Bauplan', twist: '', patterns: ['growth'], references: [], roadmap: [] },
    ...Object.fromEntries(idFields.map((field, index) => [field, String(10001 + index)])),
  };
  const before = structuredClone(input), base = normalize(input);
  for (const direction of CREATIVE_DIRECTIONS) {
    const result = creativeDirectionConfig(input, direction.id);
    for (const [field, value] of Object.entries(base)) if (!changedFields.has(field)) assert.deepEqual(result[field], value, `${direction.id}/${field}`);
    assert.equal(result.name, 'Creators eigene Welt'); assert.equal(result.autoName, false);
    assert.equal(result.concept, null);
    assert.equal(result.storyId, direction.id);
    for (const field of idFields) assert.equal(result[field], input[field], direction.id + '/' + field);
    assert.equal(result.seed, `MF-DIRECTION-${direction.id}-01`);
    assert.notEqual(result.seed, input.seed);
  }
  assert.deepEqual(input, before);
});

test('manual template-like names and auto-name preferences survive switching either mode', () => {
  for (const [mode, name] of [['obby', 'Cloud Kingdom'], ['tycoon', 'Crystal Industries']]) for (const autoName of [true, false]) {
    const current = normalize({ mode, name, autoName });
    for (const direction of CREATIVE_DIRECTIONS) {
      const result = creativeDirectionConfig(current, direction.id);
      assert.equal(result.name, name, `${mode}/${autoName}/${direction.id}`);
      assert.equal(result.autoName, autoName);
    }
  }
});

test('direction seeds are deterministic and inspecting configurations has no persistence or download effect', () => {
  const current = normalize({ mode: 'obby', name: 'Meine Welt', autoName: false });
  const first = CREATIVE_DIRECTIONS.map(direction => creativeDirectionConfig(current, direction.id));
  assert.deepEqual(CREATIVE_DIRECTIONS.map(direction => creativeDirectionConfig(current, direction.id)), first);
  assert.equal(new Set(first.map(config => config.seed)).size, 12);
  const unrelatedSeed = { ...current, seed: 'DIFFERENT' };
  assert.deepEqual(CREATIVE_DIRECTIONS.map(direction => creativeDirectionConfig(unrelatedSeed, direction.id)), first);
  assert.throws(() => creativeDirectionConfig(current, 'missing'), { name: 'RangeError', message: 'Unbekannte kreative Richtung: missing' });
  assert.throws(() => creativeDirectionConfig(current, null), RangeError);
});

test('the actual generator builds twelve distinct valid maps within the budgets, including maximum plot count', () => {
  const fingerprints = new Set();
  for (const plots of [2, 6]) for (const direction of CREATIVE_DIRECTIONS) {
    const config = creativeDirectionConfig({ mode: 'tycoon', name: 'Unverändert', autoName: false, plots, shop: false }, direction.id);
    const map = generate(config), again = generate(config);
    assert.deepEqual(map, again);
    assert.ok(map.parts.length < (direction.mode === 'tycoon' ? PART_BUDGET : 800), `${direction.id}/${plots}: ${map.parts.length}`);
    assert.ok(!validate(map).some(check => check.status === 'error'), `${direction.id}/${plots}: ` + JSON.stringify(validate(map).filter(check => check.status === 'error')));
    assert.ok(map.parts.every(part => part.anchored && part.pos.every(Number.isFinite) && part.size.every(value => Number.isFinite(value) && value > 0)));
    assert.equal(new Set(map.parts.map(part => part.id)).size, map.parts.length);
    if (direction.mode === 'tycoon') {
      assert.equal(map.plots.length, plots);
      for (const plot of map.plots) assert.equal(map.parts.filter(part => part.plot === plot.index && part.role === 'Button').length, UPGRADES.length);
    } else {
      assert.equal(map.stages.length, config.stages + 1);
      assert.ok(map.stages[0].checkpoint && map.stages.at(-1).finish);
      assert.equal(map.parts.filter(part => part.kind === 'spawn').length, 1);
    }
    if (plots === 2) fingerprints.add(JSON.stringify(map.parts.map(part => [part.pos, part.size, part.color])));
  }
  assert.equal(fingerprints.size, 12);
});

test('the six established direction IDs retain their original preset configuration and default seeds', () => {
  const legacy = {
    prismahafen: { mode: 'tycoon', theme: 'sky', layout: 'skyline', detail: 3, polish: 1, pacing: 'brisk' },
    'blattwerk-campus': { mode: 'tycoon', theme: 'jungle', layout: 'campus', detail: 2, polish: 2, pacing: 'balanced' },
    glutachse: { mode: 'tycoon', theme: 'lava', layout: 'flow', detail: 3, polish: 1, pacing: 'relaxed' },
    wolkensaum: { mode: 'obby', theme: 'sky', stages: 18, difficulty: 'easy', gap: 2.5, rise: .6, checkpointEvery: 3, detail: 2 },
    signalsteg: { mode: 'obby', theme: 'neon', stages: 36, difficulty: 'normal', gap: 4, rise: 1.4, checkpointEvery: 5, detail: 2 },
    aschepfad: { mode: 'obby', theme: 'lava', stages: 54, difficulty: 'hard', gap: 5, rise: 2.2, checkpointEvery: 6, detail: 2 },
  };
  assert.deepEqual(CREATIVE_DIRECTIONS.slice(0, 6).map(direction => direction.id), Object.keys(legacy));
  for (const [id, config] of Object.entries(legacy)) {
    assert.deepEqual(CREATIVE_DIRECTIONS.find(direction => direction.id === id).config, config);
    assert.equal(creativeDirectionConfig({}, id).seed, `MF-DIRECTION-${id}-01`);
  }
});

test('all directions export their complete geometry and the existing mode-specific runtime sources', async () => {
  const scripts = Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async ([key, file]) => [key, await readFile(new URL(`../web/lua/${file}.lua`, import.meta.url), 'utf8')])));
  const xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  for (const direction of CREATIVE_DIRECTIONS) {
    const map = generate(creativeDirectionConfig({ name: 'Eigene & neue Welt', autoName: false, plots: 2, shop: false }, direction.id));
    const result = toRBXLX(map, scripts);
    assert.equal([...result.matchAll(/<Item class="(?:Part|SpawnLocation)" /g)].length, map.parts.length, direction.id);
    const server = direction.mode === 'tycoon' ? scripts.tycoonServer : scripts.server;
    const client = direction.mode === 'tycoon' ? scripts.tycoonClient : scripts.client;
    assert.ok(result.includes(xml(server)), direction.id + '/server');
    assert.ok(result.includes(xml(client)), direction.id + '/client');
    assert.ok(result.includes(`Theme = &quot;${map.config.theme}&quot;`));
    assert.ok(result.includes('Eigene &amp; neue Welt'));
    assert.ok(!result.includes('NaN') && !result.includes('Infinity'));
  }
});
