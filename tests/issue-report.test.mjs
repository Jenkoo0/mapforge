import test from 'node:test';
import assert from 'node:assert/strict';
import {generate,DEFAULT} from '../web/engine.js';
import {issueReport,redactLog} from '../web/issue-report.js';
test('report captures current map and reproduction without changing it or claiming tests',()=>{
 const map=generate({...DEFAULT,name:'Fehlerlabor',seed:'issue-42',boostId:123456789});const before=JSON.stringify(map.config);
 const report=issueReport(map,{log:'ServerScriptService.Test:42: attempt to index nil',steps:'Starter kaufen',actual:'Bleibt stehen'});
 assert.match(report,/issue-42/);assert.match(report,/Test:42/);assert.match(report,/Starter kaufen/);assert.match(report,/Fehlender Wert/);assert.match(report,/keine bestätigte Ursache/);assert.ok(!report.includes('123456789'));assert.equal(JSON.stringify(map.config),before);
});
test('redacts common secrets and bounds oversized logs',()=>{
 const clean=redactLog('Bearer abc.def\napi_key="private-value"\n.ROBLOSECURITY=secret-cookie\nsk-proj-abcdefghijklmnop');
 for(const secret of ['abc.def','private-value','secret-cookie','abcdefghijklmnop'])assert.ok(!clean.includes(secret));
 assert.equal(redactLog('x'.repeat(60000)).length,50000);
 assert.match(issueReport(generate(DEFAULT)),/Noch kein Log/);
});
