import {DEFAULT,VERSION,generate,normalize,safeFilename,validate} from './engine.js';
import {launchFiles} from './launch-kit.js';
import {mapMetrics} from './quality-report.js';
import {measureOnlyUpRoute} from './only-up.js';
import {onlyUpGuide} from './only-up-guide.js';
import {ONLY_UP_LAYOUTS} from './only-up-architecture.js';

export const ONLY_UP_STARTERS=Object.freeze([
 {id:'onlyup-wolkenwerft',theme:'sky',title:'Wolkenwerft — Sternwarte',seed:'MF-ONLYUP-WOLKENWERFT-01'},
 {id:'onlyup-strombezirk',theme:'neon',title:'Strombezirk — Signalspitze',seed:'MF-ONLYUP-STROMBEZIRK-01'},
 {id:'onlyup-vulkanwerk',theme:'lava',title:'Vulkanwerk — Sonnenkrone',seed:'MF-ONLYUP-VULKANWERK-01'},
 {id:'onlyup-wurzelgarten',theme:'jungle',title:'Wurzelgarten — Gartenkrone',seed:'MF-ONLYUP-WURZELGARTEN-01'}
].map(starter=>Object.freeze(starter)));

const INDIVIDUAL_TITLES={ridge:['Klippenstern — Die Wetterstation','Relaisküste — Das letzte Signal','Glutgrat — Die Ofenwacht','Farnsaum — Der Himmelsgarten'],switchback:['Wolkenfalten — Die Hofsternwarte','Schaltgärten — Die Relaisgalerien','Glutgalerien — Die Sonnenhöfe','Farnfalten — Die hängenden Höfe']};
export const INDIVIDUAL_ONLY_UP_STARTERS=Object.freeze(['spire','ridge','switchback'].flatMap(ascentLayout=>ONLY_UP_STARTERS.map((starter,index)=>Object.freeze(ascentLayout==='spire'?{...starter,ascentLayout}:{...starter,ascentLayout,id:starter.id+'-'+ascentLayout,title:INDIVIDUAL_TITLES[ascentLayout][index],seed:starter.seed+'-'+ascentLayout.toUpperCase()}))));

