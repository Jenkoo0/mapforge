import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildOnlyUpCollection,ONLY_UP_STARTERS} from '../web/only-up-collection.js';
import {DEFAULT,SCRIPT_FILES,VERSION,generate,validate} from '../web/engine.js';
import {measureOnlyUpRoute} from '../web/only-up.js';
import {mapMetrics} from '../web/quality-report.js';
import {onlyUpGuide} from '../web/only-up-guide.js';

const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([key,file])=>[key,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
const projectFor=(result,record)=>{const prefix=record.folder+'/',path=Object.keys(result.files).find(name=>name.startsWith(prefix)&&name.endsWith('.mapforge.json'));return JSON.parse(result.files[path]);};

test('four independent Only-Up projects contain complete real XML, safe config and measured geometry',async()=>{
 const before=JSON.stringify(DEFAULT),progress=[],painted=[];
 const result=await buildOnlyUpCollection(scripts,{onProgress:event=>progress.push(event),artwork:async(map,starter)=>{painted.push({map,starter});return {'Thumbnail.png':new Uint8Array([137,80,78,71]),'Icon.png':new Uint8Array([137,80,78,71])};}});
 assert.equal(result.records.length,4);assert.equal(painted.length,4);
 assert.equal(new Set(result.records.map(record=>record.folder)).size,4);assert.equal(new Set(result.records.map(record=>record.routeKey)).size,4);
 assert.equal(progress[0].completed,0);assert.equal(progress.at(-1).completed,4);assert.ok(progress.every(event=>event.total===4));
 for(const [index,record] of result.records.entries()){
  const starter=ONLY_UP_STARTERS[index],project=projectFor(result,record),config=project.config,{map}=painted[index],prefix=record.folder+'/';
  assert.equal(project.version,VERSION);assert.equal(config.mode,'obby');assert.equal(config.obbyStyle,'onlyup');assert.equal(config.stages,144);
  assert.equal(config.name,starter.title);assert.equal(config.theme,starter.theme);assert.equal(config.seed,starter.seed);assert.equal(config.autoName,false);
  assert.equal(config.movement,'precise');assert.equal(config.events,'rally');assert.equal(config.storyId,'');assert.equal(config.shop,false);assert.equal(config.checkpointEvery,5);assert.equal(config.detail,3);
  for(const field of Object.keys(DEFAULT).filter(field=>field.endsWith('Id')&&field!=='storyId'))assert.equal(config[field],'');
  assert.deepEqual(validate(map).filter(check=>check.status==='error'),[]);assert.deepEqual(record.geometry,measureOnlyUpRoute(map));
  assert.equal(record.chapters.length,4);assert.equal(record.skills.length,8);assert.equal(new Set(record.skills.map(section=>section.skill)).size,8);
  assert.ok(record.geometry.length>2000);assert.ok(record.geometry.height>250);assert.equal(record.geometry.blockedLandings,0);assert.equal(record.geometry.blockedJumps,0);
  assert.equal(record.fingerprint,mapMetrics(generate(config)).fingerprint);assert.equal(record.parts,map.parts.length);assert.equal(record.routeKey,map.key);assert.equal(record.studioTested,false);
  const xml=result.files[Object.keys(result.files).find(name=>name.startsWith(prefix)&&name.endsWith('.rbxlx'))];
  assert.match(xml,/^<\?xml/);assert.ok(xml.endsWith('</roblox>'));
  assert.equal([...xml.matchAll(/<Item class="(?:Part|SpawnLocation)" /g)].length,map.parts.length);
  for(const name of ['MapForgeConfig','MapForgeData','MapForgeEventCore','MapForgeMovementServer','MapForgeMovementClient','MapForgeEventServer','MapForgeEventClient'])assert.ok(xml.includes(`<string name="Name">${name}</string>`));
  assert.ok(xml.includes('ObbyStyle = &quot;onlyup&quot;'));assert.ok(xml.includes('Profile=&quot;precise&quot;'));
  assert.equal(result.files[prefix+'OnlyUp-Aufstieg.md'],onlyUpGuide(map));assert.ok(result.files[prefix+'OnlyUp-Aufstieg.md'].includes(record.chapters[0].title));assert.ok(result.files[prefix+'KI-Uebergabe.md'].includes(record.seed));
  assert.ok(result.files[prefix+'Thumbnail.png'] instanceof Uint8Array);assert.equal(painted[index].starter.title,record.title);assert.equal(painted[index].starter.skills.length,8);
 }
 const manifest=JSON.parse(result.files['OnlyUpSammlung.json']);assert.equal(manifest.maps.length,4);assert.equal(manifest.studioPlaytestRunByGenerator,false);assert.deepEqual(manifest.maps,result.records);
 assert.match(result.files['START-HIER.md'],/Studio-Spieltest steht noch aus/);assert.equal(JSON.stringify(DEFAULT),before);
 assert.equal(onlyUpGuide({config:{mode:'tycoon',obbyStyle:'onlyup'}}),'');assert.equal(onlyUpGuide({config:{mode:'obby',obbyStyle:'classic'}}),'');
});

test('requested collection length is normalized once for every independent project',async()=>{
 for(const [requested,expected] of [[12,96],[300,240],[NaN,144],['173',173]]){
  const result=await buildOnlyUpCollection(scripts,{stages:requested});
  assert.ok(result.records.every(record=>record.stages===expected));
  for(const record of result.records)assert.equal(projectFor(result,record).config.stages,expected);
 }
});

test('cancellation and artwork failure never return a partial collection',async()=>{
 const preaborted=new AbortController();preaborted.abort();let yielded=0;
 await assert.rejects(buildOnlyUpCollection(scripts,{signal:preaborted.signal,yieldTask:()=>{yielded++;}}),/abgebrochen/);assert.equal(yielded,0);
 const controller=new AbortController();let artworkCalls=0;
 await assert.rejects(buildOnlyUpCollection(scripts,{signal:controller.signal,yieldTask:async()=>{controller.abort();},artwork:()=>{artworkCalls++;}}),/abgebrochen/);assert.equal(artworkCalls,0);
 const duringArtwork=new AbortController();
 await assert.rejects(buildOnlyUpCollection(scripts,{signal:duringArtwork.signal,artwork:async()=>{duringArtwork.abort();return {'Thumbnail.png':new Uint8Array()};}}),/abgebrochen/);
 await assert.rejects(buildOnlyUpCollection(scripts,{artwork:async()=>{throw Error('Cover fehlgeschlagen');}}),/Cover fehlgeschlagen/);
});
