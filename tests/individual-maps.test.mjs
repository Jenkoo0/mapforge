import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate,normalize,fromBrief,configLua,SCRIPT_FILES,validate} from '../web/engine.js';
import {measureOnlyUpRoute} from '../web/only-up.js';
import {buildOnlyUpCollection,INDIVIDUAL_ONLY_UP_STARTERS} from '../web/only-up-collection.js';
import {onlyUpGuide} from '../web/only-up-guide.js';
import {openMapConfig,savedProject} from '../web/map-vault.js';
import {appHarness} from './support/app-harness.mjs';
const base={mode:'obby',obbyStyle:'onlyup',stages:144,movement:'precise',events:'rally',shop:false,seed:'INDIVIDUAL'};

test('three architectures change physical routes independently of theme and preserve old geometry defaults',()=>{
 const maps=['spire','ridge','switchback'].map(ascentLayout=>generate({...base,ascentLayout}));
 assert.equal(new Set(maps.map(m=>m.key)).size,3);
 assert.deepEqual(generate(base).stages,maps[0].stages);
 assert.equal(generate(base).key,maps[0].key);
 assert.equal(normalize({ascentLayout:'<invalid>'}).ascentLayout,'spire');
 assert.equal(normalize({}).ascentLayout,'spire');
 const bounds=maps.map(m=>[0,2].map(axis=>Math.max(...m.stages.map(s=>s.pos[axis]))-Math.min(...m.stages.map(s=>s.pos[axis]))));
 assert.ok(bounds[0][0]<120&&bounds[0][1]<120);
 assert.ok(bounds[1][0]>1500,'ridge must advance along a long independent main axis');
 assert.ok(bounds[2][1]>300&&bounds[2][0]>100,'courts must occupy several folds');
 assert.ok(maps[1].parts.some(p=>p.name.startsWith('OU_RidgeButtress_')));
 assert.ok(maps[2].parts.some(p=>p.name.startsWith('OU_CourtGallery_')));
 for(const map of maps){assert.deepEqual(generate(map.config),map);const reduced=generate({...map.config,detail:0});assert.deepEqual(reduced.stages,map.stages);}
});

test('new architectures keep all actual landings and sampled jumps free for all themes, skill levels and endpoint lengths',()=>{
 for(const ascentLayout of ['ridge','switchback'])for(const theme of ['sky','neon','lava','jungle'])for(const difficulty of ['easy','normal','hard'])for(const stages of [96,240]){
  const map=generate({...base,ascentLayout,theme,difficulty,stages,storyId:'tautreppe',seed:ascentLayout+theme+difficulty}),m=measureOnlyUpRoute(map);
  assert.deepEqual([m.overlaps,m.blockedLandings,m.blockedJumps,m.invalidStages],[0,0,0,0],JSON.stringify({ascentLayout,theme,difficulty,stages,m}));
  assert.ok(m.maxGap<=4.25&&m.maxRise<2.5&&m.minWidth>=7.5);
  assert.equal(map.stages.length,stages+1);assert.equal(map.stages.at(-1).finish,true);
  assert.ok(map.parts.length<3000);assert.ok(m.height>170&&m.length>1100);
 }
});

test('own architecture survives project storage and exports with exact config, preserving name, story and paid IDs',()=>{
 const input={...base,ascentLayout:'switchback',name:'Meine hängenden Höfe',autoName:false,storyId:'tautreppe',boostId:'12345',coinsId:'67890'},map=generate(input);
 const restored=savedProject(JSON.parse(JSON.stringify(map.config)));assert.equal(restored.ascentLayout,'switchback');
 const opened=openMapConfig({config:restored},{...base,boostId:'444',coinsId:'555'});
 assert.equal(opened.ascentLayout,'switchback');assert.equal(opened.name,input.name);assert.equal(opened.storyId,'tautreppe');assert.equal(opened.boostId,'444');assert.equal(opened.coinsId,'555');
 assert.match(configLua(map),/AscentLayout = "switchback"/);assert.match(onlyUpGuide(map),/Faltenhöfe/);
 for(const [text,layout] of [['Klippenweg mit 173 Stufen','ridge'],['Only Up Faltenhöfe','switchback'],['Only Up Turmspirale','spire']]){
  const c=fromBrief(text,input).config;assert.equal(c.ascentLayout,layout);assert.equal(c.obbyStyle,'onlyup');assert.equal(c.name,input.name);assert.equal(c.boostId,input.boostId);
 }
 // An unused Only-Up field cannot alter classic Obby or Tycoon layout/route.
 for(const mode of ['obby','tycoon']){const a=generate({mode,obbyStyle:'classic',ascentLayout:'spire'}),b=generate({mode,obbyStyle:'classic',ascentLayout:'ridge'});assert.equal(a.key,b.key);assert.deepEqual(a.parts,b.parts);}
});

