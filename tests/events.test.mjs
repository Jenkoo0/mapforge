import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate,normalize,toRBXLX,configLua,SCRIPT_FILES} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {visiblePreviewParts} from '../web/preview-state.js';
import {appHarness} from './support/app-harness.mjs';
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,file])=>[k,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
test('event choices are bounded and preserve paid IDs, movement, original world and checkpoint identity',()=>{
 for(const mode of ['tycoon','obby']){
  const base=generate({mode,events:'off',seed:'EVENTS',plots:2,movement:'precise',cashSmallId:'1234'});
  for(const events of ['off','ambient','rally',{},'<script>']){
   const map=generate({...base.config,events});
   assert.equal(map.config.cashSmallId,'1234');assert.equal(map.config.movement,'precise');assert.equal(map.key,base.key);
   assert.deepEqual(map.parts.filter(p=>p.kind!=='event'),base.parts);
   assert.equal(map.parts.filter(p=>p.name==='RallyStart').length,normalize({events}).events==='rally'?1:0);
  }
 }
});
test('rally arena stays outside the map, has equal reachable signals, railings, portal and one spawn',()=>{
 for(const mode of ['tycoon','obby'])for(const theme of ['sky','neon','lava','jungle']){
  const map=generate({mode,theme,plots:6,stages:80,events:'rally'}),base=map.parts.filter(p=>p.kind!=='event');
  const deck=map.parts.find(p=>p.name==='RallyDeck'),start=map.parts.find(p=>p.name==='RallyStart');
  assert.ok(deck.pos[0]+37<Math.min(...base.map(p=>p.pos[0]-p.size[0]/2)));
  assert.ok(deck.collide);assert.equal(deck.layer,0,'large floor must render before every signal');assert.equal(map.parts.filter(p=>p.kind==='spawn').length,1);
  for(let i=1;i<=4;i++){const p=map.parts.find(p=>p.name==='RallySignal'+i);assert.ok(p.label===String(i));assert.ok(Math.abs(Math.hypot(p.pos[0]-start.pos[0],p.pos[2]-start.pos[2])-Math.sqrt(1152))<.001);assert.equal(p.pos[1]-deck.pos[1],2.5);}
  assert.equal(map.parts.filter(p=>p.name.startsWith('RallyRail_')&&p.collide).length,4);
  assert.ok(visiblePreviewParts(map).every(p=>p.kind!=='event'||p.name==='RallyPortal'));
  assert.ok(visiblePreviewParts(map,{events:true}).some(p=>p.name==='RallyDeck'));
 }
});
test('both modes embed complete event runtime and actual configuration, start package explains record scope',()=>{
 for(const mode of ['tycoon','obby'])for(const events of ['rally','ambient','off']){
  const map=generate({mode,events,plots:2,stages:12});const xml=toRBXLX(map,scripts);
  assert.ok(configLua(map).includes(`Events = { Mode="${events}" }`));
  for(const name of ['MapForgeEventCore','MapForgeEventServer','MapForgeEventClient'])assert.ok(xml.includes(`>${name}</string>`));
  for(const key of ['eventCore','eventServer','eventClient'])assert.throws(()=>toRBXLX(map,{...scripts,[key]:null}),/Skript fehlt/);
  const files=launchFiles(map,scripts);assert.ok(files['Events-und-Signal-Rallye.md'].includes('nicht dauerhaft'));
  assert.ok(files['KI-Uebergabe.md'].includes('Top 5 dieses Servers'));
 }
});
test('actual event selector persists and exports; design browsing never changes the current map',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Meine Fabrik',cashSmallId:'987',events:'ambient'}});
 try{
  const before=JSON.stringify(h.app.config);await h.click('nextEventLook');assert.equal(JSON.stringify(h.app.config),before);
  assert.equal(h.doc.getElementById('eventStudio').dataset.mode,undefined,'component must not enter the global game-mode selector');
  assert.equal(h.doc.getElementById('eventLookName').textContent,'Goldene Stunde');
  const choice=h.doc.getElementById('eventMode');choice.value='rally';for(const fn of choice.handlers.change)fn();
  assert.equal(h.app.config.events,'rally');assert.equal(h.app.config.cashSmallId,'987');
  assert.ok(h.app.map.parts.some(p=>p.name==='RallyDeck'));assert.equal(JSON.parse(h.storage.get('mapforge.config.v3')).events,'rally');
  await h.app.exportMap();const file=h.requested.at(-1);const xml=await h.blobs.get(file.url).text();assert.ok(xml.includes('MapForgeEventServer'));assert.ok(xml.includes('RallySignal4'));
 }finally{h.dispose();}
});
