import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { addCreativeWorldDetails } from '../web/creative-world.js';
import { CREATIVE_DIRECTIONS, creativeDirectionConfig } from '../web/creative-directions.js';
import { storyForConfig } from '../web/creative-story.js';
import { generate, normalize, rng, VERSION, SCRIPT_FILES, configLua, toRBXLX } from '../web/engine.js';
import { vertices } from '../web/geometry.js';
import { visiblePreviewParts } from '../web/preview-state.js';
import { generateTycoon, PART_BUDGET } from '../web/tycoon.js';

const boards = map => map.parts.filter(part => part.storyChapter);
const bounds = part => {
  const points = vertices(part);
  return [0, 1, 2].map(axis => [Math.min(...points.map(point => point[axis])), Math.max(...points.map(point => point[axis]))]);
};
const overlaps = (a, b) => a.every((range, axis) => range[0] < b[axis][1] - .01 && range[1] > b[axis][0] + .01);
const scripts = Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async ([key, file]) => [key, await readFile(new URL(`../web/lua/${file}.lua`, import.meta.url), 'utf8')])));

test('unrelated or explicitly cleared configurations receive no story geometry', () => {
  for (const mode of ['tycoon', 'obby']) {
    const map = generate({ mode, seed: 'Meine unveränderte Map', shop: false });
    const before = structuredClone(map);
    assert.equal(boards(map).length, 0);
    assert.equal(addCreativeWorldDetails(map), map);
    assert.deepEqual(map, before);
  }
  const config = creativeDirectionConfig({}, 'prismahafen');
  const changed = generate({ ...config, layout: 'flow', storyId: '' });
  assert.equal(storyForConfig(changed.config), null);
  assert.equal(boards(changed).length, 0);
});

test('personalized layouts and routes retain safe story signs at actual progress milestones', () => {
  const cases = [];
  for (const direction of CREATIVE_DIRECTIONS) {
    const base = creativeDirectionConfig({ plots: 6, shop: false }, direction.id);
    if (direction.mode === 'tycoon') {
      for (const layout of ['flow', 'campus', 'skyline']) for (const detail of [0, 3]) for (const polish of [0, 2]) cases.push({ ...base, layout, detail, polish, seed: `My ${layout} ${detail} ${polish}` });
    } else {
      for (const patch of [
        { stages: 12, checkpointEvery: 10, gap: 1, rise: 0, detail: 0 },
        { stages: 17, checkpointEvery: 2, gap: 12, rise: 7, detail: 3 },
        { stages: 43, checkpointEvery: 7, gap: 4, rise: 1, detail: 2 },
        { stages: 80, checkpointEvery: 10, gap: 1, rise: 0, detail: 3 },
      ]) cases.push({ ...base, ...patch, seed: `My course ${patch.stages}` });
    }
  }
  for (const config of cases) {
    const map = generate(config), signs = boards(map), story = storyForConfig(map.config);
    const original = generate({ ...config, storyId: '' });
    assert.deepEqual(map.parts.slice(0, original.parts.length), original.parts, `${config.storyId}: changes base geometry`);
    assert.equal(signs.length, config.mode === 'tycoon' ? config.plots * 3 : 3);
    assert.equal(map.parts.length, original.parts.length + signs.length, 'story has a fixed three-part cost per course or plot');
    if (config.mode === 'tycoon') assert.ok(map.parts.length < PART_BUDGET, `${config.storyId}/${config.layout}/${config.detail}/${config.polish}: ${map.parts.length}`);
    const occupied = original.parts.map(part => ({ name: part.name, box: bounds(part) }));
    for (const sign of signs) {
      const box = bounds(sign), chapter = story.chapters[sign.storyChapter - 1];
      assert.deepEqual(occupied.filter(part => overlaps(box, part.box)).map(part => part.name), [], `${config.storyId}/${config.layout}/${config.stages}/${sign.name}`);
      if (config.mode === 'tycoon') {
        assert.equal(sign.unlock, chapter.trigger.id);
        for (const path of map.paths.filter(path => path.plot === sign.plot)) assert.equal(overlaps(box, [[path.x-path.size[0]/2,path.x+path.size[0]/2],[-100,100],[path.z-path.size[1]/2,path.z+path.size[1]/2]]), false);
      } else {
        const stage = map.stages.find(stage => stage.index === sign.stage);
        assert.equal(sign.stage, chapter.trigger.index);
        assert.ok(stage.checkpoint || stage.finish);
      }
    }
  }
});

