import {vertices} from './geometry.js';
import {normalizeAscentLayout,ascentHeading,addAscentArchitecture} from './only-up-architecture.js';

export const ONLY_UP_PART_BUDGET=9500;
export const ONLY_UP_THEMES={
 sky:{name:'Aufstieg zur Sternwarte',label:'Wolkenwerft',top:'#c1c9d4',side:'#526a80',accent:'#ebca7b',dark:'#263e55',fog:'#d9e4ee',deck:'Concrete',frame:'Metal',chapters:['Verlassener Hafen','Mühlenwerk','Wolkenarchiv','Sternwarte'],objects:['Frachtkisten','Wartungsstege','Mühlenträger','Windsegel','Archivbalkone','Rippenstege','Messplattformen','Sternenterrassen']},
 neon:{name:'Aufstieg im Strombezirk',label:'Strombezirk',top:'#a3bbc9',side:'#465972',accent:'#72d5cd',dark:'#222f47',fog:'#697b91',deck:'DiamondPlate',frame:'Metal',chapters:['Umspannhof','Kühlwerk','Antennenbezirk','Signalspitze'],objects:['Transformatorblöcke','Kabeltraversen','Kühlrippen','Serviceträger','Relaisbalkone','Antennenstege','Empfängerplatten','Signalterrassen']},
 lava:{name:'Aufstieg am Vulkanwerk',label:'Vulkanwerk',top:'#cda98a',side:'#71534b',accent:'#ffba62',dark:'#3d3435',fog:'#b69b8b',deck:'Basalt',frame:'Metal',chapters:['Basaltsockel','Schmelzwerk','Kühlkamin','Sonnenkrone'],objects:['Basaltstufen','Erztraversen','Ofenplatten','Gussträger','Kaminbalkone','Kühlrippen','Messplatten','Kronenterrassen']},
 jungle:{name:'Aufstieg im Wurzelgarten',label:'Wurzelgarten',top:'#b4c7a2',side:'#597a5d',accent:'#e1c584',dark:'#30493d',fog:'#b6c8ad',deck:'WoodPlanks',frame:'Wood',chapters:['Wurzelhafen','Baumwerk','Glashaus','Gartenkrone'],objects:['Wurzeltische','Holztraversen','Astplatten','Rankenbalken','Glashausbalkone','Eisenrippen','Blattplatten','Kronenterrassen']}
};
const SKILLS=['Rhythmus','Versetzte Landung','Präzision','Richtungswechsel','Weite kontrollieren','Schmale Stege','Höhenwechsel','Finale Kombination'];
const round=n=>Math.round(n*1000)/1000;
const box=p=>{const v=vertices(p);return [0,1,2].map(a=>[Math.min(...v.map(p=>p[a])),Math.max(...v.map(p=>p[a]))]);};
const intersects=(a,b)=>a.every((v,i)=>v[0]<b[i][1]-.02&&v[1]>b[i][0]+.02);
const surfaceSize=stage=>stage.size||[14,2,14];
const edgeGap=(a,b)=>Math.hypot(...[0,2].map(axis=>Math.max(0,Math.abs(a.pos[axis]-b.pos[axis])-(surfaceSize(a)[axis]+surfaceSize(b)[axis])/2)));
const top=stage=>stage.pos[1]+surfaceSize(stage)[1]/2;

export function onlyUpClearanceCorridors(stages){
 const corridors=stages.map(s=>[[s.pos[0]-s.size[0]/2+.35,s.pos[0]+s.size[0]/2-.35],[top(s)+.2,top(s)+7],[s.pos[2]-s.size[2]/2+.35,s.pos[2]+s.size[2]/2-.35]]);
 for(let i=1;i<stages.length;i++)for(let sample=0;sample<=12;sample++){
  const a=stages[i-1],b=stages[i],f=sample/12,h=top(a)+(top(b)-top(a))*f+24*f*(1-f),x=a.pos[0]+(b.pos[0]-a.pos[0])*f,z=a.pos[2]+(b.pos[2]-a.pos[2])*f;
  corridors.push([[x-1.5,x+1.5],[h+.2,h+7],[z-1.5,z+1.5]]);
 }
 return corridors;
}

