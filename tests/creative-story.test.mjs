import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATIVE_DIRECTIONS, CREATIVE_VARIANT_COUNT, creativeDirectionConfig } from '../web/creative-directions.js';
import { creativeStoryMarkdown, storyForConfig } from '../web/creative-story.js';
import { DEFAULT, generate, normalize, configLua } from '../web/engine.js';
import { UPGRADES } from '../web/tycoon.js';

test('each world has its own immutable premise, role, goal and three chronological real progress beats', () => {
  const premises = new Set(), roles = new Set(), chapterTitles = new Set();
  for (const direction of CREATIVE_DIRECTIONS) {
    const story = direction.story;
    assert.ok(Object.isFrozen(story) && Object.isFrozen(story.chapters));
    for (const field of ['premise', 'playerRole', 'goal']) assert.ok(typeof story[field] === 'string' && story[field].length >= 25, `${direction.id}/${field}`);
    premises.add(story.premise); roles.add(story.playerRole);
    assert.equal(story.chapters.length, 3);
    const milestones = [];
    for (const chapter of story.chapters) {
      assert.ok(Object.isFrozen(chapter) && Object.isFrozen(chapter.trigger));
      assert.ok(chapter.title.length >= 8 && chapter.text.length >= 50);
      chapterTitles.add(chapter.title);
      if (direction.mode === 'tycoon') {
        assert.equal(chapter.trigger.kind, 'upgrade');
        const upgrade = UPGRADES.find(item => item.id === chapter.trigger.id);
        assert.ok(upgrade); assert.equal(chapter.trigger.count, upgrade.index);
        milestones.push(upgrade.index);
      } else {
        assert.equal(chapter.trigger.kind, 'stage');
        const index = chapter.trigger.index;
        assert.ok(Number.isInteger(index) && index > 0 && index <= direction.config.stages);
        assert.ok(index === direction.config.stages || index % direction.config.checkpointEvery === 0);
        milestones.push(index);
      }
    }
    assert.ok(milestones[0] < milestones[1] && milestones[1] < milestones[2]);
    assert.equal(milestones[2], direction.mode === 'tycoon' ? 48 : direction.config.stages);
  }
  assert.equal(premises.size, 12); assert.equal(roles.size, 12); assert.equal(chapterTitles.size, 36);
  assert.throws(() => { CREATIVE_DIRECTIONS[0].story.chapters[0].trigger.count = 99; }, TypeError);
});

test('all thirty-six normal saved configurations recover detached stories without a second config schema', () => {
  for (const direction of CREATIVE_DIRECTIONS) for (let variant = 1; variant <= CREATIVE_VARIANT_COUNT; variant++) {
    const config = creativeDirectionConfig({ name: 'Eigene Welt', autoName: false, plots: 2, shop: false, cashSmallId: '123456' }, direction.id, variant);
    const before = structuredClone(config), restored = JSON.parse(JSON.stringify(config));
    const story = storyForConfig(restored);
    assert.ok(story); assert.equal(story.directionId, direction.id); assert.equal(story.variant, variant);
    assert.equal(story.seed, config.seed); assert.equal(story.title, direction.title);
    assert.deepEqual(story.chapters, direction.story.chapters);
    assert.equal(story.runtimeQuestsImplemented, false);
    assert.equal(story.presentation, 'world-signs-progress-journal-and-build-plan');
    assert.equal(config.concept, null);
    assert.deepEqual(config, before);
    story.chapters[0].text = 'Local edit'; story.chapters[0].trigger.kind = 'changed';
    assert.deepEqual(storyForConfig(config).chapters, direction.story.chapters);
  }
});

