import test from 'node:test';
import assert from 'node:assert/strict';
import { drawPreview, previewComparisonFrame } from '../web/preview.js';
import { vertices } from '../web/geometry.js';
import { generate } from '../web/engine.js';
import { visiblePreviewParts } from '../web/preview-state.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const boundsNear = (actual, expected) => { assert.ok(actual); for (const key of ['minX', 'maxX', 'minY', 'maxY']) near(actual[key], expected[key]); };
const part = (pos, size, extra = {}) => ({ pos, size, color: '#204080', kind: 'decor', anchored: true, ...extra });
const obby = parts => ({ config: { mode: 'obby', theme: 'sky' }, parts, stages: [{ index: 0, pos: [0, 0, 0] }, { index: 1, pos: [0, 0, 10] }] });

function recordingCanvas() {
  const calls = [], fills = []; let path = [], gradientId = 0;
  const token = value => value?.gradientId ?? value;
  const gradient = (kind, args) => {
    const gradientIdNow = `${kind}-${gradientId++}`; calls.push([kind, ...args]);
    return { gradientId: gradientIdNow, addColorStop(...values) { calls.push(['addColorStop', gradientIdNow, ...values]); } };
  };
  const methods = {
    createLinearGradient(...args) { return gradient('linear', args); },
    createRadialGradient(...args) { return gradient('radial', args); },
    measureText(text) { calls.push(['measureText', text]); return { width: String(text).length * 7 }; },
    beginPath() { path = []; calls.push(['beginPath']); },
    moveTo(x, y) { path.push([x, y]); calls.push(['moveTo', x, y]); },
    lineTo(x, y) { path.push([x, y]); calls.push(['lineTo', x, y]); },
    fill() { fills.push({ style: token(methods.fillStyle), points: path.map(point => [...point]) }); calls.push(['fill']); },
  };
  const context = new Proxy(methods, {
    get(target, key) { return key in target ? target[key] : (...args) => { calls.push([key, ...args]); }; },
    set(target, key, value) { calls.push(['set', key, token(value)]); target[key] = value; return true; },
  });
  return { width: 800, height: 600, calls, fills, getContext: () => context };
}
const bluePolygons = canvas => canvas.fills.filter(fill => {
  const match = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(fill.style);
  return match && Number(match[1]) < Number(match[2]) && Number(match[2]) < Number(match[3]);
});

test('the frame unions real projected vertices using each entry camera and plan independently', () => {
  const first = obby([part([10, 20, 30], [4, 6, 8])]);
  const second = obby([part([-20, 7, 60], [10, 2, 4])]);
  const frame = previewComparisonFrame([
    { map: first, view: { angle: 0, plan: true } },
    { map: second, view: { angle: Math.PI / 2, plan: false } },
  ]);
  boundsNear(frame, { minX: -62, maxX: 12, minY: -18.72, maxY: 34 });
  boundsNear(previewComparisonFrame([{ map: first, view: { angle: 0 } }]), { minX: 8, maxX: 12, minY: -6.84, maxY: 2.04 });
  assert.deepEqual(previewComparisonFrame([{ map: first }, { map: second }]), previewComparisonFrame([{ map: second }, { map: first }]));
});

test('part rotations and non-box exported vertex geometry are included without changing the map', () => {
  const rotated = obby([part([10, 20, 30], [4, 6, 8], { rotation: [0, 90, 0] })]);
  boundsNear(previewComparisonFrame([{ map: rotated, view: { angle: Math.PI / 2, plan: true } }]), { minX: -32, maxX: -28, minY: 6, maxY: 14 });
  const map = obby([
    part([-15, 3, 7], [8, 6, 4], { shape: 'cylinder', rotation: [15, 0, 90] }),
    part([10, 8, -4], [5, 7, 9], { shape: 'ball', rotation: [0, 40, 0] }),
  ]);
  const before = JSON.stringify(map), points = map.parts.flatMap(vertices);
  boundsNear(previewComparisonFrame([{ map, view: { angle: 0, plan: true } }]), {
    minX: Math.min(...points.map(point => point[0])), maxX: Math.max(...points.map(point => point[0])),
    minY: Math.min(...points.map(point => point[2])), maxY: Math.max(...points.map(point => point[2])),
  });
  assert.equal(JSON.stringify(map), before);
});