/** Generate an actual rising route; chapter metadata never substitutes for geometry.
 * All gameplay surfaces are axis-aligned, so exported Roblox collision footprints
 * and the conservative route measurements use the same rectangles. */
export function generateOnlyUp(c,{version,hash,rng}){
 const t=ONLY_UP_THEMES[c.theme]||ONLY_UP_THEMES.sky,random=rng(c.seed+'|'+c.theme+'|only-up-v1');
 const stages=[],parts=[],coins=[],hazards=[],sections=[],chapters=[];
 const count=c.stages,detail=c.detail??3;
 const layout=normalizeAscentLayout(c.ascentLayout);
 let id=0,angle=0,y=18;
 const part=(name,pos,size,color,kind='decor',extra={})=>{
  const p={id:++id,name,pos:pos.map(round),size:size.map(round),color,kind,material:t.frame,anchored:true,collide:kind==='stage'||kind==='lobby'||kind==='spawn',query:kind!=='decor',...extra};parts.push(p);return p;
 };
 for(let s=0;s<8;s++)sections.push({index:s,title:t.objects[s],skill:SKILLS[s],start:Math.floor(s*count/8)+1,end:Math.floor((s+1)*count/8)});
 for(let ch=0;ch<4;ch++)chapters.push({index:ch,title:t.chapters[ch],start:ch===0?0:sections[ch*2].start,end:sections[ch*2+1].end,sections:sections.slice(ch*2,ch*2+2)});
 for(let i=0;i<=count;i++){
  const section=i===0?0:Math.min(7,Math.floor((i-1)*8/count)),chapter=Math.floor(section/2);
  const checkpoint=i===0||i===count||i%c.checkpointEvery===0;
  const precision=c.difficulty==='hard'?.9:c.difficulty==='easy'?1.13:1;
  const base=[[11,11],[9,11],[8.5,8.5],[11,8.5],[10,10],[7.8,11],[9,9],[8.5,10]][section];
  const size=checkpoint?[14,2,14]:[Math.max(7.5,base[0]*precision),2,Math.max(7.5,base[1]*precision)];
  // Radial alternation asks for deliberate aim without pushing jump distances.
  const radial=[0,2.7,.7,3,0,1.8,1.2,2.2][section];
  const radius=52+Math.sin(i*Math.PI/2)*radial;
  let pos=[radius,y,0];
  if(i){
   const previous=stages.at(-1),gap=(c.difficulty==='easy'?1.55:c.difficulty==='hard'?3.5:2.6)+[0,.25,-.2,.1,.7,-.3,.2,.35][section];
   // Solve the real rectangular edge distance instead of assuming 14x14 pads.
   if(layout==='spire'){
    let lo=angle+.015,hi=angle+.65;
    for(let step=0;step<34;step++){const mid=(lo+hi)/2,candidate={pos:[Math.cos(mid)*radius,y,Math.sin(mid)*radius],size};if(edgeGap(previous,candidate)<gap)lo=mid;else hi=mid;}
    angle=(lo+hi)/2;
   }else{
    angle=ascentHeading(layout,i);
    let lo=0,hi=40;
    for(let step=0;step<34;step++){const mid=(lo+hi)/2,candidate={pos:[previous.pos[0]+Math.cos(angle)*mid,y,previous.pos[2]+Math.sin(angle)*mid],size};if(edgeGap(previous,candidate)<gap)lo=mid;else hi=mid;}
    const step=(lo+hi)/2;pos=[previous.pos[0]+Math.cos(angle)*step,y,previous.pos[2]+Math.sin(angle)*step];
   }
   y+=checkpoint?1.6:1.7+[.1,.2,.35,.15,.05,.25,.65,.4][section]+(random()-.5)*.12;
   pos=layout==='spire'?[Math.cos(angle)*radius,y,Math.sin(angle)*radius]:[pos[0],y,pos[2]];
  }
  const stage={index:i,pos:pos.map(round),size:size.map(round),checkpoint,finish:i===count,chapter,section,skill:checkpoint?'Ruhefläche':SKILLS[section]};stages.push(stage);
  const p=part('Stage_'+i,pos,size,checkpoint?t.accent:t.top,'stage',{stage:i,stageIndex:i,checkpoint,material:t.deck});
  // A dark structural underside and recessed bright trim make edges readable.
  part('OU_DeckFrame_'+i,[pos[0],y-1.2,pos[2]],[size[0]+.4,.5,size[2]+.4],t.side);
  const trimColor=i===count?'#fff0bd':t.accent;
  for(const side of [-1,1])part('OU_Edge_'+i+'_'+side,[pos[0]+side*(size[0]/2-.18),y+.82,pos[2]],[.15,.12,size[2]-.4],trimColor,'decor',{neon:false,castShadow:false});
  // Brackets stop below the surface; nothing overhangs a landing or a jump.
  if(detail>0){
   const inward=[-Math.cos(angle),-Math.sin(angle)];
   part('OU_Bracket_'+i,[pos[0]+inward[0]*3,y-3,pos[2]+inward[1]*3],[1.2,3,1.2],t.dark);
   if(detail>1){
    for(const sign of [-1,1])part('OU_Bolt_'+i+'_'+sign,[pos[0]+sign*(size[0]/2-.8),y-.7,pos[2]-size[2]/2-.13],[.35,.35,.3],t.accent,'decor',{castShadow:false});
    if(section===0||section===2)part('OU_DeckRib_'+i,[pos[0],y-1.65,pos[2]],[size[0]*.65,.4,size[2]*.65],t.side,'decor',{material:t.deck});
   }
  }
  if(checkpoint){
   part('Checkpoint_'+i,[pos[0],y+1.035,pos[2]],[11,.06,11],t.accent,'checkpoint',{stage:i,collide:false,query:false,castShadow:false});
   // A board to the inside is visible from the route but leaves the deck open.
   if(detail>0){const r=radius-17,boardPos=layout==='spire'?[Math.cos(angle)*r,y+5.5,Math.sin(angle)*r]:[pos[0]-Math.sin(angle)*18,y+5.5,pos[2]+Math.cos(angle)*18];part('OU_Wayfinding_'+i,boardPos,[6,3,.4],t.dark,'decor',{architecture:layout!=='spire',rotation:[0,round(90-angle*180/Math.PI),0],label:i===0?`${t.label}\n${count} Etappen · nur aufwärts`:i===count?'ZIEL · '+t.chapters[3]:`${i} / ${count} · ${t.chapters[chapter]}`,sign:{mode:'surface',width:512,height:180,distance:32}});}
  }else if(i%2===0){const coin=part('Coin_'+i,[pos[0],y+3,pos[2]],[1.25,1.25,1.25],'#f4ce75','coin',{stage:i,shape:'ball',collide:false,neon:true,castShadow:false});coins.push(coin);}
  p.onlyUpSection=section;
 }
 // Grounded stairs join the lobby to the start, with two-stud rises and no gap.
 part('Lobby',[52,12,-24],[24,2,24],t.side,'lobby',{material:t.deck});
 part('OU_ApproachLower',[52,14,-13],[14,2,6],t.top,'lobby',{material:t.deck});
 part('OU_ApproachUpper',[52,16,-9],[14,2,6],t.top,'lobby',{material:t.deck});
 part('StartSpawn',[52,19.5,0],[6,1,6],t.accent,'spawn',{stage:0,material:t.deck});

 const last=stages.at(-1),height=top(last)-top(stages[0]);
 // A single connected central landmark, assembled from themed structures.
 // Its radius stays below 30 studs; the playable helix stays outside 40.
 const beam=(name,a,b,width,color,extra={})=>{const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d);return part(name,a.map((v,i)=>(v+b[i])/2),[width,length,width],color,'decor',{rotation:[round(Math.atan2(d[2],d[1])*180/Math.PI),0,round(-Math.atan2(d[0],Math.hypot(d[1],d[2]))*180/Math.PI)],...extra});};
 if(layout==='spire'){
 if(c.theme==='jungle'){
  part('OU_AncientTrunk',[0,12+height/2,0],[13,height+30,13],t.dark,'decor',{material:'Wood'});
  for(let n=0;n<6;n++){const a=n*Math.PI/3;beam('OU_Root_'+n,[0,22,0],[Math.cos(a)*27,5,Math.sin(a)*27],3.4,t.side);}
 }else{
  for(const x of [-11,11])for(const z of [-11,11])part('OU_TowerPier_'+x+'_'+z,[x,12+height/2,z],[2.4,height+30,2.4],t.dark);
 }
 if(detail>0)for(const section of sections){
  const at=stages[Math.min(count,Math.max(1,Math.round((section.start+section.end)/2)))],h=at.pos[1],n=section.index;
  part('OU_CoreTerrace_'+n,[0,h-5,0],[34,2,34],t.side,'decor',{material:t.deck});
  for(const x of [-13,13])for(const z of [-13,13]){
   part('OU_CorePost_'+n+'_'+x+'_'+z,[x,h+2,z],[1.2,13,1.2],t.dark);
   if(detail>1)beam('OU_CoreBrace_'+n+'_'+x+'_'+z,[x,h-4,z],[x*.5,h+7,z*.5],.7,t.accent);
  }
  if(c.theme==='sky'){
   if(n<4){
    part('OU_MillHouse_'+n,[0,h+3,0],[11,14,11],t.top);
    part('OU_MillHub_'+n,[0,h+8,-7],[3,3,2],t.accent,'decor',{shape:'ball'});
    for(let b=0;b<4;b++){const a=b*Math.PI/2+n*.3;part('OU_WindSail_'+n+'_'+b,[Math.cos(a)*8,h+8+Math.sin(a)*8,-8],[12,1.5,.7],b%2?t.accent:t.top,'decor',{rotation:[0,0,round(a*180/Math.PI)]});}
   }else{
    for(let rib=0;rib<6;rib++){const a=rib*Math.PI/3;beam('OU_ObservatoryRib_'+n+'_'+rib,[Math.cos(a)*14,h-3,Math.sin(a)*14],[Math.cos(a)*7,h+12,Math.sin(a)*7],1,t.top);}
    part('OU_TelescopeBody_'+n,[0,h+9,0],[4,4,15],t.dark,'decor',{rotation:[-25,25,0]});
    part('OU_TelescopeLens_'+n,[3,h+12,-7],[3,3,.5],t.accent,'decor',{neon:true});
   }
  }else if(c.theme==='neon'){
   part('OU_Transformer_'+n,[0,h+1,0],[15,10,12],t.dark);
   for(let fin=0;fin<5;fin++)part('OU_CoolingFin_'+n+'_'+fin,[-8+fin*4,h+7,0],[1,5,15],t.side);
   for(const x of [-11,11]){part('OU_PowerConduit_'+n+'_'+x,[x,h+2,-9],[1.4,16,1.4],t.accent);for(let ring=0;ring<3;ring++)part('OU_Insulator_'+n+'_'+x+'_'+ring,[x,h-3+ring*5,-9],[3,1.2,3],t.top);}
   if(n>3)beam('OU_Antenna_'+n,[0,h+6,0],[5,h+21,4],.7,t.accent);
   if(detail>1)for(let row=0;row<4;row++)part('OU_ControlStrip_'+n+'_'+row,[0,h-2+row*2.3,-6.15],[10,.35,.2],t.accent,'decor',{neon:row===2,castShadow:false});
  }else if(c.theme==='lava'){
   part('OU_Furnace_'+n,[0,h+1,0],[16,12,14],t.dark,'decor',{material:'Basalt'});
   part('OU_MoltenWindow_'+n,[0,h+1,-7.15],[10,5,.3],t.accent,'decor',{neon:true});
   for(const x of [-11,11]){part('OU_CoolingStack_'+n+'_'+x,[x,h+7,0],[4,21,5],t.side);for(let ring=0;ring<3;ring++)part('OU_StackCollar_'+n+'_'+x+'_'+ring,[x,h+ring*7,0],[5,1,6],t.top);}
   if(detail>1)for(let stone=0;stone<5;stone++)part('OU_BasaltRib_'+n+'_'+stone,[-12+stone*6,h-3,12],[4,5+(stone%3)*2,5],t.dark,'decor',{rotation:[0,stone*17,0]});
  }else{
   for(let b=0;b<5;b++){const a=b*Math.PI*.4+n*.3;beam('OU_Branch_'+n+'_'+b,[0,h-3,0],[Math.cos(a)*24,h+5,Math.sin(a)*24],2,t.side);part('OU_LeafCrown_'+n+'_'+b,[Math.cos(a)*21,h+7,Math.sin(a)*21],[10,3,8],b%2?t.top:t.side,'decor',{shape:'ball',material:'Grass'});}
   if(n>3)for(let rib=0;rib<6;rib++){const a=rib*Math.PI/3;beam('OU_GlasshouseRib_'+n+'_'+rib,[Math.cos(a)*16,h-3,Math.sin(a)*16],[Math.cos(a)*7,h+13,Math.sin(a)*7],.65,t.accent);}
   if(detail>1)for(let joint=0;joint<4;joint++)part('OU_VineJoint_'+n+'_'+joint,[10*Math.cos(joint*1.6),h+joint*2,10*Math.sin(joint*1.6)],[2,5,2],t.side,'decor',{material:'Wood'});
  }
 }
 part('OU_SummitLantern',[0,last.pos[1]+17,0],[5,8,5],t.accent,'decor',{neon:true});
 }else{
  addAscentArchitecture({layout,stages,sections,theme:t,detail,part,beam});
  // Reserve the same headroom/flight arch used by the audit. Decorative boards
  // and satellite architecture may not visually cover a landing on another fold.
  const corridors=onlyUpClearanceCorridors(stages);
  for(let i=parts.length-1;i>=0;i--)if(parts[i].kind==='decor'){const bounds=box(parts[i]);if(corridors.some(c=>intersects(c,bounds)))parts.splice(i,1);}
 }
 const routeInput=[c.seed,c.theme,count,c.difficulty,c.checkpointEvery,detail];if(layout!=='spire')routeInput.push(layout);
 const map={version,config:c,theme:t,stages,parts,coins,hazards,key:'MFUP1_'+hash(routeInput.join('|')).toString(36),onlyUp:{title:t.name,theme:c.theme,layout,chapters,sections,height:round(height)}};
 map.onlyUp.length=round(stages.slice(1).reduce((length,stage,i)=>length+Math.hypot(...stage.pos.map((v,axis)=>v-stages[i].pos[axis])),0));
 return map;
}

