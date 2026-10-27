import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPreview,Preview} from '../web/preview.js';

class Events {
 listeners=new Map();
 addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);}
 removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
 fire(type,props={}){const event={type,target:this,preventDefault(){this.defaultPrevented=true;},...props};for(const listener of this.listeners.get(type)??[])listener(event);return event;}
 get listenerCount(){return [...this.listeners.values()].reduce((count,listeners)=>count+listeners.size,0);}
}
const map=id=>({id,config:{mode:'obby',theme:'sky'},parts:[],stages:[]});
function context(){
 const gradient={addColorStop(){}};
 return {clearRect(){},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},stroke(){},fill(){},ellipse(){},clip(){},setLineDash(){},fillText(){},measureText:text=>({width:String(text).length*6})};
}
function environment({width=300,height=200,dpr=1,hidden=false,observer=true}={}){
 const window=new Events(),document=new Events(),canvas=new Events(),frames=new Map(),observers=[];
 let serial=0,ctx=context();
 window.devicePixelRatio=dpr;window.requestAnimationFrame=callback=>{const frame=++serial;frames.set(frame,callback);return frame;};window.cancelAnimationFrame=frame=>frames.delete(frame);
 if(observer)window.ResizeObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}fire(){if(!this.disconnected)this.callback([]);}};
 document.defaultView=window;document.hidden=hidden;document.visibilityState=hidden?'hidden':'visible';canvas.ownerDocument=document;canvas.width=0;canvas.height=0;canvas.rect={width,height};canvas.getBoundingClientRect=()=>canvas.rect;canvas.getContext=()=>ctx;
 canvas.captures=new Set();canvas.released=[];canvas.setPointerCapture=id=>canvas.captures.add(id);canvas.releasePointerCapture=id=>{canvas.captures.delete(id);canvas.released.push(id);};
 return {window,document,canvas,frames,observers,setContext(value){ctx=value;},flush(){const queued=[...frames.values()];frames.clear();for(const callback of queued)callback(16);}};
}
function recordingRenderer(calls){return (canvas,renderedMap,view)=>{calls.push({map:renderedMap,width:canvas.width,height:canvas.height,view:Object.fromEntries(['angle','zoom','plan','path','focusPlot','level','labels'].map(key=>[key,view[key]]))});return true;};}

test('an inactive constructor stores only allowed view fields and paints the latest map on activation',()=>{
 const h=environment(),calls=[],rendered=[],first=map('first'),latest=map('latest');
 const preview=new Preview(h.canvas,first,{active:false,render:recordingRenderer(calls),onRender:(...result)=>rendered.push(result),view:{angle:.3,zoom:1.2,plan:true,path:true,focusPlot:2,level:6,labels:false,canvas:'invalid',render:'invalid',active:true,disposed:true}});
 assert.equal(preview.active,false);assert.equal(preview.disposed,false);assert.equal(preview.canvas,h.canvas);
 assert.equal(calls.length,0);assert.equal(h.frames.size,0);
 assert.equal(preview.setMap(latest,{focusPlot:3,level:0,unknown:'ignored'}),null);
 assert.equal(preview.map,latest);assert.equal(preview.unknown,undefined);assert.equal(calls.length,0);
 preview.setActive(true);preview.requestDraw();preview.requestDraw();assert.equal(h.frames.size,1);h.flush();
 assert.equal(calls.length,1);assert.equal(calls[0].map,latest);
 assert.deepEqual(calls[0].view,{angle:.3,zoom:1.2,plan:true,path:true,focusPlot:3,level:0,labels:false});
 assert.deepEqual(rendered,[[true,undefined]]);preview.dispose();
});

test('explicit drawing consumes a pending frame and deactivation cancels all queued work',()=>{
 const h=environment(),calls=[],preview=new Preview(h.canvas,map('initial'),{active:false,render:recordingRenderer(calls)});
 preview.setActive(true);assert.equal(h.frames.size,1);
 assert.equal(preview.draw(),true);assert.equal(h.frames.size,0);h.flush();assert.equal(calls.length,1);
 for(let i=0;i<100;i++)preview.requestDraw();assert.equal(h.frames.size,1);
 preview.setActive(false);assert.equal(h.frames.size,0);h.flush();assert.equal(calls.length,1);
 assert.equal(preview.draw(),null);preview.requestDraw();assert.equal(h.frames.size,0);
 preview.setActive(true);h.flush();assert.equal(calls.length,2);preview.dispose();
});

