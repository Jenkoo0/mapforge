import test from 'node:test';
import assert from 'node:assert/strict';
import {generateOnlyUp,measureOnlyUpRoute,validateOnlyUpGeometry,ONLY_UP_THEMES,ONLY_UP_PART_BUDGET} from '../web/only-up.js';
import {hash,rng,normalize} from '../web/engine.js';
import {vertices} from '../web/geometry.js';

const make=(input={})=>generateOnlyUp({...normalize({events:'off',...input}),obbyStyle:'onlyup',stages:input.stages??144},{version:'test',hash,rng});
const ranges=p=>{const points=vertices(p);return [0,1,2].map(axis=>[Math.min(...points.map(p=>p[axis])),Math.max(...points.map(p=>p[axis]))]);};
const overlap=(a,b)=>a.every((range,axis)=>range[0]<b[axis][1]-.02&&range[1]>b[axis][0]+.02);

test('Only Up is deterministic, long and vertically compact, with distinct connected chapters',()=>{
 const a=make(),b=make();assert.deepEqual(a,b);
 const m=measureOnlyUpRoute(a);
 assert.equal(a.stages.length,145);assert.ok(m.length>2000);assert.ok(m.height>250);
 assert.equal(a.onlyUp.chapters.length,4);assert.equal(a.onlyUp.sections.length,8);
 assert.equal(new Set(a.onlyUp.sections.map(s=>s.skill)).size,8);
 assert.equal(a.onlyUp.length,m.length);assert.equal(a.onlyUp.height,m.height);
 const covered=a.onlyUp.sections.flatMap(s=>Array.from({length:s.end-s.start+1},(_,i)=>s.start+i));
 assert.deepEqual(covered,Array.from({length:144},(_,i)=>i+1));
 const sizes=new Set(a.stages.filter(s=>!s.checkpoint).map(s=>JSON.stringify(s.size)));
 assert.ok(sizes.size>=5,'skills must change the physical landing footprints');
 assert.notEqual(make({seed:'OTHER-ASCENT'}).key,a.key);
 // Winding around one landmark keeps a long route in a coherent tower footprint.
 assert.ok(a.stages.every(s=>Math.hypot(s.pos[0],s.pos[2])>=48&&Math.hypot(s.pos[0],s.pos[2])<56));
});

test('all themes and difficulties have measured reachable jumps and clear real geometry up to 240 stages',()=>{
 for(const theme of Object.keys(ONLY_UP_THEMES))for(const difficulty of ['easy','normal','hard']){
  const map=make({theme,difficulty,stages:240,seed:'CLEAR-'+theme+'-'+difficulty,movement:'precise',detail:3}),m=measureOnlyUpRoute(map);
  assert.ok(m.maxGap<=4.25,JSON.stringify({theme,difficulty,m}));assert.ok(m.maxRise<=2.5);
  assert.ok(m.minWidth>=7.5);assert.equal(m.overlaps,0);assert.equal(m.blockedLandings,0);assert.equal(m.blockedJumps,0);assert.equal(m.invalidStages,0);
  assert.ok(map.parts.length<ONLY_UP_PART_BUDGET);assert.ok(map.parts.length<3000);
  assert.ok(m.length>3300);assert.ok(m.height>430);
  // Independently calculate every true rectangular edge gap from exported parts.
  const pads=map.parts.filter(p=>p.kind==='stage');
  for(let i=1;i<pads.length;i++){
   const a=pads[i-1],b=pads[i];
   const gap=Math.hypot(...[0,2].map(axis=>Math.max(0,Math.abs(b.pos[axis]-a.pos[axis])-(a.size[axis]+b.size[axis])/2)));
   assert.ok(gap<=5.25,'precision movement without sprint');
   assert.ok(b.pos[1]+b.size[1]/2-a.pos[1]-a.size[1]/2<=3);
   assert.equal(overlap(ranges(a),ranges(b)),false);
  }
 }
});

