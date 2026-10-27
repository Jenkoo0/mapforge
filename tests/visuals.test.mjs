import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,validate,normalize,fromBrief,toRBXLX,SCRIPT_FILES,THEMES} from '../web/engine.js';
import {TYCOON_THEMES,tycoonTheme,PART_BUDGET} from '../web/tycoon.js';
import {TYCOON_SURFACES,MATERIAL_IDS,lightingProfile} from '../web/tycoon-style.js';
import {playerPlan} from '../web/player-plan.js';
const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([key,file])=>[key,readFileSync(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')]));
test('factory name and tycoon lighting follow the chosen theme',()=>{
 for(const theme of Object.keys(TYCOON_THEMES)){
  const m=generate({mode:'tycoon',theme}),xml=toRBXLX(m,scripts),p=lightingProfile(m.config,m.theme);
  assert.match(playerPlan(m.config).goal,new RegExp(tycoonTheme(theme).own));assert.ok(xml.includes('FactoryWay = &quot;'+tycoonTheme(theme).way));assert.ok(xml.includes('ExposureCompensation'));assert.ok(p.haze<.5&&p.brightness<=2.1&&p.exposure<0);assert.notEqual(p.outdoor,m.theme.fog);
  if(theme!=='sky')assert.ok(!xml.includes('DEINE KRISTALLFABRIK'));
 }
});
test('themes have distinctive non-white large surfaces; lush nature stays under the six-plot budget',()=>{
 assert.equal(new Set(Object.values(TYCOON_SURFACES).map(t=>t.floor)).size,4);
 assert.equal(new Set(Object.values(TYCOON_SURFACES).map(t=>t.floorMat)).size,4);
 for(const theme of Object.keys(TYCOON_THEMES))for(const seed of ['bloom-visual','VARIANT-2'])for(const polish of [0,1,2]){
  const m=generate({mode:'tycoon',theme,plots:6,detail:3,polish,seed});assert.ok(m.parts.length<PART_BUDGET,`${theme}: ${m.parts.length}`);assert.ok(!validate(m).some(c=>c.status==='error'));
  const floors=m.parts.filter(p=>/_(Floor|Promenade|EntranceBridge)$/.test(p.name));assert.equal(floors.length,18);assert.ok(floors.every(p=>p.material!=='SmoothPlastic'));
  if(theme==='jungle'){
   assert.ok(floors.filter(p=>p.material==='Grass').length===6);assert.ok(floors.filter(p=>p.material==='WoodPlanks').length===12);
   assert.equal(m.parts.filter(p=>p.name.includes('_FlowerBed_')).length,24);assert.ok(new Set(m.parts.filter(p=>p.name.includes('_GardenBloom_')).map(p=>p.color)).size>=4);
   assert.ok(new Set(m.parts.filter(p=>p.name.includes('_TreeCrown_')).map(p=>p.color)).size>=3);
  }
  for(const p of m.parts)assert.ok(MATERIAL_IDS[p.material],p.material);
 }
});
test('architectural signs are attached to their boards and close-range billboards stay bounded',()=>{
 const m=generate({mode:'tycoon',theme:'jungle',plots:6,detail:3,polish:2}),xml=toRBXLX(m,scripts);
 for(const p of m.parts.filter(p=>p.label&&/EntranceSign|GamePlan|WelcomeArch|ContractBoard/.test(p.name))){assert.equal(p.sign.mode,'surface');assert.ok(p.sign.distance<=55);}
 const arch=m.parts.find(p=>p.name==='WelcomeArch'),plan=m.parts.find(p=>p.name==='GamePlan');assert.ok(Math.abs(arch.pos[0]-plan.pos[0])>20);assert.ok(Math.abs(arch.pos[1]-plan.pos[1])>=8);
 assert.match(xml,/<Item class="SurfaceGui"/);assert.match(xml,/<token name="Face">5<\/token>/);assert.match(xml,/<token name="Face">2<\/token>/);
 for(const match of xml.matchAll(/<Item class="BillboardGui"[\s\S]*?<float name="MaxDistance">([\d.]+)<\/float>/g))assert.ok(Number(match[1])<=28);
});
test('both modes declare modern lighting and avoid the legacy compatibility/retro preset',()=>{
 for(const mode of ['tycoon','obby'])for(const theme of Object.keys(THEMES)){
  const xml=toRBXLX(generate({mode,theme}),scripts);
  assert.match(xml,/<token name="Technology">4<\/token>/);assert.match(xml,/<token name="LightingStyle">0<\/token>/);assert.match(xml,/<bool name="PrioritizeLightingQuality">true<\/bool>/);assert.match(xml,/<token name="TonemapperPreset">0<\/token>/);assert.ok(!xml.includes('<token name="TonemapperPreset">1</token>'));
  assert.ok(lightingProfile({mode,theme},THEMES[theme]).haze<.5);
 }
});
test('mode names follow their templates while custom project names are preserved',()=>{
 assert.equal(normalize({mode:'tycoon'}).name,'Crystal Industries');assert.equal(normalize({mode:'tycoon',theme:'jungle',name:'Cloud Kingdom'}).name,'Bloom Industries');assert.equal(normalize({mode:'obby',theme:'neon',name:'Bloom Industries'}).name,'Neon District');assert.equal(normalize({mode:'tycoon',name:'Creators Betrieb'}).name,'Creators Betrieb');assert.equal(fromBrief('Biofabrik Tycoon',{}).config.name,'Bloom Industries');
});
