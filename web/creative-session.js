// View-only comparison settings. Nothing here reads or changes a map config.
const TAU = Math.PI * 2;

function ownValue(input, key) {
  if (input === null || typeof input !== 'object') return undefined;
  try {
    if (Array.isArray(input)) return undefined;
    // Preview instances have own data fields. Ignore inherited fields and
    // accessors so restoring a view never invokes a saved value's getter.
    return Object.getOwnPropertyDescriptor(input, key)?.value;
  } catch {
    return undefined;
  }
}

const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function viewAngle(value) {
  const angle = finite(value, -.8) % TAU;
  const wrapped = angle >= Math.PI ? angle - TAU : angle < -Math.PI ? angle + TAU : angle;
  return wrapped === 0 ? 0 : wrapped;
}

function viewLevel(value) {
  // Compare only the start, early production and complete build. An arbitrary
  // slider value is not silently presented as a different partial build.
  return value === 0 || value === 6 || value === 48 ? value : 48;
}

/** Return a detached, bounded view for the existing Preview/drawPreview API.
 * Numbers are accepted without coercion; missing or invalid values use the
 * viewer defaults. Only exact tycoon levels 0, 6 and 48 are retained.
 */
export function normalizeCreativeView(input, mode) {
  const view = {
    angle: viewAngle(ownValue(input, 'angle')),
    zoom: Math.max(.5, Math.min(2.5, finite(ownValue(input, 'zoom'), 1))),
    plan: ownValue(input, 'plan') === true,
    path: ownValue(input, 'path') === true,
  };
  if (mode === 'tycoon') view.level = viewLevel(ownValue(input, 'level'));
  return view;
}
