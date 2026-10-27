import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,validate} from '../web/engine.js';
import {guideSteps,restoreGuide,completedStep,guideMarkdown} from '../web/walkthrough-core.js';
const context=(config={})=>{const map=generate({mode:'tycoon',...config});return{map,checks:validate(map),manualTests:Array.from({length:map.config.mode==='tycoon'?8:6},(_,i)=>({label:'Test '+i,done:false}))};};
test('instructions match the active mode, filename, plot count and optional shop',()=>{
 const ctx=context({name:'Creator Factory',plots:6}),steps=guideSteps(ctx);
 assert.equal(steps.length,10);assert.ok(steps.find(s=>s.id==='open').intro.includes('Creator-Factory.rbxlx'));
 assert.ok(steps.find(s=>s.id==='publish').items.some(([,text])=>text.includes('auf 6')));
 assert.equal(steps.find(s=>s.id==='test').tests.length,8);
 const free=guideSteps(context({shop:false}));assert.equal(free.find(s=>s.id==='test').tests.length,7);
 const obby=guideSteps(context({mode:'obby',shop:false}));assert.equal(obby.find(s=>s.id==='test').tests.length,5);
 assert.ok(obby.find(s=>s.id==='design').intro.includes('Obby'));
 assert.ok(!obby.find(s=>s.id==='open').tip.includes('Fabrik'));
});
test('navigation and corrupted saved values cannot certify tests or bypass layout failures',()=>{
 const steps=guideSteps(context()),answers=restoreGuide({'setup-installed':'true','publish-confirmed':true,unknown:true},steps);
 assert.equal(answers['setup-installed'],false);assert.equal(answers.unknown,undefined);
 assert.ok(!completedStep(steps.find(s=>s.id==='test'),answers));
 const bad=context({cashSmallId:'123',cashLargeId:'123'}),quality=guideSteps(bad).find(s=>s.id==='quality');
 assert.ok(!completedStep(quality,{'quality-read':true}));
 const play=steps.find(s=>s.id==='test');play.tests.forEach(t=>t.done=true);assert.ok(completedStep(play,answers));
 for(const raw of [null,[],true,'bad'])assert.ok(Object.values(restoreGuide(raw,steps)).every(v=>v===false));
});
test('offline instructions preserve all ten steps, current details and official links',()=>{
 const text=guideMarkdown(context({name:'Bloom Studio',plots:2}));
 assert.equal((text.match(/^## \d+\./gm)||[]).length,10);
 assert.ok(text.includes('Bloom-Studio.rbxlx'));assert.ok(text.includes('maximale Spielerzahl auf 2'));
 assert.ok(text.includes('https://create.roblox.com/docs/studio/setup'));
 assert.ok(text.includes('werden nicht automatisch ausgeführt'));
});
