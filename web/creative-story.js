import { CREATIVE_DIRECTIONS, CREATIVE_VARIANT_COUNT, legacyStoryId, normalizeStoryId } from './creative-data.js';

const own = (value, key) => {
  if (!value || typeof value !== 'object') return undefined;
  try { return Object.getOwnPropertyDescriptor(value, key)?.value; } catch { return undefined; }
};
const hasOwn = (value, key) => {
  if (!value || typeof value !== 'object') return false;
  try { return Object.getOwnPropertyDescriptor(value, key) !== undefined; } catch { return false; }
};
const boundedInteger = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;

/** Three ordered real checkpoints, with the current finish always last.
 * The start is used only when a short route has fewer than two later checkpoints.
 */
function courseChapters(direction, stages, checkpointEvery) {
  const checkpoints = [];
  for (let index = checkpointEvery; index < stages; index += checkpointEvery) checkpoints.push(index);
  checkpoints.push(stages);
  if (checkpoints.length < 3) checkpoints.unshift(0);
  let previous = -1;
  return direction.story.chapters.map((chapter, chapterIndex) => {
    const desired = chapter.trigger.index / direction.config.stages * stages;
    const last = checkpoints.length - (3 - chapterIndex);
    let selected = previous + 1;
    for (let index = selected + 1; index <= last; index++) {
      if (Math.abs(checkpoints[index] - desired) < Math.abs(checkpoints[selected] - desired)) selected = index;
    }
    if (chapterIndex === 2) selected = checkpoints.length - 1;
    previous = selected;
    return { ...chapter, trigger: { kind: 'stage', index: checkpoints[selected] } };
  });
}

/** Persistent editorial selection, with exact old seeds as a migration fallback.
 * An explicit empty or invalid ID never silently re-enables a previous story.
 */
export function storyForConfig(config) {
  const seed = own(config, 'seed');
  const mode = own(config, 'mode');
  const id = hasOwn(config, 'storyId') ? normalizeStoryId(own(config, 'storyId'), mode) : legacyStoryId(seed, mode);
  const direction = CREATIVE_DIRECTIONS.find(entry => entry.id === id);
  if (!direction) return null;
  const story = direction.story;
  const onlyUp = own(config, 'obbyStyle') === 'onlyup';
  const stages = boundedInteger(own(config, 'stages'), onlyUp?144:36, onlyUp?96:12, onlyUp?240:80);
  const checkpointEvery = boundedInteger(own(config, 'checkpointEvery'), 5, 2, 10);
  const variant = Array.from({ length: CREATIVE_VARIANT_COUNT }, (_, index) => index + 1).find(index => seed === `MF-DIRECTION-${id}-${String(index).padStart(2, '0')}`) || null;
  return {
    schema: 1, kind: 'creative-story', directionId: direction.id, title: direction.title,
    mode: direction.mode, variant, seed: typeof seed === 'string' ? seed : '',
    premise: story.premise, playerRole: story.playerRole,
    goal: direction.mode === 'obby' ? story.goal.replace(new RegExp(`\\b${direction.config.stages}\\b`, 'g'), String(stages)) : story.goal,
    chapters: direction.mode === 'obby' ? courseChapters(direction, stages, checkpointEvery) : story.chapters.map(chapter => ({ ...chapter, trigger: { ...chapter.trigger } })),
    presentation: 'world-signs-progress-journal-and-build-plan',
    runtimeQuestsImplemented: false,
    scope: `Drei statische Storytafeln, ein Kapiteljournal und ein redaktioneller Bauplan erzählen diese Weltgeschichte. Das Journal öffnet sich über Geschichte und gibt Texte passend zum tatsächlichen Ausbau oder Abschnitt frei. ${direction.mode === 'tycoon' ? 'Die Tafeln erscheinen mit dem jeweils zugeordneten Ausbau.' : 'Die Tafeln stehen an den zugeordneten Parcours-Etappen.'} Die vorhandenen Spielziele bleiben maßgeblich; die Kapitel fügen keine Quests, Gegenstände oder Belohnungen hinzu.`,
  };
}

const markdown = value => String(value).replace(/[\x00-\x1f\x7f]/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]|]/g, '\\$&');

export function creativeStoryMarkdown(config) {
  const story = storyForConfig(config);
  if (!story) return '# Weltgeschichte\n\nDieser Konfiguration ist keine kuratierte Weltgeschichte zugeordnet. Der vorhandene Spielablauf bleibt davon unberührt. Eine eigene Geschichte kann als separater Bauplan entwickelt werden.\n';
  const project = own(config, 'name');
  const chapters = story.chapters.map((chapter, i) => {
    const trigger = chapter.trigger.kind === 'upgrade' ? `Ausbau ${chapter.trigger.count}/48 (${chapter.trigger.id})` : `Abschnitt ${chapter.trigger.index}`;
    return `### ${i + 1}. ${markdown(chapter.title)}\n\nEtappe: ${trigger}\n\n${markdown(chapter.text)}`;
  }).join('\n\n');
  return `# Weltgeschichte — ${markdown(story.title)}\n\n${story.scope}\n\n${typeof project === 'string' ? `Projektname: ${markdown(project.slice(0, 70))}\n\n` : ''}Richtung: ${story.directionId}${story.variant ? ` · Variante ${story.variant}` : ''}\nSeed: ${markdown(story.seed)}\n\n## Ausgangslage\n\n${markdown(story.premise)}\n\n## Deine Rolle\n\n${markdown(story.playerRole)}\n\n## Tatsächliches Spielziel\n\n${markdown(story.goal)}\n\n## Drei Kapitel\n\n${chapters}\n\n## Umsetzung und Grenzen\n\nDie drei Tafeln sind beschriftete, nicht kollidierende Geometrie im Map-Export. ${story.mode === 'tycoon' ? 'Sie verwenden die vorhandenen Ausbaufreigaben. Spieler bauen den Gratis-Starter, produzieren Cash, holen es am Tresor ab und kaufen vorhandene Ausbauten.' : 'Sie stehen an Checkpoints oder am Ziel. Bei kurzen Routen mit weit auseinanderliegenden Checkpoints beginnt das erste Kapitel am Start. Spieler springen über vorhandene Plattformen und erreichen die Zielplattform. Münzen sind optional; vorhandene Gefahren bleiben aktiv.'} Das Spieljournal zeigt ausschließlich freigegebene Kapitel nach aktuellem Fortschritt; Rebirth oder Neustart setzt die Freigabe passend zurück. Neue Dialoge, NPCs, Transportgegenstände oder Sonderbelohnungen sind nicht implementiert. Die Tafeln sind kein Beleg für Lesbarkeit auf einem echten Gerät; dafür sind tatsächliche Spieltests nötig.\n`;
}