test('resize matches actual canvas proportions and bounded DPR; zero-sized layouts defer rendering',()=>{
 const h=environment({dpr:3}),calls=[],rendered=[];
 const preview=new Preview(h.canvas,map('resize'),{render:recordingRenderer(calls),onRender:success=>rendered.push(success)});
 assert.equal(calls.length,1);assert.equal(h.canvas.width,600);assert.equal(h.canvas.height,400);
 h.canvas.rect={width:0,height:0};h.observers[0].fire();h.flush();
 assert.equal(calls.length,1);assert.equal(rendered.length,1);assert.equal(h.canvas.width,600);assert.equal(h.canvas.height,400);
 h.canvas.rect={width:200.5,height:100.25};h.window.devicePixelRatio=1.5;h.observers[0].fire();h.flush();
 assert.equal(calls.length,2);assert.equal(h.canvas.width,301);assert.equal(h.canvas.height,150);
 h.observers[0].fire();h.observers[0].fire();assert.equal(h.frames.size,1);preview.dispose();
});

test('hidden documents never render and recover the latest map once visible',()=>{
 const h=environment({hidden:true}),calls=[],preview=new Preview(h.canvas,map('before'),{render:recordingRenderer(calls)});
 assert.equal(calls.length,0);h.observers[0].fire();assert.equal(h.frames.size,0);
 h.document.hidden=false;h.document.visibilityState='visible';h.document.fire('visibilitychange');h.flush();assert.equal(calls.length,1);
 h.canvas.fire('pointerdown',{button:0,isPrimary:true,pointerId:4,clientX:10});preview.requestDraw();
 h.document.hidden=true;h.document.visibilityState='hidden';h.document.fire('visibilitychange');
 assert.equal(h.frames.size,0);assert.equal(preview.drag,null);assert.deepEqual(h.canvas.released,[4]);
 const latest=map('latest');preview.setMap(latest,{level:48});assert.equal(calls.length,1);
 h.document.hidden=false;h.document.visibilityState='visible';h.document.fire('visibilitychange');h.flush();
 assert.equal(calls.length,2);assert.equal(calls.at(-1).map,latest);assert.equal(calls.at(-1).view.level,48);preview.dispose();
});

test('camera drag belongs to one primary pointer and emits a view snapshot without per-move frames',()=>{
 const h=environment(),calls=[],changed=[],preview=new Preview(h.canvas,map('drag'),{render:recordingRenderer(calls),onViewChange:view=>changed.push(view),view:{angle:0,focusPlot:2,level:6,labels:false}});
 h.canvas.fire('pointerdown',{button:2,isPrimary:true,pointerId:1,clientX:0});
 h.canvas.fire('pointerdown',{button:0,isPrimary:false,pointerId:2,clientX:0});assert.equal(preview.drag,null);
 h.canvas.fire('pointerdown',{button:0,isPrimary:true,pointerId:7,clientX:10});
 h.canvas.fire('pointerdown',{button:0,isPrimary:true,pointerId:8,clientX:100});
 h.canvas.fire('pointermove',{isPrimary:true,pointerId:8,clientX:120});
 h.canvas.fire('pointermove',{isPrimary:false,pointerId:7,clientX:30});assert.equal(preview.angle,0);
 h.canvas.fire('pointermove',{isPrimary:true,pointerId:7,clientX:30});
 h.canvas.fire('pointermove',{isPrimary:true,pointerId:7,clientX:50});
 assert.ok(Math.abs(preview.angle-.36)<1e-10);assert.equal(changed.length,2);assert.equal(h.frames.size,1);
 assert.equal(changed.at(-1).focusPlot,2);assert.equal(changed.at(-1).level,6);assert.equal(changed.at(-1).labels,false);assert.equal(changed.at(-1).canvas,undefined);
 h.canvas.fire('pointerup',{pointerId:8});assert.notEqual(preview.drag,null);
 h.canvas.fire('pointercancel',{pointerId:7});assert.equal(preview.drag,null);assert.deepEqual(h.canvas.released,[7]);
 h.flush();assert.equal(calls.length,2);preview.dispose();
});

