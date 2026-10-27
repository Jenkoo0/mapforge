import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTWORK_FORMATS,ARTWORK_LAYOUTS,artworkComposition,artworkTextLines,artworkPng,drawMapArtwork} from '../web/map-artwork.js';
import {generate} from '../web/engine.js';
import {ArtworkStudio} from '../web/artwork-ui.js';
import {visiblePreviewParts} from '../web/preview-state.js';

function canvasDouble(width=960,height=540){
 const texts=[],numbers=[],ctx=new Proxy({measureText:text=>({width:Array.from(String(text)).length*14}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillText:(text,...args)=>{texts.push(text);numbers.push(...args);}}, {get:(o,k)=>k in o?o[k]:(...args)=>numbers.push(...args.filter(v=>typeof v==='number')),set:(o,k,v)=>(o[k]=v,true)});
 return {width,height,texts,numbers,style:{},getContext:()=>ctx,setAttribute(){},ownerDocument:{createElement:()=>canvasDouble()}};
}

test('minigame collection covers show the actual selected arena with the proper mode label',()=>{
 for(const minigame of ['signal','memory','collect']){
  const map=generate({mode:'tycoon',events:'rally',minigame}),canvas=canvasDouble(),views=[];
  assert.equal(drawMapArtwork(canvas,map,{scope:'arena',renderScene:(_,actual,view)=>{assert.equal(actual,map);views.push(view);return true;}}),true);
  assert.equal(views[0].events,true);assert.equal(views[0].focusPlot,0);assert.ok(canvas.texts.includes('MINISPIEL'));
  const visible=visiblePreviewParts(map,views[0]);assert.ok(visible.every(p=>p.kind==='event'));assert.equal(visible.filter(p=>/^RallySignal/.test(p.name)).length,4);
 }
});

test('thumbnail compositions use exact geometry and real modes without modifying the map',()=>{
 for(const mode of ['tycoon','obby'])for(const theme of ['sky','neon','lava','jungle'])for(const format of ['landscape','square']){
  const map=generate({mode,theme,plots:2,stages:18,detail:1}),before=JSON.stringify(map),canvas=canvasDouble(),seen=[];
  const renderScene=(scene,actual,view)=>{seen.push({map:actual,view});return true;};
  assert.equal(drawMapArtwork(canvas,map,{title:'Creators Welt',subtitle:'Eine eigene Geschichte',format,renderScene}),true);
  assert.equal(seen[0].map,map);assert.equal(seen[0].view.labels,false);assert.equal(seen[0].view.level,48);assert.equal(seen[0].view.focusPlot,mode==='tycoon'?1:0);
  assert.equal(JSON.stringify(map),before);assert.ok(canvas.texts.includes('Creators Welt'));assert.ok(canvas.numbers.every(Number.isFinite));
 }
 const map=generate({mode:'tycoon',plots:2}),canvas=canvasDouble();let view;
 drawMapArtwork(canvas,map,{title:'',scope:'all',plan:true,angle:.8,renderScene:(_c,_m,v)=>(view=v,true)});
 assert.equal(view.focusPlot,0);assert.equal(view.plan,true);assert.equal(view.angle,.8);assert.equal(canvas.texts.length,0);
});

test('actual map renderer composes both export formats and failures remain explicit',()=>{
 const map=generate({mode:'obby',stages:18,detail:1});
 for(const format of ['landscape','square']){const spec=ARTWORK_FORMATS[format],canvas=canvasDouble(spec.width,spec.height);assert.equal(drawMapArtwork(canvas,map,{title:'Wolkenpost',format}),true);assert.ok(canvas.numbers.every(Number.isFinite));}
 assert.equal(drawMapArtwork({getContext:()=>null},map),false);
 assert.equal(drawMapArtwork(canvasDouble(),map,{renderScene:()=>false}),false);
 assert.equal(drawMapArtwork(canvasDouble(),map,{createCanvas:()=>null}),false);
});

test('cover text wraps long names within the measured space and ellipsizes excess lines',()=>{
 const ctx={measureText:s=>({width:Array.from(s).length*10})};
 for(const text of ['Eine lange Geschichte in einer kleinen Fabrik','UnunterbrochenExtremLangerTitelOhneLeerzeichen','🐌 Wolkenpost  aus   dem Garten']){
  const lines=artworkTextLines(ctx,text,100,2);assert.ok(lines.length<=2);assert.ok(lines.every(line=>ctx.measureText(line).width<=100));
 }
 assert.deepEqual(artworkTextLines(ctx,'',100,2),[]);
 assert.deepEqual(artworkTextLines(ctx,'Eine Kristallfabrik',100,4),['Eine','Kristallfa','brik']);
});

test('PNG encoding validates real blob output and surfaces browser and upload-size failures',async()=>{
 const blob=new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'});
 assert.equal(await artworkPng({toBlob:cb=>cb(blob)}),blob);
 for(const value of [null,new Blob([],{type:'image/png'}),new Blob(['x'],{type:'image/jpeg'}),new Blob([new Uint8Array(3*1024*1024)],{type:'image/png'})])await assert.rejects(artworkPng({toBlob:cb=>cb(value)}));
 await assert.rejects(artworkPng({}));await assert.rejects(artworkPng({toBlob(){throw Error('canvas');}}));
});

function studioDouble(options={}){
 const nodes=new Map(),downloads=[],buttons=['landscape','square'].map(format=>({dataset:{artworkFormat:format},handlers:{},setAttribute(k,v){this[k]=v;},addEventListener(k,v){this.handlers[k]=v;},removeEventListener(){}}));
 const root={ownerDocument:{createElement:()=>canvasDouble()},showModal(){this.open=true;},close(){this.open=false;},setAttribute(){},addEventListener(){},removeEventListener(){},querySelector(id){if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,style:{},setAttribute(){},addEventListener(){},removeEventListener(){}});return nodes.get(id);},querySelectorAll(selector){return selector==='[data-artwork-format]'?buttons:[...nodes.values(),...buttons];}};
 const studio=new ArtworkStudio(root,{download:(...args)=>downloads.push(args),render:()=>true,encode:async()=>new Blob(['PNG'],{type:'image/png'}),...options});return {studio,root,nodes,downloads,buttons};
}

