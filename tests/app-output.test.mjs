import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as turn} from 'node:timers/promises';
import {safeFilename} from '../web/engine.js';
import {appHarness} from './support/app-harness.mjs';
test('generator story choice survives custom settings and explicit removal stays removed',async()=>{
 const h=await appHarness({config:{mode:'obby',stages:18,storyId:'nachtgarten',seed:'CUSTOM',name:'Meine Welt',autoName:false}});try{
  assert.equal(h.doc.getElementById('storyChoice').value,'nachtgarten');assert.match(h.doc.getElementById('storySummary').textContent,/Drei Kapitel/);
  h.app.update({...h.app.config,seed:'CUSTOM-2',stages:40,checkpointEvery:7});assert.equal(h.app.config.storyId,'nachtgarten');
  h.doc.getElementById('storyChoice').value='mondumschlag';await h.doc.getElementById('storyChoice').handlers.change[0]();assert.equal(h.app.config.storyId,'mondumschlag');assert.equal(h.app.config.name,'Meine Welt');
  h.doc.getElementById('storyChoice').value='';await h.doc.getElementById('storyChoice').handlers.change[0]();h.app.update({...h.app.config,seed:'MF-DIRECTION-nachtgarten-01'});assert.equal(h.app.config.storyId,'');assert.equal(h.doc.getElementById('storyChoice').value,'');
 }finally{h.dispose();}
});
test('actual generate/export handlers ignore duplicate clicks and export the captured map',async()=>{
 const h=await appHarness();try{
  const count=h.generations,first=h.click('generateManual');assert.equal(h.app.output.phase,'building');const duplicate=h.click('generateManual');await Promise.all([first,duplicate]);
  assert.equal(h.generations,count+1);assert.equal(h.app.output.phase,'ready');assert.equal(h.doc.getElementById('outputCenter').hidden,false);assert.equal(h.app.config.autoName,true);
  const name=h.app.config.name,exporting=h.click('exportTop');assert.equal(h.app.output.busyExport,'map');const duplicateExport=h.app.exportBundle();
  h.app.update({...h.app.config,name:'Später bearbeitet',autoName:false});await Promise.all([exporting,duplicateExport]);
  assert.equal(h.requested.length,1);const file=h.requested[0];assert.equal(file.name,safeFilename(name)+'.rbxlx');assert.ok((await h.blobs.get(file.url).text()).includes('Name = &quot;'+name+'&quot;'));assert.equal(h.app.config.name,'Später bearbeitet');assert.equal(h.app.output.busyExport,null);
  const text=h.doc.getElementById('outputCenter').innerHTML;assert.ok(text.includes(file.name));assert.match(text,/Erneut herunterladen/);assert.match(text,/Vorschau aktualisiert/);
 }finally{h.dispose();}
});
test('actual Bot-Zentrale completes into the same visible result and download flow',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2,detail:1}});try{
  h.doc.getElementById('botTrends').checked=false;h.doc.getElementById('botBrief').value='Neon-Tycoon';
  const first=h.bots[0].run(),duplicate=h.bots[0].run();await Promise.all([first,duplicate]);
  assert.equal(h.app.config.theme,'neon');assert.equal(h.app.output.phase,'ready');assert.ok(h.doc.getElementById('botResult').innerHTML.includes(h.app.config.name));assert.match(h.doc.getElementById('botResult').innerHTML,/Studio-Datei herunterladen/);
  await h.app.exportBundle();assert.equal(h.requested.length,1);assert.equal(h.requested[0].name,safeFilename(h.app.config.name)+'-Startpaket.zip');const bytes=new Uint8Array(await h.blobs.get(h.requested[0].url).arrayBuffer());assert.deepEqual([...bytes.slice(0,4)],[80,75,3,4]);
 }finally{h.dispose();}
});
test('actual app exposes script retry and rejects generation after settings change during trends',async()=>{
 const h=await appHarness({failScripts:true});try{
  assert.equal(h.app.output.scriptState,'failed');assert.match(h.doc.getElementById('outputCenter').innerHTML,/Export erneut vorbereiten/);assert.equal(h.doc.getElementById('exportTop').disabled,true);
  h.setScriptFailure(false);await h.app.loadScripts();assert.equal(h.app.output.scriptState,'ready');assert.equal(h.doc.getElementById('exportTop').disabled,false);
  h.app.trendView.data={fetchedAt:new Date().toISOString()};let resolve;h.app.trendView.beforeGenerate=()=>new Promise(r=>resolve=r);const pending=h.click('generate');await turn();await turn();assert.equal(typeof resolve,'function');
  h.app.update({...h.app.config,name:'Meine Änderung',autoName:false});resolve({name:'Reference',idea:{mode:'tycoon',theme:'neon'}});await pending;
  assert.equal(h.app.config.name,'Meine Änderung');assert.equal(h.app.output.phase,'failed');assert.match(h.doc.getElementById('outputCenter').innerHTML,/während des Abrufs geändert/);assert.equal(h.requested.length,0);
 }finally{h.dispose();}
});
test('actual app recovers the last map after reload and can export it without generating again',async()=>{
 const first=await appHarness();let entries,name,id;try{await first.app.manualGenerate();name=first.app.config.name;id=first.app.vault.find(first.app.config).id;entries=[...first.storage.entries()];}finally{first.dispose();}
 entries=entries.map(([key,value])=>[key,key==='mapforge.config.v3'?'null':value]);
 const h=await appHarness({storageEntries:entries});try{
  assert.equal(h.app.config.name,name);assert.equal(h.app.output.phase,'loaded');assert.ok(h.app.vault.get(id));assert.match(h.doc.getElementById('outputCenter').innerHTML,/Deine letzte Map ist wieder da/);assert.doesNotMatch(h.doc.getElementById('outputCenter').innerHTML,/Dein Download ist hier/);
  await h.app.exportMap();assert.equal(h.requested.length,1);assert.equal(h.requested[0].name,safeFilename(name)+'.rbxlx');assert.match(h.doc.getElementById('outputCenter').innerHTML,/Öffnen & Testen erklären/);
 }finally{h.dispose();}
});
test('actual app opens saved maps with current shop IDs and restores the previous editor state on undo',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Current',cashSmallId:'9876',seed:'CURRENT',plots:2,detail:0}});try{
  const older=h.app.vault.remember({...h.app.map,config:{...h.app.config,name:'Older',theme:'jungle',seed:'OLDER',cashSmallId:'1234'}}).record;
  assert.equal(h.app.openSavedMap(older.id),true);assert.equal(h.app.config.name,'Older');assert.equal(h.app.config.theme,'jungle');assert.equal(h.app.config.cashSmallId,'9876');assert.equal(h.app.output.canUndo,true);
  assert.equal(h.app.openSavedMap(older.id),true);assert.equal(h.app.output.canUndo,true);
  await h.app.exportMap();assert.ok((await h.blobs.get(h.requested[0].url).text()).includes('TCashSmall = 9876'));
  h.app.undoOpenMap();assert.equal(h.app.config.name,'Current');assert.equal(h.app.config.seed,'CURRENT');assert.equal(h.app.config.cashSmallId,'9876');assert.equal(h.app.output.canUndo,false);
 }finally{h.dispose();}
});
test('actual app keeps generation and downloads usable when device storage is unavailable',async()=>{
 const h=await appHarness({failStorage:true});try{await h.app.manualGenerate();assert.equal(h.app.output.phase,'ready');assert.equal(h.app.vault.persisted,false);assert.match(h.doc.getElementById('outputCenter').innerHTML,/Nur in dieser Sitzung verfügbar/);assert.doesNotMatch(h.doc.getElementById('outputCenter').innerHTML,/auf diesem Gerät gesichert/);await h.app.exportBundle();assert.equal(h.requested.length,1);}finally{h.dispose();}
});
test('actual project import rejects changed settings and a newly running build while reading the file',async()=>{
 const h=await appHarness();try{
  const input=h.doc.getElementById('importFile'),handler=input.handlers.change[0],payload=JSON.stringify({app:'MapForge',config:{...h.app.config,name:'Imported overwrite'}});let resolve;
  input.files=[{size:payload.length,text:()=>new Promise(r=>resolve=r)}];const first=handler({target:input});h.app.update({...h.app.config,name:'Edited while reading',autoName:false});resolve(payload);await first;assert.equal(h.app.config.name,'Edited while reading');assert.match(h.doc.getElementById('toast').textContent,/während des Ladens geändert/);
  input.files=[{size:payload.length,text:()=>new Promise(r=>resolve=r)}];const second=handler({target:input}),building=h.app.manualGenerate();resolve(payload);await Promise.all([second,building]);assert.equal(h.app.config.name,'Edited while reading');assert.equal(h.app.output.phase,'ready');assert.ok(!h.app.vault.records.some(r=>r.config.name==='Imported overwrite'));
 }finally{h.dispose();}
});