test('tycoon framing respects build level, the next buy button and focused plot geometry', () => {
  const map = { config: { mode: 'tycoon', theme: 'sky' }, parts: [
    part([0, 0, 0], [10, 2, 10], { plot: 1 }),
    part([20, 0, 0], [10, 2, 10], { plot: 1, unlock: 'u06' }),
    part([80, 0, 0], [10, 2, 10], { plot: 1, unlock: 'u48' }),
    part([1000, 0, 0], [10, 2, 10], { plot: 2 }),
    part([0, 1, 0], [1, 1, 1], { plot: 1, role: 'Button', upgrade: 'u01' }),
    part([15, 1, 0], [1, 1, 1], { plot: 1, role: 'Button', upgrade: 'u07' }),
    part([2000, 1, 0], [1, 1, 1], { plot: 1, role: 'Button', upgrade: 'u02' }),
  ] };
  for (const [level, maxX] of [[0, 5], [6, 25], [48, 85]]) {
    boundsNear(previewComparisonFrame([{ map, view: { angle: 0, plan: true, level, focusPlot: 1 } }]), { minX: -5, maxX, minY: -5, maxY: 5 });
  }
  boundsNear(previewComparisonFrame([{ map, view: { angle: 0, plan: true, level: 48, focusPlot: 0 } }]), { minX: -5, maxX: 1005, minY: -5, maxY: 5 });

  const actual = generate({ mode: 'tycoon', plots: 2, detail: 0, seed: 'FRAME-ACTUAL', shop: false });
  const view = { angle: .37, level: 6, focusPlot: 2 }, frame = previewComparisonFrame([{ map: actual, view }]);
  const points = visiblePreviewParts(actual, view).flatMap(vertices);
  const projected = points.map(([x, y, z]) => [x * Math.cos(.37) - z * Math.sin(.37), (x * Math.sin(.37) + z * Math.cos(.37)) * .48 - y * .84]);
  boundsNear(frame, {
    minX: Math.min(...projected.map(point => point[0])), maxX: Math.max(...projected.map(point => point[0])),
    minY: Math.min(...projected.map(point => point[1])), maxY: Math.max(...projected.map(point => point[1])),
  });
});

test('a shared frame puts identical geometry at identical screen coordinates and scale in both canvases', () => {
  const shared = part([0, 0, 0], [10, 2, 10]);
  const first = obby([shared]), second = obby([shared, part([30, 0, 0], [10, 2, 10], { color: '#b03020' })]);
  const view = { angle: 0, zoom: 1, labels: false };
  const frame = Object.freeze(previewComparisonFrame([{ map: first, view }, { map: second, view }]));
  const a = recordingCanvas(), b = recordingCanvas(), own = recordingCanvas();
  assert.equal(drawPreview(a, first, view, frame), true); assert.equal(drawPreview(b, second, view, frame), true);
  assert.equal(drawPreview(own, first, view), true);
  // At angle zero only the top and front faces are visible.
  assert.equal(bluePolygons(a).length, 2);
  assert.deepEqual(bluePolygons(a), bluePolygons(b));
  assert.notDeepEqual(bluePolygons(a), bluePolygons(own));
  const xs = bluePolygons(a).flatMap(fill => fill.points.map(point => point[0]));
  // Shared projected X bounds are -5..35, so a 10-unit part occupies 183.75px.
  near(Math.max(...xs) - Math.min(...xs), 183.75);
});

test('missing, invalid and empty frames preserve the exact default rendering command stream', () => {
  const map = obby([part([0, 0, 0], [10, 2, 10], { rotation: [0, 25, 0] })]);
  const view = { angle: -.8, zoom: 1.2, path: true, labels: false }, original = recordingCanvas();
  assert.equal(drawPreview(original, map, view), true);
  const revoked = Proxy.revocable({}, {}); revoked.revoke();
  const invalid = [undefined, null, {}, [], 'frame', { minX: 0, maxX: 5, minY: 0 },
    { minX: '0', maxX: 5, minY: 0, maxY: 2 }, { minX: 0, maxX: Infinity, minY: 0, maxY: 2 },
    { minX: 5, maxX: 0, minY: 0, maxY: 2 }, { minX: 0, maxX: 0, minY: 0, maxY: 2 },
    { minX: -1e308, maxX: 1e308, minY: 0, maxY: 2 }, { minX: 1e308, maxX: 1.7e308, minY: 0, maxY: 2 },
    { get minX() { throw Error('invalid accessor'); } }, revoked.proxy];
  for (const frame of invalid) {
    const canvas = recordingCanvas();
    assert.equal(drawPreview(canvas, map, view, frame), true); assert.deepEqual(canvas.calls, original.calls);
  }
  const ownFrame = Object.freeze(previewComparisonFrame([{ map, view }])), canvas = recordingCanvas();
  drawPreview(canvas, map, view, ownFrame); assert.deepEqual(canvas.calls, original.calls);
  assert.equal(drawPreview({ getContext: () => null }, map, view, ownFrame), false);
});

test('empty, incomplete or non-finite comparison geometry produces no misleading frame', () => {
  for (const entries of [undefined, null, {}, [], [null, {}, { map: null }], [{ map: obby([]) }],
    [{ map: obby([part([NaN, 0, 0], [1, 1, 1])]) }], [{ map: obby([part([0, 0, 0], [1, 1, 1])]), view: { angle: Infinity } }]]) {
    assert.equal(previewComparisonFrame(entries), null);
  }
  const valid = { map: obby([part([0, 0, 0], [2, 2, 2])]), view: { angle: 0, plan: true } };
  boundsNear(previewComparisonFrame([null, { map: obby([]) }, valid]), { minX: -1, maxX: 1, minY: -1, maxY: 1 });
});
