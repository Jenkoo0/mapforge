import test from 'node:test';
import assert from 'node:assert/strict';
import {appHarness} from './support/app-harness.mjs';
import {creativeDirectionConfig} from '../web/creative-directions.js';
import {economySnapshot} from '../web/tycoon.js';

const viewOf=h=>Object.fromEntries(['angle','zoom','plan','path','focusPlot','level','labels'].map(key=>[key,h.app.preview[key]]));
async function stage(h,level){const input=h.doc.getElementById('buildLevel');input.value=level;await input.handlers.input[0]({target:input});}
async function customise(h,{level=6,angle=.61,zoom=1.75,allPlots=true}={}){
 await stage(h,level);await h.click('planView');await h.click('pathView');
 if(allPlots&&h.app.preview.focusPlot)await h.click('plotView');
 h.app.preview.angle=angle;h.app.preview.zoom=zoom;h.app.preview.labels=false;
 return viewOf(h);
}
function assertRestored(h,expected){
 assert.deepEqual(viewOf(h),expected);
 assert.equal(Number(h.doc.getElementById('buildLevel').value),expected.level);
 assert.equal(h.doc.getElementById('levelOutput').textContent,expected.level+' / 48');
 assert.equal(h.doc.getElementById('planView').attrs['aria-pressed'],String(expected.plan));
 assert.equal(h.doc.getElementById('pathView').attrs['aria-pressed'],String(expected.path));
 assert.equal(h.doc.getElementById('plotView').textContent,expected.focusPlot?'Alle Grundstücke ansehen ↗':'Eine Fabrik im Detail ansehen ↗');
 assert.equal(h.app.output.canUndo,false);
}
function dispose(h){h.app.creativeStudio.dispose();h.dispose();}

test('opening an obby draft reports its actual hazards instead of tycoon production',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Von Fabrik zum Parcours',autoName:false,plots:2}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.select('aschepfad');assert.equal(lab.open(),true);
  assert.equal(h.app.config.mode,'obby');assert.equal(h.doc.getElementById('statLabelHazards').textContent,'GEFAHREN');
  assert.equal(h.doc.getElementById('statHazards').textContent,h.app.map.hazards.length);
  assert.ok(h.app.map.hazards.length>0);assert.equal(h.doc.getElementById('previewSession').hidden,true);
  await stage(h,0);assert.equal(h.doc.getElementById('statHazards').textContent,h.app.map.hazards.length);assert.equal(h.requested.length,0);
 }finally{dispose(h);}
});

test('undoing a different creative mode restores camera, all-plot scope, stage and matching controls',async()=>{
 const h=await appHarness({config:{mode:'tycoon',theme:'jungle',name:'Eigene Werkstatt',autoName:false,plots:4,cashSmallId:'9876'}});
 try{
  const original=structuredClone(h.app.config),expected=await customise(h);
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.select('wolkensaum');assert.equal(lab.open(),true);
  assert.equal(h.app.config.mode,'obby');assert.equal(h.app.preview.level,48);
  await h.click('resetView');await h.click('zoomOut');await stage(h,0);
  h.app.undoOpenMap();assert.deepEqual(h.app.config,original);assertRestored(h,expected);
  assert.equal(h.doc.getElementById('previewStageTitle').textContent,'6 von 48 Ausbauten');
  assert.equal(h.doc.getElementById('statHazards').textContent,new Intl.NumberFormat('de-DE',{notation:'compact',maximumFractionDigits:1}).format(economySnapshot(6).income));
  for(const button of h.doc.querySelectorAll('[data-preview-level]'))assert.equal(String(button.attrs['aria-pressed']),String(Number(button.dataset.previewLevel)===6));
  assert.equal(h.requested.length,0);
 }finally{dispose(h);}
});

test('undo restores an obby view with its real hazard count after trying a tycoon stage',async()=>{
 const h=await appHarness({config:{mode:'obby',theme:'lava',name:'Mein Parcours',autoName:false,stages:24}});
 try{
  const original=structuredClone(h.app.config),hazards=h.app.map.hazards.length,expected=await customise(h,{level:48,angle:-1.27,zoom:.85});
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.setLevel(0);assert.equal(lab.open(),true);
  assert.equal(h.app.config.mode,'tycoon');await h.click('resetView');
  h.app.undoOpenMap();assert.deepEqual(h.app.config,original);assertRestored(h,expected);
  assert.equal(h.doc.getElementById('previewSession').hidden,true);assert.equal(h.doc.getElementById('statHazards').textContent,hazards);assert.equal(h.requested.length,0);
 }finally{dispose(h);}
});

test('saved-map and imported-project undo slots preserve the same previous preview state',async()=>{
 for(const action of ['saved','import']){
  const h=await appHarness({config:{mode:'tycoon',name:'Vorher',autoName:false,theme:'sky',plots:2}});
  try{
   const original=structuredClone(h.app.config),expected=await customise(h,{level:0,angle:1.2,zoom:2.2,allPlots:false});
   const target={...h.app.config,name:'Danach',theme:'neon',seed:'OTHER'};
   if(action==='saved'){
    const row=h.app.vault.remember({...h.app.map,config:target}).record;assert.equal(h.app.openSavedMap(row.id),true);
   }else{
    const input=h.doc.getElementById('importFile'),payload=JSON.stringify({app:'MapForge',config:target});input.files=[{size:payload.length,text:async()=>payload}];await input.handlers.change[0]({target:input});
   }
   assert.equal(h.app.config.name,'Danach');await h.click('resetView');await stage(h,48);await h.click('plotView');
   h.app.undoOpenMap();assert.deepEqual(h.app.config,original);assertRestored(h,expected);assert.equal(h.requested.length,0);
  }finally{dispose(h);}
 }
});

test('opening only another stage of the current direction is reversible without changing the map',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Gleiche Map',autoName:false,plots:2}});
 try{
  h.app.update(creativeDirectionConfig(h.app.config,'prismahafen'));
  const original=structuredClone(h.app.config),expected=await customise(h,{level:6});
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.setLevel(48);assert.equal(lab.open(),true);
  assert.deepEqual(h.app.config,original);assert.equal(h.app.preview.level,48);assert.equal(h.app.output.canUndo,true);
  h.app.undoOpenMap();assert.deepEqual(h.app.config,original);assertRestored(h,expected);assert.equal(h.requested.length,0);
 }finally{dispose(h);}
});

test('reopening an unchanged draft and stage retains the existing undo target and its preview snapshot',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Original',autoName:false,theme:'jungle',plots:2}});
 try{
  const original=structuredClone(h.app.config),expected=await customise(h,{level:0,zoom:1.3});
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.setLevel(6);assert.equal(lab.open(),true);
  h.app.preview.angle=-1.1;h.app.preview.zoom=.7;
  h.app.navigate('bot');assert.equal(lab.open(),true);
  h.app.undoOpenMap();assert.deepEqual(h.app.config,original);assertRestored(h,expected);assert.equal(h.requested.length,0);
 }finally{dispose(h);}
});
