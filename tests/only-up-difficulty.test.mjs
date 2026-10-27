import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generate} from '../web/engine.js';
import {onlyUpDifficulty,difficultyMarkdown,ONLY_UP_DIFFICULTY_FORMULA} from '../web/only-up-difficulty.js';

const make=input=>generate({mode:'obby',obbyStyle:'onlyup',events:'off',movement:'precise',detail:0,seed:'DIFFICULTY-QA',...input});
const simple=()=>({config:{stages:8},onlyUp:{sections:Array.from({length:8},(_,i)=>({title:'Kapitel '+(i+1),skill:'Skill '+(i+1),start:i+1,end:i+1}))},stages:Array.from({length:9},(_,i)=>({index:i,pos:[i*12,i*2,0],size:[8,2,8],checkpoint:i%4===0,finish:i===8}))});

test('96/144/240 stages × four themes × three difficulties expose eight measured safe skill sections',()=>{
 for(const stages of [96,144,240])for(const theme of ['sky','neon','lava','jungle'])for(const difficulty of ['easy','normal','hard']){
  const map=make({stages,theme,difficulty}),analysis=onlyUpDifficulty(map),label=[stages,theme,difficulty].join('/');
  assert.equal(analysis.available,true,label);assert.equal(analysis.valid,true,analysis.errors.join(' '));assert.equal(analysis.validLongRoute,true,label);
  assert.equal(analysis.startsAtCheckpoint,true);assert.equal(analysis.finishesAtCheckpoint,true);assert.equal(analysis.hasFinish,true);
  assert.equal(analysis.sections.length,8);assert.equal(new Set(analysis.sections.map(section=>section.skill)).size,8);
  assert.equal(analysis.sections[0].start,1);assert.equal(analysis.sections.at(-1).end,stages);
  assert.ok(analysis.maxGap<=5.25,label);assert.ok(analysis.maxRise<=3,label);assert.ok(analysis.minWidth>=7.5,label);
  assert.equal(analysis.checkpoints,map.stages.filter(stage=>stage.checkpoint).length);assert.ok(analysis.maxCheckpointSpan<=5);
  assert.ok(analysis.length>stages*10);assert.ok(analysis.height>stages*1.6);assert.ok(analysis.largestDropToCheckpoint>0);
  assert.equal(analysis.length,map.onlyUp.length);assert.equal(analysis.height,map.onlyUp.height);
  for(const section of analysis.sections){assert.ok(section.maxGap<=5.25);assert.ok(section.maxRise<=3);assert.ok(section.index>=0&&section.index<=100);assert.ok(Number.isFinite(section.minWidth));}
 }
});

test('independent rectangle measurements use diagonal gaps, unequal surface tops and checkpoint arrival',()=>{
 const map=simple();
 // First two rectangles have gaps of 3 and 4 on their two horizontal axes.
 map.stages[1].pos=[11,2,12];map.stages[1].size=[8,4,8];
 const analysis=onlyUpDifficulty(map),first=analysis.sections[0];
 assert.equal(first.maxGap,5);assert.equal(first.maxRise,3);assert.equal(first.minWidth,8);assert.equal(first.checkpointSpan,1);
 const expected=Math.round(100*(.5*(5/5.25)+.3*(3/3)+.2*((14-8)/7.5)));
 assert.equal(first.index,expected);assert.equal(analysis.formula,ONLY_UP_DIFFICULTY_FORMULA);
 // Four rises until checkpoint 4 include its arrival before checkpoint resets.
 assert.equal(analysis.maxCheckpointSpan,4);assert.equal(analysis.largestDropToCheckpoint,6);assert.equal(analysis.checkpoints,3);
 assert.equal(analysis.height,16);assert.equal(analysis.validLongRoute,false,'short fixtures are not advertised as long routes');
});

test('length is measured in 3D and surface height does not confuse thickness with centre rise',()=>{
 const map=simple(),analysis=onlyUpDifficulty(map);
 assert.equal(analysis.length,Math.round(8*Math.hypot(12,2)*1000)/1000);assert.equal(analysis.maxGap,4);assert.equal(analysis.maxRise,2);
 map.stages[8].size[1]=4;
 const changed=onlyUpDifficulty(map);assert.equal(changed.height,17);assert.equal(changed.sections[7].maxRise,3);assert.equal(changed.largestDropToCheckpoint,6,'an already reached summit checkpoint secures its arrival');
});

test('formula bounds excessive difficulty and never rewards platforms wider than 14',()=>{
 const map=simple();map.stages[1].pos[0]=200;
 const impossible=onlyUpDifficulty(map);assert.equal(impossible.sections[0].index,100);assert.equal(impossible.valid,false);assert.ok(impossible.errors.some(error=>error.includes('Kantenlücke')));
 const wide=simple();for(const stage of wide.stages){stage.size=[30,2,30];stage.pos[1]=0;}
 const flat=onlyUpDifficulty(wide);assert.equal(flat.sections[0].index,0);assert.ok(flat.sections.every(section=>section.index===0));
});

