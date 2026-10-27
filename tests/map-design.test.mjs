import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,validate,THEMES} from '../web/engine.js';
import {LAYOUTS,PART_BUDGET,UPGRADES} from '../web/tycoon.js';
import {MATERIAL_IDS,TYCOON_SURFACES} from '../web/tycoon-style.js';
import {vertices} from '../web/geometry.js';
import {visiblePreviewParts} from '../web/preview-state.js';

test('fully built themed campuses preserve routes and budget across layout, polish and seed extremes',()=>{
 for(const theme of Object.keys(THEMES))for(const layout of Object.keys(LAYOUTS))for(const seed of ['DESIGN-01','DESIGN-02','DESIGN-03'])for(const polish of [0,2]){
  const map=generate({mode:'tycoon',theme,layout,seed,polish,plots:6,detail:3});
  assert.ok(map.parts.length<PART_BUDGET,`${theme}/${layout}/${seed}/${polish}: ${map.parts.length}`);
  assert.ok(!validate(map).some(check=>check.status==='error'),`${theme}/${layout}/${seed}/${polish}`);
  for(const plot of map.plots){
   assert.equal(map.parts.filter(p=>p.plot===plot.index&&p.role==='Button').length,UPGRADES.length);
   assert.equal(map.parts.filter(p=>p.plot===plot.index&&p.name.includes('DistrictMarker_')).length,4);
  }
 }
});

test('each factory has its own milestone landmark without taking its walking corridor',()=>{
 const features={sky:'LandmarkCrystal',neon:'LandmarkAerial',lava:'LandmarkCrag',jungle:'LandmarkCanopy'};
 for(const [theme,feature] of Object.entries(features)){
  const map=generate({mode:'tycoon',theme,plots:2,detail:3});
  const landmarks=map.parts.filter(p=>p.name.includes('Landmark'));
  assert.ok(landmarks.some(p=>p.name.includes(feature)));
  assert.ok(landmarks.every(p=>p.unlock==='u30'&&p.hiddenAtStart));
  assert.ok(!visiblePreviewParts(map,{level:29}).some(p=>p.name.includes('Landmark')));
  assert.equal(visiblePreviewParts(map,{level:30}).filter(p=>p.name.includes('Landmark')).length,landmarks.length);
  for(const path of map.paths)for(const part of landmarks.filter(p=>p.collide&&p.plot===path.plot)){
   const bounds=vertices(part),lo=[0,1,2].map(i=>Math.min(...bounds.map(p=>p[i]))),hi=[0,1,2].map(i=>Math.max(...bounds.map(p=>p[i])));
   const hit=lo[1]<8&&hi[1]>1&&lo[0]<path.x+path.size[0]/2&&hi[0]>path.x-path.size[0]/2&&lo[2]<path.z+path.size[1]/2&&hi[2]>path.z-path.size[1]/2;
   assert.equal(hit,false,part.name+' obstructs the route');
  }
 }
});

test('large architectural trims retain materials while emissive details remain useful',()=>{
 const lightness=hex=>{const n=parseInt(hex.slice(1),16);return .2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255);};
 for(const theme of Object.keys(THEMES)){
  const map=generate({mode:'tycoon',theme,plots:6,polish:2,detail:3});
  const built=visiblePreviewParts(map,{level:48});
  assert.ok(built.filter(p=>p.neon).length/built.length<.15,theme+' floods the built factory with emission');
  assert.ok(map.parts.filter(p=>/RoadStripe|PerimeterLight|EntranceGlow|FacadeLight|TowerBelt/.test(p.name)).every(p=>!p.neon));
  assert.ok(map.parts.some(p=>p.role==='Output'&&p.neon));
  assert.ok(map.parts.every(p=>MATERIAL_IDS[p.material]));
  assert.ok(lightness(TYCOON_SURFACES[theme].path)-lightness(TYCOON_SURFACES[theme].floor)>20,theme+' paths need tonal separation');
 }
});

test('seed changes architecture while generation remains reproducible and upgrade identities remain stable',()=>{
 for(const layout of Object.keys(LAYOUTS)){
  const config={mode:'tycoon',theme:'sky',plots:2,detail:3,layout,seed:'ARCHITECTURE-A'};
  const first=generate(config),again=generate(config),other=generate({...config,seed:'ARCHITECTURE-B'});
  assert.deepEqual(first,again);
  assert.notDeepEqual(first.parts.filter(p=>/TowerTier|BuildingRoof/.test(p.name)),other.parts.filter(p=>/TowerTier|BuildingRoof/.test(p.name)));
  assert.deepEqual(first.upgrades.map(u=>[u.id,u.cost,u.income,u.requires]),other.upgrades.map(u=>[u.id,u.cost,u.income,u.requires]));
  assert.equal(first.key,'MF-TYCOON-1');
 }
});

test('obby obstacles follow travel direction, stay on their stage and use theme materials',()=>{
 const expected={sky:'Concrete',neon:'DiamondPlate',lava:'Basalt',jungle:'WoodPlanks'};
 for(const theme of Object.keys(THEMES))for(const difficulty of ['easy','normal','hard'])for(const seed of ['ROUTE-1','ROUTE-2']){
  const map=generate({mode:'obby',theme,difficulty,seed,stages:80,detail:3});
  assert.ok(map.parts.filter(p=>p.kind==='stage').every(p=>p.material===expected[theme]));
  assert.ok(!validate(map).some(check=>check.status==='error'));
  for(const part of map.parts.filter(p=>/^(?:Hurdle|SlalomA|SlalomB|Sweep|Pulse)_/.test(p.name))){
   const index=Number(part.name.match(/_(\d+)$/)[1]),stage=map.stages[index],a=map.stages[index-1].pos,b=map.stages[index+1].pos;
   const yaw=Math.atan2(b[0]-a[0],b[2]-a[2])*180/Math.PI;
   assert.ok(Math.abs(part.rotation[1]-yaw)<.001,part.name);
   assert.ok(vertices(part).every(v=>Math.abs(v[0]-stage.pos[0])<=7.001&&Math.abs(v[2]-stage.pos[2])<=7.001),theme+'/'+part.name);
  }
 }
});