test('cover studio exports its inspected snapshot and chosen dimensions without mutating the map',async()=>{
 const painted=[],h=studioDouble({render:(canvas,map,options)=>(painted.push({width:canvas.width,height:canvas.height,map,options}),true)}),map=generate({mode:'tycoon',plots:2,name:'Mein Projekt',autoName:false}),before=JSON.stringify(map);
 assert.equal(h.studio.open(map,{title:'Richtung',hook:'Ein Erzählrahmen'}),true);assert.equal(h.nodes.get('#artworkTitle').value,'Mein Projekt');
 h.studio.format='square';h.nodes.get('#artworkTitle').value='Mein neues Cover';h.studio.paint();assert.equal(h.nodes.get('#artworkSubtitleRow').hidden,true);assert.equal(await h.studio.export(),true);
 assert.equal(painted.at(-1).width,512);assert.equal(painted.at(-1).height,512);assert.equal(painted.at(-1).map,map);assert.equal(h.downloads[0][0],'Mein-neues-Cover-Icon.png');assert.equal(JSON.stringify(map),before);
 assert.equal(h.studio.close(),true);assert.equal(h.studio.map,null);h.studio.dispose();assert.equal(h.studio.open(map),false);
});

test('pending image output can be cancelled and disposed results cannot download',async()=>{
 let finish;const h=studioDouble({encode:()=>new Promise(resolve=>finish=resolve)}),map=generate({mode:'obby',stages:18});h.studio.open(map);
 const running=h.studio.export();assert.equal(h.studio.pending,true);assert.equal(await h.studio.export(),false);assert.equal(h.studio.open(map),false);assert.equal(h.studio.close(),true);assert.equal(h.studio.pending,false);
 h.studio.dispose();finish(new Blob(['PNG'],{type:'image/png'}));assert.equal(await running,false);assert.equal(h.downloads.length,0);
 const failed=studioDouble({encode:async()=>{throw Error('Browserfehler');}});failed.studio.open(map);assert.equal(await failed.studio.export(),false);assert.match(failed.nodes.get('#artworkStatus').textContent,/Browserfehler/);assert.equal(failed.studio.pending,false);
});

