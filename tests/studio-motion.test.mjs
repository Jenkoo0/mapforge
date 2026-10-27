import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioMotionController, emitStudioEvent, initStudioMotion } from '../web/studio-motion.js';

function animationAdapter() {
  const calls = [];
  return {
    calls,
    animate(element, frames, options) {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = { finished, cancelled: false, finish: () => resolve(), cancel() { this.cancelled = true; reject(Error('cancelled')); } };
      calls.push({ element, frames, options, animation });
      return animation;
    },
  };
}
const flush = () => Promise.resolve();

test('rapid feedback replaces its channel and old completion cannot remove the new animation', async () => {
  const adapter = animationAdapter(), motion = createStudioMotionController({ animate: adapter.animate });
  const first = motion.play({}, [], {}, 'page');
  const second = motion.play({}, [], {}, 'page');
  assert.equal(first.cancelled, true);
  assert.equal(motion.activeCount, 1);
  await flush();
  assert.equal(motion.activeCount, 1);
  second.finish();
  await flush();
  assert.equal(motion.activeCount, 0);
});

test('animation ownership stays bounded, also when channels change faster than completion', async () => {
  const adapter = animationAdapter(), motion = createStudioMotionController({ animate: adapter.animate, maxAnimations: 3 });
  for (let i = 0; i < 200; i++) motion.play({}, [], {}, `channel-${i}`);
  assert.equal(motion.activeCount, 3);
  assert.equal(adapter.calls.filter(call => call.animation.cancelled).length, 197);
  motion.dispose();
  await flush();
  assert.equal(motion.activeCount, 0);
  assert.ok(adapter.calls.every(call => call.animation.cancelled));
  assert.equal(motion.play({}, []), null);
});

test('reduced motion and hidden tabs immediately cancel movement without replaying it', async () => {
  const adapter = animationAdapter(), motion = createStudioMotionController({ animate: adapter.animate });
  motion.play({}, [], {}, 'page');
  motion.play({}, [], {}, 'preview');
  motion.setReducedMotion(true);
  assert.equal(motion.activeCount, 0);
  assert.equal(motion.play({}, [{ transform: 'translateY(5px)' }]), null);
  assert.equal(adapter.calls.length, 2);
  motion.setReducedMotion(false);
  assert.equal(motion.activeCount, 0);
  motion.play({}, []);
  motion.setHidden(true);
  assert.equal(motion.activeCount, 0);
  assert.equal(motion.play({}, []), null);
  motion.setHidden(false);
  assert.equal(motion.activeCount, 0);
  await flush();
});

test('an unavailable or failing animation API cannot interrupt application feedback', () => {
  const motion = createStudioMotionController({ animate() { throw Error('unsupported'); } });
  assert.equal(motion.play({}, []), null);
  assert.equal(motion.activeCount, 0);
  const defaultMotion = createStudioMotionController();
  assert.equal(defaultMotion.play({}, []), null);
  assert.doesNotThrow(() => initStudioMotion({ window: {}, document: {} }).dispose());
});

