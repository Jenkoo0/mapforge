import test from 'node:test';
import assert from 'node:assert/strict';
import {CREATIVE_DIRECTIONS,CREATIVE_VARIANT_COUNT,creativeDirectionConfig,normalizeCreativeVariant} from '../web/creative-directions.js';
import {generate,normalize,validate} from '../web/engine.js';
import {appHarness} from './support/app-harness.mjs';

const physical = map => JSON.stringify(map.parts.map(({pos,size,rotation,color,material,kind})=>({pos,size,rotation,color,material,kind})));
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('all thirty-six seeded studies have distinct reproducible geometry while preserving every unrelated setting',()=>{
 const current=normalize({mode:'tycoon',name:'Meine Lichtfabrik',autoName:false,plots:6,cashSmallId:'998877',vipPassId:'776655',shopHints:false,persistence:false,analytics:false});
 const before=structuredClone(current);
 assert.equal(CREATIVE_VARIANT_COUNT,3);
 assert.equal(CREATIVE_DIRECTIONS.length*CREATIVE_VARIANT_COUNT,36);
 for(const direction of CREATIVE_DIRECTIONS){
  const original=creativeDirectionConfig(current,direction.id),geometries=new Set();
  assert.equal(original.seed,`MF-DIRECTION-${direction.id}-01`);
  for(const variant of [1,2,3]){
   const config=creativeDirectionConfig(current,direction.id,variant),{seed,...rest}=config,{seed:_,...expected}=original;
   assert.deepEqual(rest,expected);assert.equal(seed,`MF-DIRECTION-${direction.id}-0${variant}`);
   for(const plots of [2,6]){
    const map=generate({...config,plots});assert.deepEqual(map,generate({...config,plots}));
    assert.deepEqual(validate(map).filter(check=>check.status==='error'),[],direction.id+'/'+variant+'/'+plots);
    assert.ok(map.parts.length<(config.mode==='tycoon'?5200:800));
    if(config.mode==='tycoon')for(const plot of map.plots)assert.equal(map.parts.filter(p=>p.plot===plot.index&&p.role==='Button').length,48);
    if(plots===6)geometries.add(physical(map));
   }
  }
  assert.equal(geometries.size,3,direction.id+' must change physical geometry, not only seed metadata');
 }
 assert.deepEqual(current,before);
 for(const value of [0,-1,4,NaN,Infinity,2.2,'2',null,{},new Number(2)])assert.equal(normalizeCreativeVariant(value),1);
 assert.equal(normalizeCreativeVariant(2),2);
});

