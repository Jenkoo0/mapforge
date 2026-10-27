import {CREATIVE_DIRECTIONS,creativeDirectionConfig} from './creative-directions.js';
import {DEFAULT,VERSION,generate,safeFilename,validate} from './engine.js';
import {launchFiles} from './launch-kit.js';
import {mapMetrics} from './quality-report.js';

/** Independent starter projects. Never consumes or writes the user's current map. */
export async function buildCreativeCollection(scripts,{onProgress=()=>{},yieldTask=()=>Promise.resolve(),signal,artwork}={}){
 const files={},records=[],total=CREATIVE_DIRECTIONS.length;
 const abort=()=>{if(signal?.aborted)throw Error('Sammlung abgebrochen. Deine Map bleibt erhalten.');};
 for(const [index,direction] of CREATIVE_DIRECTIONS.entries()){
  abort();onProgress({completed:index,total,title:direction.title});await yieldTask();abort();
  const config=creativeDirectionConfig({...DEFAULT,name:direction.title,autoName:false,plots:2,shop:false,shopHints:false,analytics:false},direction.id),map=generate(config),errors=validate(map).filter(c=>c.status==='error');
  if(errors.length)throw Error(direction.title+': '+errors.map(c=>c.title).join(' · '));
  const folder=String(index+1).padStart(2,'0')+'-'+safeFilename(direction.title),projectFiles=launchFiles(map,scripts);
  for(const [name,data] of Object.entries(projectFiles))files[folder+'/'+name]=data;
  if(artwork){const images=await artwork(map,direction);abort();for(const [name,data] of Object.entries(images))files[folder+'/'+name]=data;}
  const metrics=mapMetrics(map);records.push({id:direction.id,title:direction.title,mode:config.mode,theme:config.theme,seed:config.seed,parts:metrics.total,fingerprint:metrics.fingerprint,folder,studioTested:false});
  onProgress({completed:index+1,total,title:direction.title});
 }
 abort();files['Sammlung.json']=JSON.stringify({app:'MapForgeCollection',version:VERSION,maps:records,shopEnabled:false,studioTested:false},null,2);
 files['START-HIER.md']=`# Zwölf Welten, dein nächstes Spiel\n\nMapForge ${VERSION} · ${records.length} eigenständige Starterprojekte. Jede Map hat einen eigenen Namen, Seed, Weltgeschichte und vollständige Roblox-Datei mit den vorhandenen Spielsystemen. Tycoons verwenden zwei Grundstücke.\n\n${records.map((r,i)=>`${i+1}. **${r.title}** · ${r.mode==='tycoon'?'Tycoon':'Obby'} · ${r.parts} Bauteile · Ordner ${r.folder}`).join('\n')}\n\n## Öffnen\n1. Sammlung entpacken und einen Ordner wählen.\n2. Die .rbxlx in Roblox Studio öffnen und Play starten.\n3. Weltgeschichte.md lesen: die Kapiteltafeln erzählen die Welt; zusätzliche NPCs oder neue Questmechaniken sind nicht eingebaut.\n4. In einem separaten Testplatz Wege, Fortschritt, Mehrspieler, Speichern und Geräte prüfen. Diese Sammlung ist kein Nachweis ausgeführter Roblox-Tests.\n5. Jede Map als eigene Experience veröffentlichen. Shops sind ausgeschaltet, Produkt- und Pass-IDs leer. Erst eigene Produkte der jeweiligen Experience einrichten.\n\n${artwork?'Thumbnail.png und Icon.png sind echte Geometrie-Cover. Licht und Spielansicht in Studio vor dem Upload prüfen.':'Cover lassen sich im MapForge-Cover-Studio aus der tatsächlichen Geometrie erstellen.'}\n\nDie Sammlung verändert deine aktuelle Map und Meine Maps nicht.\n`;
 return {files,records};
}
