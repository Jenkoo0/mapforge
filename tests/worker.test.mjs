import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
test('published Worker serves the app, modules and runtime sources without a CDN',async()=>{
 for(const [path,text] of [['/minigames.js','MINIGAMES'],['/grind-studio.js','mountGrindStudio'],['/minigame-collection.js','buildMinigameCollection'],['/grind-minigame-research.md','Werkmarken'],['/lua/workshop-core.lua','function W.Buy'],['/lua/workshop-service.lua','function S.Award'],['/lua/workshop-client.lua','MapForgeWorkshopHUD']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/only-up-architecture.js','addAscentArchitecture'],['/individual-map-research.md','Faltenhöfe']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/events.js','addEventArena'],['/event-ui.js','mountEventPreview'],['/only-up.js','generateOnlyUp'],['/only-up-ui.js','Skill-Kurve'],['/only-up-difficulty.js','onlyUpDifficulty'],['/only-up-collection.js','buildOnlyUpCollection'],['/only-up-reference.html','Only Up'],['/lua/event-core.lua','function E.Advance'],['/lua/event-server.lua','RequestStreamAroundAsync'],['/lua/event-client.lua','ReducedMotionEnabled']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 const session=await worker.fetch(new Request('https://mapforge.test/creative-session.js'),{},{});assert.equal(session.status,200);assert.ok((await session.text()).includes('normalizeCreativeView'));
 for(const [path,text] of [['/creative-directions.js','creativeDirectionConfig'],['/creative-ui.js','CreativeStudio'],['/creative-studio.css','creative-workbench']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/studio-motion.js','initStudioMotion'],['/studio-motion.css','prefers-reduced-motion'],['/studio-skin.css','inspector-summary'],['/studio-research.md','PlayCanvas']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/idea-preview.js','prepareIdeaPreview'],['/bot-ui.js','data-idea-preview']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/map-vault.js','MapVault'],['/maps-ui.js','MyMaps']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,text] of [['/map-names.js','proposeMapName'],['/output-center.js','DownloadStore']]){const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(text));}
 for(const [path,contains] of [['/','Trend View'],['/app.js','TrendView'],['/geometry.js','rotationMatrix'],['/preview-state.js','previewStage'],['/launch-kit.js','KI-Uebergabe.md'],['/listing.js','gameListing'],['/growth.js','growthMarkdown'],['/shop-setup.js','parseShopImport'],['/shop-ui.js','ShopSetup'],['/upload-ui.js','Titel und Bio sind fertig.'],['/handoff.js','KI-Übergabe'],['/zip.js','makeZip'],['/improve.js','assessPatch'],['/improve-ui.js','ImproveView'],['/gameplay.js','pacingPlan'],['/review-kit.js','reviewFiles'],['/playability.js','OFFER_RULES'],['/playtest-ui.js','PlaytestLab'],['/walkthrough.js','Walkthrough'],['/walkthrough-core.js','guideSteps'],['/lua/tycoon-server.lua','ProcessReceipt'],['/guide.md','48']]){
  const r=await worker.fetch(new Request('https://mapforge.test'+path),{},{});assert.equal(r.status,200);assert.ok((await r.text()).includes(contains));
 }
 assert.equal((await worker.fetch(new Request('https://mapforge.test/missing'),{},{})).status,404);
 assert.equal((await worker.fetch(new Request('https://mapforge.test/api/trends',{method:'POST'}),{},{})).status,405);
});
test('trend route returns verified schema from upstream and reuses its dated snapshot',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async url=>{calls++;return {ok:true,status:200,json:async()=>String(url).includes('get-sort-content')?{games:[{universeId:1,rootPlaceId:2,name:'Factory Tycoon',playerCount:42,totalUpVotes:9,totalDownVotes:1}]}:{data:[]}};};
 try{
  const one=await worker.fetch(new Request('https://mapforge.test/api/trends'),{},{});assert.equal(one.status,200);const data=await one.json();assert.equal(data.games[0].playing,42);assert.equal(data.mode,'charts');assert.ok(data.fetchedAt);const firstCalls=calls;
  const two=await worker.fetch(new Request('https://mapforge.test/api/trends'),{},{});assert.equal((await two.json()).fetchedAt,data.fetchedAt);assert.equal(calls,firstCalls);
 }finally{globalThis.fetch=original;}
});
