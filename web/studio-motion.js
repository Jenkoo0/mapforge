// Small, interruptible UI feedback. Map rendering and work remain owned by app.js.
const APPEARANCE_KEY = 'mapforge.studio.appearance.v1';
const EVENT_TYPES = new Set(['page', 'map', 'work']);
const instances = new WeakMap();

/** Dispatch a completed application action; this helper also tolerates test/SSR DOMs. */
export function emitStudioEvent(type, detail, target = globalThis.window) {
  if (!EVENT_TYPES.has(type) || typeof target?.dispatchEvent !== 'function') return false;
  const EventClass = target.CustomEvent ?? globalThis.CustomEvent;
  if (typeof EventClass !== 'function') return false;
  try { return target.dispatchEvent(new EventClass(`mapforge:${type}`, { detail })); }
  catch { return false; }
}

/** One animation per feedback channel, with a hard bound and no persistent loop. */
export function createStudioMotionController({ animate = (element, frames, options) => element.animate(frames, options), reducedMotion = false, hidden = false, maxAnimations = 5 } = {}) {
  const active = new Map();
  const limit = Number.isInteger(maxAnimations) ? Math.min(8, Math.max(1, maxAnimations)) : 5;
  let reduced = !!reducedMotion;
  let concealed = !!hidden;
  let disposed = false;
  const stop = key => {
    const entry = active.get(key);
    if (!entry) return;
    active.delete(key);
    try { entry.animation.cancel?.(); } catch { /* Feedback cannot block an action. */ }
  };
  const cancelAll = () => { for (const key of [...active.keys()]) stop(key); };
  return {
    play(element, frames, options = {}, channel = element) {
      stop(channel);
      if (disposed || reduced || concealed || !element) return null;
      let animation;
      try { animation = animate(element, frames, { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)', ...options, fill: 'none' }); }
      catch { return null; }
      if (!animation) return null;
      while (active.size >= limit) stop(active.keys().next().value);
      const entry = { element, animation };
      active.set(channel, entry);
      const finish = () => { if (active.get(channel) === entry) active.delete(channel); };
      // Handling both outcomes also consumes the rejected finished promise on cancel.
      try {
        if (animation.finished?.then) animation.finished.then(finish, finish);
        else if (animation.addEventListener) {
          animation.addEventListener('finish', finish, { once: true });
          animation.addEventListener('cancel', finish, { once: true });
        } else stop(channel);
      } catch { stop(channel); }
      return animation;
    },
    cancel: stop,
    cancelAll,
    setReducedMotion(value) { reduced = !!value; if (reduced) cancelAll(); },
    setHidden(value) { concealed = !!value; if (concealed) cancelAll(); },
    dispose() { disposed = true; cancelAll(); },
    get activeCount() { return active.size; },
    get reducedMotion() { return reduced; },
    get hidden() { return concealed; },
  };
}

/** Initialise once after markup exists. Optional dependencies make policy testable. */
export function initStudioMotion(options = {}) {
  const win = options.window ?? globalThis.window;
  const doc = options.document ?? win?.document ?? globalThis.document;
  if (!doc || typeof doc !== 'object' || !doc.body) return { dispose() {} };
  if (instances.has(doc)) return instances.get(doc);
  const byId = id => doc.getElementById?.(id);
  const body = doc.body;
  const activity = byId('studioActivity');
  const themeButton = byId('studioThemeButton');
  const focusButton = byId('studioFocusButton');
  const preview = byId('map-preview') ?? doc.querySelector?.('.preview-panel');
  let media;
  try { media = win?.matchMedia?.('(prefers-reduced-motion: reduce)'); } catch { /* Optional API. */ }
  const motion = createStudioMotionController({
    animate: options.animate,
    reducedMotion: media?.matches,
    hidden: doc.hidden === true || doc.visibilityState === 'hidden',
  });
  const cleanup = [];
  const work = new Map();
  let focused = false;
  let appearance = 'light';
  let disposed = false;
  let storage;
  try { storage = options.storage ?? win?.localStorage; } catch { /* Private mode may deny storage. */ }
  const attr = (element, name, value) => element?.setAttribute?.(name, String(value));
  const data = (element, name, value) => {
    if (element?.dataset) element.dataset[name] = String(value);
    else attr(element, `data-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value);
  };
  const listen = (target, type, listener, capture = false) => {
    if (typeof target?.addEventListener !== 'function') return;
    target.addEventListener(type, listener, capture);
    cleanup.push(() => target.removeEventListener?.(type, listener, capture));
  };
  const setActivity = (message, state = 'ready') => {
    if (activity) activity.textContent = message;
    data(activity, 'state', state);
    attr(activity, 'aria-busy', work.size > 0);
  };
  const setTheme = (value, persist = true) => {
    appearance = value === 'dark' ? 'dark' : 'light';
    data(body, 'studioTheme', appearance);
    const label = appearance === 'dark' ? 'Helles Design einschalten' : 'Dunkles Design einschalten';
    attr(themeButton, 'aria-label', label);
    attr(themeButton, 'title', label);
    attr(themeButton, 'aria-pressed', appearance === 'dark');
    data(themeButton, 'appearance', appearance);
    const visibleLabel = themeButton?.querySelector?.('[data-theme-label], [data-appearance-label]');
    if (visibleLabel) visibleLabel.textContent = appearance === 'dark' ? 'Dunkel' : 'Hell';
    if (persist) { try { storage?.setItem(APPEARANCE_KEY, appearance); } catch { /* The current session still works. */ } }
  };
  const setFocus = (value, restore = false) => {
    const changed = focused !== !!value;
    focused = !!value;
    body.classList?.toggle('studio-focus', focused);
    attr(focusButton, 'aria-pressed', focused);
    const label = focused ? 'Fokusmodus verlassen' : 'Vorschau fokussieren';
    attr(focusButton, 'aria-label', label);
    attr(focusButton, 'title', label);
    const visibleLabel = focusButton?.querySelector?.('[data-focus-label]');
    if (visibleLabel) visibleLabel.textContent = focused ? 'Fokus verlassen' : 'Fokus';
    if (focused) preview?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
    if (changed) motion.play(preview, [{ opacity: .8, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200 }, 'focus');
    if (restore) focusButton?.focus?.({ preventScroll: true });
  };
  const onPage = event => {
    const page = event.detail?.page;
    if (typeof page !== 'string') return;
    if (page !== 'generator' && focused) setFocus(false);
    const destination = byId(`page-${page}`);
    motion.play(destination, [{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 210 }, 'page');
  };
  const onMap = () => {
    if (!work.size) setActivity('Vorschau aktualisiert');
    const surface = preview?.querySelector?.('.canvas-wrap');
    motion.play(surface, [{ opacity: .8, transform: 'scale(1.008)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 200 }, 'preview');
  };
  const onWork = event => {
    const { kind, state, message } = event.detail ?? {};
    if (!['generation', 'export'].includes(kind) || !['start', 'done', 'error'].includes(state)) return;
    const fallback = kind === 'generation' ? 'Map wird gebaut …' : 'Export wird erstellt …';
    if (state === 'start') {
      motion.cancel('activity');
      work.set(kind, typeof message === 'string' && message.trim() ? message : fallback);
    }
    else work.delete(kind);
    attr(preview, 'aria-busy', work.has('generation'));
    data(body, 'studioWork', [...work.keys()].join(' '));
    if (work.size) setActivity([...work.values()].at(-1), 'working');
    else {
      const fallbackResult = state === 'error' ? 'Vorgang fehlgeschlagen' : kind === 'generation' ? 'Map erstellt' : 'Export erstellt';
      setActivity(typeof message === 'string' && message.trim() ? message : fallbackResult, state === 'error' ? 'error' : 'success');
      if (state === 'error') motion.cancel('activity');
      else motion.play(activity, [{ boxShadow: '0 0 0 4px rgba(107,139,91,.20)' }, { boxShadow: '0 0 0 0 rgba(107,139,91,0)' }], { duration: 220 }, 'activity');
    }
  };
  listen(win, 'mapforge:page', onPage);
  listen(win, 'mapforge:map', onMap);
  listen(win, 'mapforge:work', onWork);
  listen(themeButton, 'click', () => setTheme(appearance === 'dark' ? 'light' : 'dark'));
  listen(focusButton, 'click', () => setFocus(!focused));
  listen(doc, 'click', event => {
    const button = event.target?.closest?.('.theme-card, .creative-direction, .segmented button, .camera-tools button, [data-preview-level]');
    if (!button || button.disabled || (button.getAttribute?.('aria-pressed') !== 'true' && !button.classList?.contains?.('selected'))) return;
    motion.play(button, [{ transform: 'scale(.975)' }, { transform: 'scale(1)' }], { duration: 140 }, 'selection');
  });
  listen(doc, 'toggle', event => {
    const group = event.target;
    if (!group?.open || !group.matches?.('details.inspector-group')) return;
    const content = group.querySelector?.('.inspector-group-content, .inspector-content, .inspector-body') ?? group;
    motion.play(content, [{ opacity: .7 }, { opacity: 1 }], { duration: 160 }, 'inspector');
  }, true);
  listen(doc, 'keydown', event => {
    if (!focused || event.defaultPrevented || event.isComposing || event.key !== 'Escape') return;
    const target = event.target ?? doc.activeElement;
    if (target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
      || doc.querySelector?.('dialog[open], [role="dialog"][aria-modal="true"]')
      || body.classList?.contains?.('navigation-open')) return;
    event.preventDefault?.();
    setFocus(false, true);
  });
  listen(doc, 'visibilitychange', () => motion.setHidden(doc.hidden === true || doc.visibilityState === 'hidden'));
  listen(win, 'pagehide', () => motion.cancelAll());
  const onReduced = event => motion.setReducedMotion(event.matches);
  if (typeof media?.addEventListener === 'function') listen(media, 'change', onReduced);
  else if (typeof media?.addListener === 'function') {
    media.addListener(onReduced);
    cleanup.push(() => media.removeListener?.(onReduced));
  }
  let saved;
  try { saved = storage?.getItem(APPEARANCE_KEY); } catch { /* Default appearance remains available. */ }
  setTheme(saved, false);
  setFocus(false);
  if (activity && !activity.textContent.trim()) setActivity('Bereit zum Bauen');
  const api = {
    motion,
    setTheme(value) { if (!disposed) setTheme(value); },
    setFocus(value) { if (!disposed) setFocus(value); },
    get appearance() { return appearance; },
    get focused() { return focused; },
    dispose() {
      if (disposed) return;
      disposed = true;
      cleanup.splice(0).forEach(remove => remove());
      motion.dispose();
      work.clear();
      setFocus(false);
      instances.delete(doc);
    },
  };
  instances.set(doc, api);
  return api;
}