test('explicit story association survives personal geometry and seed changes but never crosses game modes', () => {
  const original = creativeDirectionConfig({}, 'mondumschlag', 2);
  assert.ok(storyForConfig(original));
  for (const patch of [{ seed: 'Meine neue Welt' }, { seed: original.seed.replace('-02', '-04') }, { stages: 12 }, { theme: 'lava' }, { detail: 0 }, { checkpointEvery: 10 }, { layout: 'skyline', pacing: 'relaxed' }]) {
    assert.equal(storyForConfig({ ...original, ...patch }).directionId, original.storyId);
  }
  for (const patch of [{ mode: 'tycoon' }, { storyId: '' }, { storyId: 'unknown' }, { storyId: 'prismahafen' }]) assert.equal(storyForConfig({ ...original, ...patch }), null);
  assert.ok(storyForConfig({ ...original, name: 'Mein eigener Name', plots: 6, coinsId: '998877', shop: true, persistence: true, analytics: true }));
  for (const input of [undefined, null, false, 7, 'story', [], {}, Object.create(original)]) assert.equal(storyForConfig(input), null);
  let getters = 0;
  const hostile = { get seed() { getters++; throw Error('getter'); } };
  assert.equal(storyForConfig(hostile), null); assert.equal(getters, 0);
  const revoked = Proxy.revocable({}, {}); revoked.revoke();
  assert.equal(storyForConfig(revoked.proxy), null);
});

test('chapter milestones refer to actual generated upgrades and checkpoint/finish geometry', () => {
  for (const direction of CREATIVE_DIRECTIONS) {
    const config = creativeDirectionConfig({ plots: 2, shop: false }, direction.id);
    const map = generate(config), story = storyForConfig(map.config);
    assert.ok(story);
    assert.equal(map.parts.filter(part => part.storyChapter).length, direction.mode === 'tycoon' ? config.plots * 3 : 3);
    for (const chapter of story.chapters) {
      if (direction.mode === 'tycoon') {
        for (const plot of map.plots) {
          assert.ok(map.parts.some(part => part.plot === plot.index && part.role === 'Button' && part.upgrade === chapter.trigger.id));
          assert.ok(map.parts.some(part => part.plot === plot.index && part.unlock === chapter.trigger.id));
        }
      } else {
        const stage = map.stages.find(stage => stage.index === chapter.trigger.index);
        assert.ok(stage && (stage.checkpoint || stage.finish));
        assert.ok(map.parts.some(part => part.kind === 'stage' && part.stage === stage.index));
      }
    }
  }
});

