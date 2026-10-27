import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBotRun} from '../web/bot-core.js';
import {generate,toRBXLX,SCRIPT_FILES} from '../web/engine.js';
import {readFileSync} from 'node:fs';
import {launchFiles} from '../web/launch-kit.js';
import {listingDescription} from '../web/player-plan.js';
const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([key,file])=>[key,readFileSync(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')]));
test('bot builds actual checked geometry, protects IDs and records the real objective',async()=>{
 const config=generate({mode:'tycoon',cashSmallId:12345,seed:'BOT-TEST'}).config,before=JSON.stringify(config),events=[];
 const run=await buildBotRun({config,brief:'Neon-Tycoon, schöner, schneller',progress:e=>events.push(e)});
 assert.equal(JSON.stringify(config),before);assert.equal(run.config.cashSmallId,config.cashSmallId);assert.equal(run.config.seed,'BOT-TEST');assert.equal(run.config.pacing,'brisk');assert.equal(run.config.theme,'neon');assert.match(run.plan.goal,/48/);assert.equal(run.reference,null);assert.ok(events.some(e=>e.step==='Prüfung'));assert.ok(generate(run.config).parts.length>1000);
});
test('bot refuses missing or stale chart data without silently generating',async()=>{
 const config=generate({mode:'tycoon'}).config,now=Date.now();
 for(const data of [null,{games:[],fetchedAt:'bad'},{games:[],fetchedAt:new Date(now-1000000).toISOString()},{games:[],fetchedAt:new Date(now+120000).toISOString()}])await assert.rejects(buildBotRun({config,useTrends:true,now:()=>now,fetchTrends:async()=>data}),/frischen Trenddaten/);
 const game={id:1,name:'Source Factory',url:'https://www.roblox.com/games/1',playing:400,idea:{fit:95,mode:'tycoon',theme:'jungle',name:'Own Factory'}};
 const run=await buildBotRun({config,useTrends:true,fetchTrends:async()=>({games:[game],fetchedAt:new Date(now).toISOString()})});assert.equal(run.reference.name,game.name);assert.notEqual(run.config.name,'Own Factory');assert.notEqual(run.config.name,config.name);assert.equal(run.config.autoName,true);assert.equal(run.config.theme,'jungle');
});
test('export contains visible sign text and accurate instructions for either mode',()=>{
 for(const mode of ['tycoon','obby']){const map=generate({mode,name:'<Creator & Test>',stages:24,plots:6});const files=launchFiles(map,scripts);assert.match(files['Spielziel-und-Referenzen.md'],/Core loops/);assert.match(files['Creator-Hub-Vorlage.md'],new RegExp(mode==='tycoon'?'48 Ausbauten':'24 Parcours'));assert.match(listingDescription(map.config),/ohne Robux/);const xml=toRBXLX(map,scripts);if(mode==='tycoon'){assert.match(xml,/<Item class="BillboardGui"/);assert.match(xml,/SO WÄCHST DEIN BETRIEB/);assert.match(xml,/<bool name="Enabled">false<\/bool>/);}}
});
