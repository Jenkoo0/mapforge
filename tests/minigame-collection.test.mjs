import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT,SCRIPT_FILES,VERSION,generate,validate} from '../web/engine.js';
import {buildMinigameCollection,MINIGAME_STARTERS} from '../web/minigame-collection.js';
import {grindMarkdown} from '../web/minigames.js';
import {mapMetrics} from '../web/quality-report.js';

const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([key,file])=>[key,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
const projectFor=(result,record)=>JSON.parse(result.files[Object.keys(result.files).find(name=>name.startsWith(record.folder+'/')&&name.endsWith('.mapforge.json'))]);

test('three independent short Obby projects include selected minigames, real XML and editable safe settings',async()=>{
 const before=JSON.stringify(DEFAULT),progress=[],painted=[];
 const result=await buildMinigameCollection(scripts,{onProgress:event=>progress.push(event),artwork:async(map,starter)=>{painted.push({map,starter});return {'Thumbnail.png':new Uint8Array([137,80,78,71]),'Icon.png':new Uint8Array([137,80,78,71])};}});
 assert.equal(result.records.length,3);assert.equal(painted.length,3);assert.equal(new Set(result.records.map(record=>record.folder)).size,3);assert.equal(new Set(result.records.map(record=>record.routeKey)).size,3);
 assert.deepEqual(result.records.map(record=>record.minigame),['signal','memory','collect']);assert.equal(progress[0].completed,0);assert.equal(progress.at(-1).completed,3);assert.ok(progress.every(event=>event.total===3));
 for(const [index,record] of result.records.entries()){
  const starter=MINIGAME_STARTERS[index],project=projectFor(result,record),config=project.config,{map}=painted[index],prefix=record.folder+'/';
  assert.equal(project.version,VERSION);assert.equal(config.mode,'obby');assert.equal(config.obbyStyle,'classic');assert.ok(config.stages>=12&&config.stages<=24);assert.equal(config.stages,starter.stages);
  for(const key of ['theme','seed','minigame'])assert.equal(config[key],starter[key]);assert.equal(config.name,starter.title);assert.equal(config.autoName,false);
  assert.equal(config.events,'rally');assert.equal(config.grind,true);assert.equal(config.shop,false);assert.equal(config.shopHints,false);assert.equal(config.analytics,false);assert.equal(config.storyId,'');
  for(const key of Object.keys(DEFAULT).filter(key=>key.endsWith('Id')&&key!=='storyId'))assert.equal(config[key],'');
  assert.deepEqual(validate(map).filter(check=>check.status==='error'),[]);assert.equal(record.fingerprint,mapMetrics(generate(config)).fingerprint);assert.equal(record.parts,map.parts.length);assert.equal(record.studioTested,false);
  const xml=result.files[Object.keys(result.files).find(name=>name.startsWith(prefix)&&name.endsWith('.rbxlx'))];assert.match(xml,/^<\?xml/);assert.ok(xml.endsWith('</roblox>'));assert.equal([...xml.matchAll(/<Item class="(?:Part|SpawnLocation)" /g)].length,map.parts.length);
  for(const name of ['MapForgeConfig','MapForgeData','MapForgeEventCore','MapForgeEventServer','MapForgeEventClient'])assert.ok(xml.includes(`<string name="Name">${name}</string>`));
  assert.equal(result.files[prefix+'Werkstatt-Grind-und-Minispiele.md'],grindMarkdown(config));assert.ok(result.files[prefix+'KI-Uebergabe.md'].includes(record.seed));assert.ok(result.files[prefix+'Thumbnail.png'] instanceof Uint8Array);assert.equal(painted[index].starter.title,record.title);
 }
 const manifest=JSON.parse(result.files['MinispieleSammlung.json']);assert.deepEqual(manifest.maps,result.records);assert.equal(manifest.studioPlaytestRunByGenerator,false);assert.equal(manifest.shopEnabled,false);
 assert.match(result.files['START-HIER.md'],/Roblox-Engine-Test.*nicht ausgeführt/);assert.match(result.files['START-HIER.md'],/normalen Obby/);assert.equal(JSON.stringify(DEFAULT),before);
});

test('cancel before work, during yield or during artwork never produces a partial collection',async()=>{
 const before=new AbortController();before.abort();let yielded=0;await assert.rejects(buildMinigameCollection(scripts,{signal:before.signal,yieldTask:()=>yielded++}),/abgebrochen/);assert.equal(yielded,0);
 const duringYield=new AbortController();let painted=0;await assert.rejects(buildMinigameCollection(scripts,{signal:duringYield.signal,yieldTask:async()=>duringYield.abort(),artwork:async()=>painted++}),/abgebrochen/);assert.equal(painted,0);
 const duringArtwork=new AbortController();await assert.rejects(buildMinigameCollection(scripts,{signal:duringArtwork.signal,artwork:async()=>{duringArtwork.abort();return {'Icon.png':new Uint8Array()};}}),/abgebrochen/);
 await assert.rejects(buildMinigameCollection(scripts,{artwork:async()=>{throw Error('Cover fehlgeschlagen');}}),/Cover fehlgeschlagen/);
});
