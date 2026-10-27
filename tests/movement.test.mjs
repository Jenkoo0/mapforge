import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MOVEMENT_PROFILES,movementForConfig,movementMarkdown} from '../web/movement.js';
import {generate,normalize,validate,repair,configLua,toRBXLX,SCRIPT_FILES,fromBrief} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {appHarness} from './support/app-harness.mjs';
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([key,file])=>[key,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));

test('legacy movement stays classic, malformed profiles cannot inject speeds or clear shop and story settings',()=>{
 assert.equal(normalize({}).movement,'classic');
 for(const movement of [null,undefined,{},['parkour'],'constructor','__proto__','Parkour','parkour '])assert.equal(normalize({movement}).movement,'classic');
 for(const movement of Object.keys(MOVEMENT_PROFILES)){
  const c=normalize({movement,WalkSpeed:999,sprint:999,mode:'tycoon',name:'Mein Spiel',autoName:false,cashSmallId:'12345',storyId:'nachtpost'});
  assert.equal(c.movement,movement);assert.equal(c.cashSmallId,'12345');assert.equal(c.storyId,'nachtpost');assert.equal(c.name,'Mein Spiel');assert.equal(c.WalkSpeed,undefined);assert.equal(c.sprint,undefined);assert.deepEqual(normalize(JSON.parse(JSON.stringify(c))),c);
 }
 assert.ok(Object.isFrozen(MOVEMENT_PROFILES)&&Object.isFrozen(MOVEMENT_PROFILES.parkour));
});

test('movement changes preserve the map geometry, route identity and checkpoint namespace',()=>{
 for(const mode of ['obby','tycoon']){
  const base=generate({mode,seed:'MOVEMENT-COMPAT',plots:2,stages:12});
  for(const movement of Object.keys(MOVEMENT_PROFILES)){const map=generate({...base.config,movement});assert.deepEqual(map.parts,base.parts);assert.equal(map.key,base.key);}
 }
});

test('briefs select explicit movement wishes and negated sprint does not turn sprint on',()=>{
 for(const [brief,movement] of [['Tycoon mit Sprint','explore'],['Obby mit präziser Steuerung','precise'],['Neon Parkour','parkour'],['Parkour ohne Sprint','classic'],['kein Sprint','classic']]){
  const result=fromBrief(brief,{movement:'parkour',cashSmallId:'9876'});assert.equal(result.config.movement,movement);assert.equal(result.config.cashSmallId,'9876');assert.ok(result.notes.some(n=>n.startsWith('Bewegung:')));
 }
 assert.equal(fromBrief('Neue Naturwelt',{movement:'precise'}).config.movement,'precise');
});

test('both game modes export matching StarterPlayer and server profile values plus complete movement scripts',()=>{
 for(const mode of ['obby','tycoon'])for(const movement of Object.keys(MOVEMENT_PROFILES)){
  const map=generate({mode,movement,plots:2,stages:12}),p=movementForConfig(map.config),xml=toRBXLX(map,scripts),lua=configLua(map);
  assert.ok(xml.includes(`<float name="CharacterWalkSpeed">${p.walk}</float>`));assert.ok(xml.includes(`<float name="CharacterJumpPower">${p.jump}</float>`));assert.ok(lua.includes(`WalkSpeed = ${p.walk}`)&&lua.includes(`JumpPower = ${p.jump}`));
  assert.ok(lua.includes(`Profile="${movement}", SprintSpeed=${p.sprint}, SprintEnabled=${p.sprint>p.walk}`));
  for(const name of ['MapForgeMovementServer','MapForgeMovementClient'])assert.ok(xml.includes(`<string name="Name">${name}</string>`));
  assert.ok(xml.includes(`<bool name="EnableMouseLockOption">${p.walk===p.sprint}</bool>`));
  assert.throws(()=>toRBXLX(map,{...scripts,movementServer:''}),/movementServer/);assert.throws(()=>toRBXLX(map,{...scripts,movementClient:''}),/movementClient/);
 }
});

test('jump validation uses normal walking and tighter precision limits, never the sprint speed',()=>{
 const base=generate({mode:'obby',stages:12}),stages=[{pos:[0,18,0]},{pos:[19.6,20,0]}];
 for(const movement of ['classic','explore','parkour'])assert.equal(validate({...base,stages,config:{...base.config,movement}}).find(c=>c.id==='jumps').status,'pass');
 assert.equal(validate({...base,stages,config:{...base.config,movement:'precise'}}).find(c=>c.id==='jumps').status,'error');
 const tooFar=[{pos:[0,18,0]},{pos:[21,20,0]}];assert.equal(validate({...base,stages:tooFar,config:{...base.config,movement:'parkour'}}).find(c=>c.id==='jumps').status,'error');
 for(const movement of Object.keys(MOVEMENT_PROFILES)){
  const fixed=repair({...base.config,movement,gap:12,rise:7});assert.equal(fixed.config.movement,movement);assert.equal(validate(generate(fixed.config)).find(c=>c.id==='jumps').status,'pass');
 }
});

test('start package and per-map handoff explain the actual controls and retain the selected movement',()=>{
 const map=generate({mode:'tycoon',movement:'explore',plots:2,detail:0}),files=launchFiles(map,scripts);
 assert.match(files['Spielerbewegung.md'],/24 Studs\/s/);assert.match(files['Spielerbewegung.md'],/Umschalttaste halten/);assert.match(files['Spielerbewegung.md'],/L3/);assert.match(files['KI-Uebergabe.md'],/Spielerbewegung — Erkunden/);
 const project=JSON.parse(files[Object.keys(files).find(n=>n.endsWith('.mapforge.json'))]);assert.equal(project.config.movement,'explore');
 assert.match(movementMarkdown({movement:'classic'}),/Kein zusätzlicher Sprint/);
});

test('actual movement selector updates the exported snapshot and survives reload without changing paid settings',async()=>{
 const h=await appHarness({config:{mode:'tycoon',movement:'classic',cashSmallId:'9876',plots:2,detail:0}});let entries;
 try{
  const input=h.doc.getElementById('movementProfile');input.value='parkour';await input.handlers.change[0]();assert.equal(h.app.config.movement,'parkour');assert.match(h.doc.getElementById('movementHint').textContent,/Sprint 26/);assert.equal(h.app.config.cashSmallId,'9876');
  await h.app.exportMap();assert.match(await h.blobs.get(h.requested[0].url).text(),/Profile=&quot;parkour&quot;/);entries=[...h.storage.entries()];
 }finally{h.dispose();}
 const restored=await appHarness({storageEntries:entries});try{assert.equal(restored.app.config.movement,'parkour');assert.equal(restored.doc.getElementById('movementProfile').value,'parkour');}finally{restored.dispose();}
});
