import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCreativeView } from '../web/creative-session.js';
import { generate, normalize } from '../web/engine.js';

const defaults = { angle: -.8, zoom: 1, plan: false, path: false };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('an existing Preview-shaped instance produces a detached view with no map or config fields', () => {
  class ExistingPreview {
    constructor() {
      this.angle = .4; this.zoom = 1.7; this.plan = true; this.path = true;
      this.level = 6; this.focusPlot = 2; this.canvas = {}; this.map = { config: { seed: 'KEEP' } };
    }
  }
  const input = new ExistingPreview(), before = structuredClone({ ...input });
  const result = normalizeCreativeView(input, 'tycoon');
  assert.deepEqual(result, { angle: .4, zoom: 1.7, plan: true, path: true, level: 6 });
  assert.deepEqual({ ...input }, before);
  result.angle = 2; result.level = 48;
  assert.equal(input.angle, .4); assert.equal(input.level, 6);
  assert.notEqual(result, normalizeCreativeView(input, 'tycoon'));
});

test('camera turns preserve their direction while using a bounded canonical angle', () => {
  for (const angle of [-27.6, -Math.PI * 8, -Math.PI, -.8, 0, .6, Math.PI, Math.PI * 11, 94.7]) {
    const result = normalizeCreativeView({ angle }, 'obby');
    assert.ok(result.angle >= -Math.PI && result.angle < Math.PI);
    near(Math.sin(result.angle), Math.sin(angle)); near(Math.cos(result.angle), Math.cos(angle));
    assert.deepEqual(normalizeCreativeView(result, 'obby'), result);
  }
  assert.equal(normalizeCreativeView({ angle: Math.PI }, 'obby').angle, -Math.PI);
  assert.equal(Object.is(normalizeCreativeView({ angle: -0 }, 'obby').angle, -0), false);
  for (const angle of [Number.MAX_VALUE, -Number.MAX_VALUE]) {
    const result = normalizeCreativeView({ angle }, 'obby');
    assert.ok(Number.isFinite(result.angle) && result.angle >= -Math.PI && result.angle < Math.PI);
  }
});

test('zoom is bounded and view toggles require real booleans', () => {
  for (const [zoom, expected] of [[-100, .5], [0, .5], [.5, .5], [1.25, 1.25], [2.5, 2.5], [1e100, 2.5]]) {
    assert.equal(normalizeCreativeView({ zoom }, 'obby').zoom, expected);
  }
  assert.deepEqual(normalizeCreativeView({ plan: true, path: true }, 'obby'), { ...defaults, plan: true, path: true });
  for (const value of ['true', 'false', 1, 0, [], {}, null, undefined]) {
    assert.equal(normalizeCreativeView({ plan: value, path: value }, 'obby').plan, false);
    assert.equal(normalizeCreativeView({ plan: value, path: value }, 'obby').path, false);
  }
});

test('only tycoon comparisons expose a level and only exact supported stages are retained', () => {
  const cases = [[-100, 48], [0, 0], [3, 48], [3.01, 48], [6, 6], [24, 48], [27, 48], [27.01, 48], [48, 48], [Number.MAX_VALUE, 48]];
  for (const [level, expected] of cases) assert.equal(normalizeCreativeView({ level }, 'tycoon').level, expected);
  for (const mode of ['obby', undefined, null, '', 'TYCOON', {}, Symbol('mode')]) {
    assert.deepEqual(normalizeCreativeView({ level: 6 }, mode), defaults);
  }
  for (const value of [undefined, NaN, Infinity, -Infinity, '6', null, false, {}, Symbol('level'), 6n]) {
    assert.equal(normalizeCreativeView({ level: value }, 'tycoon').level, 48);
  }
});

test('untrusted containers, numeric types and accessors fall back without coercion or mutation', () => {
  for (const input of [undefined, null, 6, 'camera', true, Symbol('input'), [], () => {}]) {
    assert.deepEqual(normalizeCreativeView(input, 'obby'), defaults);
  }
  let reads = 0;
  const hostileValue = { valueOf() { reads++; throw Error('coercion'); }, toString() { reads++; throw Error('coercion'); } };
  for (const value of [hostileValue, '1.5', NaN, Infinity, -Infinity, Symbol('number'), 1n]) {
    assert.deepEqual(normalizeCreativeView({ angle: value, zoom: value }, 'obby'), defaults);
  }
  const accessors = Object.fromEntries(Object.keys(defaults).map(key => [key, { get() { reads++; throw Error('getter'); }, enumerable: true }]));
  accessors.level = { get() { reads++; throw Error('getter'); }, enumerable: true };
  const input = Object.defineProperties({}, accessors);
  assert.deepEqual(normalizeCreativeView(input, 'tycoon'), { ...defaults, level: 48 });
  assert.equal(reads, 0);
  assert.deepEqual(normalizeCreativeView(Object.create({ angle: .2, zoom: 2, plan: true, path: true, level: 6 }), 'tycoon'), { ...defaults, level: 48 });
  const proxy = Proxy.revocable({}, {}); proxy.revoke();
  assert.deepEqual(normalizeCreativeView(proxy.proxy, 'obby'), defaults);
  assert.deepEqual(normalizeCreativeView(new Proxy({}, { getOwnPropertyDescriptor() { throw Error('blocked'); } }), 'obby'), defaults);
  const parsed = JSON.parse('{"__proto__":{"plan":true},"zoom":2,"name":"ignored","config":{"seed":"bad"}}');
  assert.deepEqual(normalizeCreativeView(parsed, 'obby'), { ...defaults, zoom: 2 });
  assert.equal({}.plan, undefined);
});

test('comparing multiple cameras cannot change generated geometry, stored config or another view', () => {
  const config = normalize({ mode: 'tycoon', seed: 'VIEW-ISOLATION', plots: 2, detail: 0, shop: false });
  const map = generate(config), before = JSON.stringify(map);
  const input = Object.freeze({ angle: -.8, zoom: 1, plan: false, path: true, level: 6, map, config });
  const left = normalizeCreativeView(input, config.mode);
  const right = normalizeCreativeView({ ...input, angle: 1.4, zoom: 1.9, plan: true }, config.mode);
  left.angle = .7; left.level = 48;
  assert.equal(right.angle, 1.4); assert.equal(right.level, 6);
  assert.equal(input.angle, -.8); assert.equal(input.level, 6);
  assert.equal(JSON.stringify(map), before);
  assert.deepEqual(generate(config).parts, map.parts);
  assert.deepEqual(normalizeCreativeView(right, config.mode), right);
});
