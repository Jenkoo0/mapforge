import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareIdeaPreview,ideaCardsHtml} from '../web/idea-preview.js';
import {proposeConcepts} from '../web/idea-core.js';
import {buildBotRun} from '../web/bot-core.js';
import {generate,normalize} from '../web/engine.js';
import {visiblePreviewParts} from '../web/preview-state.js';
import {mapMetrics} from '../web/quality-report.js';
import {appHarness} from './support/app-harness.mjs';

const now=Date.parse('2026-10-24T12:00:00Z');
const config=normalize({mode:'tycoon',plots:6,autoName:true,name:'Meine Map',seed:'IDEA-COMPARE',cashSmallId:'3456789',vipPassId:'5678912'});
const flush=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};

test('comparison geometry and metrics match the actual selected build for all three ideas',async()=>{
 const before=JSON.stringify(config),ideas=proposeConcepts(config,{seed:'compare',now}),fingerprints=new Set();
 for(const idea of ideas){
  const preview=await prepareIdeaPreview(config,idea,{now:()=>now});
  const run=await buildBotRun({config,idea,now:()=>now+1000}),actual=generate(run.config);
  assert.deepEqual(preview.config,run.config);assert.deepEqual(preview.map.parts,actual.parts);
  assert.equal(preview.metrics.parts,actual.parts.length);assert.equal(preview.metrics.headroom,5200-actual.parts.length);
  assert.equal(preview.metrics.plots,6);assert.ok(preview.metrics.headroom>0);assert.ok(preview.metrics.passed>0);
  assert.ok(visiblePreviewParts(actual,{focusPlot:1,level:0}).length<visiblePreviewParts(actual,{focusPlot:1,level:48}).length);
  fingerprints.add(mapMetrics(actual).fingerprint);
 }
 assert.equal(fingerprints.size,3);assert.equal(JSON.stringify(config),before);
});

test('comparison cards escape an own map name and report measured data without a quality score',async()=>{
 const own={...config,autoName:false,name:'<img src=x onerror=bad()> & Creator'};
 const preview=await prepareIdeaPreview(own,proposeConcepts(own,{seed:'html',now})[0],{now:()=>now});
 const html=ideaCardsHtml([preview]);
 assert.ok(html.includes('data-idea-canvas='));assert.match(html,/Im Generator ansehen/);assert.match(html,/Studio-Test offen/);
 assert.match(html,/&lt;img/);assert.ok(!html.includes('<img src=x'));assert.ok(html.includes(preview.metrics.parts.toLocaleString('de-DE')));
 assert.match(html,/ein Grundstück/);assert.match(html,/reine Produktion im Modell/);assert.doesNotMatch(html,/Qualitätsscore|60 FPS/);
});

test('opening a compared idea saves the previous map, preserves IDs and can undo without a download',async()=>{
 const h=await appHarness({config});
 try{
  const bot=h.bots[0],before=structuredClone(h.app.config),savedBefore=JSON.stringify(h.app.vault.records);h.doc.getElementById('botTrends').checked=false;
  await bot.proposeIdeas();assert.deepEqual(h.app.config,before);assert.equal(JSON.stringify(h.app.vault.records),savedBefore);
  const preview=bot.ideaPreviews[1];bot.setIdeaLevel(6);assert.equal(bot.previewIdea(preview.idea.id),true);
  assert.equal(h.doc.getElementById('buildLevel').value,6);
  assert.deepEqual(h.app.config,preview.config);assert.equal(h.app.config.cashSmallId,'3456789');assert.equal(h.app.config.vipPassId,'5678912');
  assert.match(h.doc.getElementById('outputCenter').innerHTML,/Idee als Vorschau geöffnet/);assert.equal(h.requested.length,0);
  assert.ok(h.app.vault.records.some(r=>JSON.stringify(r.config)===JSON.stringify(before)));
  assert.ok(h.app.vault.records.every(r=>!r.generatedAt));
  assert.equal(bot.previewIdea(preview.idea.id),true);h.app.undoOpenMap();assert.deepEqual(h.app.config,before);assert.equal(h.requested.length,0);
  assert.equal(bot.previewIdea(preview.idea.id),false);assert.match(h.doc.getElementById('ideaStatus').textContent,/Einstellungen/);
 }finally{h.bots[0].setActive(false);h.dispose();}
});

test('choosing another comparison after preview keeps its exact geometry through ZIP export',async()=>{
 const h=await appHarness({config});
 try{
  const bot=h.bots[0];h.doc.getElementById('botTrends').checked=false;await bot.proposeIdeas();
  assert.equal(bot.previewIdea(bot.ideas[0].id),true);
  const target=bot.currentIdea(bot.ideas[2].id),fingerprint=mapMetrics(target.map).fingerprint;
  const first=bot.run({bundle:true,idea:target.idea}),duplicate=bot.run({bundle:true,idea:target.idea});
  const [result]=await Promise.all([first,duplicate]);assert.equal(result.ok,true);assert.equal(h.requested.length,1);
  assert.equal(mapMetrics(h.app.map).fingerprint,fingerprint);
  const zip=await h.blobs.get(h.requested[0].url).text();assert.ok(zip.includes(fingerprint));assert.ok(zip.includes(target.config.name));
 }finally{h.bots[0].setActive(false);h.dispose();}
});

test('edits while comparison awaits trends discard the proposals and never overwrite the current map',async()=>{
 const h=await appHarness({config});
 try{
  const bot=h.bots[0];let release;bot.fetchTrends=()=>new Promise(resolve=>{release=resolve;});h.doc.getElementById('botTrends').checked=true;
  const pending=bot.proposeIdeas();h.app.update({...h.app.config,plots:2,name:'Neu bearbeitet',autoName:false});
  release({fetchedAt:new Date().toISOString(),games:[{name:'Factory',url:'https://www.roblox.com/games/123',playing:5,idea:{fit:95,theme:'neon'}}]});
  await pending;assert.equal(bot.ideaPreviews.length,0);assert.equal(h.app.config.name,'Neu bearbeitet');assert.equal(h.requested.length,0);
  assert.match(h.doc.getElementById('ideaStatus').textContent,/inzwischen geändert/);
 }finally{h.bots[0].setActive(false);h.dispose();}
});

test('leaving the workshop cancels pending canvas work and stage changes paint actual cached maps',async()=>{
 const h=await appHarness({config});
 try{
  const bot=h.bots[0];h.doc.getElementById('botTrends').checked=false;await bot.proposeIdeas();
  for(const p of bot.ideaPreviews)h.doc.getElementById('canvas-'+p.idea.id).dataset.ideaCanvas=p.idea.id;
  const painted=[];bot.renderIdeaPreview=(canvas,map,view)=>painted.push({canvas,map,view});
  bot.setActive(true);bot.setActive(false);await flush();assert.equal(painted.length,0);
  bot.setActive(true);await flush();assert.equal(painted.length,3);assert.ok(painted.every(p=>p.view.level===48));
  painted.length=0;bot.setIdeaLevel(0);bot.setIdeaLevel(6);await flush();assert.equal(painted.length,3);
  assert.ok(painted.every(p=>p.view.level===6&&p.view.focusPlot===1));
  assert.equal(painted[0].map,bot.ideaPreviews[0].map);assert.equal(h.requested.length,0);
 }finally{h.bots[0].setActive(false);await flush();h.dispose();}
});
