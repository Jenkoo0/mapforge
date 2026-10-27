import {DEFAULT,VERSION,generate,normalize,safeFilename,validate} from './engine.js';
import {launchFiles} from './launch-kit.js';
import {mapMetrics} from './quality-report.js';
import {MINIGAMES,grindMarkdown} from './minigames.js';

export const MINIGAME_STARTERS=Object.freeze([
 {id:'signalwerk',title:'Signalwerk — Die Nachtschicht',seed:'MF-MINIGAME-SIGNALWERK-01',theme:'neon',minigame:'signal',stages:18},
 {id:'echohoefe',title:'Echohöfe — Garten der Erinnerung',seed:'MF-MINIGAME-ECHOHOEFE-01',theme:'jungle',minigame:'memory',stages:16},
 {id:'funkenjagd',title:'Funkenjagd — Unter der Glutkrone',seed:'MF-MINIGAME-FUNKENJAGD-01',theme:'lava',minigame:'collect',stages:20}
].map(starter=>Object.freeze(starter)));

/** Independent starter generation. No reads or writes to the editor or MapVault. */
export async function buildMinigameCollection(scripts,{artwork,yieldTask=()=>Promise.resolve(),onProgress=()=>{},signal}={}){
 const files={},records=[],total=MINIGAME_STARTERS.length;
 const abort=()=>{if(signal?.aborted)throw Error('Minispiel-Sammlung abgebrochen. Deine Map bleibt erhalten.');};
 const paidIds=Object.fromEntries(Object.keys(DEFAULT).filter(key=>key.endsWith('Id')&&key!=='storyId').map(key=>[key,'']));
 for(const [index,starter] of MINIGAME_STARTERS.entries()){
  abort();onProgress({completed:index,total,title:starter.title});await yieldTask();abort();
  const config=normalize({...DEFAULT,...paidIds,mode:'obby',obbyStyle:'classic',name:starter.title,autoName:false,theme:starter.theme,seed:starter.seed,stages:starter.stages,difficulty:'normal',gap:3.5,rise:1.1,checkpointEvery:4,detail:3,movement:'precise',events:'rally',minigame:starter.minigame,grind:true,storyId:'',concept:null,shop:false,shopHints:false,analytics:false});
  const map=generate(config),errors=validate(map).filter(check=>check.status==='error');
  if(errors.length)throw Error(starter.title+': '+errors.map(check=>check.title).join(' · '));
  abort();
  const folder=String(index+1).padStart(2,'0')+'-'+safeFilename(starter.title),projectFiles=launchFiles(map,scripts),metrics=mapMetrics(map);
  for(const [name,data] of Object.entries(projectFiles))files[folder+'/'+name]=data;
  files[folder+'/Werkstatt-Grind-und-Minispiele.md']=grindMarkdown(config);
  if(artwork){const images=await artwork(map,starter);abort();for(const [name,data] of Object.entries(images))files[folder+'/'+name]=data;}
  records.push({id:starter.id,title:config.name,folder,mode:config.mode,obbyStyle:config.obbyStyle,theme:config.theme,seed:config.seed,stages:config.stages,minigame:config.minigame,minigameLabel:MINIGAMES[starter.minigame].label,events:config.events,grind:config.grind,parts:metrics.total,fingerprint:metrics.fingerprint,routeKey:map.key,studioTested:false});
  onProgress({completed:index+1,total,title:config.name});
 }
 abort();
 files['MinispieleSammlung.json']=JSON.stringify({app:'MapForgeMinigameCollection',version:VERSION,maps:records,shopEnabled:false,studioTested:false,studioPlaytestRunByGenerator:false},null,2);
 files['START-HIER.md']=`# Drei kurze Wege. Drei Minispiele. Deine Werkstatt.\n\nMapForge ${VERSION}. Drei eigenständige Obby-Starter mit kurzem Parcours und separater Minispiel-Arena. Jedes Projekt hat seinen eigenen Namen, Seed und seine Konfiguration. Die drei ausgewählten Minispiele unterscheiden sich durch Regeln: geordnete Signalroute, Gedächtnisfolge oder freie Stationswahl. Der Generator gibt keine Zusage für Spielerzahlen, Bildrate oder wirtschaftlichen Erfolg.\n\n${records.map((record,index)=>`${index+1}. **${record.title}** · ${record.stages} Obby-Abschnitte + ${record.minigameLabel} · Ordner ${record.folder}`).join('\n')}\n\n## Öffnen und ausprobieren\n1. ZIP entpacken, einen Themenordner wählen und die .rbxlx-Datei in Roblox Studio öffnen.\n2. Werkstatt-Grind-und-Minispiele.md lesen. Im Hauptspiel laufen und Münzen sammeln; am Arena-Portal das Minispiel betreten. Auf ein aktives Event warten, dann einen Lauf starten.\n3. Erstes gültiges Finish jeder Serverrunde: 5–7 Marken und 10 XP. An der Werkstatt passende Attribute bis Level 5 ausbauen. Weitere Versuche verbessern nur die Rundenbestzeit.\n4. Mit zwei Testspielern Tod/Respawn, neue Runde, Echohöfe-Vorschau, Stationswechsel bei Funkenjagd, Wiederbeitritt und Speicherung prüfen. Touch/Gamepad und Bildrate auf echten Geräten prüfen.\n5. Die .mapforge.json in MapForge öffnen, um das Projekt anzupassen. Die KI-Uebergabe.md beschreibt den aktuellen Export. Jede Map als eigene Experience veröffentlichen. Shops sind ausgeschaltet und alle Produkt-/Pass-IDs leer.\n\n## Was das Paket belegt\nDie Konfigurationen und Roblox-Dateien stammen aus dem tatsächlichen Generator. Regeln, Steuerung und Persistenz benötigen einen echten Studio-Spieltest. Ein solcher Roblox-Engine-Test wurde beim Erstellen der Sammlung nicht ausgeführt. Die Karten sind Starter mit einem normalen Obby und einer Minispiel-Arena, keine bereits getesteten eigenständigen Minispiel-Experiences.\n\n${artwork?'Cover und Icon stammen aus der jeweiligen Map-Geometrie. Vor dem Upload Ausschnitt und Lesbarkeit prüfen.':'Cover und Icons können im MapForge-Cover-Studio aus der jeweiligen Map erstellt werden.'}\n\nDeine aktuelle Map und Meine Maps werden nicht verändert.\n`;
 return {files,records};
}