class Target {
  listeners = new Map();
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  dispatchEvent(event) { for (const fn of this.listeners.get(event.type) ?? []) fn(event); return true; }
  fire(type, props = {}) { const event = { type, preventDefault() { this.defaultPrevented = true; }, ...props }; this.dispatchEvent(event); return event; }
}
class Element extends Target {
  constructor(id) {
    super(); this.id = id; this.dataset = {}; this.attributes = {}; this.textContent = ''; this.children = new Map(); this.classes = new Set();
    this.classList = { toggle: (name, yes) => yes ? this.classes.add(name) : this.classes.delete(name), contains: name => this.classes.has(name) };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  querySelector(selector) { return this.children.get(selector) ?? null; }
  closest(selector) { return selector.includes('input,') ? (this.editable ? this : null) : this.selectable ? this : null; }
  matches(selector) { return selector === 'details.inspector-group' && this.inspector; }
  focus() { this.focused = true; }
}
function environment({ saved, denied = false, reduced = false } = {}) {
  const adapter = animationAdapter(), nodes = new Map();
  for (const id of ['studioActivity', 'studioThemeButton', 'studioFocusButton', 'map-preview', 'page-generator', 'page-quality']) nodes.set(id, new Element(id));
  const themeLabel = new Element('theme-label'), focusLabel = new Element('focus-label');
  nodes.get('studioThemeButton').children.set('[data-theme-label], [data-appearance-label]', themeLabel);
  nodes.get('studioFocusButton').children.set('[data-focus-label]', focusLabel);
  const surface = new Element('canvas-wrap'); nodes.get('map-preview').children.set('.canvas-wrap', surface);
  const document = new Target();
  document.body = new Element('body'); document.hidden = false;
  document.getElementById = id => nodes.get(id) ?? null;
  document.querySelector = () => document.dialog ?? null;
  const media = new Target(); media.matches = reduced;
  const writes = [], storage = {
    getItem() { if (denied) throw Error('storage denied'); return saved ?? null; },
    setItem(key, value) { if (denied) throw Error('storage denied'); writes.push({ key, value }); },
  };
  const window = new Target(); window.document = document; window.localStorage = storage; window.matchMedia = () => media;
  window.CustomEvent = class { constructor(type, { detail }) { this.type = type; this.detail = detail; } };
  const api = initStudioMotion({ window, document, animate: adapter.animate });
  return { api, window, document, media, nodes, adapter, surface, writes, themeLabel, focusLabel, event(type, detail) { emitStudioEvent(type, detail, window); } };
}

test('appearance persists separately from maps and remains usable when browser storage is denied', () => {
  const h = environment({ saved: 'dark' });
  assert.equal(h.api.appearance, 'dark');
  assert.equal(h.document.body.dataset.studioTheme, 'dark');
  assert.equal(h.nodes.get('studioThemeButton').getAttribute('aria-label'), 'Helles Design einschalten');
  assert.equal(h.themeLabel.textContent, 'Dunkel');
  h.nodes.get('studioThemeButton').fire('click');
  assert.equal(h.document.body.dataset.studioTheme, 'light');
  assert.equal(h.themeLabel.textContent, 'Hell');
  assert.equal(h.nodes.get('studioThemeButton').children.size, 1);
  assert.deepEqual(h.writes, [{ key: 'mapforge.studio.appearance.v1', value: 'light' }]);
  h.api.dispose();
  const blocked = environment({ denied: true });
  assert.equal(blocked.api.appearance, 'light');
  assert.doesNotThrow(() => blocked.nodes.get('studioThemeButton').fire('click'));
  assert.equal(blocked.api.appearance, 'dark');
  blocked.api.dispose();
  const invalid = environment({ saved: 'script:invalid' });
  assert.equal(invalid.api.appearance, 'light');
  invalid.api.dispose();
});

test('runtime motion preferences cancel actual page and preview feedback while retaining status', async () => {
  const h = environment();
  h.event('page', { page: 'generator' });
  h.event('map', { name: 'Sample', parts: 200 });
  assert.equal(h.api.motion.activeCount, 2);
  assert.ok(h.adapter.calls.every(call => call.options.duration <= 220 && call.options.fill === 'none'));
  assert.equal(h.adapter.calls[1].element, h.surface);
  h.media.matches = true; h.media.fire('change', { matches: true });
  assert.equal(h.api.motion.activeCount, 0);
  h.event('map', { parts: 600 });
  assert.equal(h.nodes.get('studioActivity').textContent, 'Vorschau aktualisiert');
  assert.equal(h.adapter.calls.length, 2);
  h.media.fire('change', { matches: false });
  h.document.hidden = true; h.document.fire('visibilitychange');
  h.event('page', { page: 'quality' });
  assert.equal(h.adapter.calls.length, 2);
  h.document.hidden = false; h.document.fire('visibilitychange');
  assert.equal(h.adapter.calls.length, 2);
  h.event('page', { page: 'quality' });
  assert.equal(h.adapter.calls.length, 3);
  h.window.fire('pagehide');
  assert.equal(h.api.motion.activeCount, 0);
  h.api.dispose();
  await flush();
});

test('work feedback reflects completed actions and overlapping work without inventing progress', () => {
  const h = environment(), status = h.nodes.get('studioActivity'), preview = h.nodes.get('map-preview');
  h.event('work', { kind: 'generation', state: 'start', message: 'Bauteile vorbereiten' });
  assert.equal(status.textContent, 'Bauteile vorbereiten');
  assert.equal(status.dataset.state, 'working');
  assert.equal(status.getAttribute('aria-busy'), 'true');
  assert.equal(preview.getAttribute('aria-busy'), 'true');
  h.event('map', { parts: 123 });
  assert.equal(status.textContent, 'Bauteile vorbereiten');
  h.event('work', { kind: 'export', state: 'start' });
  h.event('work', { kind: 'generation', state: 'done' });
  assert.equal(status.textContent, 'Export wird erstellt …');
  assert.equal(status.dataset.state, 'working');
  assert.equal(preview.getAttribute('aria-busy'), 'false');
  h.event('work', { kind: 'export', state: 'done', message: 'Studio-Datei erstellt' });
  assert.equal(status.textContent, 'Studio-Datei erstellt');
  assert.equal(status.dataset.state, 'success');
  assert.equal(status.getAttribute('aria-busy'), 'false');
  assert.equal(h.document.body.dataset.studioWork, '');
  const before = h.adapter.calls.length;
  h.event('work', { kind: 'export', state: 'error', message: 'Export konnte nicht erstellt werden' });
  assert.equal(status.dataset.state, 'error');
  assert.equal(h.adapter.calls.length, before);
  h.event('work', { kind: 'unknown', state: 'done', message: 'Untrusted action' });
  assert.equal(status.textContent, 'Export konnte nicht erstellt werden');
  h.api.dispose();
});

test('focus mode respects form editing, dialogs and navigation before handling Escape', () => {
  const h = environment(), button = h.nodes.get('studioFocusButton');
  button.fire('click');
  assert.equal(h.api.focused, true);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(h.focusLabel.textContent, 'Fokus verlassen');
  const input = new Element('name'); input.editable = true;
  assert.ok(!h.document.fire('keydown', { key: 'Escape', target: input }).defaultPrevented);
  assert.equal(h.api.focused, true);
  h.document.dialog = {};
  h.document.fire('keydown', { key: 'Escape', target: button });
  assert.equal(h.api.focused, true);
  h.document.dialog = null;
  h.document.body.classes.add('navigation-open');
  h.document.fire('keydown', { key: 'Escape', target: button });
  assert.equal(h.api.focused, true);
  h.document.body.classes.delete('navigation-open');
  h.document.fire('keydown', { key: 'Escape', target: button, defaultPrevented: true });
  assert.equal(h.api.focused, true);
  const escape = h.document.fire('keydown', { key: 'Escape', target: button });
  assert.equal(escape.defaultPrevented, true);
  assert.equal(h.api.focused, false);
  assert.equal(button.focused, true);
  assert.equal(h.focusLabel.textContent, 'Fokus');
  button.fire('click');
  h.event('page', { page: 'quality' });
  assert.equal(h.api.focused, false);
  assert.equal(h.document.body.classList.contains('studio-focus'), false);
  h.api.dispose();
});

test('selected controls and native inspector openings receive bounded feedback without changing focus', () => {
  const h = environment(), button = new Element('design'); button.selectable = true;
  button.setAttribute('aria-pressed', 'false');
  h.document.fire('click', { target: button });
  assert.equal(h.adapter.calls.length, 0);
  button.setAttribute('aria-pressed', 'true');
  h.document.fire('click', { target: button });
  assert.equal(h.adapter.calls.length, 1);
  const details = new Element('inspector'); details.open = true; details.inspector = true;
  h.document.fire('toggle', { target: details });
  assert.equal(h.adapter.calls.length, 2);
  assert.equal(details.focused, undefined);
  h.api.dispose();
});

test('initialisation is idempotent and disposal removes listeners and cancels all owned animations', () => {
  const h = environment();
  assert.equal(initStudioMotion({ window: h.window, document: h.document }), h.api);
  h.event('page', { page: 'generator' });
  h.nodes.get('studioFocusButton').fire('click');
  h.api.dispose();
  assert.equal(h.api.motion.activeCount, 0);
  assert.equal(h.api.focused, false);
  const calls = h.adapter.calls.length;
  h.event('page', { page: 'quality' });
  h.nodes.get('studioThemeButton').fire('click');
  assert.equal(h.adapter.calls.length, calls);
  assert.equal(h.api.appearance, 'light');
  assert.ok([...h.window.listeners.values(), ...h.document.listeners.values()].every(set => set.size === 0));
});

test('event emitter tolerates absent browser methods and only forwards recognised lifecycle events', () => {
  assert.equal(emitStudioEvent('map', {}, {}), false);
  assert.equal(emitStudioEvent('map', {}, { dispatchEvent() { throw Error('missing DOM'); }, CustomEvent: class {} }), false);
  const h = environment();
  assert.equal(emitStudioEvent('secret', {}, h.window), false);
  assert.equal(h.adapter.calls.length, 0);
  assert.equal(emitStudioEvent('page', { page: 'generator' }, h.window), true);
  assert.equal(h.adapter.calls.length, 1);
  h.api.dispose();
});