test('three cover layouts change composition while preserving the real map and clamping framing',()=>{
 assert.deepEqual(artworkComposition({layout:'invalid',zoom:Infinity}),{layout:'editorial',zoom:1});
 assert.equal(artworkComposition({zoom:99}).zoom,1.4);assert.equal(artworkComposition({zoom:.1}).zoom,.7);
 const map=generate({mode:'obby',stages:18}),before=JSON.stringify(map),positions=[];
 for(const layout of Object.keys(ARTWORK_LAYOUTS)){
  const canvas=canvasDouble();let view;
  assert.equal(drawMapArtwork(canvas,map,{title:'Mein Motiv',layout,zoom:1.2,renderScene:(_c,_m,v)=>(view=v,true)}),true);
  assert.equal(view.zoom,.92*1.2);assert.equal(canvas.texts.includes('Mein Motiv'),layout!=='image');positions.push(canvas.numbers);
 }
 assert.notDeepEqual(positions[0],positions[1]);assert.notDeepEqual(positions[1],positions[2]);assert.equal(JSON.stringify(map),before);
});

test('cover drafts retain framing and text per map and stay bounded to eight maps',()=>{
 const h=studioDouble(),map=generate({mode:'obby',stages:18});h.studio.open(map);
 assert.equal(h.nodes.get('#artworkLayout').value,'cinematic');
 h.nodes.get('#artworkTitle').value='Abendpost';h.nodes.get('#artworkLayout').value='image';h.nodes.get('#artworkZoom').value='1.25';h.studio.format='square';h.studio.paint();
 assert.equal(h.nodes.get('#artworkTitleRow').hidden,true);assert.equal(h.nodes.get('#artworkSubtitleRow').hidden,true);assert.equal(h.nodes.get('#artworkZoomOutput').textContent,'125 %');h.studio.close();h.studio.open(map);
 assert.equal(h.nodes.get('#artworkTitle').value,'Abendpost');assert.equal(h.nodes.get('#artworkZoom').value,1.25);assert.equal(h.studio.format,'square');h.studio.close();
 for(let i=0;i<10;i++){h.studio.open(generate({mode:'obby',seed:'OTHER-'+i,stages:12}));h.studio.close();}
 assert.equal(h.studio.drafts.size,8);
});

test('late cancelled failures and completions cannot change a reopened cover export',async()=>{
 const jobs=[],h=studioDouble({encode:()=>new Promise((resolve,reject)=>jobs.push({resolve,reject}))}),map=generate({mode:'obby',stages:12});h.studio.open(map);
 const old=h.studio.export();h.studio.close();h.studio.open(map);const current=h.studio.export(),status=h.nodes.get('#artworkStatus').textContent;
 jobs[0].reject(Error('Verspäteter Fehler'));assert.equal(await old,false);assert.equal(h.nodes.get('#artworkStatus').textContent,status);assert.equal(h.studio.pending,true);
 jobs[1].resolve(new Blob(['PNG'],{type:'image/png'}));assert.equal(await current,true);assert.equal(h.downloads.length,1);assert.equal(h.studio.pending,false);
 const cancelled=h.studio.export();h.studio.close();jobs[2].resolve(new Blob(['PNG'],{type:'image/png'}));assert.equal(await cancelled,false);assert.equal(h.downloads.length,1);
});

test('a missing PNG callback times out and late callbacks are ignored',async()=>{
 let finish;const result=artworkPng({toBlob:cb=>finish=cb},{timeoutMs:5});await assert.rejects(result,/dauert zu lange/);finish(new Blob(['PNG'],{type:'image/png'}));
});