test('keyboard camera controls retain their limits, preserve browser shortcuts and stop when inactive',()=>{
 const h=environment(),changed=[],preview=new Preview(h.canvas,map('keys'),{render:()=>true,onViewChange:view=>changed.push(view),view:{angle:0,zoom:2.5}});
 assert.equal(h.canvas.fire('keydown',{key:'ArrowRight'}).defaultPrevented,true);assert.equal(preview.angle,.12);
 h.canvas.fire('keydown',{key:'+'});assert.equal(preview.zoom,2.5);assert.equal(changed.length,1);
 h.canvas.fire('keydown',{key:'-'});assert.equal(preview.zoom,2.35);
 h.canvas.fire('keydown',{key:'Home'});assert.equal(preview.angle,-.8);assert.equal(preview.zoom,1);
 assert.ok(!h.canvas.fire('keydown',{key:'+',ctrlKey:true}).defaultPrevented);assert.equal(preview.zoom,1);
 assert.ok(!h.canvas.fire('keydown',{key:'Escape'}).defaultPrevented);
 preview.zoom=.5;h.canvas.fire('keydown',{key:'ArrowDown'});assert.equal(preview.zoom,.5);
 preview.setActive(false);const count=changed.length;h.canvas.fire('keydown',{key:'ArrowLeft'});assert.equal(changed.length,count);preview.dispose();
});

test('real renderer reports missing contexts and caught drawing errors, then recovers without remounting',()=>{
 const h=environment(),rendered=[];h.setContext(null);
 assert.equal(drawPreview(h.canvas,map('empty')),false);
 const preview=new Preview(h.canvas,map('empty'),{onRender:(success,error)=>rendered.push({success,error})});
 assert.equal(rendered[0].success,false);assert.equal(rendered[0].error,undefined);
 h.setContext(context());assert.equal(preview.draw(),true);assert.equal(rendered.at(-1).success,true);
 const failure=Error('GPU drawing unavailable');h.setContext({clearRect(){throw failure;}});
 assert.doesNotThrow(()=>preview.draw());assert.equal(rendered.at(-1).success,false);assert.equal(rendered.at(-1).error,failure);
 h.setContext(context());h.observers[0].fire();h.flush();assert.equal(rendered.at(-1).success,true);
 const onePart={...map('part'),stages:[{pos:[0,0,0]}],parts:[{pos:[0,0,0],size:[2,2,2],color:'#ffffff',kind:'decor'}]};
 assert.equal(drawPreview(h.canvas,onePart,{labels:false}),true);
 preview.dispose();
});

test('dispose releases pointer capture, disconnects resize and removes every owned listener',()=>{
 const h=environment(),calls=[],preview=new Preview(h.canvas,map('disposed'),{render:recordingRenderer(calls)});
 h.canvas.fire('pointerdown',{button:0,pointerId:3,clientX:1});preview.requestDraw();assert.equal(h.frames.size,1);
 preview.dispose();preview.dispose();assert.equal(h.frames.size,0);assert.equal(h.observers[0].disconnected,true);
 assert.equal(h.canvas.listenerCount,0);assert.equal(h.document.listenerCount,0);assert.equal(h.window.listenerCount,0);assert.deepEqual(h.canvas.released,[3]);
 h.canvas.fire('pointermove',{pointerId:3,clientX:90});h.observers[0].fire();h.document.fire('visibilitychange');preview.setActive(true);preview.setMap(map('ignored'));h.flush();
 assert.equal(calls.length,1);assert.equal(preview.map.id,'disposed');assert.equal(preview.draw(),null);
});

test('window resize fallback and consumer callback failures cannot break the viewer',()=>{
 const h=environment({observer:false}),calls=[];
 const preview=new Preview(h.canvas,map('fallback'),{render:recordingRenderer(calls),onRender(){throw Error('UI callback');},onViewChange(){throw Error('UI callback');}});
 assert.equal(h.window.listeners.get('resize').size,1);
 assert.doesNotThrow(()=>h.canvas.fire('keydown',{key:'ArrowLeft'}));h.window.fire('resize');assert.equal(h.frames.size,1);h.flush();assert.equal(calls.length,2);
 preview.dispose();assert.equal(h.window.listenerCount,0);
});
