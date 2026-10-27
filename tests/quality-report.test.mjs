import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,toRBXLX,SCRIPT_FILES} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {partQuery,partShadow,mapMetrics,metricsHtml,qualityDossier,studioMapAudit} from '../web/quality-report.js';
const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([key,file])=>[key,readFileSync(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')]));

test('measured quality data agrees with the actual exported query/shadow properties',()=>{
 for(const mode of ['obby','tycoon']){
  const map=generate({mode,theme:'jungle',detail:3,polish:2}),m=mapMetrics(map),xml=toRBXLX(map,scripts);
  assert.equal(m.total,map.parts.length);
  assert.equal((xml.match(/<bool name="CanQuery">true<\/bool>/g)||[]).length,m.queries);
  assert.equal((xml.match(/<bool name="CanQuery">false<\/bool>/g)||[]).length,m.total-m.queries);
  assert.equal((xml.match(/<bool name="CastShadow">true<\/bool>/g)||[]).length,m.shadows);
  assert.ok(m.queries<m.total);assert.ok(m.shadows<m.total);
  assert.equal(Object.values(m.materials).reduce((a,b)=>a+b,0),m.total);
  assert.equal(m.spawns,1);assert.ok(m.bounds.every(n=>Number.isFinite(n)&&n>0));
  assert.equal(m.fingerprint,mapMetrics(generate(map.config)).fingerprint);
  const altered={...map,parts:map.parts.map((p,i)=>i? p:{...p,pos:p.pos.map(n=>n+1)})};
  assert.notEqual(mapMetrics(altered).fingerprint,m.fingerprint);
  for(const field of ['neon','transparency','query','castShadow']){
   const changed={...map,parts:map.parts.map((p,i)=>i?p:{...p,[field]:field==='transparency'?.4:field==='query'?!partQuery(p):field==='castShadow'?!partShadow(p):!p[field]})};
   assert.notEqual(mapMetrics(changed).fingerprint,m.fingerprint,field+' must change the fingerprint');
  }
 }
});
test('pure decoration costs are reduced without disabling touch hazards or queryable targets',()=>{
 const p={size:[1,.2,1],kind:'decor',collide:false};assert.equal(partQuery(p),false);assert.equal(partShadow(p),false);
 for(const kind of ['coin','hazard','spawn','stage'])assert.equal(partQuery({...p,kind}),true);
 assert.equal(partQuery({...p,role:'Claim'}),true);assert.equal(partShadow({...p,castShadow:true}),true);
 assert.equal(partShadow({...p,size:[8,6,8]}),true);assert.equal(partShadow({...p,neon:true,size:[8,6,8]}),false);
 const xml=toRBXLX(generate({mode:'obby',difficulty:'hard'}),scripts);
 assert.ok((xml.match(/<bool name="CanTouch">true<\/bool>/g)||[]).length>10);
});
test('launch pack carries a reproducible dossier and a read-only Studio-only audit',()=>{
 for(const mode of ['tycoon','obby']){
  const map=generate({mode,seed:'QA-SEED',name:'<unsafe> & name',cashSmallId:'123456789012345'}),files=launchFiles(map,scripts),m=mapMetrics(map);
  assert.ok(files['Map-Dossier.md'].includes(m.fingerprint));
  assert.deepEqual(JSON.parse(files['Map-Messwerte.json']).bounds,m.bounds);
  assert.equal(JSON.parse(files['Map-Messwerte.json']).studioPlaytestRunByGenerator,false);
  const audit=files['Studio-Map-Audit.lua'];assert.equal(audit,studioMapAudit(map));
  assert.match(audit,/assert\(RunService:IsStudio\(\)/);assert.match(audit,/PathfindingService/);assert.match(audit,/GetPartBoundsInBox/);
  for(const forbidden of ['DataStoreService','MarketplaceService','Instance.new','StreamingEnabled =','HttpService','123456789012345'])assert.ok(!audit.includes(forbidden));
  assert.ok(!qualityDossier(map).includes('123456789012345'));
  const html=metricsHtml(map);assert.ok(html.includes(String(m.fingerprint)));assert.ok(!html.includes('<unsafe>'));
 }
});
