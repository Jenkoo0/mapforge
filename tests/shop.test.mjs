import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize,generate,SCRIPT_FILES} from '../web/engine.js';
import {shopPlan,parseShopImport,studioShopScanner,shopGuide} from '../web/shop-setup.js';
import {launchFiles} from '../web/launch-kit.js';
test('shop import preserves project and paid IDs, merging only reviewed public offer IDs',()=>{
 const c=normalize({mode:'tycoon',name:'Mein Betrieb',seed:'KEEP',gems100Id:'421',vipPassId:'731',shop:false});
 const r=parseShopImport(JSON.stringify({app:'MapForgeShop',universeId:901,products:{TCashSmall:123},passes:{AutoCollect:331}}),c);
 assert.equal(r.config.cashSmallId,'123');assert.equal(r.config.autoCollectPassId,'331');assert.equal(r.config.gems100Id,'421');assert.equal(r.config.vipPassId,'731');assert.equal(r.config.name,c.name);assert.equal(r.config.seed,c.seed);assert.equal(r.config.shop,false);assert.equal(c.cashSmallId,'');assert.equal(r.changes.length,2);
 assert.equal(shopPlan(c).length,9);assert.equal(shopPlan(c).filter(p=>p.type==='pass').length,3);
});
test('malformed, duplicate and arbitrary shop changes fail without normalizing them away',()=>{
 const c=normalize({mode:'tycoon',cashSmallId:'123'});
 for(const data of [{app:'wrong'},{app:'MapForgeShop',products:{Unknown:2}},{app:'MapForgeShop',products:{TCashLarge:123}},{app:'MapForgeShop',products:{TCashLarge:'1e3'}},{app:'MapForgeShop',products:{TCashLarge:-1}},{app:'MapForgeShop',products:{TCashLarge:0}},{app:'MapForgeShop',products:{TCashLarge:5},script:'untrusted'},{app:'MapForgeShop',universeId:0,products:{TCashLarge:5}}])assert.throws(()=>parseShopImport(JSON.stringify(data),c));
 assert.throws(()=>parseShopImport('{bad',c));assert.throws(()=>parseShopImport('x'.repeat(20001),c));assert.equal(c.cashSmallId,'123');
 // Game-pass and developer-product ID spaces are separate.
 assert.equal(parseShopImport('{"app":"MapForgeShop","passes":{"VIP":123}}',c).config.vipPassId,'123');
});
test('start kit includes read-only scanner, exact offer plan and honest setup limits',()=>{
 const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([k,f])=>[k,readFileSync(new URL('../web/lua/'+f+'.lua',import.meta.url),'utf8')]));
 const c=normalize({mode:'tycoon'}),files=launchFiles(generate(c),scripts),scan=studioShopScanner();
 assert.equal(files['Shop-IDs-aus-Studio.lua'],scan);assert.equal(files['Robux-Shop-Einrichtung.md'],shopGuide(c));
 assert.match(scan,/GetDeveloperProductsAsync/);assert.match(scan,/AdvanceToNextPageAsync/);assert.match(scan,/ambiguous/);assert.doesNotMatch(scan,/loadstring|HttpGet|ProcessReceipt\s*=|CreateProduct|DataStore/);
 assert.match(files['KI-Uebergabe.md'],/Kalibrierung/);assert.match(shopGuide(c),/120 Sekunden/);assert.match(shopGuide(c),/Pässe manuell/);
 const obby=launchFiles(generate({mode:'obby'}),scripts);assert.ok(!obby['Shop-IDs-aus-Studio.lua']);
});
test('all themes export three reachable calibration stations per plot without spending the detail budget',()=>{
 for(const theme of ['sky','jungle','neon','lava'])for(const plots of [2,4,6]){
  const m=generate({mode:'tycoon',theme,plots,detail:3,polish:2});
  assert.ok(m.parts.length<5200);
  for(let plot=1;plot<=plots;plot++)for(let i=1;i<=3;i++){
   const p=m.parts.find(p=>p.plot===plot&&p.role==='Calibration'+i);assert.ok(p);assert.equal(p.hiddenAtStart,undefined);assert.equal(p.collide,false);
  }
  const detail={sky:'CrystalLens',jungle:'LivingBloom',neon:'HoloDisplay',lava:'FurnaceMouth'}[theme];assert.ok(m.parts.some(p=>p.name.includes(detail)));
  assert.equal(m.parts.filter(p=>p.name.includes('GreenhouseRoof')).length,plots*2);
 }
});
