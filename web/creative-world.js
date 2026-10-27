import { storyForConfig } from './creative-story.js';
import { vertices } from './geometry.js';
import { onlyUpClearanceCorridors } from './only-up.js';

const sign = Object.freeze({ mode: 'surface', width: 512, height: 256, distance: 28 });
const bounds = part => {
  const points = vertices(part);
  return [0, 1, 2].map(axis => [Math.min(...points.map(point => point[axis])), Math.max(...points.map(point => point[axis]))]);
};
const overlaps = (a, b) => a.every((range, axis) => range[0] < b[axis][1] - .01 && range[1] > b[axis][0] + .01);
const round = value => Math.round(value * 1000) / 1000;

/** Physical chapter signs only. Purchases, checkpoints and rewards stay in their
 * existing runtime; story selection survives personal map adjustments.
 */
export function addCreativeWorldDetails(map) {
  const story = storyForConfig(map.config);
  if (!story || map.parts.some(part => part.storyChapter)) return map;
  let id = Math.max(0, ...map.parts.map(part => part.id));
  const board = (chapter, index, extra) => ({
    id: ++id, name: `StoryChapter_${index + 1}`, size: [8, 4, .5],
    color: map.theme.dark, material: map.config.theme === 'jungle' ? 'Wood' : 'Metal',
    anchored: true, collide: false, query: false, castShadow: false, kind: 'decor',
    label: `${index + 1}. ${chapter.title}\n${chapter.text}`, sign: { ...sign },
    storyChapter: index + 1, ...extra,
  });
  const additions = [];
  if (map.config.mode === 'tycoon') {
    // These gaps sit between facade panels and machine rows. They also avoid
    // all three cross lanes, the entrance kiosks and the rear landmark.
    const localZ = [72, 24, -72];
    for (const plot of map.plots) {
      const claim = map.parts.find(part => part.plot === plot.index && part.role === 'Claim');
      const facing = claim && claim.pos[2] < plot.pos[2] ? -1 : 1;
      story.chapters.forEach((chapter, index) => additions.push(board(chapter, index, {
        name: `P${plot.index}_StoryChapter_${index + 1}`, kind: 'tycoon', plot: plot.index,
        pos: [plot.pos[0] + facing * 79, 4.5, plot.pos[2] + facing * localZ[index]],
        rotation: [0, facing < 0 ? 270 : 90, 0],
        unlock: chapter.trigger.id, hiddenAtStart: true,
      })));
    }
  } else {
    const occupied = map.parts.map(bounds);
    if(map.onlyUp)occupied.push(...onlyUpClearanceCorridors(map.stages));
    story.chapters.forEach((chapter, index) => {
      const stage = map.stages.find(entry => entry.index === chapter.trigger.index);
      if (!stage) return;
      const before = map.stages[Math.max(0, stage.index - 1)].pos;
      const after = map.stages[Math.min(map.stages.length - 1, stage.index + 1)].pos;
      const dx = after[0] - before[0], dz = after[2] - before[2], length = Math.hypot(dx, dz) || 1;
      const side = [-dz / length, dx / length];
      const panel = board(chapter, index, { stage: stage.index, stageIndex: stage.index });
      let selected, leastOverlap = Infinity;
      // Both sides of the route are considered so trees, city silhouettes and
      // neighbouring turns cannot force a panel onto the jumping platform.
      candidates: for (const distance of (map.onlyUp?[13,17,21,24,32,40]:[13,17,21,24])) for (const direction of [1, -1]) {
        const candidate = { ...panel,
          pos: [round(stage.pos[0] + side[0] * distance * direction), round(stage.pos[1] + 4.5), round(stage.pos[2] + side[1] * distance * direction)],
          rotation: [0, Math.atan2(side[0] * direction, side[1] * direction) * 180 / Math.PI, 0],
        };
        const box = bounds(candidate), intersections = occupied.filter(other => overlaps(box, other)).length;
        if (intersections < leastOverlap) { selected = candidate; leastOverlap = intersections; }
        if (!intersections) break candidates;
      }
      additions.push(selected);
      occupied.push(bounds(selected));
    });
  }
  return { ...map, parts: [...map.parts, ...additions] };
}