test('small and long routes preserve the existing server stage, coin, spawn and checkpoint contracts',()=>{
 for(const stages of [12,96,144,240])for(const checkpointEvery of [2,7,10]){
  const map=make({stages,checkpointEvery,detail:0}),pads=map.parts.filter(p=>p.kind==='stage');
  assert.equal(pads.length,stages+1);assert.deepEqual(pads.map(p=>p.stage),Array.from({length:stages+1},(_,i)=>i));
  assert.equal(map.parts.filter(p=>p.kind==='spawn').length,1);
  for(const stage of map.stages){
   const pad=pads[stage.index];assert.equal(pad.name,'Stage_'+stage.index);assert.equal(pad.stageIndex,stage.index);assert.equal(pad.collide,true);assert.equal(pad.anchored,true);
   assert.equal(stage.checkpoint,stage.index===0||stage.index===stages||stage.index%checkpointEvery===0);
   assert.deepEqual(stage.pos,pad.pos);assert.deepEqual(stage.size,pad.size);
  }
  assert.equal(map.stages.at(-1).finish,true);
  assert.ok(map.coins.every(p=>p.kind==='coin'&&p.stage>0&&p.stage<stages&&!p.collide));
  assert.equal(map.hazards.length,0,'skill comes from the route, with no unavoidable moving hazards');
  assert.ok(map.parts.filter(p=>p.kind==='decor').every(p=>!p.collide&&!p.query));
  const stairNames=['Lobby','OU_ApproachLower','OU_ApproachUpper','Stage_0'];
  const stairs=stairNames.map(name=>map.parts.find(p=>p.name===name));
  for(let i=1;i<stairs.length;i++){
   assert.ok(stairs[i].pos[1]-stairs[i-1].pos[1]<=2);
   assert.ok(stairs[i].pos[2]-stairs[i-1].pos[2]-(stairs[i].size[2]+stairs[i-1].size[2])/2<=0);
  }
  const spawn=map.parts.find(p=>p.kind==='spawn'),pad=pads[0];
  assert.equal(spawn.pos[1]-spawn.size[1]/2,pad.pos[1]+pad.size[1]/2,'spawn rests on the platform');
 }
});

test('the safety audit catches modified distances, blocked landings, overhead obstacles and overlap',()=>{
 const map=make({stages:12,detail:0});assert.equal(validateOnlyUpGeometry(map)[0].status,'pass');
 const moved=structuredClone(map);moved.stages[1].pos[0]+=30;moved.parts.find(p=>p.name==='Stage_1').pos[0]+=30;
 assert.ok(measureOnlyUpRoute(moved).maxGap>5.25);assert.equal(validateOnlyUpGeometry(moved)[0].status,'error');
 const blocked=structuredClone(map),stage=blocked.stages[3];
 blocked.parts.push({name:'BlockedLanding',pos:[stage.pos[0],stage.pos[1]+4,stage.pos[2]],size:[4,5,4],color:'#ffffff',kind:'decor',anchored:true,collide:false});
 assert.ok(measureOnlyUpRoute(blocked).blockedLandings>0);assert.equal(validateOnlyUpGeometry(blocked)[0].status,'error');
 const overhead=structuredClone(map),a=overhead.stages[2],b=overhead.stages[3];
 overhead.parts.push({name:'OverheadBeam',pos:[(a.pos[0]+b.pos[0])/2,(a.pos[1]+b.pos[1])/2+9,(a.pos[2]+b.pos[2])/2],size:[3,2,3],color:'#ffffff',kind:'decor',anchored:true,collide:true});
 assert.ok(measureOnlyUpRoute(overhead).blockedJumps>0);
 const overlapping=structuredClone(map),other=overlapping.parts.find(p=>p.name==='Stage_2');other.pos=[...overlapping.parts.find(p=>p.name==='Stage_1').pos];
 assert.ok(measureOnlyUpRoute(overlapping).overlaps>0);assert.ok(measureOnlyUpRoute(overlapping).invalidStages>0);
});

test('each theme builds a recognizable structural family instead of swapping only colours',()=>{
 const motifs={sky:['OU_WindSail_','OU_TelescopeBody_','OU_ObservatoryRib_'],neon:['OU_Transformer_','OU_CoolingFin_','OU_Antenna_'],lava:['OU_Furnace_','OU_MoltenWindow_','OU_CoolingStack_'],jungle:['OU_AncientTrunk','OU_Root_','OU_GlasshouseRib_']};
 for(const [theme,names] of Object.entries(motifs)){
  const map=make({theme});for(const name of names)assert.ok(map.parts.some(p=>p.name.startsWith(name)),theme+' '+name);
  assert.ok(new Set(map.parts.map(p=>p.material)).size>=2);
  const noDetail=make({theme,detail:0});assert.deepEqual(noDetail.stages,map.stages,'detail reductions preserve the entire playable route');
 }
});