test('one-click bot action builds, saves and exports exactly one complete package with its actual name',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2,detail:1,cashSmallId:'123456'}});try{
  h.doc.getElementById('botTrends').checked=false;h.doc.getElementById('botBrief').value='Neon-Tycoon';
  const button=h.doc.getElementById('botRunBundle'),handler=h.doc.getElementById('botWorkspace').handlers.click[0];
  const first=handler({target:button});assert.equal(button.disabled,true);assert.equal(h.doc.getElementById('botRun').disabled,true);
  await Promise.all([first,handler({target:button}),h.app.manualGenerate()]);
  assert.equal(h.requested.length,1);assert.equal(h.bots[0].phase,'ready');assert.equal(h.app.output.phase,'ready');assert.equal(button.disabled,false);assert.equal(h.app.config.cashSmallId,'123456');
  const file=h.requested[0],data=await h.blobs.get(file.url).text();
  assert.equal(file.name,safeFilename(h.app.config.name)+'-Startpaket.zip');assert.ok(h.app.vault.find(h.app.config));for(const expected of ['KI-Uebergabe.md','.rbxlx','TCashSmall = 123456',h.app.config.name])assert.ok(data.includes(expected),expected);
  assert.equal(h.bots[0].last.download.name,file.name);assert.equal(h.bots[0].last.download.requested,true);assert.equal(h.bots[0].last.download.url,undefined);assert.ok(h.bots[0].last.events.some(e=>e.step==='Sicherung'));assert.ok(![...h.storage.keys()].some(k=>k.startsWith('mapforge.tests.')));
 }finally{h.dispose();}
});