test('story markdown is deterministic, escapes project text and distinguishes editorial beats from runtime systems', () => {
  const tycoon = creativeDirectionConfig({ name: '<script>bad()</script> **Projekt**\n# New', autoName: false }, 'nachtpost', 3);
  const obby = creativeDirectionConfig({}, 'tautreppe', 1);
  for (const config of [tycoon, obby]) {
    const markdown = creativeStoryMarkdown(config);
    assert.equal(markdown, creativeStoryMarkdown(JSON.parse(JSON.stringify(config))));
    assert.equal((markdown.match(/^### \d\./gm) || []).length, 3);
    assert.ok(markdown.includes(config.seed));
    assert.match(markdown, /nicht implementiert/);
    assert.match(markdown, /statische Storytafeln/);
    assert.doesNotMatch(markdown, /https?:\/\/|Spielerzahlen|garantiert|60 FPS/);
  }
  const markdown = creativeStoryMarkdown(tycoon);
  assert.ok(markdown.includes('&lt;script&gt;') && markdown.includes('\\*\\*Projekt\\*\\*'));
  assert.ok(!markdown.includes('<script>') && !markdown.includes('\n# New'));
  assert.match(markdown, /Ausbau 40\/48 \(u40\)/);
  assert.match(creativeStoryMarkdown(obby), /Abschnitt 24/);
  assert.match(creativeStoryMarkdown({ seed: 'USER-SEED' }), /keine kuratierte Weltgeschichte/);
});

test('story IDs normalize independently from purchase settings and migrate only legacy projects without a selection', () => {
  assert.equal(DEFAULT.storyId, '');
  const protectedSettings = { cashSmallId: '998877', coinsId: '334455', vipPassId: '776655', shop: false, persistence: false, shopHints: false, analytics: false };
  for (const direction of CREATIVE_DIRECTIONS) {
    const selected = normalize({ mode: direction.mode, storyId: direction.id, seed: 'CUSTOM', ...protectedSettings });
    assert.equal(selected.storyId, direction.id);
    for (const [field, value] of Object.entries(protectedSettings)) assert.equal(selected[field], value);
    assert.equal(normalize({ ...selected, mode: direction.mode === 'obby' ? 'tycoon' : 'obby' }).storyId, '');
    for (const variant of [1, 2, 3]) {
      const legacy = { ...direction.config, seed: `MF-DIRECTION-${direction.id}-0${variant}` };
      assert.equal(normalize(legacy).storyId, direction.id);
      assert.equal(storyForConfig(legacy).directionId, direction.id);
      assert.equal(normalize({ ...legacy, detail: 0, stages: 61 }).storyId, direction.id);
      for (const storyId of ['', 'unknown', null, undefined, {}, 1, `${direction.id} `]) {
        assert.equal(normalize({ ...legacy, storyId }).storyId, '');
        assert.equal(storyForConfig({ ...legacy, storyId }), null);
      }
      assert.equal(normalize({ ...legacy, seed: `${legacy.seed}-extra` }).storyId, '');
      assert.equal(normalize({ ...legacy, mode: direction.mode === 'obby' ? 'tycoon' : 'obby' }).storyId, '');
    }
    assert.deepEqual(normalize(JSON.parse(JSON.stringify(selected))), selected);
  }
});

test('all allowed obby lengths and checkpoint gaps remap to three ordered real milestones and the current finish', () => {
  for (const direction of CREATIVE_DIRECTIONS.filter(direction => direction.mode === 'obby')) {
    for (let stages = 12; stages <= 80; stages++) for (let checkpointEvery = 2; checkpointEvery <= 10; checkpointEvery++) {
      const config = { ...direction.config, storyId: direction.id, seed: 'CUSTOM', stages, checkpointEvery };
      const story = storyForConfig(config), indices = story.chapters.map(chapter => chapter.trigger.index);
      assert.equal(indices.length, 3); assert.equal(indices.at(-1), stages);
      assert.ok(indices[0] < indices[1] && indices[1] < indices[2], `${direction.id}/${stages}/${checkpointEvery}`);
      assert.ok(indices.every(index => index >= 0 && index <= stages && (index === stages || index % checkpointEvery === 0)));
      assert.match(story.goal, new RegExp(`\\b${stages}\\b`));
      assert.deepEqual(storyForConfig(config), story);
      if (indices[0] === 0) assert.ok(Math.floor((stages - 1) / checkpointEvery) < 2, 'start is used only when two intermediate checkpoints are unavailable');
    }
  }
  const short = storyForConfig({ mode: 'obby', storyId: 'wolkensaum', stages: 12, checkpointEvery: 10 });
  assert.deepEqual(short.chapters.map(chapter => chapter.trigger.index), [0, 10, 12]);
});

test('Lua configuration exports the same detached story and remapped targets, or an explicit nil', () => {
  for (const direction of CREATIVE_DIRECTIONS) {
    const config = normalize({ ...creativeDirectionConfig({ plots: 2, shop: false }, direction.id), seed: 'CUSTOM', stages: 43, checkpointEvery: 7 });
    const map = generate(config), story = storyForConfig(config), lua = configLua(map);
    assert.ok(lua.includes(`Story = { Title="${story.title}"`));
    assert.ok(lua.includes(`Premise="${story.premise}"`) && lua.includes(`Goal="${story.goal}"`));
    assert.deepEqual([...lua.matchAll(/Text="[^"]*",Target=(\d+)/g)].map(match => Number(match[1])), story.chapters.map(chapter => chapter.trigger.kind === 'upgrade' ? chapter.trigger.count : chapter.trigger.index));
    assert.match(configLua(generate({ ...config, storyId: '' })), / Story = nil,/);
  }
  const markdown = creativeStoryMarkdown({ ...creativeDirectionConfig({}, 'wolkensaum'), seed: '<script>**test**\n# injected' });
  assert.ok(markdown.includes('&lt;script&gt;\\*\\*test\\*\\*'));
  assert.ok(!markdown.includes('<script>') && !markdown.includes('\n# injected') && !markdown.includes('Variante null'));
});
