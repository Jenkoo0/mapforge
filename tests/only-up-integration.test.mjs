import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,generate,fromBrief,validate,configLua,SCRIPT_FILES} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {storyForConfig} from '../web/creative-story.js';
import {appHarness} from './support/app-harness.mjs';
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,file])=>[k,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
test('Only Up is a separate long style; old projects and classic limits stay compatible',()=>{
 assert.equal(normalize({}).obbyStyle,'classic');assert.equal(normalize({stages:240}).stages,80);
 assert.equal(normalize({obbyStyle:'onlyup'}).stages,144);assert.equal(normalize({obbyStyle:'onlyup',stages:36}).stages,96);assert.equal(normalize({obbyStyle:'onlyup',stages:999}).stages,240);
 const c=fromBrief('Only Up im Dschungel mit 240 Stufen',{cashSmallId:'12345'}).config;
 assert.equal(c.mode,'obby');assert.equal(c.obbyStyle,'onlyup');assert.equal(c.stages,240);assert.equal(c.cashSmallId,'12345');
 const classic=generate({events:'off',stages:36}),onlyup=generate({...classic.config,obbyStyle:'onlyup'});assert.notEqual(classic.key,onlyup.key);
});
test('long routes export exact length, themes, progress and optional story finish at the real summit',()=>{
 for(const theme of ['sky','neon','lava','jungle']){
  const map=generate({mode:'obby',obbyStyle:'onlyup',theme,stages:240,movement:'precise',storyId:'tautreppe',events:'rally',shop:false});
  assert.equal(map.stages.length,241);assert.equal(storyForConfig(map.config).chapters.at(-1).trigger.index,240);
  assert.ok(!validate(map).some(c=>c.status==='error'));
  assert.ok(configLua(map).includes('StageCount = 240'));assert.ok(configLua(map).includes('OnlyUp = {Height='));
  const files=launchFiles(map,scripts);assert.ok(files['OnlyUp-Aufstieg.md'].includes('Abschnitte'));assert.ok(files['Roblox-Beschreibung.txt'].includes('240'));
  assert.ok(files['KI-Uebergabe.md'].includes('acht Schwerpunkte'));assert.equal(JSON.parse(files['Skillkurve.json']).sections.length,8);assert.ok(files['Skillkurve.md'].includes('keine gemessene Spielerschwierigkeit'));
 }
});
test('actual application persists a long route and exposes separate arena geometry without changing configuration',async()=>{
 const h=await appHarness({config:{mode:'obby',obbyStyle:'onlyup',stages:144,movement:'precise',shop:false,events:'rally'}});
 try{
  assert.equal(h.app.config.stages,144);assert.ok(h.doc.getElementById('onlyUpStudio-.only-up-insight').innerHTML.includes('Deine Skill-Kurve.'));assert.equal(Number(h.doc.getElementById('stages').max),240);assert.equal(Number(h.doc.getElementById('stages').min),96);
  const before=JSON.stringify(h.app.config);await h.click('arenaView');assert.equal(h.app.preview.events,true);assert.equal(JSON.stringify(h.app.config),before);
  await h.click('arenaView');assert.equal(h.app.preview.events,false);
  h.app.update({...h.app.config,stages:240});await h.app.exportMap();const xml=await h.blobs.get(h.requested.at(-1).url).text();assert.ok(xml.includes('Stage_240'));assert.ok(xml.includes('StageCount = 240'));
  assert.equal(JSON.parse(h.storage.get('mapforge.config.v3')).stages,240);
 }finally{h.dispose();}
});
