import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTrend,fetchRobloxTrends,recommendTrend} from '../web/trend-core.js';
const game={universeId:10,rootPlaceId:20,name:'Garden Tycoon',playerCount:120,totalUpVotes:9,totalDownVotes:1};
const response=data=>({ok:true,status:200,json:async()=>data});
test('normalization rejects invalid IDs and derives clear implementable scope',()=>{
 assert.equal(normalizeTrend({...game,universeId:'javascript:alert(1)'}),null);
 assert.equal(normalizeTrend({...game,rootPlaceId:-1}),null);
 const r=normalizeTrend(game);assert.equal(r.playing,120);assert.equal(r.rating,90);assert.equal(r.idea.theme,'jungle');assert.equal(r.url,'https://www.roblox.com/games/20');
 assert.ok(r.idea.scope.includes('Produktions-Tycoon'));assert.equal(recommendTrend([r]).id,10);
});
test('charts are deduplicated, ranks survive metadata and timestamps are explicit',async()=>{
 const calls=[];const f=async url=>{calls.push(url);return url.includes('get-sort-content')?response({games:[game]}):response({data:[{id:10,rootPlaceId:20,name:'Garden Tycoon',playing:140,visits:1000}]});};
 const r=await fetchRobloxTrends(f,()=>new Date('2026-10-19T18:00:00Z'));
 assert.equal(r.games.length,1);assert.equal(r.games[0].playing,140);assert.equal(r.games[0].trendingRank,1);assert.equal(r.games[0].playingRank,1);assert.equal(r.mode,'charts');assert.equal(r.fetchedAt,'2026-10-19T18:00:00.000Z');
 assert.ok(calls.every(u=>/^https:\/\/(apis|games)\.roblox\.com\//.test(u)));
});
test('watchlist fallback never claims to be the live Roblox chart',async()=>{
 const f=async url=>{if(url.includes('get-sort-content'))throw new Error('outage');return response({data:[{id:31970568,rootPlaceId:69184822,name:'Theme Park Tycoon 2',playing:1234}]});};
 const r=await fetchRobloxTrends(f);assert.equal(r.mode,'watchlist');assert.equal(r.games[0].playingRank,null);assert.ok(r.coverage.includes('Watchlist'));assert.equal(r.warnings.length,2);
});
test('upstream total failure returns failure instead of fabricated player counts',async()=>{
 await assert.rejects(fetchRobloxTrends(async()=>{throw new Error('offline');}),/TREND_SOURCE_UNAVAILABLE/);
});
