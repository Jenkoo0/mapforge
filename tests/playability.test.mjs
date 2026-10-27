import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,generate,configLua} from '../web/engine.js';
import {MILESTONES,UPGRADES} from '../web/tycoon.js';
import {OFFER_RULES,offerPlan,normalizePlaytest,restorePlaytests,summarizePlaytests,playtestMarkdown,projectScope} from '../web/playability.js';

test('contextual offers wait for actual progress, time, interest and configuration',()=>{
 const c=normalize({mode:'tycoon',autoCollectPassId:'123',gems100Id:'124'});
 const plan=s=>offerPlan(c,s);
 assert.ok(plan({}).every(p=>!p.eligible));
 assert.ok(plan({builds:5,seconds:179,collects:3}).every(p=>!p.eligible));
 const scenario={builds:5,seconds:180,collects:3};
 assert.equal(plan(scenario).find(p=>p.key==='AutoCollect').eligible,true);
 assert.equal(plan({...scenario,flags:{AutoCollect:true}}).find(p=>p.key==='AutoCollect').eligible,false);
 assert.equal(plan(scenario).find(p=>p.key==='TGems100').eligible,false);
 assert.equal(plan({...scenario,designInterest:true}).find(p=>p.key==='TGems100').eligible,true);
 for(const patch of [{shop:false},{persistence:false},{shopHints:false},{shopHintDelay:300}])assert.ok(offerPlan({...c,...patch},scenario).every(p=>!p.eligible));
 assert.ok(plan({...scenario,builds:48,seconds:10000,designInterest:true}).every(p=>!p.eligible));
 assert.equal(plan(scenario).find(p=>p.key==='TBoost15').configured,false);
});
test('fixed cash offers are gated by production value and active boosts are excluded',()=>{
 const c=normalize({mode:'tycoon',cashSmallId:'100',tycoonBoostId:'101'}),s={builds:12,seconds:600,collects:3};
 for(const income of [0,1,100000])assert.equal(offerPlan(c,{...s,income}).find(p=>p.key==='TCashSmall').eligible,false);
 assert.equal(offerPlan(c,{...s,income:100}).find(p=>p.key==='TCashSmall').eligible,true);
 assert.equal(offerPlan(c,{...s,boost:true}).find(p=>p.key==='TBoost15').eligible,false);
 assert.ok(offerPlan({...c,shopFocus:'designs'},s).every(p=>!p.eligible));
});
test('configuration, milestone and Lua rules are generated from shared definitions',async()=>{
 const c=normalize({shopHintDelay:1,shopFocus:'unknown',analytics:false,shopHints:false});
 assert.equal(c.shopHintDelay,120);assert.equal(c.shopFocus,'balanced');assert.equal(normalize({shopHintDelay:Infinity}).shopHintDelay,180);
 const lua=configLua(generate(c));assert.ok(lua.includes('ShopHints = false'));assert.ok(lua.includes('OnboardingAnalytics = false'));
 assert.equal(MILESTONES.reduce((n,m)=>n+m.reward,0),70);assert.ok(MILESTONES.every(m=>m.count<=UPGRADES.length));
 const economy=await readFile(new URL('../web/lua/tycoon-economy.lua',import.meta.url),'utf8');
 for(const rule of OFFER_RULES)assert.ok(economy.includes(`Key="${rule.key}", Pass=${!!rule.pass}, Builds=${rule.builds}, Seconds=${rule.seconds}, Collects=${rule.collects}`));
});
test('playtest summaries use real bounded observations and never invent metrics',()=>{
 assert.deepEqual([summarizePlaytests().n,summarizePlaytests().firstAction,summarizePlaytests().minutes],[0,null,null]);
 assert.equal(normalizePlaytest(null),null);assert.equal(normalizePlaytest({note:'missing measurements'}),null);
 const row={firstAction:20,minutes:5,returnIntent:'yes',blocker:'none',benefit:'looks',scope:projectScope(normalize({mode:'tycoon'}))};
 const rows=[row,{...row,firstAction:60,minutes:9,returnIntent:'no',blocker:'shop'}];
 const s=summarizePlaytests(rows);assert.equal(s.firstAction,40);assert.equal(s.minutes,7);assert.equal(s.yes,1);assert.ok(s.next.some(t=>t.includes('Angebotshinweise')));assert.ok(s.next.some(t=>t.includes('fünf')));
 const bounded=normalizePlaytest({...row,firstAction:-10,minutes:9999,note:'x'.repeat(2000),blocker:'invented'});assert.equal(bounded.firstAction,0);assert.equal(bounded.minutes,240);assert.equal(bounded.note.length,500);assert.equal(bounded.blocker,'none');
 assert.equal(restorePlaytests(Array(250).fill(row)).length,200);
 assert.ok(playtestMarkdown(rows).includes('keine automatische Roblox-Telemetrie'));
});
