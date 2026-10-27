import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,normalize,validate,configLua} from '../web/engine.js';
import {UPGRADES,LAYOUTS,upgradeName,upgradeSlots} from '../web/tycoon.js';
import {previewStage,visiblePreviewParts} from '../web/preview-state.js';
import {assessPatch,reviewRevision} from '../web/improve.js';
import {pacingPlan} from '../web/gameplay.js';
import {drawPreview} from '../web/preview.js';
test('three build plans use complete unique cells while preserving purchases and saved identity',()=>{
 const signatures=new Set();
 for(const layout of Object.keys(LAYOUTS)){
  const slots=upgradeSlots(layout);assert.equal(slots.size,48);assert.equal(new Set(slots.values()).size,48);assert.ok([...slots.values()].every(i=>i>=0&&i<48));
  signatures.add(JSON.stringify([...slots].sort()));
  const m=generate({mode:'tycoon',layout,name:'Eigene Fabrik',cashSmallId:'123'});
  assert.equal(m.config.layout,layout);assert.equal(m.config.cashSmallId,'123');assert.equal(m.key,'MF-TYCOON-1');
  assert.deepEqual(m.upgrades.map(({id,cost,income,requires})=>({id,cost,income,requires})),UPGRADES.map(({id,cost,income,requires})=>({id,cost,income,requires})));
 }
 assert.equal(signatures.size,3);assert.equal(normalize({layout:'unknown'}).layout,'flow');
});
test('all high-detail build plans preserve walkways, independent plots and budget',()=>{
 for(const theme of ['sky','jungle','neon','lava'])for(const layout of Object.keys(LAYOUTS)){
  const m=generate({mode:'tycoon',theme,layout,plots:6,detail:3,polish:2,seed:'layout-check'});
  assert.ok(m.parts.length<5200,`${theme}/${layout}`);assert.ok(!validate(m).some(c=>c.status==='error'),`${theme}/${layout}`);
  for(let plot=1;plot<=6;plot++)assert.equal(new Set(m.parts.filter(p=>p.plot===plot&&p.role==='Button').map(p=>p.upgrade)).size,48);
  const again=generate(m.config);assert.deepEqual(again.parts,m.parts,'same plan/seed is deterministic');
 }
});
test('themed names are unique, exported and do not alter the economy model',()=>{
 for(const theme of ['sky','jungle','neon','lava']){
  const m=generate({mode:'tycoon',theme,layout:'campus'}),lua=configLua(m);
  assert.equal(new Set(m.upgrades.map(u=>u.name)).size,48);assert.ok(lua.includes(`Theme = "${theme}"`));assert.ok(lua.includes('Layout = "campus"'));
  assert.equal(m.upgrades[0].name,upgradeName(UPGRADES[0],theme));
  assert.deepEqual(pacingPlan('balanced',theme).rows.map(r=>r.cost),pacingPlan('balanced').rows.map(r=>r.cost));
 }
 const bloom=generate({mode:'tycoon',theme:'jungle'});assert.match(bloom.upgrades[0].name,/Saatgut/);assert.ok(bloom.upgrades.some(u=>/Blütenpresse/.test(u.name)));assert.ok(!bloom.upgrades.some(u=>/Kristall/.test(u.name)));
});
test('start and build previews reveal the actual next field and only already-unlocked structures',()=>{
 const m=generate({mode:'tycoon',theme:'jungle',layout:'skyline',plots:6});
 for(const count of [0,1,6,25,48]){
  const state=previewStage(m.config,count),parts=visiblePreviewParts(m,{level:count,focusPlot:1});
  assert.equal(state.count,count);assert.ok(parts.every(p=>p.plot===1));assert.ok(parts.every(p=>!p.unlock||Number(p.unlock.slice(1))<=count));
  const buttons=parts.filter(p=>p.role==='Button');assert.equal(buttons.length,count===48?0:1);
  if(count<48){assert.equal(buttons[0].upgrade,UPGRADES[count].id);assert.equal(state.next.name,m.upgrades[count].name);assert.ok(m.parts.includes(buttons[0]));}
 }
 assert.equal(previewStage(m.config,0).next.cost,0);assert.equal(previewStage(m.config,48).next,null);
 assert.equal(previewStage(m.config,-10).count,0);assert.equal(previewStage(m.config,999).count,48);
 const obby=generate({mode:'obby'});assert.deepEqual(visiblePreviewParts(obby,{level:0}),obby.parts.filter(p=>p.kind!=='event'||p.name==='RallyPortal'));
 assert.ok(visiblePreviewParts(obby,{events:true}).every(p=>p.kind==='event'&&p.name!=='RallyPortal'));
});
test('reviewed build-plan changes stay reversible and preserve IDs while rejecting unknown plans',()=>{
 const c=normalize({mode:'tycoon',layout:'flow',cashSmallId:'777'});
 const review=assessPatch({app:'MapForgeReview',baseRevision:reviewRevision(c),summary:'Werkbereiche',patch:{layout:'campus'}},c);
 assert.equal(review.before.layout,'flow');assert.equal(review.after.layout,'campus');assert.equal(review.after.cashSmallId,'777');assert.equal(review.metrics.errorsAfter,0);
 assert.throws(()=>assessPatch({app:'MapForgeReview',baseRevision:reviewRevision(c),patch:{layout:'untrusted'}},c));
});
test('the next free target keeps its label when nearby world signs compete for preview space',()=>{
 const text=[],gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:s=>({width:s.length*8}),fillText:s=>text.push(s)},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 drawPreview({width:1200,height:850,getContext:()=>ctx},generate({mode:'tycoon',theme:'jungle'}),{level:0,focusPlot:1});
 assert.ok(text.includes('GRATIS STARTER'));assert.ok(text.includes('Gratis-Saatgutsammler'));
});
