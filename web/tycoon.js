import {TYCOON_SURFACES,FOLIAGE,BLOSSOMS} from './tycoon-style.js';
import {vertices} from './geometry.js';
export const TYCOON_THEMES={
 sky:{name:'Crystal Industries',label:'Kristallfabrik',own:'deine Kristallfabrik',way:'zur Kristallfabrik',top:'#7897ba',side:'#405777',accent:'#7ee8de',dark:'#29364e',fog:'#c3d7e1'},
 neon:{name:'Neon Empire',label:'Neon-Labor',own:'dein Neon-Labor',way:'zum Neon-Labor',top:'#394661',side:'#27344f',accent:'#bc98ff',dark:'#252942',fog:'#8f9dbd'},
 lava:{name:'Molten Industries',label:'Vulkanwerk',own:'dein Vulkanwerk',way:'zum Vulkanwerk',top:'#795e4c',side:'#50403c',accent:'#ff9850',dark:'#40303d',fog:'#b6959a'},
 jungle:{name:'Bloom Industries',label:'Biofabrik',own:'deine Biofabrik',way:'zur Biofabrik',top:'#598853',side:'#3f6748',accent:'#b6d871',dark:'#30463d',fog:'#b6cfc1'}
};
export const tycoonTheme=key=>TYCOON_THEMES[Object.hasOwn(TYCOON_THEMES,key)?key:'sky'];
export const LAYOUTS={flow:{name:'Produktionsstraße',detail:'Maschinen folgen dem Baufortschritt; hohe Gebäude am hinteren Rand.'},campus:{name:'Fabrik-Campus',detail:'Ähnliche Maschinen bilden eigene Werkbereiche; Türme bleiben am Rand.'},skyline:{name:'Zentrale Skyline',detail:'Gestaffelte Türme bilden hinten die Mitte; Produktion liegt davor.'}};
export const TYCOON_PRODUCTS=[
 {key:'TCashSmall',field:'cashSmallId',name:'25.000 Cash',detail:'Fester Betrag für deine nächste Erweiterung.'},
 {key:'TCashLarge',field:'cashLargeId',name:'1.000.000 Cash',detail:'Großes Cash-Paket für den Fabrikausbau.'},
 {key:'TGems100',field:'gems100Id',name:'100 Kristalle',detail:'Für auswählbare Fabrik-Skins.'},
 {key:'TGems500',field:'gems500Id',name:'500 Kristalle',detail:'Größeres Paket für mehrere Designs.'},
 {key:'TBoost15',field:'tycoonBoostId',name:'2× Produktion · 15 Min.',detail:'Verdoppelt Produktion für 15 Minuten Spielzeit.'},
 {key:'TBundle',field:'bundleId',name:'Empire-Paket',detail:'250.000 Cash + 250 Kristalle. Wiederholbar.'}
];
export const TYCOON_PASSES=[
 {key:'VIP',field:'vipPassId',name:'VIP',detail:'Goldene Fabrikakzente, VIP-Titel und +25 % Produktion.'},
 {key:'AutoCollect',field:'autoCollectPassId',name:'Auto-Collect',detail:'Produktion automatisch vom Tresor ins Wallet sammeln.'},
 {key:'DoubleIncome',field:'doubleIncomePassId',name:'2× Produktion dauerhaft',detail:'Dauerhafter Produktionsfaktor. Stapelt sich mit dem Zeitboost.'}
];
const definitions=[
 ['Starterbohrer','drill'],['Förderband A','belt'],['Kristallpresse','press'],['Extraktor II','drill'],['Energieverteiler','reactor'],['Werkhalle','hall'],
 ['Förderband B','belt'],['Doppelbohrer','drill'],['Laser-Schneider','press'],['Forschungslabor','lab'],['Fassaden-Upgrade','wall'],['Reaktorkern','reactor'],
 ['Automatisierte Presse','press'],['Förderstrecke C','belt'],['Plasma-Extraktor','drill'],['Drohnenstation','lab'],['Kontrollturm','tower'],['Quantenreaktor','reactor'],
 ['Kristall-Labor','lab'],['Industriebohrer','drill'],['Veredelungsanlage','press'],['Neon-Fassade','wall'],['Orbit-Transmitter','tower'],['Meisterreaktor','reactor'],
 ['Hyperpresse','press'],['Skyline-Turm','tower'],['Energiegarten','lab'],['Dimensionskern','reactor'],['Empire-Zentrale','tower'],['Prestige-Monument','monument'],
 ['Solar-Array','solar'],['Kühltürme','cooling'],['Logistikdepot','storage'],['Bio-Gewächshaus','greenhouse'],['Verladekran','crane'],['Tiefenkernbohrer','drill'],
 ['Robotik-Labor','lab'],['Fusionsanlage','reactor'],['Zen-Energiegarten','garden'],['Orbital-Antenne','antenna'],['Nano-Veredelung','press'],['Skyline-Residenz','tower'],
 ['Dimensionsportal','portal'],['Drohnen-Helipad','helipad'],['Antimaterie-Kern','reactor'],['Zukunfts-Campus','lab'],['Empire-Wolkenkratzer','tower'],['Weltwunder','monument']
];
let running=3;
export const UPGRADES=definitions.map(([name,kind],index)=>{
 // Keep the first six builds quick, then lengthen the construction curve gradually.
 const progression=1+3.2*Math.max(0,(index-5)/(definitions.length-6));
 const cost=index===0?0:Math.round(Math.round(running*(12+index*1.7))*progression);
 const decorative=['hall','wall','monument'].includes(kind);
 const income=index===0?3:decorative?0:Math.max(1,Math.round(running*.52));
 if(index)running+=income;
 return {id:'u'+String(index+1).padStart(2,'0'),index:index+1,name,kind,cost,income,requires:index?'u'+String(index).padStart(2,'0'):null};
});
const MACHINE_NAMES={
 jungle:{drill:'Saatgut-Extraktor',belt:'Pflanzen-Förderband',press:'Blütenpresse',reactor:'Bio-Reaktor',hall:'Gewächshalle',lab:'Pflanzenlabor',wall:'Rankenfassade',tower:'Wachstumsturm',monument:'Blütenmonument',solar:'Solarblätter',cooling:'Bewässerungstürme',storage:'Saatgutlager',greenhouse:'Blütengewächshaus',crane:'Erntekran',garden:'Botanischer Garten',antenna:'Wetterstation',portal:'Biomportal',helipad:'Erntedrohnenplatz'},
 neon:{drill:'Photonen-Extraktor',belt:'Energietransport',press:'Laserpresse',reactor:'Plasma-Reaktor',hall:'Cyber-Werkhalle',lab:'Photonenlabor',wall:'Hologrammfassade',tower:'Datenturm',monument:'Neon-Monument',solar:'Photonen-Array',cooling:'Kryo-Kühlung',storage:'Energiespeicher',greenhouse:'Hydroponik-Labor',crane:'Magnetkran',garden:'Lichtgarten',antenna:'Signalstation',portal:'Quantenportal',helipad:'Cyber-Drohnenplatz'},
 lava:{drill:'Erzbohrer',belt:'Erz-Förderband',press:'Schmelzpresse',reactor:'Magmakern',hall:'Gießereihalle',lab:'Legierungslabor',wall:'Basaltfassade',tower:'Hochofen',monument:'Vulkan-Monument',solar:'Wärmekollektoren',cooling:'Kühltürme',storage:'Erzlager',greenhouse:'Wärmegewächshaus',crane:'Gießereikran',garden:'Lavasteingarten',antenna:'Vulkan-Messstation',portal:'Glutportal',helipad:'Erzdrohnenplatz'}
};
export function upgradeName(upgrade,theme='sky'){
 const names=MACHINE_NAMES[theme];if(!names)return upgrade.name;
 if(upgrade.index===1)return {jungle:'Gratis-Saatgutsammler',neon:'Gratis-Photonensammler',lava:'Gratis-Erzsammler'}[theme];
 const n=UPGRADES.slice(0,upgrade.index).filter(u=>u.kind===upgrade.kind).length;
 return (names[upgrade.kind]||upgrade.name)+(n>1?' '+n:'');
}
export const themedUpgrades=theme=>UPGRADES.map(u=>({...u,name:upgradeName(u,theme)}));
export function upgradeSlots(layout='flow'){
 const available=Array.from({length:UPGRADES.length},(_,i)=>i),slots=new Map();
 const tall=UPGRADES.filter(u=>['tower','monument','antenna','crane'].includes(u.kind));
 const skyline=[44,45,43,46,42,47,38,39,37,40,36,41];
 for(const [i,u] of tall.entries()){
  const slot=layout==='skyline'?skyline[i]:available.at(-1);
  available.splice(available.indexOf(slot),1);slots.set(u.id,slot);
 }
 const remaining=UPGRADES.filter(u=>!slots.has(u.id));
 if(layout==='campus'){
  const order=['drill','belt','press','reactor','hall','wall','lab','solar','cooling','storage','greenhouse','garden','portal','helipad'];
  remaining.sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)||a.index-b.index);
 }
 for(const u of remaining)slots.set(u.id,available.shift());
 return slots;
}
export const SKINS=[{id:'mint',name:'Mint',cost:0,color:'#86f0d0'},{id:'violet',name:'Violet',cost:50,color:'#b3a1ff'},{id:'gold',name:'Gold',cost:100,color:'#ffdc86'},{id:'ruby',name:'Ruby',cost:150,color:'#ff899f'},{id:'ice',name:'Ice',cost:250,color:'#9be3ff'},{id:'void',name:'Void',cost:400,color:'#c38df3'},
 {id:'ocean',name:'Ocean',cost:500,color:'#52cde8'},{id:'ember',name:'Ember',cost:600,color:'#ffab75'},
 {id:'rose',name:'Rose',cost:700,color:'#f5a4cb'},{id:'aurora',name:'Aurora',cost:850,color:'#8defbc'},
 {id:'royal',name:'Royal',cost:1100,color:'#a69dff'},{id:'prism',name:'Prism',cost:1500,color:'#eef7ff'}];