test('every curated variant has exactly three safe physical chapter signs per plot or course', () => {
  for (const direction of CREATIVE_DIRECTIONS) for (const variant of [1, 2, 3]) {
    const map = generate(creativeDirectionConfig({ plots: 6, shop: false }, direction.id, variant));
    const story = storyForConfig(map.config), signs = boards(map);
    const originalBounds = map.parts.filter(part => !part.storyChapter).map(part => ({ name: part.name, box: bounds(part) }));
    assert.equal(signs.length, direction.mode === 'tycoon' ? 18 : 3, `${direction.id}/${variant}`);
    assert.ok(map.parts.length < (direction.mode === 'tycoon' ? PART_BUDGET : 800), `${direction.id}: ${map.parts.length}`);
    assert.equal(new Set(map.parts.map(part => part.id)).size, map.parts.length);
    assert.equal(Math.max(...map.parts.map(part => part.id)), map.parts.length);
    assert.equal(addCreativeWorldDetails(map), map, 'reapplying details is idempotent');
    for (const sign of signs) {
      const chapter = story.chapters[sign.storyChapter - 1];
      assert.equal(sign.label, `${sign.storyChapter}. ${chapter.title}\n${chapter.text}`);
      assert.deepEqual(sign.sign, { mode: 'surface', width: 512, height: 256, distance: 28 });
      assert.equal(sign.anchored, true); assert.equal(sign.collide, false); assert.equal(sign.query, false);
      assert.equal(sign.castShadow, false); assert.equal(sign.role, undefined); assert.equal(sign.upgrade, undefined);
      assert.ok(sign.pos.every(Number.isFinite) && sign.size.every(size => size > 0));
      const box = bounds(sign);
      assert.deepEqual(originalBounds.filter(part => overlaps(box, part.box)).map(part => part.name), [], `${direction.id}/${variant}/${sign.name} overlaps existing geometry`);
      if (direction.mode === 'tycoon') {
        assert.equal(sign.hiddenAtStart, true); assert.equal(sign.unlock, chapter.trigger.id);
        const plot = map.plots.find(plot => plot.index === sign.plot);
        assert.ok(plot);
        assert.equal(Math.abs(sign.pos[0] - plot.pos[0]), 79);
        assert.ok([72, 24].includes(Math.abs(sign.pos[2] - plot.pos[2])));
        for (const path of map.paths.filter(path => path.plot === plot.index)) {
          const pathBox = [[path.x - path.size[0] / 2, path.x + path.size[0] / 2], [-100, 100], [path.z - path.size[1] / 2, path.z + path.size[1] / 2]];
          assert.equal(overlaps(box, pathBox), false, `${sign.name} enters a reserved path`);
        }
      } else {
        assert.equal(sign.stageIndex, chapter.trigger.index); assert.equal(sign.stage, chapter.trigger.index);
        assert.equal(sign.hiddenAtStart, undefined); assert.equal(sign.unlock, undefined);
        const stage = map.stages.find(stage => stage.index === sign.stageIndex);
        const distance = Math.hypot(sign.pos[0] - stage.pos[0], sign.pos[2] - stage.pos[2]);
        assert.ok(distance >= 12.99 && distance <= 24.01);
        assert.ok(Math.abs(sign.pos[1] - stage.pos[1] - 4.5) < .001);
      }
    }
    if (direction.mode === 'tycoon') for (const plot of map.plots) assert.equal(signs.filter(sign => sign.plot === plot.index).length, 3);
  }
});

