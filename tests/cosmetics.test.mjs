import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COSMETICS,cosmeticsGuide,cosmeticChecks,cosmeticsSetupHtml} from '../web/cosmetics.js';
import {DEFAULT,normalize,generate,toRBXLX,SCRIPT_FILES,configLua,repair,validate} from '../web/engine.js';
import {launchFiles} from '../web/launch-kit.js';
import {parseShopImport} from '../web/shop-setup.js';
import {openMapConfig} from '../web/map-vault.js';
import {appHarness} from './support/app-harness.mjs';
import {buildMinigameCollection} from '../web/minigame-collection.js';
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,f])=>[k,await readFile(new URL('../web/lua/'+f+'.lua',import.meta.url),'utf8')])));

test('cosmetics use empty own pass IDs and never alter map geometry, route or existing offers',()=>{
 assert.equal(COSMETICS.length,3);
 for(const item of COSMETICS)assert.equal(DEFAULT[item.field],'');
 for(const mode of ['obby','tycoon']){
  const base=generate({mode,seed:'KEEP',boostId:'101',vipPassId:'202'}),changed=generate({...base.config,auroraPassId:'303',cosmetics:false});
  assert.deepEqual(changed.parts,base.parts);assert.equal(changed.key,base.key);assert.equal(changed.config.boostId,'101');assert.equal(changed.config.vipPassId,'202');
  const xml=toRBXLX(changed,scripts);
  assert.match(xml,/>MapForgeCosmeticsServer</);assert.match(xml,/>MapForgeCosmeticsClient</);
  assert.ok(configLua(changed).includes('Cosmetics = { Enabled=false'));
  assert.ok(configLua(changed).includes('PassId=303'));
  assert.throws(()=>toRBXLX(changed,{...scripts,cosmeticsServer:null}),/cosmeticsServer/);
 }
 assert.equal(normalize({auroraPassId:'not-an-id'}).auroraPassId,'');
 assert.equal(normalize({auroraPassId:Infinity}).auroraPassId,'');
});

test('cosmetic pass collision fails closed without overwriting old paid benefits',()=>{
 for(const mode of ['obby','tycoon']){
  const c=normalize({mode,vipPassId:'101',auroraPassId:'101',solarPassId:'202',nebulaPassId:'202'});
  assert.ok(validate(generate(c)).some(x=>x.id==='cosmetics'&&x.status==='error'));
  const fixed=repair(c).config;assert.equal(fixed.vipPassId,'101');assert.equal(fixed.auroraPassId,'');assert.equal(fixed.solarPassId,'202');assert.equal(fixed.nebulaPassId,'');
 }
 assert.equal(cosmeticChecks(normalize({shop:false}))[0].status,'pass');
 const imported=parseShopImport('{"app":"MapForgeShop","passes":{"CosmeticAurora":303}}',normalize({vipPassId:'101'}));
 assert.equal(imported.config.auroraPassId,'303');assert.equal(imported.config.vipPassId,'101');
 assert.throws(()=>parseShopImport('{"app":"MapForgeShop","passes":{"CosmeticAurora":101}}',normalize({vipPassId:'101'})),/Doppelte/);
 const kept=openMapConfig({config:normalize({auroraPassId:'999'})},normalize({auroraPassId:'303'}));assert.equal(kept.auroraPassId,'303');
});

test('all starter exports contain cosmetics setup without claiming unconfigured purchases work',async()=>{
 const bundle=await buildMinigameCollection(scripts);
 for(const record of bundle.records){
  const root=record.folder+'/';assert.ok(bundle.files[root+'Kosmetik-Shop-Einrichtung.md']);
  const project=JSON.parse(bundle.files[Object.keys(bundle.files).find(n=>n.startsWith(root)&&n.endsWith('.mapforge.json'))]);
  assert.equal(project.config.cosmetics,true);assert.equal(project.config.shop,false);
  for(const item of COSMETICS)assert.equal(project.config[item.field],'');
  assert.ok(bundle.files[root+'Shop-Angebote.csv'].includes('CosmeticAurora'));
 }
 const files=launchFiles(generate({mode:'tycoon',auroraPassId:'303'}),scripts);
 assert.match(files['Kosmetik-Shop-Einrichtung.md'],/\| 303 \|/);
 assert.match(files['KI-Uebergabe.md'],/MapForgeCosmeticsServer/);
 for(const text of ['UserOwnsGamePassAsync','keine Spielvorteile','30.05.2026','keine globalen Avatar','Nicht eingerichtet','zwei','ProcessReceipt'])assert.ok(cosmeticsGuide({}).toLowerCase().includes(text.toLowerCase()),text);
 assert.match(cosmeticsSetupHtml(),/Keine Vorteile/);
});

test('actual app saves cosmetic IDs, respects shop switch and loads complete runtime before export',async()=>{
 const h=await appHarness({config:{mode:'obby',name:'Mein Name',autoName:false,seed:'KEEP',boostId:'101',coinsId:'102'}});
 try{
  assert.equal(h.app.output.scriptState,'ready');
  h.doc.getElementById('auroraPassId').value='303';h.doc.getElementById('solarPassId').value='';h.doc.getElementById('nebulaPassId').value='';
  h.doc.getElementById('cosmeticsEnabled').checked=true;h.doc.getElementById('shopEnabled').checked=false;
  await h.click('saveShop');assert.equal(h.app.config.auroraPassId,'303');assert.equal(h.app.config.shop,false);
  assert.equal(h.app.config.name,'Mein Name');assert.equal(h.app.config.boostId,'101');
  assert.equal(JSON.parse(h.storage.get('mapforge.config.v3')).auroraPassId,'303');
  await h.app.exportMap();const file=h.requested.at(-1);assert.ok((await h.blobs.get(file.url).text()).includes('MapForgeCosmeticsServer'));
 }finally{h.dispose();}
});