test('browsing variants and a remembered comparison preserves the map, IDs, stage and camera until explicit opening',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Creator Projekt',autoName:false,plots:2,cashSmallId:'998877'}});
 try{
  const lab=h.app.creativeStudio,painted=[];lab.renderPreview=(_canvas,map,view,frame)=>{painted.push({map,view:{angle:view.angle,zoom:view.zoom,level:view.level},frame});return true;};
  h.app.navigate('bot');lab.setLevel(6);lab.moveCamera('right');lab.moveCamera('in');await flush();
  const before=structuredClone(h.app.config),saved=JSON.stringify(h.app.vault.records),first=lab.draft.map;
  assert.equal(lab.stepVariant(-1),false);assert.equal(lab.remember(),true);
  const ref=lab.reference;assert.equal(lab.stepVariant(1),true);await flush();const second=lab.draft.map,view={...lab.camera};
  assert.notEqual(physical(first),physical(second));assert.equal(lab.reference,ref);assert.equal(lab.choice().variant,2);
  const candidateFrame=painted.at(-1).frame;
  assert.equal(lab.compare(true),true);await flush();assert.equal(lab.draft.map,first);assert.deepEqual(lab.camera,view);assert.equal(lab.view().level,6);
  assert.deepEqual(painted.at(-1).frame,candidateFrame);assert.equal(lab.stepVariant(1),false);
  assert.equal(lab.compare(false),true);await flush();assert.equal(lab.draft.map,second);assert.deepEqual(lab.camera,view);
  assert.equal(lab.stepVariant(1),true);assert.equal(lab.stepVariant(1),false);assert.equal(lab.stepVariant(-1),true);assert.equal(physical(lab.draft.map),physical(second));
  assert.deepEqual(h.app.config,before);assert.equal(JSON.stringify(h.app.vault.records),saved);assert.equal(h.requested.length,0);
  lab.compare(true);const expected=structuredClone(lab.draft.config);assert.equal(lab.open(),true);assert.deepEqual(h.app.config,expected);assert.equal(physical(h.app.map),physical(first));assert.equal(h.app.config.cashSmallId,'998877');
  h.app.undoOpenMap();assert.deepEqual(h.app.config,before);assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('direction memory, cross-mode comparisons and removing a viewed reference return to the current candidate',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.stepVariant(1);lab.remember();lab.setFilter('obby');lab.stepVariant(1);lab.stepVariant(1);
  const current=structuredClone(lab.choice());assert.equal(lab.direction().mode,'obby');assert.equal(lab.compare(true),true);assert.equal(lab.direction().mode,'tycoon');assert.equal(lab.filter,'all');
  assert.equal(lab.forget(),true);assert.equal(lab.reference,null);assert.equal(lab.direction().mode,'obby');assert.deepEqual(lab.choice(),current);
  lab.select('prismahafen');assert.equal(lab.choice().variant,2);lab.select(current.id);assert.equal(lab.choice().variant,3);
  lab.remember();lab.setBusy(true);assert.equal(lab.compare(true),false);assert.equal(lab.forget(),false);assert.equal(lab.remember(),false);assert.equal(lab.stepVariant(-1),false);lab.setBusy(false);
  lab.dispose();assert.equal(lab.compare(true),false);assert.equal(lab.forget(),false);assert.equal(lab.remember(),false);assert.equal(lab.stepVariant(-1),false);assert.equal(lab.currentDraft,null);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('changed map settings invalidate the comparison and stale opening cannot restore old product IDs',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2,cashSmallId:'12345'}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.remember();lab.stepVariant(1);lab.compare(true);
  lab.getConfig=()=>({...h.app.config,cashSmallId:'54321',name:'Neue Entscheidung'});
  assert.equal(lab.open(),false);assert.equal(lab.reference,null);assert.equal(lab.showingReference,false);assert.equal(lab.choice().variant,2);assert.equal(lab.draft.config.cashSmallId,'54321');
  assert.equal(lab.draft.config.name,'Neue Entscheidung');assert.equal(h.app.config.cashSmallId,'12345');assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});

test('manual template-like project names survive generation, cached comparisons and actual opening',async()=>{
 for(const name of ['Cloud Kingdom','Crystal Industries']){
  const h=await appHarness({config:{mode:'obby',name,autoName:false,plots:2}});
  try{
   const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');lab.select('prismahafen');
   assert.equal(lab.draft.config.name,name);assert.equal(lab.draft.map.config.name,name);lab.remember();lab.stepVariant(1);
   lab.compare(true);assert.equal(lab.draft.config.name,name);assert.equal(lab.draft.map.config.name,name);lab.compare(false);assert.equal(lab.draft.config.name,name);
   assert.equal(lab.open(),true);assert.equal(h.app.config.name,name);assert.equal(h.app.map.config.name,name);assert.equal(h.app.config.autoName,false);
  }finally{h.app.creativeStudio.dispose();h.dispose();}
 }
});

test('busy work suspends real canvas keyboard and pointer input and resumes only in the active lab',async()=>{
 const h=await appHarness({config:{mode:'tycoon',plots:2}});
 try{
  const lab=h.app.creativeStudio;lab.renderPreview=()=>true;h.app.navigate('bot');await flush();const viewer=lab.viewer,canvas=viewer.canvas,angle=viewer.angle;
  const key=()=>canvas.handlers.keydown[0]({key:'ArrowRight',preventDefault(){},isComposing:false});
  const down=()=>canvas.handlers.pointerdown[0]({button:0,isPrimary:true,clientX:10,pointerId:1});
  lab.setBusy(true);key();down();assert.equal(viewer.angle,angle);assert.equal(lab.camera.angle,angle);assert.equal(viewer.drag,null);
  lab.setBusy(false);key();assert.notEqual(viewer.angle,angle);assert.ok(Math.abs(lab.camera.angle-viewer.angle)<1e-10);
  lab.setActive(false);lab.setBusy(true);lab.setBusy(false);assert.equal(viewer.active,false);assert.equal(h.requested.length,0);
 }finally{h.app.creativeStudio.dispose();h.dispose();}
});
