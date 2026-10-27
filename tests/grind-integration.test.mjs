import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalize,generate,fromBrief,toRBXLX,configLua,SCRIPT_FILES} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {appHarness} from './support/app-harness.mjs';
import {gameListing} from '../web/listing.js';
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,f])=>[k,await readFile(new URL('../web/lua/'+f+'.lua',import.meta.url),'utf8')])));

test('complete exports include the workshop runtime and exact selectable minigame independently of main map geometry',()=>{
 assert.equal(Object.keys(SCRIPT_FILES).length,19);
 for(const [key,source] of Object.entries(scripts))assert.ok(source.includes('MapForge'),key+' must pass actual application source loading');
 for(const mode of ['obby','tycoon'])for(const minigame of ['signal','memory','collect'])for(const grind of [false,true]){
  const map=generate({mode,minigame,grind,events:'rally',name:'Mein Spiel',autoName:false,boostId:'12345'}),xml=toRBXLX(map,scripts),files=launchFiles(map,scripts);
  assert.equal((xml.match(/<ProtectedString name="Source">/g)||[]).length,mode==='tycoon'?17:16);
  assert.match(configLua(map),new RegExp('Minigame = "'+minigame+'"'));assert.ok(configLua(map).includes('Grind = { Enabled='+grind+' }'));
  for(const name of ['MapForgeWorkshopCore','MapForgeWorkshop','MapForgeWorkshopServer','MapForgeWorkshopClient'])assert.ok(xml.includes('>'+name+'</string>'));
  for(const field of ['workshopCore','workshopService','workshopServer','workshopClient'])assert.throws(()=>toRBXLX(map,{...scripts,[field]:null}),/Skript fehlt/);
  assert.ok(files['Werkstatt-und-Minispiele.md'].includes('Level 0–5'));assert.ok(files['KI-Uebergabe.md'].includes('Werkstatt-Grind'));
  assert.equal(map.config.boostId,'12345');assert.equal(map.config.name,'Mein Spiel');
 }
 const variants=['signal','memory','collect'].map(minigame=>generate({minigame,events:'rally',seed:'SAME'}));
 assert.deepEqual(variants[0].stages,variants[1].stages);assert.deepEqual(variants[1].stages,variants[2].stages);assert.equal(new Set(variants.map(m=>m.key)).size,1);
 assert.equal(new Set(variants.map(m=>JSON.stringify(m.parts.filter(p=>/^RallySignal/.test(p.name)).map(p=>p.pos)))).size,3);
 assert.ok(variants[1].parts.some(p=>p.name.startsWith('EchoLeaf')));assert.ok(variants[2].parts.some(p=>p.name.startsWith('SparkCoil')));
});

test('briefs normalize explicit minigames and grind choices while keeping personal settings',()=>{
 for(const [brief,minigame] of [['Merkfolge im Garten','memory'],['Funkenjagd','collect'],['Signal-Rallye','signal']]){
  const c=fromBrief(brief,{name:'Eigener Name',autoName:false,coinsId:'777',events:'off'}).config;
  assert.equal(c.minigame,minigame);assert.equal(c.events,'rally');assert.equal(c.name,'Eigener Name');assert.equal(c.coinsId,'777');
 }
 assert.equal(fromBrief('ohne Grind').config.grind,false);assert.equal(normalize({minigame:'invalid'}).minigame,'signal');
 assert.ok(gameListing(normalize({minigame:'memory',events:'rally'})).description.includes('sechs Signale'));
 assert.ok(gameListing(normalize({minigame:'collect',events:'rally'})).description.includes('freier Reihenfolge'));
});

test('actual app loads every source and persists workshop/minigame through a complete export',async()=>{
 const h=await appHarness({config:{mode:'tycoon',name:'Meine Fabrik',autoName:false,cashSmallId:'987'}});
 try{
  assert.equal(h.app.output.scriptState,'ready');h.app.update({...h.app.config,minigame:'memory',grind:false});
  assert.equal(h.app.config.name,'Meine Fabrik');assert.equal(h.app.config.cashSmallId,'987');
  assert.equal(JSON.parse(h.storage.get('mapforge.config.v3')).minigame,'memory');
  await h.app.exportBundle();assert.equal(h.requested.length,1);assert.ok((await h.blobs.get(h.requested[0].url).text()).includes('Workshop'));
 }finally{h.dispose();}
});
