import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT,THEMES,SCRIPT_FILES,generate,normalize,validate,repair,fromBrief,diagnose,toRBXLX,configLua} from '../web/engine.js';
test('deterministic seeds and meaningful variants',()=>{
 assert.deepEqual(generate({seed:'one'}),generate({seed:'one'}));
 assert.notDeepEqual(generate({seed:'one'}).parts,generate({seed:'two'}).parts);
});
test('all themes, difficulty levels and size extremes have complete safe routes',()=>{
 for(const theme of Object.keys(THEMES))for(const difficulty of ['easy','normal','hard'])for(const stages of [12,36,80])for(let seed=0;seed<10;seed++){
  const map=generate({theme,difficulty,stages,seed:String(seed)});
  assert.equal(map.stages.length,stages+1);assert.equal(map.stages[0].index,0);assert.equal(map.stages.at(-1).index,stages);
  assert.ok(map.stages[0].checkpoint);assert.ok(map.stages.at(-1).checkpoint);
  assert.ok(map.parts.every(p=>p.pos.every(Number.isFinite)&&p.size.every(n=>Number.isFinite(n)&&n>0)));
  assert.equal(map.parts.filter(p=>p.kind==='spawn').length,1);
  assert.ok(!validate(map).some(c=>c.status==='error'),`${theme}/${difficulty}/${stages}/${seed}`);
  assert.ok(map.hazards.every(h=>!map.stages[h.stage].checkpoint),'No hazard on safe checkpoint');
 }
});
test('invalid and untrusted inputs are bounded, repairs reduce actual errors',()=>{
 const c=normalize({stages:'oops',rise:Infinity,gap:-100,theme:'bad',injected:5});
 assert.equal(c.stages,36);assert.equal(c.rise,DEFAULT.rise);assert.equal(c.gap,1);assert.equal(c.theme,'sky');assert.equal(c.injected,undefined);
 const bad={theme:'neon',rise:7,gap:12,checkpointEvery:10,boostId:'123',coinsId:'123'};
 assert.ok(validate(generate(bad)).some(c=>c.status==='error'));
 const fixed=repair(bad);assert.ok(fixed.changes.length>=3);assert.ok(!validate(generate(fixed.config)).some(c=>c.status==='error'));
});
test('brief keywords and count alter actual configuration',()=>{
 const {config}=fromBrief('Eine leichte Lava Obby mit 50 Abschnitten ohne Shop');
 assert.equal(config.theme,'lava');assert.equal(config.difficulty,'easy');assert.equal(config.shop,false);
 assert.equal(fromBrief('40 Stufen',{}).config.stages,40);
});
test('diagnostics handle storage, receipts and unknown messages without evaluating code',()=>{
 assert.ok(diagnose('StudioAccessToApisNotAllowed DataStoreService')[0].title.includes('Speicher'));
 assert.ok(diagnose('ProcessReceipt failed')[0].title.includes('Kauf'));
 assert.ok(diagnose('some unknown message')[0].detail.includes('keine Fehlerfreiheit'));
 assert.deepEqual(diagnose('   '),[]);
});
test('export fails closed when scripts are missing and escapes project code',async()=>{
 const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,file])=>[k,await readFile(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')])));
 const map=generate({name:'<script>"; error("bad") -- & test'});
 assert.throws(()=>toRBXLX(map,{}),/Skript fehlt/);
 const result=toRBXLX(map,scripts);assert.ok(!result.includes('<script>'));assert.ok(result.includes('&lt;script&gt;'));
 assert.ok(result.includes('class="SpawnLocation"'));assert.ok(result.includes('name="Source"'));assert.ok(result.includes('MapForgeData'));
 assert.ok(configLua(map).includes('\\"; error(\\"bad\\")'));
});
test('saved progress namespace changes when route or obstacles change',()=>{
 const base=generate(DEFAULT).key;
 for(const patch of [{difficulty:'hard'},{seed:'other'},{checkpointEvery:3},{stages:40},{gap:5}])assert.notEqual(generate({...DEFAULT,...patch}).key,base);
});
