import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate,validate,repair,SCRIPT_FILES,toRBXLX} from '../web/engine.js';
import {UPGRADES,TYCOON_THEMES,economySnapshot,PART_BUDGET} from '../web/tycoon.js';
test('all tycoon maps have independent complete plots and locked construction',()=>{
 for(const theme of Object.keys(TYCOON_THEMES))for(const plots of [2,3,4,5,6])for(const detail of [0,2,3]){
  const m=generate({mode:'tycoon',theme,plots,detail});assert.equal(m.plots.length,plots);assert.ok(m.parts.length<PART_BUDGET);assert.ok(m.parts.every(p=>p.pos.every(Number.isFinite)&&p.size.every(n=>Number.isFinite(n)&&n>0)));
  for(let plot=1;plot<=plots;plot++){
   const parts=m.parts.filter(p=>p.plot===plot);
   assert.equal(parts.filter(p=>p.role==='Claim').length,1);assert.equal(parts.filter(p=>p.role==='Collect').length,1);
   const buttons=parts.filter(p=>p.role==='Button');assert.deepEqual(buttons.map(b=>b.upgrade),UPGRADES.map(u=>u.id));
   assert.ok(parts.filter(p=>p.unlock).every(p=>p.hiddenAtStart));
  }
  assert.equal(m.parts.filter(p=>p.kind==='spawn').length,1);assert.ok(!validate(m).some(c=>c.status==='error'));
 }
});
test('upgrade plan is affordable from the free starter without buying Robux',()=>{
 let wallet=0,rate=0,seconds=0;const owned=new Set();
 for(const u of UPGRADES){
  assert.ok(!u.requires||owned.has(u.requires));
  assert.ok(Number.isFinite(u.cost)&&u.cost>=0);
  if(u.cost>wallet){assert.ok(rate>0);const wait=(u.cost-wallet)/rate;assert.ok(wait<=390,'standard late-game wait stays below 6.5 production minutes');seconds+=wait;wallet=u.cost;}
  wallet-=u.cost;rate+=u.income;owned.add(u.id);
 }
 assert.deepEqual(UPGRADES.slice(0,6).map(u=>u.cost),[0,41,77,137,226,369],'first six builds keep their previous prices');
 assert.ok(seconds>119*60&&seconds<121*60,`extended unboosted economic time ${seconds}`);
 assert.equal(economySnapshot(UPGRADES.length).income,rate);assert.equal(economySnapshot(0).income,0);
});
test('duplicate tycoon IDs are blocked and repair removes only duplicates',()=>{
 const c={mode:'tycoon',cashSmallId:'100',cashLargeId:'100',vipPassId:'200',doubleIncomePassId:'200'};
 assert.ok(validate(generate(c)).some(x=>x.status==='error'));
 const fixed=repair(c);assert.equal(fixed.config.cashSmallId,'100');assert.equal(fixed.config.cashLargeId,'');assert.equal(fixed.config.vipPassId,'200');assert.equal(fixed.config.doubleIncomePassId,'');
 assert.ok(!validate(generate(fixed.config)).some(x=>x.status==='error'));
});
test('tycoon export includes dedicated runtime, economy module and ownership metadata',async()=>{
 const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([key,file])=>[key,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
 const xml=toRBXLX(generate({mode:'tycoon',plots:2}),scripts);
 assert.ok(xml.includes('MapForgeTycoon'));assert.ok(xml.includes('MFPlot'));assert.ok(xml.includes('MFUnlock'));assert.ok(xml.includes('MFCollide'));
 assert.ok(xml.includes('TCashSmall'));assert.ok(xml.includes('AutoCollect'));
 const exportedCosts=[...scripts.tycoonEconomy.matchAll(/\{Id="(u\d+)", Name="[^"]+", Cost=(\d+), Income=(\d+)/g)].map(m=>({id:m[1],cost:Number(m[2]),income:Number(m[3])}));
 assert.deepEqual(exportedCosts,UPGRADES.map(({id,cost,income})=>({id,cost,income})),'Lua table must use the editor construction curve');
});

test('rotated geometry leaves the promenade and cross-lane centres free',async()=>{
 const {vertices}=await import('../web/geometry.js');
 for(const theme of Object.keys(TYCOON_THEMES)){
  const m=generate({mode:'tycoon',theme,plots:6,detail:3,seed:'walkways'});
  for(const path of m.paths){
   const size=path.size[0]>path.size[1]?[path.size[0]-20,path.size[1]]:path.size;
   for(const p of m.parts.filter(p=>p.plot===path.plot&&p.collide&&(p.layer??2)>1)){
    const v=vertices(p),lo=[0,1,2].map(i=>Math.min(...v.map(x=>x[i]))),hi=[0,1,2].map(i=>Math.max(...v.map(x=>x[i])));
    const hit=hi[1]>1&&lo[1]<5.5&&hi[0]>path.x-size[0]/2&&lo[0]<path.x+size[0]/2&&hi[2]>path.z-size[1]/2&&lo[2]<path.z+size[1]/2;
    assert.ok(!hit,`${theme}: ${p.name} blocks lane ${path.x}/${path.z}`);
   }
  }
 }
});
