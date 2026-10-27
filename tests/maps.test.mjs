import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generate,normalize,VERSION} from '../web/engine.js';
import {MapVault,MAPS_KEY,MAPS_LIMIT,openMapConfig,SHOP_ID_FIELDS,savedProject} from '../web/map-vault.js';
import {MyMaps} from '../web/maps-ui.js';
const memory=()=>{const values=new Map();return {values,get:(key,fallback)=>values.has(key)?structuredClone(values.get(key)):fallback,set:(key,value)=>{values.set(key,structuredClone(value));return true;}};};
const map=name=>generate({name,mode:'obby',seed:'SEED-'+name,stages:12});
test('saved maps survive reload with actual configuration, generation times and a bounded history',()=>{
 const storage=memory();let time=1700000000000;const vault=new MapVault(storage,{now:()=>time++});
 for(let i=0;i<10;i++){const m=map('Map '+i),r=vault.remember(m,{source:'generated'});assert.equal(r.record.parts,m.parts.length);assert.equal(r.record.generatorVersion,VERSION);assert.ok(r.record.generatedAt);}
 assert.equal(vault.records.length,MAPS_LIMIT);assert.equal(vault.records[0].config.name,'Map 9');assert.equal(vault.records.at(-1).config.name,'Map 2');
 const first=vault.get(vault.records[0].id),generatedAt=first.generatedAt;vault.remember(generate(first.config));assert.equal(vault.records.length,MAPS_LIMIT);assert.equal(vault.records[0].generatedAt,generatedAt);assert.ok(vault.records[0].updatedAt>first.updatedAt);
 first.config.name='Externally mutated';assert.equal(vault.records[0].config.name,'Map 9');
 const restored=new MapVault(storage);assert.deepEqual(restored.records,vault.records);assert.deepEqual(generate(restored.records[0].config).parts,generate(vault.records[0].config).parts);
 assert.equal(savedProject(null),null);assert.equal(savedProject([]),null);assert.equal(savedProject({name:'Broken'}),null);assert.deepEqual(savedProject(normalize({name:'Valid'})),normalize({name:'Valid'}));
});
test('opening an old map restores its layout and name while retaining every current paid ID',()=>{
 const ids=Object.fromEntries(SHOP_ID_FIELDS.map((field,i)=>[field,String(5000+i)])),old=map('Older map'),active=normalize({...ids,name:'Current setup',mode:'tycoon',theme:'neon'});
 const record={config:{...old.config,...Object.fromEntries(SHOP_ID_FIELDS.map((field,i)=>[field,String(1000+i)]))}},config=openMapConfig(record,active);
 assert.equal(config.name,old.config.name);assert.equal(config.seed,old.config.seed);assert.equal(config.mode,'obby');for(const key of SHOP_ID_FIELDS)assert.equal(config[key],active[key]);
 const opened=generate(config);assert.equal(opened.key,old.key);assert.deepEqual(opened.parts,old.parts);assert.equal(active.name,'Current setup');assert.equal(record.config.cashSmallId,'1002');
});
test('storage failure preserves an exportable session copy and never claims durable saving',()=>{
 for(const fail of [()=>false,()=>{throw Error('quota');}]){
  const storage=memory();storage.set=fail;const vault=new MapVault(storage),r=vault.remember(map('Session only'),{source:'generated'});
  assert.equal(r.persisted,false);assert.equal(vault.records.length,1);assert.equal(JSON.parse(vault.backup()).records[0].config.name,'Session only');assert.equal(new MapVault(storage).records.length,0);
 }
});
test('collection import previews capacity, keeps existing maps and refuses a stale plan',()=>{
 const source=new MapVault(memory());for(let i=0;i<8;i++)source.remember(map('Map '+i),{source:'generated'});
 const target=new MapVault(memory());target.remember(map('Existing'));target.remember(map('Map 7'));
 const before=structuredClone(target.records),plan=target.prepareImport(source.backup());assert.equal(plan.duplicates,1);assert.equal(plan.records.length,6);assert.equal(plan.skipped,1);assert.deepEqual(target.records,before);
 const result=target.applyImport(plan);assert.equal(result.added,6);assert.equal(target.records.length,8);assert.deepEqual(target.records.slice(0,2),before);assert.equal(new Set(target.records.map(r=>r.id)).size,8);
 const again=target.prepareImport(source.backup());assert.equal(again.records.length,0);assert.equal(again.skipped,1);
 const other=new MapVault(memory()),stale=other.prepareImport(source.backup());other.remember(map('Changed meanwhile'));assert.throws(()=>other.applyImport(stale),/inzwischen geändert/);assert.equal(other.records.length,1);
});
test('damaged entries and invalid backup files cannot replace or certify saved maps',()=>{
 const storage=memory(),vault=new MapVault(storage);vault.remember(map('Keep this'));const payload=JSON.parse(vault.backup()),before=JSON.stringify(vault.records);
 const invalid=[null,{}, {...payload,schemaVersion:999},{...payload,records:Array(9).fill(payload.records[0])},{...payload,records:[{...payload.records[0],config:[]}]},{...payload,records:[{...payload.records[0],updatedAt:Number.MAX_SAFE_INTEGER}]},{...payload,records:[{...payload.records[0],generatedAt:0}]}];
 for(const value of invalid)assert.throws(()=>vault.prepareImport(JSON.stringify(value)));assert.throws(()=>vault.prepareImport('{bad'));assert.throws(()=>vault.prepareImport('ä'.repeat(256001)),/zu groß/);assert.equal(JSON.stringify(vault.records),before);
 storage.values.set(MAPS_KEY,{app:'MapForgeMaps',schemaVersion:1,records:[null,payload.records[0],payload.records[0]]});const restored=new MapVault(storage);assert.equal(restored.records.length,1);assert.equal(restored.ignored,2);assert.equal(restored.records[0].config.name,'Keep this');
});
test('removal can be undone without mutating the saved configuration or duplicating entries',()=>{
 const storage=memory(),vault=new MapVault(storage);for(const name of ['One','Two','Three'])vault.remember(map(name));const before=structuredClone(vault.records),token=vault.remove(before[1].id);assert.equal(vault.records.length,2);assert.equal(new MapVault(storage).records.length,2);assert.ok(vault.undoRemove(token));assert.deepEqual(vault.records,before);assert.equal(vault.undoRemove(token),false);assert.equal(vault.remove('missing'),null);
});
function rootDouble(){
 const fields=new Map(),handlers={};return {innerHTML:'',handlers,addEventListener:(type,fn)=>handlers[type]=fn,querySelector(selector){if(!fields.has(selector))fields.set(selector,{textContent:'',innerHTML:'',click(){},value:''});return fields.get(selector);},querySelectorAll(selector){if(selector==='[data-map-preview]')return [...this.querySelector('[data-vault-cards]').innerHTML.matchAll(/data-map-preview="([^"]+)"/g)].map(m=>({dataset:{mapPreview:m[1]},setAttribute(){}}));return [];}};
}
test('actual gallery filters safe map cards, renders their real geometry and gates actions while busy',()=>{
 const vault=new MapVault(memory());vault.remember(map('<Sky & Friends>'));vault.remember(generate({mode:'tycoon',name:'Neon Test',theme:'neon',plots:2,detail:0}));const root=rootDouble(),opened=[],drawn=[],queue=[];let busy=false;
 const prior=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>queue.push(fn);
 try{const ui=new MyMaps(root,{vault,getBusy:()=>busy,onOpen:id=>opened.push(id),onSave:()=>null,download(){},toast(){},renderPreview:(canvas,m,view)=>drawn.push({m,view})});
  assert.ok(root.querySelector('[data-vault-cards]').innerHTML.includes('&lt;Sky &amp; Friends&gt;'));ui.setActive(true);while(queue.length)queue.shift()();assert.equal(drawn.length,2);for(const row of drawn){assert.equal(row.view.level,48);assert.ok(vault.find(row.m.config));assert.ok(row.m.parts.length>50);}
  ui.mode='tycoon';ui.renderCards();while(queue.length)queue.shift()();assert.doesNotMatch(root.querySelector('[data-vault-cards]').innerHTML,/Sky &amp;/);assert.match(root.querySelector('[data-vault-cards]').innerHTML,/Neon Test/);
  busy=true;ui.action('open',vault.records[0].id);assert.equal(opened.length,0);assert.match(root.querySelector('[data-vault-message]').textContent,/Bitte warte/);busy=false;ui.action('open',vault.records[0].id);assert.equal(opened.length,1);
  ui.query='no such map';ui.renderCards();assert.match(root.querySelector('[data-vault-cards]').innerHTML,/Keine passende Map/);
 }finally{globalThis.requestAnimationFrame=prior;}
});
test('gallery reads backups without applying them and detects changes while the file is loading',async()=>{
 const vault=new MapVault(memory()),backup=new MapVault(memory());backup.remember(map('From backup'));const root=rootDouble(),ui=new MyMaps(root,{vault,getBusy:()=>false,onOpen(){},onSave(){},download(){},toast(){}});
 const text=backup.backup();await ui.readImport({files:[{size:text.length,text:async()=>text}],value:'selected'});assert.equal(vault.records.length,0);assert.match(root.querySelector('[data-vault-import]').innerHTML,/Maps hinzufügen/);ui.action('commit');assert.equal(vault.records.length,1);assert.equal(vault.records[0].config.name,'From backup');
 let resolve;const loading=ui.readImport({files:[{size:text.length,text:()=>new Promise(r=>resolve=r)}],value:'selected'});vault.remember(map('New map'));resolve(text);await loading;assert.equal(ui.pending,null);assert.match(root.querySelector('[data-vault-message]').textContent,/inzwischen geändert/);
});