/** Measurements use actual exported surface rectangles and part rotations.
 * They are conservative geometry checks, not a Roblox character simulation. */
export function measureOnlyUpRoute(map){
 let maxGap=0,maxRise=0,length=0,minWidth=Infinity,overlaps=0,blockedLandings=0,blockedJumps=0;
 const stages=map.stages,surfaces=map.parts.filter(p=>p.kind==='stage'),surfaceByIndex=new Map(surfaces.map(p=>[p.stage,p]));
 let invalidStages=Math.abs(surfaces.length-stages.length)+(stages.length===0?1:0);
 for(let i=0;i<stages.length;i++){
  const a=stages[i],size=surfaceSize(a),surface=surfaceByIndex.get(a.index);
  if(!surface||a.index!==i||!size.every(v=>Number.isFinite(v)&&v>0)||!surface.collide||(surface.rotation||[]).some(v=>v!==0)||!a.pos.every(Number.isFinite)||JSON.stringify(surface.pos)!==JSON.stringify(a.pos)||JSON.stringify(surface.size)!==JSON.stringify(size))invalidStages++;
  minWidth=Math.min(minWidth,size[0],size[2]);
  if(i){maxGap=Math.max(maxGap,edgeGap(stages[i-1],a));maxRise=Math.max(maxRise,top(a)-top(stages[i-1]));length+=Math.hypot(...a.pos.map((v,axis)=>v-stages[i-1].pos[axis]));}
 }
 const gameplayBoxes=surfaces.map(box);
 for(let i=0;i<gameplayBoxes.length;i++)for(let j=i+1;j<gameplayBoxes.length;j++)if(intersects(gameplayBoxes[i],gameplayBoxes[j]))overlaps++;
 const obstacles=map.parts.filter(p=>!['stage','spawn','checkpoint','coin'].includes(p.kind)).map(p=>({p,b:box(p)}));
 for(const [index,a] of stages.entries()){
  const size=surfaceSize(a),clearance=[[a.pos[0]-size[0]/2+.35,a.pos[0]+size[0]/2-.35],[top(a)+.2,top(a)+7],[a.pos[2]-size[2]/2+.35,a.pos[2]+size[2]/2-.35]];
  if(obstacles.some(({p,b})=>p.transparency!==1&&intersects(clearance,b))||gameplayBoxes.some((b,j)=>j!==index&&intersects(clearance,b)))blockedLandings++;
 }
 // Reserve a sampled arch plus avatar headroom between centres. Surface sizes
 // certify the edge gap separately; these boxes detect scenery in the flight
 // path without misclassifying the destination platform's own underside.
 for(let i=1;i<stages.length;i++){
  const a=stages[i-1],b=stages[i],otherSurfaces=surfaces.flatMap((p,j)=>p.stage!==a.index&&p.stage!==b.index?[gameplayBoxes[j]]:[]);
  let blocked=false;
  for(let sample=0;sample<=12&&!blocked;sample++){
   const t=sample/12,floor=top(a)+(top(b)-top(a))*t+24*t*(1-t),centre=a.pos.map((v,axis)=>v+(b.pos[axis]-v)*t);
   const corridor=[[centre[0]-1.5,centre[0]+1.5],[floor+.2,floor+7],[centre[2]-1.5,centre[2]+1.5]];
   blocked=obstacles.some(({p,b})=>p.transparency!==1&&intersects(corridor,b))||otherSurfaces.some(b=>intersects(corridor,b));
  }
  if(blocked)blockedJumps++;
 }
 return {maxGap:round(maxGap),maxRise:round(maxRise),length:round(length),height:round(stages.length?top(stages.at(-1))-top(stages[0]):0),minWidth:round(minWidth),overlaps,blockedLandings,blockedJumps,invalidStages};
}
export function validateOnlyUpGeometry(map){
 const m=measureOnlyUpRoute(map),bad=m.invalidStages+m.overlaps+m.blockedLandings+m.blockedJumps;
 return [{id:'onlyup-route',status:!bad&&m.maxGap<=5.25&&m.maxRise<=3?'pass':'error',title:'Only-Up-Geometrie',detail:`${m.length.toFixed(0)} Studs Route · ${m.height.toFixed(0)} Studs Aufstieg · kleinste Landefläche ${m.minWidth.toFixed(1)} · ${m.overlaps} Überlappungen · ${m.blockedLandings} blockierte Landungen · ${m.blockedJumps} blockierte Sprungkorridore · ${m.invalidStages} ungültige Etappen.`}];
}