test('chapter signs preserve all existing tycoon geometry, economy and exported runtime configuration', () => {
  for (const direction of CREATIVE_DIRECTIONS.filter(direction => direction.mode === 'tycoon')) for (const plots of [2, 6]) {
    const config = normalize(creativeDirectionConfig({ plots, shop: false, cashSmallId: '12345' }, direction.id, 2));
    const original = generateTycoon(config, { rng, version: VERSION }), map = generate(config);
    assert.deepEqual({ ...map, parts: map.parts.slice(0, original.parts.length) }, original);
    assert.deepEqual(map.config, config);
    assert.equal(configLua(map), configLua(original));
    assert.deepEqual(generate(config), map, 'the same preset and seed produce the same signs');
  }
});

test('tycoon chapter visibility follows the existing upgrade boundary and selected plot', () => {
  for (const direction of CREATIVE_DIRECTIONS.filter(direction => direction.mode === 'tycoon')) {
    const map = generate(creativeDirectionConfig({ plots: 2 }, direction.id));
    const story = storyForConfig(map.config);
    for (let count = 0; count <= 48; count++) {
      const shown = boards({ parts: visiblePreviewParts(map, { level: count, focusPlot: 2 }) });
      const expected = story.chapters.map((chapter, index) => ({ chapter, index })).filter(({ chapter }) => chapter.trigger.count <= count).map(({ index }) => index + 1);
      assert.deepEqual(shown.map(sign => sign.storyChapter), expected, `${direction.id}/${count}`);
      assert.ok(shown.every(sign => sign.plot === 2));
    }
  }
});

function partItem(xml, name) {
  const at = xml.indexOf(`<string name="Name">${name}</string>`);
  assert.ok(at >= 0, name);
  const start = xml.lastIndexOf('<Item class="Part"', at), tags = /<Item\b[^>]*>|<\/Item>/g;
  tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(xml))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return xml.slice(start, tags.lastIndex);
  }
  assert.fail(`Unclosed exported part ${name}`);
}

test('Roblox XML includes readable SurfaceGuis, noninteractive parts and existing unlock/stage metadata', () => {
  for (const id of ['blattwerk-campus', 'tautreppe']) {
    const map = generate(creativeDirectionConfig({ plots: 2, shop: false }, id));
    const xml = toRBXLX(map, scripts);
    for (const sign of boards(map)) {
      const item = partItem(xml, sign.name);
      const properties = item.slice(0, item.indexOf('</Properties>'));
      assert.match(properties, /<bool name="Anchored">true<\/bool>/);
      for (const field of ['CanCollide', 'CanTouch', 'CanQuery', 'CastShadow']) assert.ok(properties.includes(`<bool name="${field}">false</bool>`), field);
      assert.equal((item.match(/<Item class="SurfaceGui"/g) || []).length, 2);
      assert.equal((item.match(/<CanvasSize>/g) || []).length, 0);
      assert.equal((item.match(/<Vector2 name="CanvasSize"><X>512<\/X><Y>256<\/Y><\/Vector2>/g) || []).length, 2);
      assert.equal((item.match(/<float name="MaxDistance">28<\/float>/g) || []).length, 2);
      assert.equal((item.match(/<bool name="TextWrapped">true<\/bool>/g) || []).length, 2);
      if (map.config.mode === 'tycoon') {
        assert.match(properties, /<float name="Transparency">1<\/float>/);
        assert.ok(item.includes(`<string name="Name">MFUnlock</string><string name="Value">${sign.unlock}</string>`));
        assert.equal((item.match(/<bool name="Enabled">false<\/bool>/g) || []).length, 2);
      } else {
        assert.ok(item.includes(`<string name="Name">MFStage</string><int name="Value">${sign.stage}</int>`));
        assert.equal((item.match(/<bool name="Enabled">true<\/bool>/g) || []).length, 2);
      }
    }
  }
});
