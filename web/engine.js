import {COSMETICS,COSMETIC_ID_FIELDS,cosmeticsLua,cosmeticChecks} from './cosmetics.js';
import {generateOnlyUp,measureOnlyUpRoute,validateOnlyUpGeometry,ONLY_UP_PART_BUDGET} from './only-up.js';
import {normalizeAscentLayout} from './only-up-architecture.js';
import {normalizeMinigame} from './minigames.js';
import {normalizeEvents,addEventArena} from './events.js';
import {normalizeMovement,movementForConfig,movementJumpLimits} from './movement.js';
import {cleanConcept} from './idea-data.js';
import {gameListing} from './listing.js';
import {isTemplateName} from './map-names.js';
import {MATERIAL_IDS,lightingProfile} from './tycoon-style.js';
import {rotationMatrix} from './geometry.js';
import {partQuery,partShadow} from './quality-report.js';
import {addCreativeWorldDetails} from './creative-world.js';
import {legacyStoryId,normalizeStoryId} from './creative-data.js';
import {storyForConfig} from './creative-story.js';
import {generateTycoon,validateTycoon,TYCOON_THEMES,tycoonTheme,TYCOON_PRODUCTS,TYCOON_PASSES,UPGRADES,PART_BUDGET,SKINS,RESEARCH,QUESTS,PACING,LAYOUTS} from './tycoon.js';
export const VERSION = '3.25.0-public.1';
export const SCRIPT_FILES={cosmeticsServer:'cosmetics-server',cosmeticsClient:'cosmetics-client',workshopCore:'workshop-core',workshopService:'workshop-service',workshopServer:'workshop-server',workshopClient:'workshop-client',eventCore:'event-core',eventServer:'event-server',eventClient:'event-client',movementServer:'movement-server',movementClient:'movement-client',data:'data',server:'server',client:'client',health:'health',tycoonServer:'tycoon-server',tycoonClient:'tycoon-client',tycoonHealth:'tycoon-health',tycoonEconomy:'tycoon-economy'};
export const THEMES = {
  sky: {name:'Cloud Kingdom', label:'Himmel', top:'#becaff', side:'#6660bc', accent:'#baff62', dark:'#292344', fog:'#d8e3ff', path:'spiral'},
  neon: {name:'Neon District', label:'Neon', top:'#90a6ff', side:'#46407e', accent:'#4effce', dark:'#191830', fog:'#363a58', path:'switchback'},
  lava: {name:'Molten Canyon', label:'Lava', top:'#f0a477', side:'#814a51', accent:'#ffdc70', dark:'#382639', fog:'#75494d', path:'canyon'},
  jungle: {name:'Lost Islands', label:'Dschungel', top:'#a6d8ae', side:'#438677', accent:'#ffe794', dark:'#254444', fog:'#97b7b3', path:'spiral'}
};
export const DEFAULT = {cosmetics:true,auroraPassId:'',solarPassId:'',nebulaPassId:'',concept:null,obbyStyle:'classic',ascentLayout:'spire',grind:true,minigame:'signal',events:'rally',movement:'classic',storyId:'',name:'Cloud Kingdom',autoName:true,mode:'obby',plots:4,layout:'flow',pacing:'balanced',polish:1,theme:'sky',difficulty:'normal',stages:36,checkpointEvery:5,seed:'EXAMPLE-01',detail:3,gap:4,rise:1.3,shop:true,persistence:true,shopHints:true,shopHintDelay:180,shopFocus:'balanced',analytics:true,boostId:'',coinsId:'',cashSmallId:'',cashLargeId:'',gems100Id:'',gems500Id:'',tycoonBoostId:'',bundleId:'',vipPassId:'',autoCollectPassId:'',doubleIncomePassId:''};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
export function hash(str){let h=2166136261;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=hash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function normalize(input={}){
  const c={...DEFAULT};for(const k of Object.keys(DEFAULT))if(Object.prototype.hasOwnProperty.call(input,k))c[k]=input[k];
  c.name=String(c.name||'Meine Map').replace(/[\x00-\x1f]/g,'').slice(0,70);
  c.autoName=typeof input.autoName==='boolean'?input.autoName:isTemplateName(input.name);
  c.concept=c.mode==='obby'?null:cleanConcept(c.concept);
  c.seed=String(c.seed||'MAP-01').slice(0,80);
  c.theme=Object.hasOwn(THEMES,c.theme)?c.theme:'sky';
  c.layout=Object.hasOwn(LAYOUTS,c.layout)?c.layout:'flow';
  c.pacing=Object.hasOwn(PACING,c.pacing)?c.pacing:'balanced';
  c.mode=c.mode==='tycoon'?'tycoon':'obby';
  c.obbyStyle=c.obbyStyle==='onlyup'?'onlyup':'classic';
  c.ascentLayout=normalizeAscentLayout(c.ascentLayout);
  c.movement=normalizeMovement(c.movement);
  c.events=normalizeEvents(c.events);
  c.minigame=normalizeMinigame(c.minigame);c.grind=c.grind!==false;c.cosmetics=c.cosmetics!==false;
  c.storyId=Object.prototype.hasOwnProperty.call(input,'storyId')?normalizeStoryId(c.storyId,c.mode):legacyStoryId(c.seed,c.mode);
  if(c.autoName&&c.mode==='tycoon'&&Object.values(THEMES).some(t=>t.name===c.name))c.name=tycoonTheme(c.theme).name;
  else if(c.autoName&&c.mode==='obby'&&Object.values(TYCOON_THEMES).some(t=>t.name===c.name))c.name=THEMES[c.theme].name;
  c.plots=Math.round(clamp(finite(c.plots,4),2,6));
  c.difficulty=['easy','normal','hard'].includes(c.difficulty)?c.difficulty:'normal';
  c.stages=Math.round(clamp(finite(c.obbyStyle==='onlyup'&&!Object.prototype.hasOwnProperty.call(input,'stages')?144:c.stages,c.obbyStyle==='onlyup'?144:36),c.obbyStyle==='onlyup'?96:12,c.obbyStyle==='onlyup'?240:80));
  c.checkpointEvery=Math.round(clamp(finite(c.checkpointEvery,5),2,10));
  c.polish=Math.round(clamp(finite(c.polish,1),0,2));
  c.detail=Math.round(clamp(finite(c.detail,2),0,3));
  c.gap=clamp(finite(c.gap,4),1,12);c.rise=clamp(finite(c.rise,1.3),0,7);
  c.shop=c.shop!==false;c.persistence=c.persistence!==false;
  c.shopHints=c.shopHints!==false;c.analytics=c.analytics!==false;
  c.shopHintDelay=Math.round(clamp(finite(c.shopHintDelay,180),120,900));
  c.shopFocus=c.shopFocus==='designs'?'designs':'balanced';
  for(const k of ['boostId','coinsId',...TYCOON_PRODUCTS.map(p=>p.field),...TYCOON_PASSES.map(p=>p.field),...COSMETIC_ID_FIELDS]) c[k]=/^\d{1,15}$/.test(String(c[k]).trim())&&Number(c[k])>0?String(c[k]).trim():'';
  return c;
}
export function fromBrief(brief,input={}){
  const c=normalize(input), s=String(brief).toLowerCase(), notes=[];
  if(/tycoon|fabrik|factory|empire/.test(s)){c.mode='tycoon';notes.push('Produktions-Tycoon');}else if(/obby|parcours/.test(s))c.mode='obby';
  for(const [theme,re] of [['lava',/lava|vulkan|feuer|canyon/],['jungle',/dschungel|jungle|wald|temple|insel|bloom|biofabrik|natur|blumen/],['neon',/neon|cyber|stadt|city/],['sky',/wolken|himmel|sky|cloud/]])if(re.test(s)){c.theme=theme;notes.push('Design: '+THEMES[theme].label);break;}
  if(/einfach|anfänger|leicht|easy/.test(s)){c.difficulty='easy';notes.push('Leichte Hindernisse');}
  else if(/schwer|hard|profi/.test(s)){c.difficulty='hard';notes.push('Mehr Hindernisse');}
  if(/only\s*up|nur\s+(?:nach\s+)?oben|vertikal(?:er|e|es)?\s+(?:aufstieg|parcours)/.test(s)){c.mode='obby';c.obbyStyle='onlyup';c.stages=Math.max(144,c.stages);notes.push('Only Up · langer Themenaufstieg');}
  for(const [layout,re] of [['ridge',/klippenweg|klippenpfad/],['switchback',/faltenhöfe|faltenhoefe/],['spire',/turmspirale/]])if(re.test(s)){c.mode='obby';c.obbyStyle='onlyup';c.ascentLayout=layout;notes.push('Eigene Bauform: '+layout);break;}
  const count=s.match(/\b(\d{1,3})\s*(?:stufen|stages|level|abschnitte)/);if(count){c.stages=clamp(Number(count[1]),c.obbyStyle==='onlyup'?96:12,c.obbyStyle==='onlyup'?240:80);notes.push(c.stages+' Abschnitte');}
  if(/ohne\s*(shop|käufe|robux)/.test(s))c.shop=false;
  if(/ohne\s*(grind|werkstatt)/.test(s))c.grind=false;else if(/grind|werkstatt|maschinenverbesser/.test(s))c.grind=true;
  for(const [game,re] of [['memory',/echohöfe|echohoefe|merkfolge|gedächtnis/],['collect',/funkenjagd|sammelrunde/],['signal',/signal[- ]?rallye|signalwerk/]])if(re.test(s)){c.minigame=game;c.events='rally';notes.push('Minispiel ausgewählt');break;}
  let requestedMovement=null;
  if(/(?:ohne|kein)\s+sprint|klassisch(?:e|es|en)?\s+(?:movement|bewegung|steuerung)/.test(s))requestedMovement='classic';
  else if(/präzise(?:s|r|n)?\s+(?:movement|bewegung|steuerung)|präzisionsprofil/.test(s))requestedMovement='precise';
  else if(/parkour/.test(s))requestedMovement='parkour';
  else if(/\bsprint(?:en)?\b|erkundungsprofil/.test(s))requestedMovement='explore';
  if(requestedMovement){c.movement=requestedMovement;notes.push('Bewegung: '+movementForConfig(c).name);}
  if(!notes.length)notes.push('Aktuelle Vorlage mit neuem Seed');
  return {config:normalize(c),notes};
}
export function generate(input){
 const c=normalize(input);if(c.mode==='tycoon')return addCreativeWorldDetails(addEventArena(generateTycoon(c,{hash,rng,version:VERSION})));
 if(c.obbyStyle==='onlyup')return addCreativeWorldDetails(addEventArena(generateOnlyUp(c,{hash,rng,version:VERSION})));
 const t=THEMES[c.theme], random=rng(c.seed+'|'+c.theme), stages=[], parts=[], coins=[], hazards=[];
 const surfaces={sky:{deck:'Concrete',rock:'Slate',frame:'Metal'},neon:{deck:'DiamondPlate',rock:'Metal',frame:'Metal'},lava:{deck:'Basalt',rock:'Slate',frame:'Metal'},jungle:{deck:'WoodPlanks',rock:'Ground',frame:'Wood'}}[c.theme];
 let id=0;
 const part=(name,pos,size,color,kind='decor',extra={})=>{const material=/Stage_|Lobby|Hurdle|Slalom/.test(name)?surfaces.deck:/Underside_|Island_|Rock_/.test(name)?surfaces.rock:/Gate|Building_|Trunk_/.test(name)?surfaces.frame:'SmoothPlastic';const p={id:++id,name,pos:pos.map(n=>Math.round(n*1000)/1000),size,color,kind,material,anchored:true,collide:kind!=='coin'&&kind!=='decor',...extra};parts.push(p);return p;};
 let x=0,z=0,angle=random()*.8;
 for(let i=0;i<=c.stages;i++){
  if(i>0){const step=14+c.gap;if(t.path==='spiral'){angle+=step/(66+i*1.1)*(0.92+random()*.16);x+=Math.cos(angle)*step;z+=Math.sin(angle)*step;}else if(t.path==='switchback'){const run=(i-1)%8;const dir=Math.floor((i-1)/8)%2===0?1:-1;if(run===7)z+=step;else x+=step*dir;}else {const dir=(Math.floor((i-1)/7)%2===0?1:-1);if((i-1)%7===6)z+=step;else {x+=step*dir;z+=Math.sin(i*.7+angle)*1.6;}}}
  const y=18+i*c.rise, checkpoint=i===0||i===c.stages||i%c.checkpointEvery===0;
  const stage={index:i,pos:[x,y,z],checkpoint,finish:i===c.stages};stages.push(stage);
  part('Stage_'+i,[x,y,z],[14,2,14],checkpoint?t.accent:t.top,'stage',{stage:i,checkpoint});
  part('Underside_'+i,[x,y-(checkpoint?2.5:2.1),z],[checkpoint?13:11.5,checkpoint?3:2.2,checkpoint?13:11.5],t.side);
  // Thin edge lights stay below the walkable surface.
  part('Edge_'+i,[x,y+.4,z-7.04],[14,.3,.2],t.accent,'decor',{neon:true});
  if(checkpoint){part('Checkpoint_'+i,[x,y+1.06,z],[10,.12,10],t.accent,'checkpoint',{stage:i,collide:false,neon:true});
    part('GateL_'+i,[x-6,y+5,z+4],[.5,8,.5],t.side,'decor');part('GateR_'+i,[x+6,y+5,z+4],[.5,8,.5],t.side,'decor');part('GateTop_'+i,[x,y+9,z+4],[12.5,.6,.6],t.accent,'decor',{neon:true});
  }else {
    const cadence=c.difficulty==='easy'?5:c.difficulty==='hard'?2:3;
    if(i%cadence===0){const mode=random()>.5?'Sweep':'Pulse';const p=part(mode+'_'+i,[x,y+1.55,z],[10,.65,.8],'#ff6b87','hazard',{stage:i,mode,neon:true,collide:false});hazards.push(p);}
    else if(i%4===1){part('Hurdle_'+i,[x,y+1.7,z],[8,1.4,1],t.side,'decor',{collide:true});}
    else if(i%4===2){part('SlalomA_'+i,[x-3.8,y+3,z-2],[2.2,4,2.2],t.side,'decor',{collide:true});part('SlalomB_'+i,[x+3.8,y+3,z+2],[2.2,4,2.2],t.side,'decor',{collide:true});}
    const coin=part('Coin_'+i,[x,y+3,z],[1.5,1.5,1.5],'#ffdd75','coin',{stage:i,shape:'ball',neon:true});coins.push(coin);
  }
  if(c.detail>0&&i%(4-c.detail)===0){const sign=random()>.5?1:-1;
   const dx=x+sign*(19+random()*8),dy=y-8-random()*7;
   part('Island_'+i,[dx,dy,z+5],[9+random()*8,4,10+random()*5],t.side);
   part('Crystal_'+i,[x+sign*22,y-2,z+4],[1.2,6+random()*6,1.2],t.accent,'decor',{neon:true});
   if(c.detail>1){
    if(c.theme==='jungle'){part('Trunk_'+i,[dx,dy+5,z+5],[1.6,6,1.6],'#745349');part('Canopy_'+i,[dx,dy+9,z+5],[9,5,8],'#5aaa80','decor',{shape:'ball'});part('CanopyTop_'+i,[dx,dy+12,z+5],[6,4,6],'#8fd99b','decor',{shape:'ball'});}
    else if(c.theme==='neon'){const h=12+random()*18;part('Building_'+i,[dx,dy+h/2+2,z+5],[6,h,6],t.dark);for(let w=0;w<3;w++)part('Window_'+i+'_'+w,[dx,dy+5+w*5,z+1.95],[4,.4,.15],t.accent,'decor',{neon:true});}
    else if(c.theme==='sky'){for(let w=0;w<3;w++)part('Cloud_'+i+'_'+w,[dx+w*4-4,dy-2,z+5],[10,4+(w===1?2:0),7],'#e3e9ff','decor',{shape:'ball'});}
    else {part('Rock_'+i,[dx,dy+7,z+4],[4,12,5],t.dark);part('LavaSeam_'+i,[dx,dy+9,z+1.4],[.5,10,.2],t.accent,'decor',{neon:true});}
   }
  }
 }
 // Obstacle fronts and checkpoint portals follow the direction of travel. The
 // platforms retain their tested square footprints and original saved route.
 for(const p of parts){
  const match=p.name.match(/^(?:GateL|GateR|GateTop|Hurdle|SlalomA|SlalomB)_(\d+)$/),index=match?Number(match[1]):p.kind==='hazard'?p.stage:null;
  if(index===null)continue;
  const centre=stages[index].pos,before=stages[Math.max(0,index-1)].pos,after=stages[Math.min(c.stages,index+1)].pos;
  const yaw=Math.atan2(after[0]-before[0],after[2]-before[2]),dx=p.pos[0]-centre[0],dz=p.pos[2]-centre[2];
  p.pos[0]=Math.round((centre[0]+dx*Math.cos(yaw)+dz*Math.sin(yaw))*1000)/1000;
  p.pos[2]=Math.round((centre[2]-dx*Math.sin(yaw)+dz*Math.cos(yaw))*1000)/1000;
  p.rotation=[0,Math.round(yaw*180/Math.PI*1000)/1000,0];
 }
 const start=stages[0];part('Lobby',[0,12,-23],[38,2,24],t.side,'lobby');part('LobbyStep',[0,15,-13],[14,2,8],t.top,'lobby');
 part('StartSpawn',[0,20.5,0],[7,1,7],t.accent,'spawn',{collide:true,stage:0});
 const last=stages.at(-1);part('FinishBeacon',[last.pos[0],last.pos[1]+14,last.pos[2]],[3,6,3],t.accent,'decor',{neon:true});
 return addCreativeWorldDetails(addEventArena({version:VERSION,config:c,theme:t,stages,parts,coins,hazards,key:'MF1_'+hash(c.seed+'|'+c.theme+'|'+c.stages+'|'+c.gap+'|'+c.rise+'|'+c.difficulty+'|'+c.checkpointEvery+'|'+c.detail).toString(36)}));
}
export function validate(map){
 if(map.config.mode==='tycoon')return [...validateTycoon(map),...cosmeticChecks(map.config,TYCOON_PASSES)];
 const c=map.config, limits=movementJumpLimits(c), movement=movementForConfig(c), checks=[], add=(id,status,title,detail,fix=null)=>checks.push({id,status,title,detail,fix});
 let maxGap=0,maxRise=0;
 for(let i=1;i<map.stages.length;i++){const a=map.stages[i-1].pos,b=map.stages[i].pos;maxGap=Math.max(maxGap,Math.hypot(Math.max(0,Math.abs(b[0]-a[0])-14),Math.max(0,Math.abs(b[2]-a[2])-14)));maxRise=Math.max(maxRise,b[1]-a[1]);}
 if(c.obbyStyle==='onlyup'){const measured=measureOnlyUpRoute(map);maxGap=measured.maxGap;maxRise=measured.maxRise;checks.push(...validateOnlyUpGeometry(map));}
 add('jumps',maxGap<=limits.gap&&maxRise<=limits.rise?'pass':'error','Sprünge & Höhen',`Größte Kantenlücke ${maxGap.toFixed(1)} Studs · Anstieg ${maxRise.toFixed(1)}. ${movement.name}: ohne Sprint konservativ ${limits.gap.toFixed(2)} / ${limits.rise.toFixed(2)}; kein Ersatz für Spieltests.`,maxGap>limits.gap||maxRise>limits.rise?'jumps':null);
 add('spawn',map.parts.filter(p=>p.kind==='spawn').length===1?'pass':'error','Spawn & Ziel','Ein Startpunkt, eine Zielplattform und Rücksetzung zum letzten Checkpoint.');
 add('checkpoints',c.checkpointEvery<=7?'pass':'warn','Checkpoint-Abstände',`Alle ${c.checkpointEvery} Abschnitte; Start und Ziel sind immer gesichert.`,c.checkpointEvery>7?'checkpoints':null);
 add('anchored',map.parts.every(p=>p.anchored)?'pass':'error','Verankerte Bauteile',`${map.parts.length} Bauteile geprüft. Bewegte Gefahren werden serverseitig versetzt.`,map.parts.some(p=>!p.anchored)?'anchors':null);
 const budget=c.obbyStyle==='onlyup'?ONLY_UP_PART_BUDGET:850;
 add('budget',map.parts.length<budget?'pass':'warn','Bauteilbudget',`${map.parts.length} Teile. Planungsgrenze ${budget}; tatsächliche FPS auf Geräten testen.`,map.parts.length>=budget?'detail':null);
 add('server','pass','Spielregeln auf dem Server','Münzen und Fortschritt mit Distanz-, Reihenfolge- und Zeitprüfung; Kaufbelohnungen nur über ProcessReceipt.');
 const ids=[c.boostId,c.coinsId].filter(Boolean), duplicate=ids.length===2&&ids[0]===ids[1];
 add('products',!c.shop?'pass':duplicate?'error':ids.length===2?'pass':'warn','Shop-Konfiguration',!c.shop?'Robux-Shop ausgeschaltet.':duplicate?'Beide Produkte haben dieselbe ID. Verwende zwei unterschiedliche Developer Products.':ids.length===2?'Zwei Produkt-IDs eingetragen. Zugehörigkeit und Kaufablauf in Roblox prüfen.':'Robux-Käufe bleiben deaktiviert, bis zwei passende Produkt-IDs eingetragen sind.',duplicate?'products':null);
 add('persistence',c.persistence?'pass':'warn','Speicherlogik',c.persistence?'Session-Sperre, Autosave und persistente Kaufbelege eingebaut. Studio benötigt aktivierte API-Dienste; sonst nur Demo.':'Demo-Modus: kein dauerhafter Fortschritt und keine Robux-Käufe.');
 add('studio','manual','Roblox-Spieltest','Noch offen: Play, Mehrspieler, Touch-Steuerung, Speichern und Kaufwiederholung in Roblox Studio testen.');
 return [...checks,...cosmeticChecks(c,TYCOON_PASSES)];
}
export function repair(input){
 const c=normalize(input),changes=[];
 const passIds=new Set(TYCOON_PASSES.map(p=>c[p.field]).filter(Boolean));
 for(const item of COSMETICS){if(c[item.field]&&passIds.has(c[item.field])){c[item.field]='';changes.push('Doppelte kosmetische Pass-ID entfernt');}else if(c[item.field])passIds.add(c[item.field]);}
 if(c.mode==='tycoon'){
  for(const group of [TYCOON_PRODUCTS,TYCOON_PASSES]){const seen=new Set();for(const p of group){if(c[p.field]&&seen.has(c[p.field])){c[p.field]='';changes.push('Doppelte Shop-ID entfernt');}else if(c[p.field])seen.add(c[p.field]);}}
 }else{
  const limits=movementJumpLimits(c);
  if(c.gap>limits.gap||c.rise>limits.rise){c.gap=Math.min(c.gap,limits.gap-1);c.rise=Math.min(c.rise,Math.min(2.2,limits.rise));changes.push('Sprungweiten und Höhen auf konservative Werte begrenzt');}
  if(c.checkpointEvery>7){c.checkpointEvery=5;changes.push('Checkpoint-Abstand auf 5 gesetzt');}
  if(c.boostId&&c.boostId===c.coinsId){c.coinsId='';changes.push('Doppelte Produkt-ID entfernt');}
 }
 const before=c.detail,budget=c.mode==='tycoon'?PART_BUDGET:c.obbyStyle==='onlyup'?ONLY_UP_PART_BUDGET:850;
 while(c.detail>0&&generate(c).parts.length>=budget)c.detail--;
 if(before!==c.detail)changes.push('Detailbudget reduziert');
 return {config:c,changes};
}

export function diagnose(log){
 const rules=[
  [/DataStore|StudioAccessToApisNotAllowed|403.*API/i,'Speicherzugriff','Datei zuerst in deinem Roblox-Konto veröffentlichen. Für einen separaten Testplatz unter Game Settings → Security den Studio-Zugriff auf API-Dienste aktivieren. Studio kann echte Daten ändern. Bei Live-Ausfällen bleiben Käufe gesperrt.'],
  [/429|throttl|request.*queue|budget/i,'Zu viele Anfragen','Autosave-Abstände prüfen, keine DataStore-Schreibvorgänge in Heartbeat-Schleifen. Erst nach kurzer Pause erneut testen; Käufe nicht pauschal bestätigen.'],
  [/Infinite yield|WaitForChild/i,'Objekt fehlt','Prüfe den vollständigen Objektpfad und Groß-/Kleinschreibung. Bei MapForge müssen Config und MapForgeRemotes in ReplicatedStorage liegen. Verwende die komplette exportierte Datei.'],
  [/attempt to index nil|not a valid member|nil value/i,'Fehlender Wert','Die genannte Zeile und den ersten fehlenden Objektzugriff prüfen. Vor Zugriff Existenz prüfen; der vollständige Stacktrace hilft beim Eingrenzen.'],
  [/ProcessReceipt|receipt|purchase|product.*id|Produkt-ID/i,'Kaufkonfiguration','Eigene Developer Products im selben Spiel anlegen und IDs in Config setzen. Belohnung und PurchaseId müssen dauerhaft gespeichert sein, bevor PurchaseGranted zurückgegeben wird.'],
  [/session|SESSION_BUSY|Profil.*gesperrt/i,'Profil noch gesperrt','Anderen Spielserver oder Studio-Test schließen. Session-Sperre läuft nach spätestens 180 Sekunden aus. Sperre nicht löschen, solange ein Server das Profil verwendet.'],
  [/syntax|Expected|Unexpected|parse/i,'Skript-Syntax','Zeile aus dem Output prüfen: Klammern, Anführungszeichen und end. Bei eigenen Änderungen in Studio Script Analysis öffnen; der Log-Check ändert keinen fremden Code.'],
  [/Permission|not authorized|401|403/i,'Berechtigung','Kontoinhaber, Spielzuordnung und Asset-Rechte prüfen. Keine Passwörter oder API-Schlüssel in Logs einfügen.'],
  [/fps|lag|performance|memory/i,'Leistung','Detailgrad reduzieren, mit mehreren Spielern und einem echten Mobilgerät testen; MicroProfiler verwenden.']
 ];
 if(!String(log).trim())return [];
 const matches=rules.filter(([re])=>re.test(log)).map(([,title,detail])=>({title,detail}));
 return matches.length?matches:[{title:'Keine bekannte Signatur gefunden',detail:'Das ist keine Fehlerfreiheit-Bestätigung. Kopiere die erste rote Fehlermeldung samt Skriptname, Zeilennummer und Stacktrace aus Studio Output.'}];
}
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const luaString=s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r')+'"';
export function configLua(map){const c=map.config;const movement=movementForConfig(c);const tycoon=c.mode==='tycoon';const story=storyForConfig(c);const onlyUpLua=map.onlyUp?`{Height=${map.onlyUp.height},Chapters={${map.onlyUp.chapters.map(ch=>`{Title=${luaString(ch.title)},Start=${ch.start},Finish=${ch.end}}`).join(',')}}}`:'nil';const storyLua=story?`{ Title=${luaString(story.title)}, Premise=${luaString(story.premise)}, Goal=${luaString(story.goal)}, Chapters={${story.chapters.map(chapter=>`{Title=${luaString(chapter.title)},Text=${luaString(chapter.text)},Target=${chapter.trigger.kind==='upgrade'?chapter.trigger.count:chapter.trigger.index}}`).join(',')}}}`:'nil';const products=tycoon?TYCOON_PRODUCTS.map(p=>`${p.key} = ${c[p.field]||0}`).join(', '):`Boost15 = ${c.boostId||0}, Coins500 = ${c.coinsId||0}`;return `-- MapForge ${VERSION}; exported configuration\nreturn {\n Name = ${luaString(c.name)},\n PublicTitle = ${luaString(gameListing(c).title)},\n PublicDescription = ${luaString(gameListing(c).description)},\n Story = ${storyLua},\n Events = { Mode=${luaString(c.events)} },\n Minigame = ${luaString(c.minigame)},\n Grind = { Enabled=${c.grind} },\n Cosmetics = ${cosmeticsLua(c,luaString)},\n Mode = ${luaString(c.mode)},\n ObbyStyle = ${luaString(c.obbyStyle)},\n AscentLayout = ${luaString(c.ascentLayout)},\n OnlyUp = ${onlyUpLua},\n Theme = ${luaString(c.theme)},\n Layout = ${luaString(c.layout)},\n FactoryWay = ${luaString(tycoon?tycoonTheme(c.theme).way:'zum Ziel')},\n RouteKey = ${luaString(map.key)},\n StageCount = ${c.stages},\n PlotCount = ${c.plots},\n UpgradeCount = ${UPGRADES.length},\n CheckpointEvery = ${c.checkpointEvery},\n Persistence = ${c.persistence},\n StudioTestData = true,\n StudioTestTools = true,\n BuildCostFactor = ${PACING[c.pacing].factor},\n PacingName = ${luaString(PACING[c.pacing].name)},\n ShopEnabled = ${c.shop},\n ShopHints = ${c.shopHints},\n ShopHintDelay = ${c.shopHintDelay},\n ShopFocus = ${luaString(c.shopFocus)},\n OnboardingAnalytics = ${c.analytics},\n WalkSpeed = ${movement.walk},\n JumpPower = ${movement.jump},\n Movement = { Profile=${luaString(movement.id)}, SprintSpeed=${movement.sprint}, SprintEnabled=${movement.sprint>movement.walk} },\n Products = { ${products} },\n Passes = { ${TYCOON_PASSES.map(p=>`${p.key} = ${c[p.field]||0}`).join(', ')} },\n Skins = { ${SKINS.map(s=>`{Id=${luaString(s.id)},Name=${luaString(s.name)},Cost=${s.cost}}`).join(',')} },\n Research = { ${RESEARCH.map(r=>`{Id=${luaString(r.id)},Name=${luaString(r.name)},Max=${r.max},Base=${r.base},Growth=${r.growth},Detail=${luaString(r.detail)}}`).join(',')} },\n Quests = { ${QUESTS.map(q=>`{Id=${luaString(q.id)},Name=${luaString(q.name)},Field=${luaString(q.field)},Target=${q.target},Reward=${q.reward}}`).join(',')} },\n}\n`;}
export function toRBXLX(map,scripts){
 if(map.config.mode==='tycoon'){scripts={...scripts,server:scripts.tycoonServer,client:scripts.tycoonClient,health:scripts.tycoonHealth,economy:scripts.tycoonEconomy};if(!scripts.economy)throw new Error('Skript fehlt: tycoonEconomy');}
 for(const k of ['cosmeticsServer','cosmeticsClient','data','server','client','health','movementServer','movementClient','eventCore','eventServer','eventClient','workshopCore','workshopService','workshopServer','workshopClient'])if(!scripts[k])throw new Error('Skript fehlt: '+k);
 const movement=movementForConfig(map.config);
 let ref=0;const item=(cls,name,props='',children='')=>`<Item class="${cls}" referent="RBXMF${++ref}"><Properties><string name="Name">${xml(name)}</string>${props}</Properties>${children}</Item>`;
 const val=(cls,name,value)=>{const type=cls==='StringValue'?'string':cls==='BoolValue'?'bool':cls==='NumberValue'?'double':'int';return item(cls,name,`<${type} name="Value">${xml(value)}</${type}>`);};
 const script=(cls,name,src,disabled=false)=>item(cls,name,`<ProtectedString name="Source">${xml(src)}</ProtectedString>${cls==='Script'||cls==='LocalScript'?`<bool name="Disabled">${disabled}</bool>`:''}`);
 const color=(name,hex)=>{const n=parseInt(hex.slice(1),16);return `<Color3 name="${name}"><R>${((n>>16)&255)/255}</R><G>${((n>>8)&255)/255}</G><B>${(n&255)/255}</B></Color3>`;};
 const sign=p=>{
  if(!p.label)return '';
  const spec={width:160,height:42,distance:28,offset:3,...p.sign};
  const common=`<bool name="Enabled">${!p.hiddenAtStart}</bool><bool name="AlwaysOnTop">false</bool><float name="MaxDistance">${spec.distance}</float>`;
  const text=()=>item('TextLabel','Text','<UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2><float name="BackgroundTransparency">0.12</float>'+color('BackgroundColor3','#18202c')+color('TextColor3','#edf5f4')+'<bool name="TextWrapped">true</bool><bool name="TextScaled">true</bool><string name="Text">'+xml(p.label)+'</string>');
  if(spec.mode==='surface')return [5,2].map((face,i)=>item('SurfaceGui',i?'MapForgeSignBack':'MapForgeSign',common+`<token name="Face">${face}</token><Vector2 name="CanvasSize"><X>${spec.width}</X><Y>${spec.height}</Y></Vector2><float name="LightInfluence">0</float><float name="Brightness">1</float>`,text())).join('');
  return item('BillboardGui','MapForgeSign',common+`<UDim2 name="Size"><XS>0</XS><XO>${spec.width}</XO><YS>0</YS><YO>${spec.height}</YO></UDim2><Vector3 name="StudsOffset"><X>0</X><Y>${spec.offset}</Y><Z>0</Z></Vector3>`,text());
 };
 const geom=p=>{
  const [x,y,z]=p.pos,[sx,sy,sz]=p.size,r=rotationMatrix(p.rotation),materials=MATERIAL_IDS;let props=`<Vector3 name="size"><X>${sx}</X><Y>${sy}</Y><Z>${sz}</Z></Vector3><CoordinateFrame name="CFrame"><X>${x}</X><Y>${y}</Y><Z>${z}</Z>${r.map((n,i)=>`<R${Math.floor(i/3)}${i%3}>${Math.abs(n)<1e-10?0:n}</R${Math.floor(i/3)}${i%3}>`).join('')}</CoordinateFrame><Color3uint8 name="Color3uint8">${(parseInt(p.color.slice(1),16)+0xff000000)>>>0}</Color3uint8><bool name="Anchored">true</bool><bool name="CanCollide">${p.collide}</bool><bool name="CanTouch">${['stage','spawn','hazard','coin'].includes(p.kind)}</bool><token name="Material">${p.neon?288:materials[p.material]||272}</token><token name="TopSurface">0</token><token name="BottomSurface">0</token>`;
  if(p.hiddenAtStart)props=props.replace(`<bool name="CanCollide">${p.collide}</bool>`,'<bool name="CanCollide">false</bool>')+'<float name="Transparency">1</float>';
  if(p.shape==='ball'||p.shape==='cylinder')props+=`<token name="shape">${p.shape==='ball'?0:2}</token>`;
  if(!p.hiddenAtStart&&p.transparency)props+=`<float name="Transparency">${p.transparency}</float>`;
  props+=`<bool name="CastShadow">${partShadow(p)}</bool><bool name="CanQuery">${partQuery(p)}</bool>`;
  if(p.kind==='spawn')props+='<bool name="Neutral">true</bool><float name="Duration">0</float><bool name="AllowTeamChangeOnTouch">false</bool>';
  const meta=val('StringValue','MFKind',p.kind)+(Number.isInteger(p.stage)?val('IntValue','MFStage',p.stage):'')+(p.mode?val('StringValue','MFMode',p.mode):'')+(Number.isInteger(p.plot)?val('IntValue','MFPlot',p.plot)+val('BoolValue','MFCollide',p.collide)+val('StringValue','MFColor',p.color):'')+(p.role?val('StringValue','MFRole',p.role):'')+(p.unlock?val('StringValue','MFUnlock',p.unlock):'')+(p.upgrade?val('StringValue','MFUpgrade',p.upgrade):'')+(p.skin?val('BoolValue','MFSkin',true):'')+(p.transparency?val('NumberValue','MFTransparency',p.transparency):'')+(p.label?val('StringValue','MFLabel',p.label):'');
  const lights=p.light?item('PointLight','MapForgeLight',color('Color',p.color)+`<float name="Brightness">${p.light.brightness}</float><float name="Range">${p.light.range}</float><bool name="Shadows">false</bool><bool name="Enabled">${!p.hiddenAtStart}</bool>`):'';
  return item(p.kind==='spawn'?'SpawnLocation':'Part',p.name,props,meta+lights+sign(p));
 };
 const folder=kind=>item('Folder',kind,'',map.parts.filter(p=>p.kind===kind).map(geom).join(''));
 const world=item('Workspace','Workspace','<float name="FallenPartsDestroyHeight">-100</float><float name="Gravity">196.2</float><bool name="StreamingEnabled">true</bool><int name="StreamingMinRadius">64</int><int name="StreamingTargetRadius">256</int>',item('Model','MapForgeWorld','',[...new Set(['stage','checkpoint','coin','hazard','spawn','lobby','decor',...map.parts.map(p=>p.kind)])].map(folder).join('')));
 const lp=lightingProfile(map.config,map.theme);
 // Future (4) is a legacy import guard: omitted Technology defaults to Compatibility in old XML.
 // Current rendering intent is explicitly Realistic (0), with prioritized lighting quality.
 const lighting=item('Lighting','Lighting','<token name="Technology">4</token><token name="LightingStyle">0</token><bool name="PrioritizeLightingQuality">true</bool>'+color('Ambient',lp.ambient)+color('OutdoorAmbient',lp.outdoor)+`<float name="Brightness">${lp.brightness}</float><float name="ExposureCompensation">${lp.exposure}</float><float name="ClockTime">${lp.clock}</float><bool name="GlobalShadows">true</bool><float name="ShadowSoftness">0.25</float><float name="EnvironmentDiffuseScale">${lp.diffuse}</float><float name="EnvironmentSpecularScale">${lp.specular}</float><float name="FogEnd">3000</float>`,
  item('BloomEffect','MapForgeBloom',`<float name="Intensity">${lp.bloom}</float><float name="Size">20</float><float name="Threshold">${lp.threshold}</float>`)+
  item('Atmosphere','MapForgeAtmosphere',color('Color',map.theme.fog)+color('Decay',map.theme.side)+`<float name="Density">${lp.density}</float><float name="Offset">0.05</float><float name="Haze">${lp.haze}</float><float name="Glare">${lp.glare}</float>`)+
  item('ColorCorrectionEffect','MapForgeColor',`<float name="Brightness">0</float><float name="Contrast">${lp.contrast}</float><float name="Saturation">${lp.saturation}</float>`)+
  item('ColorGradingEffect','MapForgeTonemapper','<token name="TonemapperPreset">0</token>'));


 return `<?xml version="1.0" encoding="utf-8"?><roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="4"><External>null</External><External>nil</External>${world}${lighting}${item('ReplicatedStorage','ReplicatedStorage','',script('ModuleScript','MapForgeConfig',configLua(map)))}${item('ServerScriptService','ServerScriptService','',script('ModuleScript','MapForgeWorkshopCore',scripts.workshopCore)+script('ModuleScript','MapForgeWorkshop',scripts.workshopService)+script('Script','MapForgeCosmeticsServer',scripts.cosmeticsServer)+script('Script','MapForgeWorkshopServer',scripts.workshopServer)+script('ModuleScript','MapForgeData',scripts.data)+script('Script','MapForgeServer',scripts.server)+script('Script','MapForgeHealth',scripts.health)+script('Script','MapForgeMovementServer',scripts.movementServer)+script('ModuleScript','MapForgeEventCore',scripts.eventCore)+script('Script','MapForgeEventServer',scripts.eventServer)+(scripts.economy?script('ModuleScript','MapForgeTycoon',scripts.economy):''))}${item('StarterPlayer','StarterPlayer',`<float name="CharacterWalkSpeed">${movement.walk}</float><bool name="CharacterUseJumpPower">true</bool><float name="CharacterJumpPower">${movement.jump}</float><bool name="EnableMouseLockOption">${movement.sprint===movement.walk}</bool>`,item('StarterPlayerScripts','StarterPlayerScripts','',script('LocalScript','MapForgeClient',scripts.client)+script('LocalScript','MapForgeMovementClient',scripts.movementClient)+script('LocalScript','MapForgeEventClient',scripts.eventClient)+script('LocalScript','MapForgeWorkshopClient',scripts.workshopClient)+script('LocalScript','MapForgeCosmeticsClient',scripts.cosmeticsClient)))}</roblox>`;
}
export function safeFilename(name){return String(name).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'MapForge';}