test('stale cached totals never replace real measurements and analysis never reads parts',()=>{
 const map=make({stages:96});map.onlyUp.length=1;map.onlyUp.height=99999;
 Object.defineProperty(map,'parts',{get(){throw new Error('UI analysis must not inspect world parts');}});
 const analysis=onlyUpDifficulty(map);assert.equal(analysis.valid,true);assert.ok(analysis.length>1000);assert.ok(analysis.height<1000);assert.equal(analysis.warnings.length,2);
 const again=onlyUpDifficulty(map);assert.deepEqual(again,analysis);
});

test('invalid or missing inputs fail politely instead of throwing or producing NaN',()=>{
 for(const map of [undefined,null,{}, {onlyUp:{}},{onlyUp:{sections:[]},stages:[]}]){
  const analysis=onlyUpDifficulty(map);assert.equal(analysis.valid,false);assert.ok(analysis.errors.length);assert.doesNotThrow(()=>difficultyMarkdown(map));
 }
 for(const edit of [map=>map.stages[2].size[0]=0,map=>map.stages[2].pos[1]=Infinity,map=>map.stages[2].index=4,map=>delete map.stages[2].size,map=>map.stages[2].rotation=[0,10,0],map=>map.onlyUp.sections.pop(),map=>map.onlyUp.sections[3].start=1,map=>map.onlyUp.sections[7].end=7]){
  const map=simple();edit(map);const analysis=onlyUpDifficulty(map);assert.equal(analysis.valid,false);assert.ok(analysis.errors.length);assert.equal(analysis.sections.some(section=>Number.isNaN(section.index)),false);
 }
 const overflow=simple();overflow.stages[1].pos=[1.7e308,1.7e308,1.7e308];const bounded=onlyUpDifficulty(overflow);assert.equal(bounded.valid,false);assert.equal(bounded.length,null);assert.equal(bounded.sections.length,0);
});

test('missing checkpoints, early finish, and stale configured counts cannot report a valid route',()=>{
 for(const edit of [map=>map.stages[0].checkpoint=false,map=>map.stages[8].checkpoint=false,map=>map.stages[3].finish=true,map=>map.stages[8].finish=false,map=>map.config.stages=9]){
  const map=simple();edit(map);assert.equal(onlyUpDifficulty(map).valid,false);
 }
});

test('actual checkpoint flags match the server modulo interval and missing or extra flags are detected',()=>{
 for(const checkpointEvery of [2,7,10]){
  const map=make({stages:96,checkpointEvery}),analysis=onlyUpDifficulty(map);
  assert.equal(analysis.valid,true,analysis.errors.join(' '));assert.ok(analysis.maxCheckpointSpan<=checkpointEvery);
  for(const stage of map.stages)assert.equal(stage.checkpoint,stage.index===0||stage.finish===true||stage.index%checkpointEvery===0);
 }
 const missing=make({stages:96,checkpointEvery:5});missing.stages[5].checkpoint=false;
 const missingAnalysis=onlyUpDifficulty(missing);assert.equal(missingAnalysis.valid,false);assert.equal(missingAnalysis.maxCheckpointSpan,10);assert.ok(missingAnalysis.errors.some(error=>error.includes('Etappe 5')&&error.includes('Serverintervall')));assert.ok(missingAnalysis.errors.some(error=>error.includes('Checkpointspanne')));
 const extra=make({stages:96,checkpointEvery:5});extra.stages[3].checkpoint=true;
 const extraAnalysis=onlyUpDifficulty(extra);assert.equal(extraAnalysis.valid,false);assert.ok(extraAnalysis.errors.some(error=>error.includes('Etappe 3')&&error.includes('Serverintervall')));
 const secured=simple();for(const stage of secured.stages)stage.checkpoint=true;assert.equal(onlyUpDifficulty(secured).largestDropToCheckpoint,0,'all reached checkpoint surfaces have zero return loss');
});

test('markdown lists all eight real skill focuses, measurements, formula and truthful limits',()=>{
 const map=make({stages:144}),markdown=difficultyMarkdown(map),analysis=onlyUpDifficulty(map);
 for(const section of map.onlyUp.sections){assert.ok(markdown.includes(section.title));assert.ok(markdown.includes(section.skill));}
 assert.ok(markdown.includes('Index / 100'));assert.ok(markdown.includes(ONLY_UP_DIFFICULTY_FORMULA));assert.ok(markdown.includes('keine gemessene Spielerschwierigkeit'));assert.ok(markdown.includes('Kein Roblox-Spieltest'));assert.ok(markdown.includes(String(analysis.checkpoints)));
 map.onlyUp.sections[0].title='A | B\n<script>';const safe=difficultyMarkdown(map);assert.ok(safe.includes('A \\| B script'));assert.ok(!safe.includes('<script>'));
});

test('analysis is a pure module without an engine import or quadratic part audits',async()=>{
 const source=await readFile(new URL('../web/only-up-difficulty.js',import.meta.url),'utf8');
 assert.ok(!/from\s*['\"]\.\/engine\.js/.test(source));assert.ok(!/map\.parts|measureOnlyUpRoute|validateOnlyUpGeometry/.test(source));
 const map=simple(),before=structuredClone(map);onlyUpDifficulty(map);difficultyMarkdown(map);assert.deepEqual(map,before);
});