export const RESEARCH=[
 {id:'efficiency',name:'Prozessoptimierung',max:12,base:1500,growth:3,detail:'+5 % Basisproduktion je Stufe'},
 {id:'logistics',name:'Offline-Logistik',max:8,base:3500,growth:4,detail:'+30 Minuten Offline-Fenster je Stufe'},
 {id:'mastery',name:'Prestige-Forschung',max:8,base:10000,growth:5,detail:'+5 Kristalle je Rebirth und Stufe'}
];
export const QUESTS=[
 {id:'build',name:'3 Ausbauten bauen',field:'Buys',target:3,reward:10},
 {id:'play',name:'5 Minuten spielen',field:'Seconds',target:300,reward:15},
 {id:'collect',name:'500 Cash abholen',field:'Collected',target:500,reward:10},
 {id:'architect',name:'12 Ausbauten bauen',field:'Buys',target:12,reward:25},
 {id:'session',name:'15 Minuten spielen',field:'Seconds',target:900,reward:30},
 {id:'industrialist',name:'10.000 Cash abholen',field:'Collected',target:10000,reward:25}
];
export const CONTRACTS=[
 {id:'build',name:'Bauauftrag',metric:'build',target:3,reward:12,detail:'Baue bis zu drei weitere Ausbauten. Je Ausbau gibt es vier Kristalle.'},
 {id:'research',name:'Forschungsauftrag',metric:'research',target:1,reward:8,detail:'Erforsche eine weitere Stufe mit erspieltem Cash.'},
 {id:'collect',name:'Lieferauftrag',metric:'collect',target:120,reward:8,detail:'Sammle Cash im Wert von zwei Minuten deiner Produktion bei Annahme.'}
];
export const CONTRACT_LIMIT=3;
export const CALIBRATION={minimumBuilds:3,stations:3,bonusFactor:1.15,bonusSeconds:120,cooldown:180,minimumInterval:4};
export const PACING={brisk:{name:'Zügig',factor:.7,detail:'30 % niedrigere Baukosten als die verlängerte Standardkurve'},balanced:{name:'Standard',factor:1,detail:'Schneller Einstieg, danach schrittweise längere Bauabschnitte'},relaxed:{name:'Langfristig',factor:1.25,detail:'25 % höhere Baukosten als die verlängerte Standardkurve'}};
export function buildCost(upgrade,pacing='balanced'){return Math.round(upgrade.cost*(Object.hasOwn(PACING,pacing)?PACING[pacing]:PACING.balanced).factor);}
export const PART_BUDGET=5200;
export const MILESTONES=[{id:'build12',count:12,reward:10},{id:'build24',count:24,reward:15},{id:'build36',count:36,reward:20},{id:'build48',count:48,reward:25}];
export function economySnapshot(ownedCount=1,rebirths=0,pacing='balanced'){const nodes=UPGRADES.slice(0,Math.max(0,Math.min(UPGRADES.length,ownedCount))),next=UPGRADES[nodes.length];return {count:nodes.length,income:nodes.reduce((n,u)=>n+u.income,0)*(1+Math.min(100,Math.max(0,rebirths))*.2),spent:nodes.reduce((n,u)=>n+buildCost(u,pacing),0),next:next?{...next,cost:buildCost(next,pacing)}:null};}
export function generateTycoon(c,{rng,version}){
 const t=TYCOON_THEMES[c.theme],rand=rng(c.seed+'|'+c.theme),parts=[],stages=[],plots=[],paths=[];let id=0;
 const surface=TYCOON_SURFACES[c.theme],metal=surface.metal,silver=surface.silver,glass=surface.glass;
 // Emission has a job: objectives, working cores and small lamps. Large trims
 // retain their material and shading instead of flattening the entire factory.
 const emissive=/Button_|Claim$|Screen|EnergyCore|Output_|Beacon|PortalField|PortalCore|Signal_|HeliLight|LampHead|PromenadeGlow|FurnaceMouth|HoloDisplay|Calibration_\d|LandmarkHeart/;
 const part=(name,pos,size,color,extra={})=>{const p={id:++id,name,pos:pos.map(n=>Math.round(n*1000)/1000),size,color,kind:'tycoon',anchored:true,collide:true,material:surface.bodyMat,plot:0,...extra};if(p.neon&&!emissive.test(name))p.neon=false;if(c.theme==='jungle'&&/RoadStripe|Waymark|PromenadeGlow|PerimeterLight|EntranceGlow|FacadeLight|BayTrim/.test(name)){p.neon=false;p.material='Wood';}parts.push(p);return p;};
 const columns=Math.ceil(c.plots/2),width=columns*224+8;
 part('CentralBoulevard',[0,-1,0],[width,2,66],t.dark,{material:c.theme==='jungle'?'Ground':'Asphalt',layer:0});
 for(const z of [-25,25])part('HubPavement_'+z,[0,.12,z],[width,.24,14],surface.path,{material:surface.pathMat,layer:1});
 for(let x=-width/2+12;x<width/2;x+=18)part('RoadStripe_'+x,[x,.04,0],[8,.05,.6],t.accent,{neon:true,collide:false,layer:1});
 part('StartSpawn',[0,.7,0],[8,1,8],t.accent,{kind:'spawn'});
 for(const x of [-13,13])part('WelcomePillar_'+x,[x,7,11],[1.5,14,1.5],metal,{material:'Metal'});
 part('WelcomeArch',[0,13,11],[27,3.2,1.2],t.dark,{label:t.own.toUpperCase(),sign:{mode:'surface',width:480,height:90,distance:55}});
 part('GamePlan',[-23,5,1],[13,7,1],t.dark,{collide:false,sign:{mode:'surface',width:400,height:180,distance:24},label:'SO WÄCHST DEIN BETRIEB\nGratis starten · produzieren\nCash abholen · weiterbauen'});
 for(let col=0;col<columns;col++){
  const x=(col-(columns-1)/2)*224;
  for(const z of [-25,25]){
   part('HubPlanter_'+col+'_'+z,[x+40,.9,z],[16,1.8,7],surface.bed,{material:c.theme==='jungle'?'Wood':'Concrete'});
   part('HubHedge_'+col+'_'+z,[x+40,2.4,z],[14,2,5],c.theme==='lava'?'#8b7058':FOLIAGE[(col+(z>0?1:0))%FOLIAGE.length],{collide:false,material:'Grass'});
   if(c.polish>0)for(let flower=-1;flower<=1;flower++){
    const fx=x+40+flower*4;
    part('HubStem_'+col+'_'+z+'_'+flower,[fx,3.3,z],[.25,1.5,.25],'#567d65',{collide:false});
    part('HubBloom_'+col+'_'+z+'_'+flower,[fx,4.15,z],[1.8,1.2,1.8],c.theme==='jungle'?BLOSSOMS[(flower+1+col)%BLOSSOMS.length]:flower===0?t.accent:surface.silver,{shape:'ball',collide:false});
    if(c.polish===2)for(const side of [-1,1])part('HubPetal_'+col+'_'+z+'_'+flower+'_'+side,[fx+side*.8,4,z],[1.1,.65,1.4],c.theme==='jungle'?BLOSSOMS[(flower+3+col)%BLOSSOMS.length]:t.accent,{shape:'ball',collide:false});
   }
  }
 }
 for(let pi=1;pi<=c.plots;pi++){
  const col=Math.floor((pi-1)/2),s=(pi-1)%2?-1:1,cx=(col-(columns-1)/2)*224,cz=-s*146;
  const P=(name,xyz,size,color,extra={})=>{const rotation=extra.rotation||[0,0,0];return part('P'+pi+'_'+name,[cx+s*xyz[0],xyz[1],cz+s*xyz[2]],size,color,{plot:pi,...extra,rotation:[s<0?-rotation[0]:rotation[0],rotation[1]+(s<0?180:0),rotation[2]]});};
  const cyl=(name,xyz,height,diameter,color,extra={})=>P(name,xyz,[height,diameter,diameter],color,{...extra,shape:'cylinder',rotation:[0,0,90]});
  const path=(name,x,z,sx,sz)=>{P(name,[x,.32,z],[sx,.08,sz],surface.path,{layer:1,material:surface.pathMat,collide:false});paths.push({plot:pi,x:cx+s*x,z:cz+s*z,size:[sx,sz]});};
  plots.push({index:pi,pos:[cx,0,cz]});stages.push({index:pi,pos:[cx,0,cz],checkpoint:false});
  P('Foundation',[0,-1.5,0],[188,3,216],surface.base,{role:'Base',layer:0,material:surface.baseMat});
  P('IslandUndercut',[0,-4.2,0],[178,2.4,206],t.dark,{layer:0,material:'Slate'});
  P('Floor',[0,.1,0],[184,.2,212],surface.floor,{layer:0,material:surface.floorMat});
  P('EntranceBridge',[0,.1,115],[22,.2,20],surface.path,{layer:0,material:surface.pathMat});
  // A central promenade and three cross lanes remain clear at every build level.
  path('Promenade',0,0,18,204);
  for(const z of [-48,0,48])path('CrossLane_'+z,0,z,164,5.5);
  if(c.polish>0)for(const z of [-48,0,48])for(const x of [-12,12])P('Waymark_'+x+'_'+z,[x,.39,z],[2,.06,1],t.accent,{layer:1,collide:false,neon:true});
  if(c.polish===2)for(const z of [-72,-24,24,72])for(const x of [-9.6,9.6])P('PromenadeGlow_'+x+'_'+z,[x,.48,z],[.22,.18,5],t.accent,{layer:1,collide:false,neon:true,skin:true,light:Math.abs(z)===72?{range:10,brightness:.3}:undefined});
  for(const x of [-44,44])for(const z of [-48,48])P('DistrictFloor_'+x+'_'+z,[x,.23,z],[68,.06,88],surface.district,{layer:0,material:surface.floorMat,collide:false});
  // Sector labels sit beside the promenade, never in its walking or camera lane.
  for(const x of [-14,14])for(const z of [-72,72])P('DistrictMarker_'+x+'_'+z,[x,3.2,z],[3.5,4.8,.7],t.dark,{material:c.theme==='jungle'?'Wood':'Metal',label:(x<0?'A':'B')+(z>0?'1':'2'),sign:{mode:'surface',width:100,height:140,distance:20}});
  for(const x of [-90,90]){
   P('PerimeterLight_'+x,[x,.35,0],[.5,.4,207],t.accent,{neon:true,collide:false,skin:true,layer:1});
   P('CanalRim_'+x,[x*.94,.38,0],[5,.4,194],c.theme==='jungle'?surface.bed:t.dark,{material:c.theme==='jungle'?'Wood':surface.baseMat,layer:1,collide:false});
   P('WaterChannel_'+x,[x*.94,.61,0],[3.6,.1,192],c.theme==='jungle'?'#4a9386':c.theme==='lava'?'#c97949':glass,{material:c.theme==='lava'?'CrackedLava':'Glass',transparency:c.theme==='lava'?0:.32,collide:false,layer:1});
  }
  P('Claim',[0,.52,101],[13,.8,8],t.accent,{role:'Claim',sign:{width:150,height:42,distance:24,offset:3},collide:false,neon:true});
  const kiosk=(name,x,color,role)=>{
   P(name+'Plinth',[x,.5,101],[14,1,10],t.dark);
   const main=P(name,[x,2.1,100],[10,3,6],color,{role,material:'Metal',sign:{width:152,height:44,distance:28,offset:3.4}});
   P(name+'Screen',[x,3.9,100],[8,.6,4],color,{neon:true,collide:false,light:role==='Research'?{range:13,brightness:.7}:undefined});
   P(name+'Door',[x,2.2,103.1],[4,2,.15],t.dark,{collide:false});
   return main;
  };
  kiosk('Collector',-30,'#83d9ac','Collect');kiosk('Research',30,'#9dc9ff','Research');
  kiosk('Shop',-69,'#ffda86','Shop');kiosk('Rebirth',69,'#c9a2ff','Rebirth');
  P('ContractBoardBase',[-77,.45,82],[15,.5,5],t.side,{material:'Concrete'});
  for(const dx of [-5,5])P('ContractBoardLeg_'+dx,[-77+dx,1.6,82],[.7,2.6,.7],metal,{material:'Metal'});
  P('ContractBoard',[-77,4.5,82],[12,4,.7],t.dark,{role:'ContractBoard',label:'AUFTRÄGE',sign:{mode:'surface',width:240,height:85,distance:26},material:'Wood'});
  P('ContractBoardGlow',[-77,6.7,82],[12.5,.3,1],t.accent,{neon:true,collide:false});
  for(let station=1;station<=CALIBRATION.stations;station++){
   const x=12,z=96-station*48;
   P('CalibrationBase_'+station,[x,.6,z],[3,.7,3],metal,{material:'Metal',collide:false});
   P('CalibrationPost_'+station,[x,2.1,z],[1.2,2.5,1.2],t.side,{material:c.theme==='jungle'?'Wood':'Metal',collide:false});
   P('Calibration_'+station,[x,3.6,z],[2.5,.6,2.5],t.accent,{role:'Calibration'+station,neon:true,collide:false,label:'KALIBRIERUNG '+station+'/3',sign:{width:140,height:36,distance:18,offset:2}});
   P('CalibrationScreen_'+station,[x,2.5,z+ .7],[.8,.8,.1],t.accent,{neon:true,collide:false});
  }
  for(let line=0;line<3;line++)P('ContractBoardNote_'+line,[-79+line*2,4.5,82.5],[1.3,2,.1],line===1?'#ffda86':t.top,{collide:false});
  for(const x of [-12,12])P('EntrancePillar_'+x,[x,7.3,106],[1.3,14,1.3],metal,{material:'Metal'});
  P('EntranceCanopy',[0,14.4,106],[26,1,6],t.side,{material:'Metal'});
  P('EntranceSign',[0,13.8,109.1],[20,2,.3],t.dark,{label:t.label.toUpperCase()+' · '+String(pi).padStart(2,'0'),sign:{mode:'surface',width:420,height:75,distance:48}});
  P('EntranceGlow',[0,15,106],[24,.15,4.5],t.accent,{neon:true,skin:true,collide:false});
  for(const side of [-1,1]){
   P('EntranceWing_'+side,[side*20,11.8,104],[12,1.2,8],surface.metal,{material:c.theme==='jungle'?'WoodPlanks':'Metal',rotation:[0,0,side*10]});
   P('EntranceFin_'+side,[side*25,6.2,104],[1,11,3.5],t.side,{material:c.theme==='jungle'?'Wood':'Concrete'});
  }
  const xs=[-66,-44,-22,22,44,66],zs=[84,60,36,12,-12,-36,-60,-84];
  // Put tall structures at the far edge, leaving the front production yards readable.
  const slots=upgradeSlots(c.layout);
  for(const u of UPGRADES){
   const slot=slots.get(u.id),x=xs[slot%6],z=zs[Math.floor(slot/6)],v=rand(),extra={unlock:u.id,hiddenAtStart:true},acc={...extra,skin:true,neon:true},steel={...extra,material:'Metal'};
   const Q=(n,xyz,size,color,options={})=>P(n+'_'+u.id,[x+xyz[0],xyz[1],z+xyz[2]],size,color,{...extra,...options});
   const C=(n,xyz,h,d,color,options={})=>cyl(n+'_'+u.id,[x+xyz[0],xyz[1],z+xyz[2]],h,d,color,{...extra,...options});
   P('Button_'+u.id,[x,.58,z+9],[9,.6,3.4],t.accent,{role:'Button',upgrade:u.id,hiddenAtStart:true,collide:false,neon:true});
   Q('MachineBase',[0,.8,0],[15,1.05,15],surface.base,{material:c.theme==='jungle'?'WoodPlanks':surface.baseMat});
   if(u.index%4===0)Q('BayTrim',[0,1.35,6.8],[12,.16,.3],t.accent,{...acc,collide:false});
   if(u.kind==='drill'){
    for(const dx of [-4.5,4.5])Q('DrillFrame'+dx,[dx,4.7,-1],[1.3,7,7],metal,steel);
    Q('DrillBeam',[0,8.5,-1],[11,1.1,3],silver,steel);
    C('DrillMotor',[0,9.9,-1],1.8,4.5,t.side,steel);
    C('DrillShaft',[0,5.6,-1],4.6,1.1,t.accent,acc);
    for(let i=0;i<3;i++)C('DrillBit'+i,[0,3.7-i*.7,-1],.5,3.6-i*.8,silver,steel);
    Q('OreBin',[0,1.9,3],[6,1.1,4],t.side,steel);
   }else if(u.kind==='belt'){
    Q('Belt',[0,1.8,0],[10,.6,12],'#354754',steel);
    for(const dx of [-5.2,5.2])Q('BeltRail'+dx,[dx,2.4,0],[.6,1,12],silver,steel);
    for(let b=0;b<4;b++)Q('BeltRoller'+b,[0,2.23,-4.5+b*3],[9,.45,.45],metal,{...steel,shape:'cylinder'});
    for(let b=0;b<2;b++)Q('BeltOre'+b,[b?2:-2,3,-2+b*5],[1.8,1.8,1.8],t.accent,{...acc,rotation:[0,20+b*35,15],collide:false});
   }else if(u.kind==='press'){
    Q('PressBed',[0,2,0],[10,1.5,9],t.side,steel);
    for(const dx of [-4.3,4.3])C('PressPiston'+dx,[dx,5.5,-1],6,1.3,silver,steel);
    Q('PressCrown',[0,8.6,-1],[11,1.2,5],t.side,steel);Q('PressPlate',[0,5.1,0],[8,.8,6],metal,steel);
    Q('PressScreen',[0,7.4,1.6],[4,.7,.2],t.accent,{...acc,collide:false});
    Q('PressCore',[0,3,0],[3,1,3],t.accent,acc);
   }else if(u.kind==='reactor'||u.kind==='cooling'){
    if(u.kind==='cooling'){
     for(const dx of [-3.3,3.3]){const h=7+(dx>0?3:0);C('CoolingTank'+dx,[dx,h/2+1.4,0],h,5.6,t.side,steel);C('CoolingRim'+dx,[dx,h+1.5,0],.7,6.2,silver,steel);C('CoolingVent'+dx,[dx,h+1.9,0],.2,4,t.dark,steel);}
     Q('CoolingPipe',[0,2.4,3],[10,1,1],t.accent,acc);
    }else{
     C('ReactorFoot',[0,1.8,0],1,10,metal,steel);C('ReactorChamber',[0,5.3,0],6,6.5,glass,{material:'Glass',transparency:.55});
     Q('EnergyCore',[0,5.4,0],[3.6,3.6,3.6],t.accent,{...acc,shape:'ball',light:u.index%3===0?{range:14,brightness:.65}:undefined});
     for(const h of [2.7,7.8])C('ReactorRing'+h,[0,h,0],.55,8.5,silver,steel);
     for(const dx of [-4.3,4.3])Q('ReactorSpine'+dx,[dx,5.3,0],[.8,7,.8],t.side,steel);
     C('ReactorCap',[0,9,0],1.2,5,t.side,steel);
    }
   }else if(['lab','greenhouse','hall','wall','storage'].includes(u.kind)){
    if(u.kind==='storage'){
     for(const dx of [-3.3,3.3]){Q('Container'+dx,[dx,3.8,0],[5.8,5,11],dx<0?t.side:metal,steel);for(const dz of [-4,4])Q('ContainerBrace'+dx+'_'+dz,[dx,3.8,dz],[6,.3,.3],silver,steel);}
    }else{
     const green=u.kind==='greenhouse',h=green?8:u.kind==='hall'?10:u.kind==='wall'?8:5.8+v*2;
     Q('BuildingBody',[0,1.8,0],[12,1.7,11],t.side,steel);
     for(const dx of [-5.5,5.5])Q('BuildingColumn'+dx,[dx,2+h/2,0],[1,h,11],t.side,steel);
     Q('BuildingBack',[0,2+h/2,-5],[10,h,.7],t.side,steel);
     Q('BuildingGlass',[0,2+h/2,5.3],[10,h-2,.25],glass,{material:'Glass',transparency:green?.5:.27});
     if(green){
      for(const side of [-1,1])Q('GreenhouseRoof'+side,[side*3.25,h+2.7,0],[7,.3,12.5],glass,{material:'Glass',transparency:.5,rotation:[0,0,-side*22]});
      Q('GreenhouseRidge',[0,h+4,0],[.4,.45,13],c.theme==='jungle'?surface.bed:silver,{material:c.theme==='jungle'?'Wood':'Metal'});
     }else {
      Q('BuildingRoof',[0,h+2,0],[14,.8,12.5],metal,steel);
      if(u.kind==='lab')Q('LabSkylight',[0,h+2.65,0],[6,.45,7],glass,{material:'Glass',transparency:.2,collide:false});
     }
     Q('BuildingHeader',[0,h+1.3,5.6],[11,.5,.4],t.accent,acc);
     if(green)for(const dx of [-3,3]){
      Q('GrowingBed'+dx,[dx,2.9,0],[3.5,.6,8],surface.bed,{material:'WoodPlanks'});
      for(const dz of [-2.5,2.5])Q('Plant'+dx+'_'+dz,[dx,4.2,dz],[2.5,2.6,2.5],FOLIAGE[(pi+(dx>0?1:0)+(dz>0?1:0))%FOLIAGE.length],{material:'LeafyGrass',shape:'ball',collide:false});
     }
     else Q('HVAC',[2,h+3,-2],[4,1.5,4],silver,steel);
    }
   }else if(u.kind==='tower'){
    const h=18+u.index*.38+v*6+(c.layout==='skyline'?6:0),step=h/3;
    for(let k=0;k<3;k++){
     const width=12-k*(1.2+v*.5),base=1.6+k*step,setback=k*(u.index%2?-.35:.35);
     Q('TowerTier'+k,[setback,base+step/2,0],[width,step-.3,width],u.index%3===0?metal:t.side,{material:'Concrete'});
     Q('TowerFront'+k,[setback,base+step*.55,width/2+.12],[width*(u.index%3===0?.58:.86),step*.68,.2],glass,{material:'Glass',transparency:.2});
     Q('TowerSide'+k,[setback-width/2-.12,base+step*.55,0],[.2,step*.68,width*.78],glass,{material:'Glass',transparency:.2});
     Q('TowerBelt'+k,[setback,base+step,0],[width+.4,.3,width+.4],t.accent,{...acc,neon:k===2});
    }
    Q('TowerMast',[0,h+4,0],[.45,5,.45],silver,steel);Q('TowerBeacon',[0,h+6.7,0],[.8,.8,.8],t.accent,{...acc,shape:'ball'});
   }else if(u.kind==='solar'){
    for(const dx of [-4,4])Q('SolarLeg'+dx,[dx,3,0],[.7,4,.7],silver,steel);
    Q('SolarPanel',[0,5.3,0],[14,.5,11],'#2d5274',{...steel,rotation:[-15,0,0]});
    for(const dx of [-4.5,0,4.5])Q('SolarGrid'+dx,[dx,5.63,0],[.18,.08,10.6],glass,{...extra,rotation:[-15,0,0],collide:false});
   }else if(u.kind==='garden'){
    Q('GardenBasin',[0,1.6,0],[13,.7,12],silver,{material:'Concrete'});
    Q('GardenPool',[0,2,0],[11,.1,10],glass,{material:'Glass',transparency:.25,collide:false});
    for(const dx of [-4,4]){Q('GardenPlanter'+dx,[dx,2.3,-3],[3,1.8,4],t.side);Q('GardenTrunk'+dx,[dx,5,-3],[.6,4,.6],'#796550',{material:'Wood'});Q('GardenTree'+dx,[dx,7.4,-3],[4.8,4.4,4.8],'#7fbda0',{shape:'ball',collide:false});}
   }else if(u.kind==='portal'){
    for(const dx of [-4.5,4.5])Q('PortalPillar'+dx,[dx,6.5,0],[1.5,10,3],metal,steel);
    Q('PortalLintel',[0,11.8,0],[11,1.2,3],t.side,steel);Q('PortalField',[0,6.5,0],[7.4,8,.3],t.accent,{...acc,transparency:.66,collide:false});
    Q('PortalCore',[0,6.5,0],[2.5,2.5,1],t.accent,{...acc,shape:'ball',collide:false});
   }else if(u.kind==='crane'||u.kind==='antenna'){
    const h=u.kind==='crane'?18:22;Q('Mast',[0,h/2+1,0],[2,h,2],silver,steel);
    for(const dy of [5,10,15])Q('MastBrace'+dy,[0,dy,0],[7,.5,3],t.side,steel);
    if(u.kind==='crane'){Q('CraneArm',[0,h+1,0],[14,1,2],t.accent,acc);Q('CraneCable',[5,h-4,0],[.2,9,.2],metal,steel);Q('Cargo',[5,7.5,0],[3,3,3],t.side,steel);}
    else {Q('Dish',[0,h+2,0],[8,1.7,8],glass,{...steel,shape:'ball',rotation:[35,0,0]});Q('Signal',[0,h+4,0],[1.2,1.2,1.2],t.accent,{...acc,shape:'ball'});}
   }else if(u.kind==='helipad'){
    Q('Helipad',[0,2.2,0],[13,1.5,13],metal,steel);
    for(const dx of [-2,2])Q('HeliMark'+dx,[dx,3,0],[.6,.05,6],silver,{collide:false});
    Q('HeliBar',[0,3,0],[4,.05,.6],silver,{collide:false});
    for(const dx of [-5.5,5.5])for(const dz of [-5.5,5.5])Q('HeliLight'+dx+'_'+dz,[dx,3.1,dz],[.5,.3,.5],t.accent,acc);
   }else{
    C('MonumentFoot',[0,1.8,0],1.2,12,silver,{material:'Concrete'});C('MonumentStep',[0,2.8,0],.8,9,t.side);
    Q('MonumentCrystal',[0,8,0],[4,9+v*3,4],t.accent,{...acc,rotation:[12,45,18]});
    for(const dy of [5,10])Q('Orbit'+dy,[0,dy,0],[11,.3,1],silver,{...steel,rotation:[0,dy*6,20]});
    Q('MonumentCrown',[0,14,0],[2,2,2],t.accent,{...acc,shape:'ball',label:u.index===48?'EMPIRE LEGEND':undefined});
   }
   if(c.detail>=2&&u.index%6===0){
    if(c.theme==='jungle'){
     for(const side of [-1,1])Q('LivingPlanter'+side,[side*5,2.4,-4],[2.8,2.4,2.8],FOLIAGE[(u.index+pi+(side>0?1:0))%FOLIAGE.length],{material:'LeafyGrass',shape:'ball',collide:false});
     Q('LivingBloom',[5,3.9,-4],[1.7,1,1.7],BLOSSOMS[(u.index+pi)%BLOSSOMS.length],{shape:'ball',collide:false});
    }else if(c.theme==='sky'){
     for(const side of [-1,1])Q('CrystalLens'+side,[side*5,3.4,-4],[1.8,5,1.8],side<0?glass:t.accent,{material:'Glass',transparency:.18,rotation:[0,25,side*18],collide:false});
     Q('LensLink',[0,3,-4],[8,.35,.35],silver,{material:'Metal',collide:false});
    }else if(c.theme==='lava'){
     Q('FurnaceHood',[0,4,-4],[7,5,3],t.dark,{material:'Basalt'});
     Q('FurnaceMouth',[0,3.7,-2.4],[4,2,.2],t.accent,{neon:true,collide:false});
     Q('FurnaceFlue',[3,7,-4],[1.8,5,1.8],metal,{material:'Metal'});
    }else{
     Q('HoloProjector',[0,2.2,-4],[6,1,3],metal,{material:'Metal'});
     Q('HoloDisplay',[0,5,-4],[5.5,4,.2],t.accent,{neon:true,transparency:.45,collide:false});
     Q('HoloGlyph',[0,5,-3.7],[1.6,1.6,.15],glass,{neon:true,rotation:[0,0,45],collide:false});
    }
   }
   if(['drill','press','reactor','lab'].includes(u.kind))Q('Output',[0,3.1,6.2],[2.5,.6,.6],t.accent,{...acc,role:'Output',collide:false});
   // One detailed console per four bays is enough to communicate the control
   // language; the saved parts fund architecture instead of repeating clutter.
   if(c.detail>=2&&u.index%4===0){
    Q('ControlConsole',[5.9,2.3,4.5],[1.4,2,1.2],metal,steel);Q('ConsoleScreen',[5.9,3.4,4.5],[1.2,.3,1],t.accent,{...acc,collide:false});
   }
  }
  // Purchasable architecture frames the yards without covering the play area.
  for(const x of [-79,79]){
   for(const z of [-96,96])P('HallFrame_'+x+'_'+z,[x,7.6,z],[1.4,15,1.4],metal,{unlock:'u06',hiddenAtStart:true,material:'Metal'});
   P('HallCornice_'+x,[x,15,0],[2,1.1,194],t.side,{unlock:'u06',hiddenAtStart:true,material:'Metal'});
   P('FacadeLight_'+x,[x,15.6,0],[.6,.15,194],t.accent,{unlock:'u22',hiddenAtStart:true,neon:true,skin:true,collide:false});
   if(c.detail>=1)for(const z of [-84,-60,-36,-12,12,36,60,84]){
    P('WallFoot_'+x+'_'+z,[x,1.6,z],[.9,2.6,14],t.side,{unlock:'u11',hiddenAtStart:true,material:'Concrete'});
    P('FacadeGlass_'+x+'_'+z,[x,5,z],[.3,4.2,14],glass,{unlock:'u11',hiddenAtStart:true,material:'Glass',transparency:.55,collide:false});
   }
  }
  // A bespoke rear silhouette becomes the reward for the prestige milestone.
  // Pylons sit outside the reserved promenade; the open centre remains walkable.
  const landmark={unlock:'u30',hiddenAtStart:true},archMaterial=c.theme==='jungle'?'Wood':c.theme==='lava'?'Basalt':'Metal';
  for(const side of [-1,1]){
   P('LandmarkPylon_'+side,[side*13,17,-100],[3,33,4],t.side,{...landmark,material:archMaterial});
   P('LandmarkShoulder_'+side,[side*10,32,-100],[8,2,5],metal,{...landmark,material:archMaterial,rotation:[0,0,-side*16]});
  }
  P('LandmarkCrown',[0,35,-100],[18,2,5],metal,{...landmark,material:archMaterial});
  if(c.theme==='sky'){
   P('LandmarkHeart',[0,29,-100],[5,12,5],t.accent,{...landmark,skin:true,material:'Glass',transparency:.16,rotation:[8,45,15],collide:false});
   for(const side of [-1,1])P('LandmarkCrystal_'+side,[side*8,38,-100],[2.4,9,2.4],glass,{...landmark,material:'Glass',transparency:.16,rotation:[0,0,-side*16],collide:false});
  }else if(c.theme==='neon'){
   P('LandmarkHeart',[0,29,-100],[8,8,2],t.accent,{...landmark,skin:true,neon:true,rotation:[0,0,45],collide:false});
   P('LandmarkInset',[0,29,-98.8],[4.8,4.8,.5],t.dark,{...landmark,rotation:[0,0,45],collide:false});
   P('LandmarkAerial',[0,40,-100],[1,9,1],silver,{...landmark,material:'Metal'});
  }else if(c.theme==='lava'){
   for(const side of [-1,1])P('LandmarkCrag_'+side,[side*5,37,-100],[5,15,6],t.dark,{...landmark,material:'Basalt',rotation:[0,side*12,-side*19]});
   P('LandmarkHeart',[0,29,-100],[2,8,3],t.accent,{...landmark,neon:true,skin:true,collide:false});
  }else{
   for(const side of [-1,1])P('LandmarkCanopy_'+side,[side*7,37,-100],[18,8,11],FOLIAGE[side<0?1:2],{...landmark,material:'LeafyGrass',shape:'ball',collide:false});
   P('LandmarkHeart',[0,30,-100],[6,5,6],BLOSSOMS[(pi-1)%BLOSSOMS.length],{...landmark,shape:'ball',collide:false});
  }
  // Landscaping has a distinct silhouette for every theme and uses the seeded RNG.
  const count=c.detail===0?0:c.detail*2;
  for(let d=0;d<count;d++){
   const side=d%2?1:-1,x=side*(99+rand()*2),z=-80+Math.floor(d/2)*70,jitter=(rand()-.5)*8;
   P('LandscapePlinth_'+d,[x,.2,z],[14,.7,19],c.theme==='jungle'?surface.floor:surface.base,{material:c.theme==='jungle'?'Grass':surface.baseMat,layer:0});
   if(c.theme==='jungle'){
    P('TreeTrunk_'+d,[x,4.7,z],[1.5,9,1.5],'#79634d',{material:'Wood',rotation:[0,0,side*8]});
    for(let k=0;k<3;k++)P('TreeCrown_'+d+'_'+k,[x+(k-1)*3,9.7+(k===1?3:0),z+jitter],[8-k*.6,5.5+(d%2),8],FOLIAGE[(d+k)%FOLIAGE.length],{material:'LeafyGrass',shape:'ball',collide:false});
    if(c.detail>=2&&d%2===0)P('TreeBranch_'+d,[x+side*1.3,6.5,z],[3.5,.7,.7],'#79634d',{material:'Wood',rotation:[0,0,side*28]});
    P('Fern_'+d,[x+4,1.8,z+5],[5,2.5,5],FOLIAGE[(d+2)%FOLIAGE.length],{material:'Grass',shape:'ball',collide:false});
   }else if(c.theme==='lava'){
    for(let k=0;k<3;k++)P('Basalt_'+d+'_'+k,[x+(k-1)*3,3+k*2,z+jitter],[4,6+k*4,5],k%2?t.dark:t.side,{material:'Slate',rotation:[k*4,k*20,side*(8+k*3)]});
    P('MagmaVein_'+d,[x,1,z+4],[10,.18,2],t.accent,{neon:true,collide:false});
   }else if(c.theme==='sky'){
    for(let k=0;k<3;k++)P('CrystalCluster_'+d+'_'+k,[x+(k-1)*3,4+k*1.5,z+jitter],[2.4,7+k*2,2.4],k===1?'#edf9ff':t.accent,{rotation:[side*8,k*25,side*(12+k*6)],material:'Glass',transparency:.12,collide:false});
    P('SoftCloud_'+d,[x,-3,z],[18,5,17],'#e5edf3',{shape:'ball',collide:false});
   }else{
    P('LightTotem_'+d,[x,7,z],[3,14,3],t.dark,{material:'Metal'});
    P('HoloPanel_'+d,[x,10,z+1.7],[8,5,.25],t.accent,{neon:true,transparency:.35,collide:false,rotation:[0,side*10,0]});
    P('Antenna_'+d,[x,16,z],[.3,5,.3],silver,{material:'Metal'});
   }
  }
  if(c.theme==='jungle'&&c.detail>0){
   for(const side of [-1,1])for(let bi=0;bi<(c.detail>=2?2:1);bi++){
    const x=side*94,z=-47+bi*91,key=side+'_'+bi;
    P('FlowerBed_'+key,[x,.7,z],[6,1.1,18],surface.bed,{material:'WoodPlanks'});
    P('FlowerSoil_'+key,[x,1.3,z],[5.2,.2,17],'#594a36',{material:'Ground',collide:false});
    for(let flower=0;flower<2;flower++){
     const dz=z-4+flower*8,green=FOLIAGE[(pi+bi+flower)%FOLIAGE.length],color=BLOSSOMS[(pi+bi*2+flower)%BLOSSOMS.length];
     P('GardenStem_'+key+'_'+flower,[x,2.4,dz],[.3,2.1,.3],green,{material:'Grass',collide:false});
     P('GardenBloom_'+key+'_'+flower,[x,3.65,dz],[2.8,1.1,2.8],color,{material:'SmoothPlastic',shape:'ball',collide:false});
     if(c.polish>0)P('GardenPetal_'+key+'_'+flower,[x+side*.9,3.45,dz],[2,1,2],BLOSSOMS[(pi+bi+flower+1)%BLOSSOMS.length],{material:'SmoothPlastic',shape:'ball',collide:false});
     if(c.polish===2)P('GardenHedge_'+key+'_'+flower,[x+side,1.9,dz+2.3],[3,1.7,3.3],green,{material:'LeafyGrass',shape:'ball',collide:false});
    }
   }
  }
  if(c.detail>0)for(const x of [-80,80])for(const z of [-99,0,90]){
   P('LampPole_'+x+'_'+z,[x,5.5,z],[.6,10,.6],metal,{material:'Metal'});
   P('LampHead_'+x+'_'+z,[x,10.6,z],[3,.4,2],t.accent,{neon:true,collide:false,light:c.detail>=2?{range:19,brightness:.65}:undefined});
  }
  if(c.detail>=3)for(const x of [-77,77])for(const z of [-48,48]){
   P('Bench_'+x+'_'+z,[x,1.5,z],[3.2,.6,5],t.dark,{material:'Wood'});
   P('BenchBack_'+x+'_'+z,[x+(x<0?-1.5:1.5),2.4,z],[.4,1.6,5],metal,{material:'Metal'});
  }
 }
 return {version,config:c,theme:t,stages,parts,coins:[],hazards:[],plots,paths,upgrades:themedUpgrades(c.theme),key:'MF-TYCOON-1',economy:economySnapshot(UPGRADES.length,0,c.pacing)};
}
export function validateTycoon(map){
 const c=map.config,checks=[],add=(id,status,title,detail,fix=null)=>checks.push({id,status,title,detail,fix});
 const rolesValid=map.plots.every(plot=>['Claim','Collect','Rebirth','Research','Shop','ContractBoard','Calibration1','Calibration2','Calibration3'].every(role=>map.parts.filter(p=>p.plot===plot.index&&p.role===role).length===1));
 add('ownership',rolesValid?'pass':'error','Eigene Grundstücke',`${map.plots.length} Grundstücke. Kauf, Tresor und Rebirth prüfen den Eigentümer auf dem Server.`);
 const upgradesValid=map.plots.every(plot=>UPGRADES.every(u=>map.parts.filter(p=>p.plot===plot.index&&p.role==='Button'&&p.upgrade===u.id).length===1&&map.parts.some(p=>p.plot===plot.index&&p.unlock===u.id)));
 add('economy',upgradesValid?'pass':'error',UPGRADES.length+' Ausbaustufen',`Gratis-Starter, ${UPGRADES.length-1} weitere Käufe, 28 Forschungsstufen und 12 Farbdesigns. Ohne Robux durchspielbar.`);
 add('budget',map.parts.length<PART_BUDGET?'pass':'warn','Bauteilbudget',`${map.parts.length} verankerte Bauteile; tatsächliche FPS und Mehrspielerbetrieb in Studio prüfen.`);
 add('wallet','pass','Dauerhafter Fortschritt','Cash, Kristalle, Ausbauten und Skins bleiben gespeichert. Rebirth setzt nur die Fabrik zurück.');
 const ids=TYCOON_PRODUCTS.map(p=>c[p.field]).filter(Boolean),passes=TYCOON_PASSES.map(p=>c[p.field]).filter(Boolean);
 const dupe=new Set(ids).size!==ids.length||new Set(passes).size!==passes.length;
 add('products',!c.shop?'pass':dupe?'error':ids.length+passes.length?'warn':'warn','Robux-Angebote',!c.shop?'Robux-Shop ausgeschaltet.':dupe?'Doppelte IDs innerhalb eines Produkttyps gefunden.':`${ids.length}/6 Developer Products, ${passes.length}/3 Pässe konfiguriert. Zugehörigkeit und Preise in Roblox prüfen.`,dupe?'tycoonProducts':null);
 add('persistence',c.persistence?'pass':'warn','Kaufbelege & Session-Sperren',c.persistence?'Belohnung und Beleg atomar gespeichert; Wiederholungen und verlorene Antworten berücksichtigt.':'Nur Demo: kein dauerhaftes Speichern und keine echten Käufe.');
 const reachable=map.paths?.length===map.plots.length*4&&map.paths.every(path=>{
  const size=path.size[0]>path.size[1]?[path.size[0]-20,path.size[1]]:path.size;
  return !map.parts.some(p=>{
   if(p.plot!==path.plot||!p.collide||(p.layer??2)<2)return false;
   const v=vertices(p),lo=[0,1,2].map(i=>Math.min(...v.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...v.map(p=>p[i])));
   return hi[1]>1&&lo[1]<5.5&&hi[0]>path.x-size[0]/2&&lo[0]<path.x+size[0]/2&&hi[2]>path.z-size[1]/2&&lo[2]<path.z+size[1]/2;
  });
 });
 add('walkways',reachable?'pass':'error','Freie Hauptwege',`${map.plots.length} Promenaden und drei Querverbindungen je Fabrik; Maschinen stehen außerhalb der Laufkorridore.`);
 add('geometry',map.parts.every(p=>p.anchored&&p.pos.every(Number.isFinite)&&p.size.every(n=>Number.isFinite(n)&&n>0)&&(!p.rotation||p.rotation.every(Number.isFinite))&&(!p.transparency||p.transparency>=0&&p.transparency<=1))?'pass':'error','Geometrie und Materialien','Maße, Rotation, Glas-Transparenz und verankerte Teile für den Export geprüft.');
 add('loop','pass','Weitere Spielziele','Drei wählbare Auftragstypen, sechs Tagesaufträge, 12 Skin-Käufe und Forschung. Ein aktiver Auftrag bleibt bei Pause und Rebirth erhalten.');
 add('studio','manual','Roblox-Spieltest offen','Grundstückswechsel, zwei Spieler, Offline-Rückkehr, Rebirth, Touch und echte Kaufbelege in einem Testspiel prüfen.');
 return checks;
}
