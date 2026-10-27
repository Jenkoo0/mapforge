import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeConcepts,applyConcept} from '../web/idea-core.js';
import {conceptMarkdown} from '../web/idea-data.js';
import {DEFAULT,generate,normalize,validate} from '../web/engine.js';
import {buildBotRun} from '../web/bot-core.js';
const now=Date.parse('2026-10-24T00:00:00Z');
const config=normalize({...DEFAULT,mode:'tycoon',name:'Meine Map',autoName:true,cashSmallId:12345,vipPassId:98765,plots:6});
test('three multi-reference concepts build distinct real geometry and preserve IDs',()=>{
 const before=JSON.stringify(config),ideas=proposeConcepts(config,{seed:'test',now});assert.equal(ideas.length,3);
 assert.equal(new Set(ideas.map(i=>i.title)).size,3);assert.equal(new Set(ideas.map(i=>i.build.layout)).size,3);
 for(const idea of ideas){const c=applyConcept(config,idea,now),map=generate(c);assert.equal(c.cashSmallId,'12345');assert.equal(c.vipPassId,'98765');assert.equal(c.plots,6);assert.ok(map.parts.length<5200);assert.ok(!validate(map).some(c=>c.status==='error'));assert.ok(c.concept.references.length>=3);assert.equal(normalize(JSON.parse(JSON.stringify(c))).concept.title,idea.title);assert.match(conceptMarkdown(c),/Noch nicht implementierte/);}
 assert.equal(JSON.stringify(config),before);assert.equal(applyConcept({...config,name:'Eigener Name',autoName:false},ideas[0],now).name,'Eigener Name');
 assert.deepEqual(proposeConcepts(config,{seed:'test',now}),ideas);
});
test('live source selection records actual observations, rejects stale/future/unusable data',()=>{
 const fetchedAt=new Date(now).toISOString(),games=[{name:'Observed Factory',url:'https://www.roblox.com/games/456',playing:123,idea:{fit:95}},{name:'Not a tycoon',url:'https://www.roblox.com/games/999',playing:9999,idea:{fit:20}}];
 const ideas=proposeConcepts(config,{trends:{fetchedAt,games},now});assert.equal(ideas[0].references[0].playing,123);assert.equal(ideas[0].references[0].kind,'live');assert.ok(!JSON.stringify(ideas).includes('Not a tycoon'));
 assert.throws(()=>proposeConcepts(config,{trends:{fetchedAt:new Date(now-1000000).toISOString(),games},now}),/frischen/);
 assert.throws(()=>proposeConcepts(config,{trends:{fetchedAt:new Date(now+120000).toISOString(),games},now}),/frischen/);
 assert.throws(()=>proposeConcepts(config,{trends:{fetchedAt,games:[]},now}),/passenden/);
 assert.throws(()=>applyConcept(config,ideas[0],now+1000000),/veraltet/);
 const sanitized=normalize({...config,concept:{schema:1,title:'Test',references:[{name:'bad',url:'javascript:alert(1)'}],patterns:['unknown','growth']}}).concept;assert.deepEqual(sanitized.references,[]);assert.deepEqual(sanitized.patterns,['growth']);
});
test('bot automatically mixes or builds the selected idea once with matching handoff',async()=>{
 const idea=proposeConcepts(config,{seed:'choice',now})[1],events=[];
 const run=await buildBotRun({config,idea,now:()=>now,progress:e=>events.push(e)});assert.equal(run.config.name,idea.title);assert.equal(run.config.layout,'skyline');assert.equal(run.config.seed,idea.build.seed);assert.equal(events.filter(e=>e.step==='Prüfung').length,1);assert.equal(run.config.concept.title,idea.title);
 const automatic=await buildBotRun({config,brief:'Neon Tycoon',useIdeas:true,now:()=>now});assert.equal(automatic.config.theme,'neon');assert.ok(automatic.config.concept.references.length>=3);
 const custom=await buildBotRun({config:{...config,name:'Creator',autoName:false},useIdeas:true,now:()=>now});assert.equal(custom.config.name,'Creator');
});

test('live metadata affects the preferred concept rather than just decorating its description',()=>{
 const data={fetchedAt:new Date(now).toISOString(),games:[{name:'Neon Factory',url:'https://www.roblox.com/games/987',playing:800,idea:{fit:95,theme:'neon'}}]};
 assert.equal(proposeConcepts(config,{trends:data,now})[0].build.theme,'neon');
});

test('actual workshop can preview, build and export a chosen idea without duplicating the map',async()=>{
 const {appHarness}=await import('./support/app-harness.mjs');const h=await appHarness({config});
 try{
  h.doc.getElementById('botTrends').checked=false;h.doc.getElementById('botIdeas').checked=true;
  const bot=h.bots[0],before=JSON.stringify(h.app.config);await bot.proposeIdeas();
  assert.equal(JSON.stringify(h.app.config),before);assert.equal(bot.ideas.length,3);assert.match(h.doc.getElementById('botIdeaCards').innerHTML,/Diese Idee bauen/);
  const idea=bot.ideas[1],first=bot.run({bundle:true,idea}),duplicate=bot.run({bundle:true,idea});const [result]=await Promise.all([first,duplicate]);
  assert.equal(result.ok,true);assert.equal(h.requested.length,1);assert.equal(h.app.config.concept.title,idea.title);assert.equal(h.app.vault.records[0].config.concept.title,idea.title);
  const zip=await h.blobs.get(h.requested[0].url).text();assert.match(zip,/Map-Idee-und-Referenzen.md/);assert.ok(zip.includes(idea.title));assert.ok(zip.includes('MapForgeCash'));assert.ok(zip.includes('CoreUISafeInsets'));
 }finally{h.dispose();}
});
