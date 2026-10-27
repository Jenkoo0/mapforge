import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,normalize} from '../web/engine.js';
import {localReview,assessPatch,parseReview,reviewRevision,reviewRequest,reviewPrompt,improvementMarkdown} from '../web/improve.js';
import {pacingPlan} from '../web/gameplay.js';
import {PACING,PART_BUDGET,UPGRADES,buildCost} from '../web/tycoon.js';
import {reviewFiles} from '../web/review-kit.js';
import {makeZip} from '../web/zip.js';
test('feedback changes real geometry and pacing while keeping product IDs and map identity',()=>{
 const c=normalize({mode:'tycoon',detail:1,polish:0,plots:6,cashSmallId:'123',vipPassId:'456',seed:'keep-this'});
 const r=localReview(c,'Schöner, mehr Details und weniger warten');
 assert.equal(r.source,'local');assert.equal(r.after.pacing,'brisk');assert.equal(r.after.detail,3);assert.equal(r.after.polish,2);
 assert.equal(r.after.cashSmallId,'123');assert.equal(r.after.vipPassId,'456');assert.equal(r.after.seed,c.seed);assert.equal(r.after.mode,c.mode);
 assert.ok(r.metrics.partsAfter>r.metrics.partsBefore);assert.ok(r.metrics.partsAfter<PART_BUDGET);assert.equal(r.metrics.errorsAfter,0);
 const lean=localReview(r.after,'Für Handy, weniger Deko und Shop stört');assert.equal(lean.after.polish,0);assert.equal(lean.after.shopHints,false);assert.ok(lean.metrics.partsAfter<r.metrics.partsAfter);
});
test('AI imports are bound to a revision and reject code, stale maps, IDs and unsafe geometry',()=>{
 const c=normalize({mode:'obby',gap:4});
 const response=patch=>({app:'MapForgeReview',baseRevision:reviewRevision(c),summary:'test',patch,notes:[]});
 const good=JSON.stringify(response({gap:3,rise:1}));assert.equal(parseReview('```json\n'+good+'\n```',c).after.gap,3);
 for(const patch of [{coinsId:'999'},{seed:'replace'},{script:'print(1)'},{polish:2},{gap:NaN},{gap:12,rise:7},{gap:'3'}])assert.throws(()=>assessPatch(response(patch),c));
 assert.throws(()=>parseReview(good,{...c,seed:'changed'}),/Map-Version/);
 assert.throws(()=>parseReview('x'.repeat(50001),c),/groß/);
 assert.throws(()=>parseReview(JSON.stringify(response(JSON.parse('{"__proto__":{"evil":true}}'))),c));
 assert.equal({}.evil,undefined);
});
test('automatic checks respect budget and keep the same paid product configuration across variants',()=>{
 for(const theme of ['sky','neon','jungle','lava'])for(const plots of [2,6]){
  const c=normalize({mode:'tycoon',theme,plots,detail:3,polish:0,cashSmallId:'789',cashLargeId:'789'}),r=localReview(c);
  assert.equal(r.after.cashSmallId,'789');assert.equal(r.after.cashLargeId,'789');assert.ok(r.metrics.partsAfter<PART_BUDGET);
  assert.ok(r.metrics.errorsAfter<=r.metrics.errorsBefore);
 }
 const obby=localReview(normalize({gap:12,rise:7,checkpointEvery:10}),'Leichter');assert.equal(obby.metrics.errorsAfter,0);assert.ok(obby.after.gap<=3);
});
test('review packages describe actual geometry, limits and the exact response revision',()=>{
 const map=generate({mode:'tycoon'}),r=reviewRequest(map,'Mehr Deko');
 assert.equal(r.geometry.parts,map.parts.length);assert.equal(r.responseExample.baseRevision,reviewRevision(map.config));assert.ok(!Object.hasOwn(r.allowedFields,'cashSmallId'));
 assert.ok(reviewPrompt(map).includes('kein Roblox-Screenshot'));
 assert.ok(improvementMarkdown([localReview({...map.config,polish:0})]).includes('Lokale Prüfung'));
 const png=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6i0AAAAASUVORK5CYII=','base64'));
 const files=reviewFiles(map,{feedback:'Mehr Details',previewBytes:png,startPreviewBytes:png});
 // JSON omits undefined properties and normalizes negative zero.
 assert.deepEqual(JSON.parse(files['Geometrie.json']).parts,JSON.parse(JSON.stringify(map.parts)));
 assert.equal(JSON.parse(files['Map-Daten.json']).baseRevision,r.baseRevision);
 assert.match(files['Weltgeschichte.md'],/keine kuratierte Weltgeschichte/);
 const bytes=makeZip(files);assert.equal(new DataView(bytes.buffer).getUint16(bytes.length-12,true),8);
 assert.throws(()=>reviewFiles(map,{previewBytes:new Uint8Array(2),startPreviewBytes:png}));
});
test('pacing model and exported build costs agree without changing income or prerequisites',()=>{
 const standard=pacingPlan('balanced'),brisk=pacingPlan('brisk'),long=pacingPlan('relaxed');
 assert.ok(brisk.seconds<standard.seconds&&standard.seconds<long.seconds);
 assert.ok(brisk.seconds>83*60&&brisk.seconds<85*60);assert.ok(long.seconds>149*60&&long.seconds<151*60);
 assert.ok(standard.rows[5].seconds<90,'quick initial builds');assert.ok(standard.rows[11].seconds<300,'first free milestone within five model minutes');
 for(const [mode,value] of Object.entries(PACING)){
  const p=pacingPlan(mode);assert.equal(p.rows.length,48);assert.equal(p.rows[0].cost,0);
  for(let i=0;i<48;i++)assert.equal(p.rows[i].cost,buildCost(UPGRADES[i],mode));
  assert.equal(p.rows.at(-1).income,standard.rows.at(-1).income);assert.equal(p.factor,value.factor);
 }
 assert.equal(normalize({pacing:'constructor'}).pacing,'balanced');
});
