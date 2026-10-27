import test from 'node:test';
import assert from 'node:assert/strict';
import {mountOnlyUp,onlyUpSummary} from '../web/only-up-ui.js';

function element(dataset={}){
 const listeners=new Map(),attributes=new Map();
 return {dataset,hidden:false,textContent:'',innerHTML:'',style:{setProperty(){}},classList:{add(){},toggle(){}},addEventListener:(event,handler)=>listeners.set(event,handler),setAttribute:(name,value)=>attributes.set(name,value),getAttribute:name=>attributes.get(name),click:()=>listeners.get('click')?.()};
}
function host(){
 const root=element(),styles=['classic','onlyup'].map(obbyStyle=>element({obbyStyle})),presets=[96,144,240].map(onlyUpPreset=>element({onlyUpPreset:String(onlyUpPreset)})),layouts=['spire','ridge','switchback'].map(ascentLayout=>element({ascentLayout}));
 const children=new Map(['.only-up-theme','.only-up-classic','.only-up-plan','.only-up-stage-count','.only-up-chapters','.only-up-elevation','.only-up-insight','#downloadOnlyUp','#downloadIndividualOnlyUp','#cancelOnlyUp','#onlyUpCollectionStatus'].map(selector=>[selector,element()]));
 const height=element();children.get('.only-up-elevation').querySelector=()=>height;
 root.querySelector=selector=>children.get(selector);root.querySelectorAll=selector=>({'[data-obby-style]':styles,'[data-only-up-preset]':presets,'[data-ascent-layout]':layouts}[selector]||[]);
 return {root,styles,presets,layouts,children,height};
}
const config={mode:'obby',obbyStyle:'onlyup',stages:144,theme:'sky',seed:'SAVED',rise:1.3,detail:2,movement:'classic',name:'Mein eigener Gipfel',autoName:false};

test('opening and refreshing the card never modify a saved project; style clicks preserve unrelated settings',()=>{
 const ui=host(),changes=[];let current={...config,obbyStyle:'classic',stages:36};
 const view=mountOnlyUp(ui.root,{getConfig:()=>current,onChange:patch=>changes.push(patch)});
 view.refresh();assert.deepEqual(changes,[]);
 ui.styles[1].click();assert.deepEqual(changes,[{obbyStyle:'onlyup'}]);
 current={...current,...changes[0]};view.refresh();ui.styles[1].click();assert.equal(changes.length,1);
 ui.presets[1].click();assert.deepEqual(changes[1],{obbyStyle:'onlyup',stages:144});
 assert.equal(current.name,'Mein eigener Gipfel');assert.equal(current.seed,'SAVED');assert.equal(current.autoName,false);
});

test('card hides for Tycoon and restores the active style and custom section count',()=>{
 const ui=host();let current={...config,mode:'tycoon',stages:173};
 const view=mountOnlyUp(ui.root,{getConfig:()=>current,onChange(){}});
 assert.equal(ui.root.hidden,true);
 current={...current,mode:'obby'};view.refresh();assert.equal(ui.root.hidden,false);
 assert.equal(ui.children.get('.only-up-stage-count').textContent,'173 Abschnitte');
 assert.equal(ui.styles[1].getAttribute('aria-pressed'),'true');
 assert.ok(ui.presets.every(button=>button.getAttribute('aria-pressed')==='false'));
});

test('height comes from the matching generated geometry and stale projects never show it',()=>{
 const map={config:{...config},stages:[{pos:[0,18,0]},{pos:[0,334.8,0]}]};
 assert.ok(Math.abs(onlyUpSummary(config,map).height-316.8)<.00001);
 for(const patch of [{stages:240},{seed:'NEW'},{theme:'lava'},{obbyStyle:'classic'},{rise:2},{movement:'parkour'},{ascentLayout:'ridge'},{ascentLayout:'switchback'}])assert.equal(onlyUpSummary({...config,...patch},map).height,null);
 assert.equal(onlyUpSummary(config,{...map,stages:[{pos:[0,NaN,0]}]}).height,null);
 assert.equal(onlyUpSummary(config,null).height,null);
});