test('package failure retains the generated map and export retry preserves its name, seed and geometry',async()=>{
 const h=await appHarness({failScripts:true});try{
  h.doc.getElementById('botTrends').checked=false;const bot=h.bots[0],result=await bot.run({bundle:true});
  assert.equal(result.ok,false);assert.equal(bot.phase,'export-failed');assert.equal(h.app.output.phase,'ready');assert.ok(h.app.vault.find(h.app.config));assert.equal(h.requested.length,0);assert.equal(h.doc.getElementById('botRetryBundle').hidden,false);
  const config=JSON.stringify(h.app.config),parts=h.app.map.parts.length,count=h.generations;
  h.setScriptFailure(false);const retry=await bot.retryBundle();assert.equal(retry.ok,true);assert.equal(JSON.stringify(h.app.config),config);assert.equal(h.app.map.parts.length,parts);assert.equal(h.generations,count);assert.equal(h.requested.length,1);assert.equal(bot.phase,'ready');assert.equal(h.doc.getElementById('botRetryBundle').hidden,true);
 }finally{h.dispose();}
});

test('failed bot export cannot silently retry with an edited map',async()=>{
 const h=await appHarness({failScripts:true});try{
  h.doc.getElementById('botTrends').checked=false;const bot=h.bots[0];await bot.run({bundle:true});
  h.app.update({...h.app.config,name:'Neue bearbeitete Map',autoName:false});h.setScriptFailure(false);
  assert.equal(h.doc.getElementById('botRetryBundle').hidden,true);assert.equal(h.doc.getElementById('botRetryBundle').disabled,true);
  const result=await bot.retryBundle();assert.equal(result.ok,false);assert.equal(h.requested.length,0);assert.equal(h.app.config.name,'Neue bearbeitete Map');assert.match(h.doc.getElementById('botResult').innerHTML,/Vorschau wurde seit diesem Auftrag geändert/);
 }finally{h.dispose();}
});

test('bot stops on unavailable trends before replacing the map or starting its package',async()=>{
 const h=await appHarness();try{
  h.doc.getElementById('botTrends').checked=true;const before=JSON.stringify(h.app.config),result=await h.bots[0].run({bundle:true});
  assert.equal(result.ok,false);assert.equal(h.bots[0].phase,'failed');assert.equal(JSON.stringify(h.app.config),before);assert.equal(h.requested.length,0);assert.equal(h.doc.getElementById('botRunBundle').disabled,false);
 }finally{h.dispose();}
});

test('one-click bot keeps its real file link when automatic download or browser storage is blocked',async()=>{
 const h=await appHarness({failStorage:true});try{
  h.doc.getElementById('botTrends').checked=false;h.app.output.downloads.requestFile=()=>{throw Error('blocked');};
  const result=await h.bots[0].run({bundle:true});assert.equal(result.ok,true);assert.equal(result.file.requested,false);assert.ok(h.blobs.has(result.file.url));assert.equal(h.app.vault.persisted,false);
  assert.match(h.doc.getElementById('outputCenter').innerHTML,/Nur in dieser Sitzung verfügbar/);assert.ok(h.doc.getElementById('outputCenter').innerHTML.includes(result.file.url));assert.match(h.doc.getElementById('botStatus').textContent,/Nutze den Dateilink/);assert.ok(h.bots[0].last.events.some(e=>e.step==='Sicherung'&&e.detail.includes('Nur in dieser Sitzung')));
 }finally{h.dispose();}
});