/** Four independent exports. No current project or saved-map storage is read. */
export async function buildOnlyUpCollection(scripts,{onProgress=()=>{},yieldTask=()=>Promise.resolve(),signal,artwork,stages=144,individual=false}={}){
 const starters=individual?INDIVIDUAL_ONLY_UP_STARTERS:ONLY_UP_STARTERS;
 const files={},records=[],total=starters.length;
 const abort=()=>{if(signal?.aborted)throw Error('Only-Up-Sammlung abgebrochen. Deine Map bleibt erhalten.');};
 // Clear all product/pass IDs explicitly so future DEFAULT changes cannot turn
 // an independent starter into a copy of another experience's paid products.
 const paidIds=Object.fromEntries(Object.keys(DEFAULT).filter(key=>key.endsWith('Id')&&key!=='storyId').map(key=>[key,'']));
 for(const [index,starter] of starters.entries()){
  abort();onProgress({completed:index,total,title:starter.title});await yieldTask();abort();
  const config=normalize({...DEFAULT,...paidIds,mode:'obby',obbyStyle:'onlyup',ascentLayout:starter.ascentLayout||'spire',name:starter.title,autoName:false,theme:starter.theme,seed:starter.seed,stages,movement:'precise',checkpointEvery:5,detail:3,events:'rally',storyId:'',concept:null,shop:false,shopHints:false,analytics:false});
  const map=generate(config),checks=validate(map),errors=checks.filter(check=>check.status==='error');
  if(errors.length)throw Error(starter.title+': '+errors.map(check=>check.title).join(' · '));
  abort();
  const folder=String(index+1).padStart(2,'0')+'-'+safeFilename(starter.title),projectFiles=launchFiles(map,scripts);
  for(const [name,data] of Object.entries(projectFiles))files[folder+'/'+name]=data;
  const geometry=measureOnlyUpRoute(map),metrics=mapMetrics(map);
  const chapters=map.onlyUp.chapters.map(chapter=>({index:chapter.index,title:chapter.title,start:chapter.start,end:chapter.end,sections:chapter.sections.map(section=>({...section}))}));
  const skills=map.onlyUp.sections.map(section=>({...section}));
  const record={id:starter.id,title:config.name,mode:config.mode,obbyStyle:config.obbyStyle,ascentLayout:config.ascentLayout,theme:config.theme,seed:config.seed,stages:config.stages,folder,parts:metrics.total,fingerprint:metrics.fingerprint,routeKey:map.key,geometry,chapters,skills,studioTested:false};
  files[folder+'/OnlyUp-Aufstieg.md']=projectFiles['OnlyUp-Aufstieg.md']||onlyUpGuide(map);
  if(artwork){const images=await artwork(map,{...starter,stages:config.stages,chapters,skills});abort();for(const [name,data] of Object.entries(images))files[folder+'/'+name]=data;}
  records.push(record);onProgress({completed:index+1,total,title:config.name});
 }
 abort();
 files['OnlyUpSammlung.json']=JSON.stringify({app:'MapForgeOnlyUpCollection',version:VERSION,maps:records,shopEnabled:false,studioTested:false,studioPlaytestRunByGenerator:false},null,2);
 files['START-HIER.md']=`# ${records.length} Welten. Eigene Wege nach oben.\n\nMapForge ${VERSION} · ${records.length} eigenständige Only-Up-Starter ${individual?'aus vier Themen × drei Bauformen':'mit Turmspirale'} mit jeweils ${records[0].stages} Abschnitten, vier Themenkapiteln und acht Spielschwerpunkten. Jede Map hat einen festen eigenen Namen und Seed, eine vollständig erzeugte Route und eine Roblox-Studio-Datei mit Konfiguration, Checkpoints, Münzen, Spielerbewegung und Events.\n\n${records.map((record,index)=>`${index+1}. **${record.title}** · ${ONLY_UP_LAYOUTS[record.ascentLayout].label} · ${record.geometry.length} Studs Route · ${record.geometry.height} Studs Aufstieg · Ordner ${record.folder}`).join('\n')}\n\n## Map öffnen\n1. ZIP entpacken und einen Themenordner wählen.\n2. Die .rbxlx-Datei in Roblox Studio über Datei → Aus Datei öffnen laden.\n3. OnlyUp-Aufstieg.md für Kapitel und Sprungschwerpunkte lesen, dann Play starten. Das Bewegungsprofil ist Präzise; die Signal-Rallye ist enthalten.\n4. Jeden Sprung und Checkpoint, Tod und Respawn, Mehrspieler, Touch-Steuerung, Streaming und Rejoin in einem separaten Testplatz prüfen. Speichern und Bildrate auf echten Geräten testen.\n5. Die .mapforge.json lässt sich in MapForge öffnen und weiter bearbeiten. Jede Map als eigene Experience veröffentlichen. Shops sind ausgeschaltet; alle Produkt- und Pass-IDs sind leer.\n\n## Was bereits geprüft wurde\nDer Generator hat seine eigene Geometrie auf Sprunggrenzen, Freiraum, Überlappungen und gültige Etappen geprüft. Länge, Höhengewinn, Kapitel und Schwerpunkte in OnlyUpSammlung.json stammen aus diesen tatsächlichen Maps. Das beweist keine Roblox-Physik, keinen Spielspaß und keine Bildrate. Ein tatsächlicher Roblox-Studio-Spieltest steht noch aus.\n\n${artwork?'Die enthaltenen Cover wurden aus der jeweiligen Map erzeugt. Ausschnitt, Licht und Darstellung vor dem Upload prüfen.':'Cover kannst du im MapForge-Cover-Studio aus der jeweiligen Geometrie erstellen.'}\n\nDeine aktuelle Map und Meine Maps werden von diesem Sammlungsbau nicht verändert.\n`;
 return {files,records};
}
