import {gameListing} from './listing.js';
import {tycoonTheme} from './tycoon.js';
export const LEARNING_REFERENCES=[
 ['Onboarding','https://create.roblox.com/docs/production/game-design/onboarding','Zweck, nächste Aktion und langfristige Ziele sichtbar machen.'],
 ['Core loops','https://create.roblox.com/docs/production/game-design/core-loops','Wiederkehrende Aktionen mit Fortschritt verbinden.'],
 ['Onboarding techniques','https://create.roblox.com/docs/production/game-design/onboarding-techniques','Schilder und kontextbezogene Hilfe.'],
 ['Publishing','https://create.roblox.com/docs/production/publishing/publish-games-and-places','Speichern, testen und öffentlich freigeben unterscheiden.']
];
export function playerPlan(c){return c.mode==='tycoon'?{goal:`Baue ${tycoonTheme(c.theme).own} mit 48 Ausbauten und steigere ihre Produktion.`,loop:'Gratis-Starter bauen → Cash produzieren → Tresor abholen → nächsten Ausbau kaufen.',first:'Baue den kostenlosen Starter am markierten Feld deines Grundstücks.',next:'Ab 3 Ausbauten Aufträge wählen oder die drei Kalibrierungsstationen für +15 % Produktion (120 Spielsekunden) besuchen. Bei 12/24/36/48 Ausbauten kostenlose Kristalle für Designs erhalten.',later:'Forschung dauerhaft ausbauen. Nach 48 Ausbauten optional Rebirth: Fabrik und Cash neu starten; Forschung, Designs und Kristalle bleiben.'}:{goal:`Erreiche das Ziel nach ${c.stages} Parcours-Abschnitten.`,loop:'Springen → Münzen sammeln → Checkpoints erreichen → zum Ziel.',first:'Springe vom Start auf die erste Plattform.',next:`Alle ${c.checkpointEvery} Abschnitte sichert ein Checkpoint deinen Weg. Nach einem Sturz startest du dort erneut.`,later:'Sammle 250 Münzen für eine Leuchtspur. Der Parcours ist ohne Robux spielbar.'};}
export function listingDescription(c){return gameListing(c).description;}

export function playerPlanMarkdown(c){const p=playerPlan(c);return `# So spielst du ${c.name}\n\n## Dein Ziel\n${p.goal}\n\n## Erster Schritt\n${p.first}\n\n## Danach\n${p.loop}\n${p.next}\n${p.later}\n\n## Steuerung\nWASD/Stick: laufen. Leertaste/Sprungtaste: springen. Interaktion am Ziel halten bzw. antippen.\n\n## Referenzen (20.10.2026)\n${LEARNING_REFERENCES.map(([title,url,lesson])=>`- Roblox · ${title}: ${url}\n  ${lesson}`).join('\n')}\n\nKonkrete Umsetzung mit echten Spielern auf Verständlichkeit prüfen.\n`;}
