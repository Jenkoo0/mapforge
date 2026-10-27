import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize,generate,toRBXLX,configLua,safeFilename,SCRIPT_FILES} from '../web/engine.js';
import {nameForGeneration,proposeMapName,isTemplateName} from '../web/map-names.js';
import {gameListing} from '../web/listing.js';
import {launchFiles} from '../web/launch-kit.js';
import {buildBotRun} from '../web/bot-core.js';
import {OutputCenter,DownloadStore} from '../web/output-center.js';
const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([key,file])=>[key,readFileSync(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')]));
test('old custom names opt out while template projects get names for all eight designs',()=>{
 for(const name of ['Creators Welt','Mein bestehendes Spiel','<Test & Co>']){
  const c=normalize({name});assert.equal(c.autoName,false);assert.equal(nameForGeneration(c,'new').name,name);
 }
 for(const mode of ['obby','tycoon'])for(const theme of ['sky','neon','lava','jungle']){
  const c=normalize({mode,theme,seed:'NAME-TEST',cashSmallId:'12345'}),next=nameForGeneration(c,'first');
  assert.equal(c.autoName,true);assert.equal(isTemplateName(next.name),false);assert.ok(next.name.length<50);assert.equal(next.seed,c.seed);assert.equal(next.cashSmallId,'12345');
  assert.deepEqual(next,nameForGeneration(c,'first'));assert.notEqual(nameForGeneration(next,'first').name,next.name);
  const names=new Set(Array.from({length:150},(_,i)=>proposeMapName({...c,seed:'SEED-'+i},i)));assert.ok(names.size>60);
 }
 const c=normalize({name:'Absichtlich behalten',autoName:false});assert.equal(normalize(JSON.parse(JSON.stringify(c))).autoName,false);
 assert.equal(nameForGeneration({...c,autoName:true},'explicit').autoName,true);assert.notEqual(nameForGeneration({...c,autoName:true},'explicit').name,c.name);
});
test('generated names stay identical across map, public title, XML, project and handoff exports',()=>{
 for(const mode of ['obby','tycoon'])for(const theme of ['sky','neon','lava','jungle']){
  const before=generate({mode,theme,seed:'CONSISTENT',cashSmallId:'12345'}),map=generate(nameForGeneration(before.config,'export'));
  assert.equal(map.key,before.key);assert.deepEqual(map.parts,before.parts);
  const files=launchFiles(map,scripts),project=Object.entries(files).find(([name])=>name.endsWith('.mapforge.json'));
  assert.ok(project);assert.equal(JSON.parse(project[1]).config.name,map.config.name);assert.ok(files['KI-Uebergabe.md'].includes(map.config.name));assert.equal(files['Roblox-Titel.txt'],gameListing(map.config).title);
  assert.ok(configLua(map).includes('Name = '+JSON.stringify(map.config.name)));assert.ok(toRBXLX(map,scripts).includes(map.config.name));assert.ok(safeFilename(map.config.name).length>0);
 }
});
test('bot names follow the final brief and preserve a custom name even with chart inspiration',async()=>{
 const now=()=>1700000000000,game={id:1,name:'Reference Only',url:'https://www.roblox.com/games/1',playing:50,idea:{fit:95,mode:'tycoon',theme:'lava',name:'Never Copy This'}};
 const fetchTrends=async()=>({games:[game],fetchedAt:new Date(now()).toISOString()});
 const base=normalize({mode:'tycoon',cashSmallId:'1234',seed:'KEEP'}),run=await buildBotRun({config:base,brief:'Dschungel-Tycoon',useTrends:true,fetchTrends,now});
 assert.equal(run.config.theme,'jungle');assert.equal(run.config.name,nameForGeneration({...run.config,name:base.name},String(now())).name);assert.ok(run.events.some(e=>e.step==='Map-Name'&&e.detail.includes(run.config.name)));
 const custom=await buildBotRun({config:normalize({name:'Creators eigener Betrieb',cashSmallId:'1234',seed:'KEEP'}),useTrends:true,fetchTrends,now});
 assert.equal(custom.config.name,'Creators eigener Betrieb');assert.equal(custom.config.cashSmallId,'1234');assert.equal(custom.config.seed,'KEEP');assert.equal(custom.config.autoName,false);
});
const rootDouble=()=>({hidden:true,innerHTML:'',attrs:{},handlers:{},addEventListener(event,fn){this.handlers[event]=fn;},setAttribute(k,v){this.attrs[k]=v;},scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}});
test('result remains visible, reports generation separately from download, and detects later edits',()=>{
 const root=rootDouble(),ui=new OutputCenter(root,{now:()=>1700000000000});const map=generate({name:'<Creators & Welt>',mode:'obby'});
 ui.setMap(map);assert.equal(root.hidden,true);ui.begin('Layout wird gebaut');assert.equal(root.hidden,false);assert.match(root.innerHTML,/Map wird gebaut/);assert.equal(root.attrs['aria-busy'],'true');
 ui.setScripts('ready');ui.complete();assert.match(root.innerHTML,/Deine Map ist fertig/);assert.ok(root.innerHTML.includes('&lt;Creators &amp; Welt&gt;'));assert.doesNotMatch(root.innerHTML,/Dein Download ist hier/);assert.equal(root.attrs['aria-busy'],'false');
 assert.ok(root.innerHTML.includes('data-output-action="map" >'));assert.ok(root.scrolled&&root.focused);
 ui.setMap(generate({...map.config,stages:24}));assert.match(root.innerHTML,/Einstellungen seit der letzten Generierung geändert/);assert.match(root.innerHTML,/aktuelle Vorschau/);
 ui.beginExport('bundle');assert.match(root.innerHTML,/Startpaket wird erstellt/);assert.equal(root.attrs['aria-busy'],'true');ui.endExport();
 ui.fail('Keine frischen Trends <offline>');assert.match(root.innerHTML,/Generierung nicht abgeschlossen/);assert.match(root.innerHTML,/&lt;offline&gt;/);assert.equal(root.hidden,false);
});
test('download bytes and filenames remain retryable; only evicted files lose their URLs',async()=>{
 const blobs=new Map(),revoked=[],requested=[];let serial=0;
 const downloads=new DownloadStore({createURL:blob=>{const url='blob:test/'+(++serial);blobs.set(url,blob);return url;},revokeURL:url=>{revoked.push(url);blobs.delete(url);},requestFile:file=>requested.push({...file}),now:()=>1700000000000});
 const root=rootDouble(),ui=new OutputCenter(root,{downloads}),map=generate({mode:'obby',name:'Wolkentor Obby'});ui.setMap(map);ui.setScripts('ready');ui.complete();
 const xml=toRBXLX(map,scripts),file=ui.download('Wolkentor-Obby.rbxlx',xml,'application/xml');assert.equal(await blobs.get(file.url).text(),xml);assert.equal(file.size,new TextEncoder().encode(xml).length);assert.equal(requested[0].name,file.name);
 assert.match(root.innerHTML,/Dein Download ist hier/);assert.match(root.innerHTML,/Download angefordert/);assert.ok(root.innerHTML.includes('download="'+file.name+'"'));assert.ok(root.innerHTML.includes('href="'+file.url+'"'));assert.match(root.innerHTML,/Erneut herunterladen/);assert.doesNotMatch(root.innerHTML,/erfolgreich gespeichert|Download abgeschlossen/);assert.deepEqual(revoked,[]);
 for(let i=0;i<4;i++)ui.download('Weitere-'+i+'.txt','Andere Datei');assert.equal(downloads.files.length,4);assert.deepEqual(revoked,[file.url]);for(const f of downloads.files)assert.ok(root.innerHTML.includes(f.url));
 downloads.dispose();assert.equal(revoked.length,5);assert.equal(blobs.size,0);
});
test('blocked request keeps a direct download and load or validation errors expose recovery',()=>{
 const downloads=new DownloadStore({createURL:()=> 'blob:ready',revokeURL:()=>{},requestFile:()=>{throw Error('blocked');}}),root=rootDouble(),ui=new OutputCenter(root,{downloads});ui.setMap(generate({mode:'obby'}));
 ui.setScripts('failed');assert.equal(root.hidden,false);assert.match(root.innerHTML,/Export erneut vorbereiten/);assert.ok(root.innerHTML.includes('data-output-action="map" disabled'));
 ui.setScripts('ready');ui.setMap(generate({mode:'obby',gap:12}),[{status:'error'}]);assert.match(root.innerHTML,/Zum Qualitätscheck/);assert.ok(root.innerHTML.includes('data-output-action="map" disabled'));
 const file=ui.download('Fertig.txt','complete');assert.equal(file.requested,false);assert.match(root.innerHTML,/Datei bereit/);assert.match(root.innerHTML,/Nutze den Dateilink/);assert.ok(root.innerHTML.includes('href="blob:ready"'));
});