test('large checkpoints around folded corners leave actual platform headroom at odd route lengths',()=>{
 for(const stages of [97,173,239]){
  const map=generate({...base,ascentLayout:'switchback',stages,checkpointEvery:2,difficulty:'easy',theme:'lava',seed:'REVIEW-24',detail:3}),m=measureOnlyUpRoute(map);
  assert.deepEqual([m.overlaps,m.blockedLandings,m.blockedJumps],[0,0,0]);
 }
 const map=generate({...base,ascentLayout:'switchback',stages:97,checkpointEvery:2,difficulty:'easy'}),lower=map.stages[26],upper=map.stages[28];
 upper.pos=[lower.pos[0]+1,lower.pos[1]+4,lower.pos[2]+1];
 map.parts.find(p=>p.name==='Stage_28').pos=[...upper.pos];
 assert.ok(measureOnlyUpRoute(map).blockedLandings>0,'another platform must be audited even without any decorative obstruction');
});

test('12 independent starter projects contain each theme/layout combination with real matching exported files',async()=>{
 const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,f])=>[k,await readFile(new URL('../web/lua/'+f+'.lua',import.meta.url),'utf8')])));
 const {files,records}=await buildOnlyUpCollection(scripts,{individual:true});
 assert.equal(records.length,12);assert.equal(INDIVIDUAL_ONLY_UP_STARTERS.length,12);
 assert.equal(new Set(records.map(r=>r.theme+'|'+r.ascentLayout)).size,12);
 assert.equal(new Set(records.map(r=>r.routeKey)).size,12);assert.equal(new Set(records.map(r=>r.title)).size,12);
 for(const r of records){
  const json=JSON.parse(files[Object.keys(files).find(k=>k.startsWith(r.folder+'/')&&k.endsWith('.mapforge.json'))]),map=generate(json.config);
  assert.equal(json.config.ascentLayout,r.ascentLayout);assert.equal(json.config.shop,false);
  for(const key of Object.keys(json.config).filter(k=>k.endsWith('Id')&&k!=='storyId'))assert.equal(json.config[key],'');
  assert.deepEqual(validate(map).filter(c=>c.status==='error'),[]);
  assert.deepEqual(r.geometry,measureOnlyUpRoute(map));assert.equal(r.routeKey,map.key);
  const xml=files[Object.keys(files).find(k=>k.startsWith(r.folder+'/')&&k.endsWith('.rbxlx'))];
  assert.ok(xml.includes('Stage_144'));assert.ok(xml.includes('AscentLayout = &quot;'+r.ascentLayout+'&quot;'));
  assert.ok(files[r.folder+'/KI-Uebergabe.md'].includes(r.seed));assert.ok(files[r.folder+'/OnlyUp-Aufstieg.md'].includes('Eigene Bauform'));assert.ok(files[r.folder+'/Skillkurve.json']);
 }
 assert.match(files['START-HIER.md'],/vier Themen × drei Bauformen/);assert.equal(JSON.parse(files['OnlyUpSammlung.json']).studioTested,false);
});

test('actual app persists and exports selected architecture without overwriting the personal project',async()=>{
 const h=await appHarness({config:{...base,name:'Persönlicher Weg',autoName:false,boostId:'12345'}});
 try{h.app.update({...h.app.config,ascentLayout:'ridge'});assert.equal(h.app.map.onlyUp.layout,'ridge');assert.equal(h.app.config.name,'Persönlicher Weg');assert.equal(h.app.config.boostId,'12345');assert.equal(JSON.parse(h.storage.get('mapforge.config.v3')).ascentLayout,'ridge');await h.app.exportMap();const xml=await h.blobs.get(h.requested.at(-1).url).text();assert.ok(xml.includes('AscentLayout = &quot;ridge&quot;'));assert.ok(xml.includes('OU_RidgeButtress_'));}finally{h.dispose();}
});
