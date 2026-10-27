const profile=(id,name,walk,jump,sprint,description)=>Object.freeze({id,name,walk,jump,sprint,description});
export const MOVEMENT_PROFILES=Object.freeze({
 classic:profile('classic','Klassisch',16,50,16,'Vertraute Roblox-Steuerung. Für bestehende Maps und normale Obbys.'),
 precise:profile('precise','Präzise',14,50,14,'Etwas langsamer für schmale Plattformen und gezielte Sprünge. Kein Sprint.'),
 explore:profile('explore','Erkunden',16,50,24,'Normal gehen, längere Wege mit Sprint zurücklegen. Für Tycoons und offene Maps.'),
 parkour:profile('parkour','Parkour',18,55,26,'Flotter laufen und kräftiger springen, mit zusätzlichem Sprint. Für großzügige Parcours.'),
});
export const normalizeMovement=value=>typeof value==='string'&&Object.hasOwn(MOVEMENT_PROFILES,value)?value:'classic';
export const movementForConfig=config=>MOVEMENT_PROFILES[normalizeMovement(config?.movement)];
// Keep the existing conservative envelope; faster profiles do not certify harder jumps.
// Sprint is never required by the automatic jump check.
export function movementJumpLimits(config){const p=movementForConfig(config);return {gap:6*Math.min(1,p.walk/16),rise:3*Math.min(1,(p.jump/50)**2)};}
export function movementMarkdown(config){const p=movementForConfig(config);return `# Spielerbewegung — ${p.name}\n\n${p.description}\n\nGehtempo: ${p.walk} Studs/s. Sprungkraft: ${p.jump}. Schwerkraft: 196,2 Studs/s². ${p.sprint>p.walk?`Sprint: ${p.sprint} Studs/s. Auf PC linke Umschalttaste halten; auf Controller L3 oder auf Touch Sprint antippen zum Umschalten. Umschalt ist in diesem Profil für Sprint reserviert; Shift-Lock ist aus.`:'Kein zusätzlicher Sprint. Die normale Roblox-Steuerung bleibt verfügbar.'}\n\nDie Werte werden beim Erscheinen und nach Respawn auf dem Server gesetzt. Sprint endet bei Tod, Sitzen, Schwimmen, Klettern oder Fokusverlust; er verbraucht keine Kaufwährung. Kamera, Thumbstick und normaler Sprung bleiben Roblox-Steuerung. Kein Dash, Wandsprung, Slide oder Doppelsprung eingebaut.\n\n## Spieltest mit diesem Profil\n\n- Jeden Sprung ohne Sprint, nach Tod und am Checkpoint testen.\n- Sprint starten/stoppen, Chat öffnen, Fenster wechseln und erneut erscheinen.\n- Tastatur, Controller und echtes Touch-Gerät prüfen. Der Generator simuliert keine Roblox-Physik.\n- Tempo und Sprungkraft verändern Spielgefühl und mögliche Abkürzungen. Datenchecks ersetzen diesen Test nicht.\n`;}
