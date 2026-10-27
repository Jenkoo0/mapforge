import test from 'node:test';
import assert from 'node:assert/strict';
import {appHarness} from './support/app-harness.mjs';
import {mapMetrics} from '../web/quality-report.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('creative exploration never saves a map until opening, and the actual app can restore its previous map',async()=>{
 const h=await appHarness({config:{mode:'tycoon',theme:'jungle',plots:6,name:'Mein eigener Name',autoName:false,cashSmallId:'12345',persistence:true}});
 try{
  const before=structuredClone(h.app.config),vault=JSON.stringify(h.app.vault.records),lab=h.app.creativeStudio;
  lab.renderPreview=()=>{};h.app.navigate('bot');lab.select('wolkensaum');
  assert.deepEqual(h.app.config,before);assert.equal(JSON.stringify(h.app.vault.records),vault);assert.equal(h.requested.length,0);
  const expected=mapMetrics(lab.draft.map).fingerprint;
  assert.equal(lab.open(),true);assert.equal(h.app.config.mode,'obby');assert.equal(mapMetrics(h.app.map).fingerprint,expected);
  assert.equal(h.app.config.name,before.name);assert.equal(h.app.config.cashSmallId,before.cashSmallId);assert.equal(h.app.config.persistence,true);
  assert.match(h.doc.getElementById('outputCenter').innerHTML,/Vorherige Map wiederherstellen/);assert.equal(h.requested.length,0);
  h.app.undoOpenMap();assert.deepEqual(h.app.config,before);assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.setActive(false);h.dispose();}
});

test('camera and build-stage inspection keep exact geometry and transfer the chosen stage into the actual generator',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:4,name:'Meine Werkstatt',autoName:false,cashSmallId:'9876'}});
 try{
  const lab=h.app.creativeStudio,painted=[];lab.renderPreview=(_canvas,map,view)=>{painted.push({map,level:view.level,angle:view.angle,focusPlot:view.focusPlot});return true;};
  h.app.navigate('bot');await flush();const draft=lab.draft,before=structuredClone(h.app.config),saved=JSON.stringify(h.app.vault.records);
  lab.setLevel(0);lab.moveCamera('left');lab.moveCamera('scope');await flush();
  assert.equal(lab.draft,draft);assert.equal(painted.at(-1).map,draft.map);assert.equal(painted.at(-1).level,0);assert.equal(painted.at(-1).focusPlot,0);assert.notEqual(painted.at(-1).angle,-.8);
  assert.deepEqual(h.app.config,before);assert.equal(JSON.stringify(h.app.vault.records),saved);assert.equal(h.requested.length,0);
  assert.equal(lab.open(),true);assert.equal(h.doc.getElementById('buildLevel').value,0);assert.equal(h.app.config.cashSmallId,'9876');
  h.app.undoOpenMap();assert.deepEqual(h.app.config,before);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('mode filters select a visible matching draft and preserve the tycoon comparison stage without saving',async()=>{
 const h=await appHarness({config:{mode:'tycoon'}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;lab.setActive(true);const before=structuredClone(h.app.config);
  lab.setLevel(6);assert.equal(lab.setFilter('obby'),true);assert.equal(lab.direction().mode,'obby');assert.equal(lab.view().level,undefined);assert.equal(lab.setLevel(0),false);
  assert.equal(lab.setFilter('tycoon'),true);assert.equal(lab.direction().mode,'tycoon');assert.equal(lab.view().level,6);assert.equal(lab.setFilter('unknown'),false);
  assert.deepEqual(h.app.config,before);assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('a mode-specific validation failure clears the previous preview and cannot re-enable an invalid draft',async()=>{
 const h=await appHarness({config:{mode:'tycoon',boostId:'77',coinsId:'77'}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;lab.setActive(true);await flush();assert.ok(lab.query('[data-creative-canvas]').attrs['aria-label'].includes('Prismahafen'));
  lab.select('wolkensaum');assert.equal(lab.draft,null);assert.equal(lab.query('.creative-stage').attrs['data-preview-state'],'error');
  assert.equal(lab.query('[data-creative-canvas]').attrs['aria-hidden'],'true');assert.ok(!lab.query('[data-creative-canvas]').attrs['aria-label'].includes('Prismahafen'));
  assert.equal(lab.query('[data-creative-metrics]').textContent,'Kein gültiger Bauplan');lab.setBusy(true);lab.setBusy(false);assert.equal(lab.query('[data-creative-open]').disabled,true);assert.equal(lab.open(),false);
  lab.select('prismahafen');await flush();assert.ok(lab.draft);assert.equal(lab.query('.creative-stage').attrs['data-preview-state'],'ready');assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('an actual render failure is visible, keeps valid map actions and can recover on a later draw',async()=>{
 const h=await appHarness({config:{mode:'tycoon'}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>false;lab.setActive(true);await flush();
  assert.equal(lab.query('[data-creative-render]').hidden,false);assert.equal(lab.query('.creative-stage').attrs['data-preview-state'],'unavailable');
  assert.equal(lab.query('[data-creative-canvas]').attrs['aria-hidden'],'true');assert.equal(lab.query('[data-creative-open]').disabled,false);
  lab.renderPreview=()=>true;lab.moveCamera('reset');await flush();assert.equal(lab.query('.creative-stage').attrs['data-preview-state'],'ready');assert.equal(lab.query('[data-creative-render]').hidden,true);
  lab.dispose();assert.equal(lab.select('wolkensaum'),false);assert.equal(lab.open(),false);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('creative preview discards hidden paint work, blocks busy actions and requires a fresh choice after intervening settings',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2}});
 try{
  const lab=h.app.creativeStudio,painted=[];lab.renderPreview=(_canvas,map)=>painted.push(map.config.seed);
  lab.setActive(true);lab.select('aschepfad');lab.setActive(false);
  await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(painted,[]);
  lab.setBusy(true);assert.equal(lab.select('wolkensaum'),false);assert.equal(lab.open(),false);lab.setBusy(false);
  const old=lab.draft.config;h.app.update({...h.app.config,plots:3,name:'Zwischenstand',autoName:false});
  assert.equal(lab.open(),false);assert.equal(h.app.config.name,'Zwischenstand');lab.setActive(true);assert.notDeepEqual(lab.draft.config,old);
  lab.getConfig=()=>({...h.app.config,name:'Noch eine Änderung'});
  assert.equal(lab.open(),false);assert.equal(lab.draft.config.name,'Noch eine Änderung');assert.equal(h.app.config.name,'Zwischenstand');assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.setActive(false);h.dispose();}
});
