import {VERSION,normalize,generate,validate,repair,hash} from './engine.js';
import {PART_BUDGET,PACING,LAYOUTS} from './tycoon.js';
export const REVIEW_FIELDS={layout:Object.keys(LAYOUTS),detail:[0,3,true],polish:[0,2,true],plots:[2,6,true],pacing:Object.keys(PACING),gap:[1,12,false],rise:[0,7,false],checkpointEvery:[2,10,true],theme:['sky','neon','lava','jungle'],shopHints:'boolean',shopHintDelay:[120,900,true],shopFocus:['balanced','designs']};
export const reviewRevision=c=>VERSION+'-'+hash(JSON.stringify(normalize(c))).toString(36);
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const short=(s,n=700)=>String(s??'').replace(/[\u0000-\u001f]/g,' ').slice(0,n);
export function inspectPatch(raw,config){
 if(!plain(raw))throw Error('Der Änderungsvorschlag muss ein JSON-Objekt sein.');
 if(raw.app!=='MapForgeReview'||raw.baseRevision!==reviewRevision(config))throw Error('Der Vorschlag passt nicht zu dieser Map-Version. Erstelle ein neues Prüfpaket.');
 if(!plain(raw.patch)||Object.keys(raw.patch).length>12)throw Error('Ungültige Änderungsliste.');
 const patch={};
 for(const [key,value] of Object.entries(raw.patch)){
  if(!Object.hasOwn(REVIEW_FIELDS,key))throw Error('Nicht erlaubte Änderung: '+short(key,40));
  const rule=REVIEW_FIELDS[key];
  const valid=rule==='boolean'?typeof value==='boolean':typeof rule[0]==='number'?typeof value==='number'&&Number.isFinite(value)&&value>=rule[0]&&value<=rule[1]&&(!rule[2]||Number.isInteger(value)):rule.includes(value);
  if(!valid)throw Error('Ungültiger Wert für '+key+'.');
  if(config.mode==='obby'&&['polish','plots','pacing','layout'].includes(key))throw Error(key+' gehört zum Tycoon-Modus.');
  if(config.mode==='tycoon'&&['gap','rise','checkpointEvery'].includes(key))throw Error(key+' gehört zum Obby-Modus.');
  patch[key]=value;
 }
 return {app:'MapForgeReview',baseRevision:raw.baseRevision,summary:short(raw.summary),patch,notes:Array.isArray(raw.notes)?raw.notes.slice(0,12).map(s=>short(s)):[]};
}
export function assessPatch(raw,config,source='external-ai'){
 const before=normalize(config),review=inspectPatch(raw,before),after=normalize({...before,...review.patch});
 const mapBefore=generate(before),mapAfter=generate(after),checksBefore=validate(mapBefore),checksAfter=validate(mapAfter);
 if(checksAfter.filter(c=>c.status==='error').length>checksBefore.filter(c=>c.status==='error').length)throw Error('Die Änderung erzeugt zusätzliche Layoutfehler und wurde verworfen.');
 const budget=before.mode==='tycoon'?PART_BUDGET:800;
 if(mapAfter.parts.length>=budget&&mapAfter.parts.length>mapBefore.parts.length)throw Error('Die Änderung überschreitet das Bauteilbudget.');
 return {...review,source,createdAt:new Date().toISOString(),before,after,changes:Object.entries(review.patch).filter(([k,v])=>before[k]!==v).map(([key,to])=>({key,from:before[key],to})),metrics:{partsBefore:mapBefore.parts.length,partsAfter:mapAfter.parts.length,errorsBefore:checksBefore.filter(c=>c.status==='error').length,errorsAfter:checksAfter.filter(c=>c.status==='error').length},checksAfter};
}
export function localReview(config,feedback='',focus='balanced'){
 const c=normalize(config),patch={},notes=[],repaired=repair(c).config;
 for(const key of Object.keys(REVIEW_FIELDS))if(repaired[key]!==c[key])patch[key]=repaired[key];
 const text=short(feedback,2000).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const performance=focus==='performance'||/handy|mobil|fps|lag|ruckel|weniger (?:details|bauteile|deko|licht)|ohne (?:deko|licht)|keine deko/.test(text);
 const visual=focus==='visual'||/schoner|detail|deko|polier|beleucht|blumen|atmosphar/.test(text);
 if(performance){patch.detail=Math.min(c.detail,1);if(c.mode==='tycoon')patch.polish=0;notes.push('Dekoration und Lichtdetails reduzieren; tatsächliche FPS anschließend am Gerät messen.');}
 else{
  if(c.detail<3)patch.detail=3;
  if(c.mode==='tycoon'&&c.polish<2)patch.polish=2;
  if(visual)notes.push('Mehr Wegmarkierungen, Lichtakzente und bepflanzte Straßenbeete in der Tycoon-Vorlage.');
 }
 if(/weniger wart|schneller|zugig|kurzer|zu langsam/.test(text)&&c.mode==='tycoon'){patch.pacing='brisk';notes.push('Nur die Baukosten sinken. Einkommen und feste Robux-Produktinhalte bleiben gleich.');}
 if(c.mode==='tycoon'&&/campus|werkbereiche/.test(text))patch.layout='campus';
 if(c.mode==='tycoon'&&/skyline|turme|hochhauser/.test(text))patch.layout='skyline';
 if(/langfristig|langsamer|langere runde/.test(text)&&c.mode==='tycoon')patch.pacing='relaxed';
 if(c.mode==='obby'&&/leichter|einfacher|sprunge|zu schwer/.test(text)){patch.gap=Math.min(c.gap,3);patch.rise=Math.min(c.rise,1.2);patch.checkpointEvery=3;}
 if(/shop stort|weniger (?:kauf|shop)|keine (?:kauf|shop)|ohne (?:kauf|shop)/.test(text)){patch.shopHints=false;notes.push('Automatische Angebotshinweise ausschalten. Der manuell geöffnete Shop bleibt bestehen.');}
 if(/design.?hinweis|nur (?:design|kosmetik)/.test(text))patch.shopFocus='designs';
 for(const [theme,pattern] of [['jungle',/dschungel|biolabor/],['neon',/neon|cyber/],['lava',/vulkan|lava/],['sky',/kristall|himmel|wolken/]])if(pattern.test(text)){patch.theme=theme;break;}
 if(/breiter|haus|gebaude|baum|npc|pet|fahrzeug|kamp[f]|boss/.test(text))notes.push('Neue Gebäudetypen, NPCs oder andere Spielmechaniken brauchen zusätzliche Generatorlogik. Das KI-Prüfpaket gibt dafür Geometrie und Architektur mit.');
 if(text&&!visual&&!performance&&!Object.keys(patch).length)notes.push('Für diesen Wunsch ist keine sichere Vorlagenänderung bekannt. Nutze das KI-Prüfpaket für eine freie Überarbeitung.');
 const candidate=normalize({...c,...patch}),budget=c.mode==='tycoon'?PART_BUDGET:800;
 if(generate(candidate).parts.length>=budget){
  while(candidate.polish>0&&generate(candidate).parts.length>=budget)candidate.polish--;
  while(candidate.detail>0&&generate(candidate).parts.length>=budget)candidate.detail--;
  patch.detail=candidate.detail;if(c.mode==='tycoon')patch.polish=candidate.polish;notes.push('Details an das Bauteilbudget angepasst.');
 }
 return assessPatch({app:'MapForgeReview',baseRevision:reviewRevision(c),summary:feedback?'Deine Wünsche als sichere Vorlagenänderungen prüfen.':'Layout, Details und Vorlagenbudget automatisch prüfen.',patch,notes},c,'local');
}
export function parseReview(text,config){
 const value=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 if(value.length>50000)throw Error('Der Vorschlag ist zu groß. Maximal 50 KB JSON.');
 let raw;try{raw=JSON.parse(value);}catch{throw Error('Kein gültiges JSON. Füge nur das JSON-Objekt der KI ein.');}
 return assessPatch(raw,config,'external-ai');
}
export function reviewRequest(map,feedback=''){
 const c=map.config;
 return {app:'MapForgeReviewRequest',version:VERSION,baseRevision:reviewRevision(c),wish:short(feedback,2000),config:c,checks:validate(map),geometry:{parts:map.parts.length,plots:map.plots?.length||0,stages:map.stages.length},allowedFields:REVIEW_FIELDS,responseExample:{app:'MapForgeReview',baseRevision:reviewRevision(c),summary:'Begründe die Änderungen anhand der Daten und Vorschau.',patch:{},notes:['Offene echte Spieltests benennen.']}};
}
export function reviewPrompt(map,feedback=''){
 return `# MapForge: Map prüfen und gezielt verbessern\n\nPrüfe Map-Daten.json, Geometrie.json und Map-Vorschau.png. Die Vorschau ist eine parametrische Layoutdarstellung, kein Roblox-Screenshot. Untersuche Lesbarkeit, Laufwege, Einstiegsziele, Detailbudget und Spieltempo. Berücksichtige diesen Nutzerwunsch: ${short(feedback,2000)||'Verbessere nachvollziehbare Schwächen.'}\n\nBei Konfigurationsänderungen antworte ausschließlich mit einem JSON-Objekt im Format aus responseExample. patch darf nur erlaubte Felder aus allowedFields enthalten. Produkt-IDs, Käufe, Skripte und bestehende Speicherstände dürfen nicht verändert werden. Erfinde keine Studio-Tests, Spielerzahlen oder Umsätze. Behalte baseRevision unverändert bei. Die App prüft jeden importierten Vorschlag nochmals. Größere Geometrie- oder Skriptänderungen als nächsten Quellcode-Schritt in notes beschreiben.\n\n\`\`\`json\n${JSON.stringify(reviewRequest(map,feedback),null,2)}\n\`\`\`\n`;
}
export function improvementMarkdown(history=[]){
 return `# Verbesserungsprotokoll\n\nLokale Regeln und importierte externe KI-Vorschläge sind getrennt gekennzeichnet. Kein automatisch ausgeführter Roblox-Spieltest.\n${history.slice(-10).map(h=>`\n## ${short(h.createdAt,40)} · ${h.source==='local'?'Lokale Prüfung':'Externer KI-Vorschlag'}\n${short(h.summary)}\n${(h.changes||[]).map(c=>`- ${short(c.key,40)}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`).join('\n')}\n${(h.notes||[]).map(s=>'- '+short(s)).join('\n')}\n`).join('')}\n`;
}
