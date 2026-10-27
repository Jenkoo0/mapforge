// MapForge Worker: public Roblox trend proxy plus embedded application assets.
/* TREND_CORE_BEGIN */
// Roblox public chart data. Fixed upstream URLs; no account credentials or arbitrary proxy targets.
function trendIdea(game){
 const text=(game.name+' '+(game.genre||'')+' '+(game.description||'')).toLowerCase();
 let theme='sky',name='Crystal Industries',mechanics=['Eigene Grundstücke','Produktions-Upgrades','Rebirth'],fit=25,reason='Allgemeine Spielreferenz; begrenzte Passung zur Tycoon-Vorlage.';
 if(/tycoon|factory|industr|produ[ck]tion|fabrik/.test(text)){fit=95;reason='Aufbau und Produktionsfortschritt passen direkt zur Tycoon-Vorlage.';}
 else if(/garden|farm|grow|pet|collect|steal|egg|simulator|simulation/.test(text)){fit=75;reason='Sammeln und wachsende Einnahmen lassen sich als Produktions-Tycoon adaptieren.';}
 else if(/obby|parkour|tower/.test(text)){fit=50;reason='Kurze Ziele sind übertragbar; das eigentliche Parkour-Spiel gehört zur Obby-Vorlage.';}
 if(/garden|farm|grow|lumber|forest|nature/.test(text)){theme='jungle';name='Bloom Industries';mechanics.push('Natur-Design');}
 else if(/restaurant|park|city|neon|shop|store/.test(text)){theme='neon';name='Neon Empire';mechanics.push('Sichtbarer Gebäudeausbau');}
 else if(/lava|fire|military|forge|mine|metal/.test(text)){theme='lava';name='Molten Industries';mechanics.push('Industrie-Design');}
 else if(/pet|egg|collect|steal/.test(text)){theme='sky';name='Crystal Collectors';mechanics.push('Sammler-Fortschritt');}
 return {mode:'tycoon',theme,name,mechanics,fit,reason,scope:'Eigenständiger Produktions-Tycoon: Grundstücke, Cash, 48 Ausbauten, 28 Forschungsstufen, Rebirth, sechs Tagesaufträge und 12 Skins. Andere Mechaniken des Referenzspiels werden nicht automatisch implementiert.'};
}
function normalizeTrend(raw){
 const id=Number(raw.universeId??raw.id),placeId=Number(raw.rootPlaceId);
 if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(placeId)||placeId<=0||typeof raw.name!=='string')return null;
 const number=(v)=>Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const playing=number(raw.playing??raw.playerCount);if(playing===null)return null;
 const up=number(raw.totalUpVotes),down=number(raw.totalDownVotes);
 const g={id,placeId,name:raw.name.slice(0,160),description:typeof raw.description==='string'?raw.description.slice(0,2500):'',playing,visits:raw.visits===undefined?null:number(raw.visits),genre:String(raw.genre_l2||raw.genreL1||raw.genre||'').slice(0,80),rating:up!==null&&down!==null&&up+down>0?Math.round(100*up/(up+down)):null,url:'https://www.roblox.com/games/'+placeId,trendingRank:raw.trendingRank||null,playingRank:raw.playingRank||null};
 return {...g,idea:trendIdea(g)};
}
function recommendTrend(games){return [...games].filter(g=>g.idea.fit>=70).sort((a,b)=>b.playing-a.playing||b.idea.fit-a.idea.fit)[0]||null;}
async function fetchRobloxTrends(fetcher=fetch,now=()=>new Date()){
 const session=globalThis.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=Math.random()*16|0;return(c==='x'?n:(n&3|8)).toString(16);});
 const request=async url=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);try{const r=await fetcher(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error('UPSTREAM_'+r.status);return await r.json();}finally{clearTimeout(timer);}};
 const sorts=['top-trending','top-playing-now'];
 const charts=await Promise.allSettled(sorts.map(sort=>request('https://apis.roblox.com/explore-api/v1/get-sort-content?sortId='+sort+'&sessionId='+encodeURIComponent(session))));
 const raw=new Map(),sources=[],warnings=[];
 charts.forEach((r,i)=>{if(r.status==='fulfilled'&&Array.isArray(r.value.games)&&r.value.games.length){sources.push({name:i?'Top Playing Now':'Top Trending',url:'https://www.roblox.com/charts/'+sorts[i]});r.value.games.slice(0,100).forEach((g,n)=>{if(g.isSponsored)return;const id=Number(g.universeId);if(!Number.isSafeInteger(id))return;const prior=raw.get(id)||{};raw.set(id,{...prior,...g,...(i?{playingRank:n+1}:{trendingRank:n+1})});});}else warnings.push((i?'Top Playing Now':'Top Trending')+' konnte nicht abgerufen werden.');});
 // These are explicitly a supplementary watchlist, never presented as chart rankings.
 const watchlist=[31970568,1214576306];
 const relevant=[...raw.values()].filter(g=>/tycoon|garden|farm|pet|factory|simulator/i.test(g.name||'')).map(g=>Number(g.universeId));
 const ids=[...new Set([...watchlist,...relevant])].slice(0,24);
 let metadataOK=false;
 const details=await Promise.allSettled(Array.from({length:Math.ceil(ids.length/100)},(_,i)=>request('https://games.roblox.com/v1/games?universeIds='+ids.slice(i*100,(i+1)*100).join(','))));
 for(const result of details){if(result.status==='fulfilled'&&Array.isArray(result.value.data)){metadataOK=true;for(const g of result.value.data){const prior=raw.get(g.id)||{};raw.set(g.id,{...prior,...g,universeId:g.id});}}else warnings.push('Ein Teil der Spieldetails ist nicht verfügbar.');}
 const games=[...raw.values()].map(normalizeTrend).filter(Boolean).sort((a,b)=>b.playing-a.playing);
 if(!games.length)throw new Error('TREND_SOURCE_UNAVAILABLE');
 const mode=sources.length===2?'charts':sources.length?'partial-charts':'watchlist';
 return {schema:1,fetchedAt:now().toISOString(),mode,games,sources:[...sources,...(metadataOK?[{name:'Roblox-Spieldaten und ergänzende Tycoon-Watchlist',url:'https://games.roblox.com/docs/index.html'}]:[])],warnings,coverage:mode==='watchlist'?'Nur die benannte Tycoon-Watchlist; Charts aktuell nicht erreichbar.':'Roblox-Charts plus ergänzende Tycoon-Watchlist; keine vollständige Erfassung aller Roblox-Spiele.'};
}

/* TREND_CORE_END */
const assets = /* ASSETS_BEGIN */{}/* ASSETS_END */;
let snapshot=null,pending=null;
const ttl=120000;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'METHOD_NOT_ALLOWED'},405);
 if(url.pathname==='/api/trends'){
  try{
   if(!snapshot||Date.now()-Date.parse(snapshot.fetchedAt)>ttl){
    if(!pending)pending=fetchRobloxTrends().then(data=>{snapshot=data;return data;}).finally(()=>pending=null);
    await pending;
   }
   return json({...snapshot,cacheSeconds:Math.max(0,Math.floor((Date.now()-Date.parse(snapshot.fetchedAt))/1000))});
  }catch{return json({error:'TREND_SOURCE_UNAVAILABLE',message:'Roblox-Daten sind gerade nicht erreichbar. Gespeicherte Daten sind kein Live-Abruf.',lastSnapshot:snapshot},503);}
 }
 let path;
 try{path=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}
 const asset=assets[path==='/'?'/index.html':path];
 if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}});
}};