test('layout cards send only the explicit layout patch and refresh their pressed state',()=>{
 const ui=host(),changes=[];let current={...config,gamePassId:'12345',productId:'67890',storyId:'windtor'};
 const original={...current};
 const view=mountOnlyUp(ui.root,{getConfig:()=>current,onChange:patch=>changes.push(patch)});
 assert.deepEqual(changes,[]);
 assert.deepEqual(ui.layouts.map(button=>button.getAttribute('aria-pressed')),['true','false','false']);
 ui.layouts[0].click();assert.deepEqual(changes,[]);
 ui.layouts[1].click();assert.deepEqual(changes,[{ascentLayout:'ridge'}]);
 current={...current,...changes.at(-1)};view.refresh();ui.layouts[1].click();
 assert.deepEqual(ui.layouts.map(button=>button.getAttribute('aria-pressed')),['false','true','false']);
 assert.equal(changes.length,1);
 ui.layouts[2].click();assert.deepEqual(changes.at(-1),{ascentLayout:'switchback'});
 current={...current,...changes.at(-1)};view.refresh();
 assert.deepEqual(ui.layouts.map(button=>button.getAttribute('aria-pressed')),['false','false','true']);
 const {ascentLayout,...unchanged}=current;assert.deepEqual(unchanged,original);
 assert.equal(ascentLayout,'switchback');
 assert.equal((ui.root.innerHTML.match(/data-ascent-layout=/g)||[]).length,3);
 assert.equal((ui.root.innerHTML.match(/viewBox="0 0 96 64"/g)||[]).length,3);
 assert.doesNotMatch(ui.root.innerHTML,/data-mode=/);
});

test('legacy layout omission matches an explicit tower, but changed forms withhold measured height',()=>{
 const map={config:{...config},stages:[{pos:[0,18,0]},{pos:[0,300,0]}]};
 assert.equal(onlyUpSummary({...config,ascentLayout:'spire'},map).height,282);
 assert.equal(onlyUpSummary(config,{...map,config:{...config,ascentLayout:'spire'}}).height,282);
 assert.equal(onlyUpSummary({...config,ascentLayout:'ridge'},map).height,null);
 assert.equal(onlyUpSummary({...config,ascentLayout:'ridge'},{...map,config:{...config,ascentLayout:'ridge'}}).height,282);
 const ui=host();mountOnlyUp(ui.root,{getConfig:()=>({...config,ascentLayout:'switchback'}),getMap:()=>map,onChange(){}});
 assert.equal(ui.height.textContent,'Nach dem Generieren');
 assert.match(ui.children.get('.only-up-insight').textContent,/nach dem Generieren/);
});

test('chapter list uses generated route titles and sections and escapes text safely',()=>{
 const ui=host(),chapters=Array.from({length:4},(_,index)=>({title:index===0?'<Hafen>':'Kapitel '+(index+1),start:index*36+1,end:(index+1)*36,sections:[{skill:'Balance'},{skill:'Timing'}]}));
 const map={config:{...config},stages:[{pos:[0,18,0]},{pos:[0,300,0]}],onlyUp:{chapters}};
 mountOnlyUp(ui.root,{getConfig:()=>config,getMap:()=>map,onChange(){}});
 assert.match(ui.children.get('.only-up-chapters').innerHTML,/&lt;Hafen&gt;/);
 assert.match(ui.children.get('.only-up-chapters').innerHTML,/Balance · Timing/);
 assert.equal(ui.height.textContent,'282 Studs');
 assert.deepEqual(onlyUpSummary({...config,stages:173},null).chapters.map(chapter=>[chapter.start,chapter.end]),[[1,43],[44,86],[87,129],[130,173]]);
});

test('collection controls report real work, support cancel and never modify the map',()=>{
 const ui=host(),starts=[];let cancel=0;const view=mountOnlyUp(ui.root,{getConfig:()=>config,onChange(){throw Error('unexpected config mutation');},onCollection:options=>starts.push(options),onCancelCollection:()=>cancel++});
 ui.children.get('#downloadOnlyUp').click();ui.children.get('#downloadIndividualOnlyUp').click();assert.deepEqual(starts,[{individual:false},{individual:true}]);
 assert.match(ui.root.innerHTML,/Vier Themen × drei Bauformen/);assert.match(ui.root.innerHTML,/je 144 Etappen/);
 view.setCollectionBusy(true);assert.equal(ui.children.get('#downloadOnlyUp').disabled,true);assert.equal(ui.children.get('#downloadIndividualOnlyUp').disabled,true);assert.equal(ui.children.get('#cancelOnlyUp').hidden,false);
 view.setCollectionStatus('2 / 12 Maps');assert.equal(ui.children.get('#onlyUpCollectionStatus').textContent,'2 / 12 Maps');ui.children.get('#cancelOnlyUp').click();assert.equal(cancel,1);
 view.setCollectionBusy(false);assert.equal(ui.children.get('#downloadOnlyUp').disabled,false);assert.equal(ui.children.get('#downloadIndividualOnlyUp').disabled,false);assert.equal(ui.children.get('#cancelOnlyUp').hidden,true);
});
