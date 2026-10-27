import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCreativeCollection} from '../web/creative-collection.js';
import {CREATIVE_DIRECTIONS} from '../web/creative-directions.js';
import {SCRIPT_FILES,DEFAULT,VERSION,generate} from '../web/engine.js';
import {mapMetrics} from '../web/quality-report.js';

const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([key,file])=>[key,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));

test('the collection contains twelve independent complete places with their exact seed, story and geometry',async()=>{
 const before=JSON.stringify(DEFAULT),progress=[],painted=[];
 const result=await buildCreativeCollection(scripts,{onProgress:p=>progress.push(p),artwork:async(map,direction)=>{painted.push({map,direction});return {'Thumbnail.png':new Uint8Array([137,80,78,71]),'Icon.png':new Uint8Array([137,80,78,71])};}});
 assert.equal(result.records.length,12);assert.equal(painted.length,12);assert.equal(new Set(result.records.map(r=>r.folder)).size,12);
 assert.equal(progress[0].completed,0);assert.equal(progress.at(-1).completed,12);assert.ok(progress.every(p=>p.total===12));
 for(const [index,record] of result.records.entries()){
  const folder=record.folder+'/',names=Object.keys(result.files).filter(name=>name.startsWith(folder)),project=JSON.parse(result.files[names.find(name=>name.endsWith('.mapforge.json'))]),map=painted[index].map;
  assert.equal(project.version,VERSION);assert.equal(project.config.name,CREATIVE_DIRECTIONS[index].title);assert.equal(project.config.autoName,false);assert.equal(project.config.plots,2);assert.equal(project.config.shop,false);assert.equal(project.config.analytics,false);
  for(const field of Object.keys(DEFAULT).filter(field=>field.endsWith('Id')&&field!=='storyId'))assert.equal(project.config[field],'');
  assert.equal(project.config.storyId,CREATIVE_DIRECTIONS[index].id);
  assert.equal(record.fingerprint,mapMetrics(generate(project.config)).fingerprint);assert.equal(record.parts,map.parts.length);
  assert.equal(record.studioTested,false);assert.ok(result.files[folder+'Weltgeschichte.md'].includes(CREATIVE_DIRECTIONS[index].story.chapters[0].title));
  const xml=result.files[names.find(name=>name.endsWith('.rbxlx'))];assert.equal([...xml.matchAll(/<Item class="(?:Part|SpawnLocation)" /g)].length,map.parts.length);
  assert.ok(result.files[folder+'KI-Uebergabe.md'].includes(project.config.seed));assert.ok(result.files[folder+'Thumbnail.png'] instanceof Uint8Array);
 }
 assert.equal(JSON.stringify(DEFAULT),before);assert.equal(JSON.parse(result.files['Sammlung.json']).maps.length,12);assert.match(result.files['START-HIER.md'],/Shops sind ausgeschaltet/);
});

test('collection abort and artwork errors stop before handing out partial projects',async()=>{
 const controller=new AbortController();let yields=0,covers=0;
 await assert.rejects(buildCreativeCollection(scripts,{signal:controller.signal,yieldTask:async()=>{yields++;controller.abort();},artwork:()=>{covers++;}}),/abgebrochen/);
 assert.equal(yields,1);assert.equal(covers,0);
 await assert.rejects(buildCreativeCollection(scripts,{artwork:async()=>{throw Error('Cover fehlgeschlagen');}}),/Cover fehlgeschlagen/);
});
