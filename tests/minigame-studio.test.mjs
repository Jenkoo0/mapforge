import test from 'node:test';
import assert from 'node:assert/strict';
import {MINIGAMES,normalizeMinigame,grindMarkdown,GRIND_COSTS} from '../web/minigames.js';
import {mountGrindStudio} from '../web/grind-studio.js';

function element(dataset={}){
 const listeners=new Map(),attributes=new Map();
 return {dataset,hidden:false,checked:false,textContent:'',innerHTML:'',style:{setProperty(){}},classList:{add(){}},addEventListener:(event,handler)=>listeners.set(event,handler),setAttribute:(name,value)=>attributes.set(name,value),getAttribute:name=>attributes.get(name),click:()=>listeners.get('click')?.(),change:()=>listeners.get('change')?.()};
}
function host(){
 const root=element(),choices=Object.keys(MINIGAMES).map(minigame=>element({minigame})),children=new Map(['#grindEnabled','.grind-game-description','.grind-arena-hint','.grind-attributes','.grind-plan-note','.grind-main-reward','.grind-reward','#downloadMinigames','#cancelMinigames','#minigameCollectionStatus'].map(selector=>[selector,element()]));
 root.querySelector=selector=>children.get(selector);root.querySelectorAll=()=>choices;return {root,choices,children};
}
const config={name:'Mein Gipfel',seed:'KEEP',mode:'obby',minigame:'signal',grind:true,events:'rally',boostId:'12345'};

test('three rules have independent artwork and explicit normalized identifiers',()=>{
 assert.deepEqual(Object.keys(MINIGAMES),['signal','memory','collect']);assert.equal(normalizeMinigame('memory'),'memory');
 for(const value of [null,undefined,'','nope','toString','__proto__'])assert.equal(normalizeMinigame(value),'signal');
 assert.equal(new Set(Object.values(MINIGAMES).map(game=>game.svg)).size,3);assert.equal(MINIGAMES.memory.steps,6);assert.equal(MINIGAMES.memory.previewSeconds,6);
 assert.equal(MINIGAMES.collect.steps,8);assert.match(MINIGAMES.collect.description,/zwei Durchgängen/);assert.match(MINIGAMES.collect.description,/vier Stationen pro Durchgang genau einmal/);assert.match(MINIGAMES.collect.description,/Zwischen den Durchgängen/);
 assert.deepEqual(GRIND_COSTS,[5,10,18,30,45]);assert.equal(GRIND_COSTS.reduce((sum,cost)=>sum+cost,0),108);
});

test('mounting only reads settings; explicit choices patch the game and event arena',()=>{
 const ui=host(),changes=[];let current={...config};const before={...current};
 const view=mountGrindStudio(ui.root,{getConfig:()=>current,onChange:patch=>changes.push(patch)});view.refresh();assert.deepEqual(changes,[]);
 assert.equal(ui.children.get('#grindEnabled').checked,true);assert.deepEqual(ui.choices.map(choice=>choice.getAttribute('aria-pressed')),['true','false','false']);
 ui.choices[0].click();assert.equal(changes.length,0);ui.choices[1].click();assert.deepEqual(changes,[{minigame:'memory',events:'rally'}]);
 current={...current,...changes[0]};view.refresh();assert.equal(ui.choices[1].getAttribute('aria-pressed'),'true');assert.match(ui.children.get('.grind-game-description').textContent,/sechs Sekunden/);
 assert.equal(current.name,before.name);assert.equal(current.seed,before.seed);assert.equal(current.boostId,before.boostId);
 assert.doesNotMatch(ui.root.innerHTML,/data-mode=/);assert.equal((ui.root.innerHTML.match(/viewBox="0 0 96 72"/g)||[]).length,3);
});

test('disabled arena is clear, selecting the current game enables it, and grind toggle stays explicit',()=>{
 const ui=host(),changes=[];let current={...config,events:'off',grind:false};const view=mountGrindStudio(ui.root,{getConfig:()=>current,onChange:patch=>changes.push(patch)});
 assert.match(ui.children.get('.grind-arena-hint').textContent,/ausgeschaltet/);assert.equal(ui.children.get('#grindEnabled').checked,false);assert.match(ui.children.get('.grind-plan-note').textContent,/Gespeicherte Level bleiben/);
 ui.choices[0].click();assert.deepEqual(changes,[{minigame:'signal',events:'rally'}]);
 ui.children.get('#grindEnabled').checked=true;ui.children.get('#grindEnabled').change();assert.deepEqual(changes.at(-1),{grind:true});
 current={...current,mode:'tycoon',events:'rally',grind:true};view.refresh();assert.match(ui.children.get('.grind-attributes').innerHTML,/Maschinenkraft/);assert.doesNotMatch(ui.children.get('.grind-attributes').innerHTML,/Zielfokus/);assert.match(ui.children.get('.grind-arena-hint').textContent,/Fabrik/);
});

test('collection feedback and cancel are real callbacks and never mutate a project',()=>{
 const ui=host();let starts=0,cancels=0;const view=mountGrindStudio(ui.root,{getConfig:()=>config,onChange(){throw Error('unexpected mutation');},onCollection:()=>starts++,onCancelCollection:()=>cancels++});
 ui.children.get('#downloadMinigames').click();assert.equal(starts,1);view.setCollectionBusy(true);assert.equal(ui.children.get('#downloadMinigames').disabled,true);assert.equal(ui.children.get('#cancelMinigames').hidden,false);
 view.setCollectionStatus('2 / 3 Maps');assert.equal(ui.children.get('#minigameCollectionStatus').textContent,'2 / 3 Maps');ui.children.get('#cancelMinigames').click();assert.equal(cancels,1);
 view.setCollectionBusy(false);assert.equal(ui.children.get('#downloadMinigames').disabled,false);assert.equal(ui.children.get('#cancelMinigames').hidden,true);
});

test('guide documents bounded economy, independent ranking and remaining engine verification',()=>{
 const guide=grindMarkdown({...config,minigame:'collect'});for(const text of ['Funkenjagd','Level 0–5','+4 %','+1 Münze','+5 Münzen','5, 10, 18, 30, 45','324','75 Sekunden','sechs Sekunden','5–7','10 XP','Serverrunde','kein','Engine-Test'])assert.ok(guide.includes(text),text);
 assert.match(grindMarkdown({...config,mode:'tycoon'}),/wirkt Maschinenkraft/);assert.match(grindMarkdown({...config,grind:false,events:'off'}),/ausgeschaltet/);
 for(const text of ['unter 45 Sekunden','unter 30 Sekunden','3 Marken und 6 XP','1 Marke und 2 XP','Wiedergeburt','zählt nicht zur Laufzeit','100 XP'])assert.ok(guide.includes(text),text);
 assert.match(guide,/Weitere Versuche verbessern ausschließlich die Rundenbestzeit/);
 assert.match(guide,/alle vier Stationen pro Durchgang genau einmal/);assert.match(guide,/Zwischen den Durchgängen darf dieselbe Station nicht direkt folgen/);
});
