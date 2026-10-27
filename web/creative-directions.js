import { normalize } from './engine.js';
import { CREATIVE_DIRECTIONS, normalizeCreativeVariant } from './creative-data.js';
export { CREATIVE_DIRECTIONS, CREATIVE_VARIANT_COUNT, normalizeCreativeVariant } from './creative-data.js';

const DIRECTION_FIELDS = new Set(['mode', 'theme', 'layout', 'detail', 'polish', 'pacing', 'stages', 'difficulty', 'gap', 'rise', 'checkpointEvery']);

/** Build a separate configuration; opening a card itself never changes a map. */
export function creativeDirectionConfig(current, id, variant = 1) {
  const direction = CREATIVE_DIRECTIONS.find(entry => entry.id === id);
  if (!direction) throw new RangeError(`Unbekannte kreative Richtung: ${String(id)}`);
  const base = normalize(current);
  const patch = Object.fromEntries(Object.entries(direction.config).filter(([key]) => DIRECTION_FIELDS.has(key)));
  const candidate = normalize({ ...base, ...patch, seed: `MF-DIRECTION-${direction.id}-${String(normalizeCreativeVariant(variant)).padStart(2, '0')}`, storyId: direction.id, concept: null });
  // normalize adapts old template names across modes. A direction does not rename
  // the user's project, even when a manually chosen name matches a template.
  return { ...candidate, name: base.name, autoName: base.autoName, concept: null };
}
