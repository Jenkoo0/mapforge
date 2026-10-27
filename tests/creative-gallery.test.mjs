import test from 'node:test';
import assert from 'node:assert/strict';
import {CreativeStudio} from '../web/creative-ui.js';
import {CREATIVE_DIRECTIONS,CREATIVE_VARIANT_COUNT} from '../web/creative-directions.js';
import {normalize} from '../web/engine.js';
import {Preview} from '../web/preview.js';

class Events{
 listeners=new Map();
 addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);}
 removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
 fire(type,props={}){const event={type,target:this,preventDefault(){this.defaultPrevented=true;},...props};for(const listener of this.listeners.get(type)??[])listener(event);return event;}
}
const camel=name=>name.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
class Element extends Events{
 constructor(tag,attrs,document){super();this.tag=tag;this.attrs={};this.dataset={};this.ownerDocument=document;this.textContent='';this.value='';this.hidden=false;this.disabled=false;this._html='';for(const match of attrs.matchAll(/([\w:-]+)(?:="([^"]*)")?/g))this.setAttribute(match[1],match[2]??'');this.hidden=Object.hasOwn(this.attrs,'hidden');this.disabled=Object.hasOwn(this.attrs,'disabled');}
 setAttribute(name,value){this.attrs[name]=String(value);if(name==='id')this.id=String(value);if(name==='value')this.value=String(value);if(name.startsWith('data-'))this.dataset[camel(name.slice(5))]=String(value);}
 getAttribute(name){return this.attrs[name]??null;}
 hasAttribute(name){return Object.hasOwn(this.attrs,name);}
 removeAttribute(name){delete this.attrs[name];}
 matches(selector){return selector.split(',').some(part=>{const rule=part.trim(),attribute=rule.match(/\[([\w-]+)(?:="([^"]*)")?\]/);if(rule.startsWith('#'))return this.id===rule.slice(1);if(rule.startsWith('.'))return (this.attrs.class??'').split(/\s+/).includes(rule.slice(1));if(attribute)return Object.hasOwn(this.attrs,attribute[1])&&(attribute[2]===undefined||this.attrs[attribute[1]]===attribute[2]);return this.tag===rule;});}
 closest(selector){return this.matches(selector)?this:null;}
 getBoundingClientRect(){return {width:720,height:420};}
 setPointerCapture(){}releasePointerCapture(){}focus(options){this.ownerDocument.activeElement=this;this.focusOptions=options;}scrollIntoView(options){(this.scrolls??=[]).push(options);}
 set innerHTML(value){this._html=value;}get innerHTML(){return this._html;}
}
class Root extends Events{
 constructor(document){super();this.ownerDocument=document;this.elements=[];}
 set innerHTML(value){this._html=value;this.elements=[...value.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map(match=>new Element(match[1],match[2],this.ownerDocument));}
 get innerHTML(){return this._html;}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 querySelectorAll(selector){return this.elements.filter(element=>element.matches(selector));}
}
function harness(){
 const document=new Events(),window=new Events(),frames=new Map();let serial=0,current=normalize({mode:'tycoon',name:'Meine Werkstatt',autoName:false,plots:2,shop:false,cashSmallId:'9876'}),viewers=0;
 document.defaultView=window;document.hidden=false;document.visibilityState='visible';window.devicePixelRatio=1;
 window.requestAnimationFrame=callback=>{const id=++serial;frames.set(id,callback);return id;};window.cancelAnimationFrame=id=>frames.delete(id);
 const root=new Root(document),painted=[],opened=[],covers=[];
 const lab=new CreativeStudio(root,{getConfig:()=>current,onPreview:config=>{opened.push(config);return true;},onArtwork:(map,direction)=>{covers.push({map,direction});return true;},renderPreview:()=>true,renderArtwork:(canvas,map,options)=>{painted.push({canvas,map,options});return true;},createPreview:(...args)=>{viewers++;return new Preview(...args);}});
 const visible=()=>root.querySelectorAll('[data-creative-direction]').filter(button=>!button.hidden).map(button=>button.dataset.creativeDirection);
 return {lab,root,document,window,frames,painted,opened,covers,visible,get config(){return current;},get viewers(){return viewers;},change(values){current=normalize({...current,...values});},flushOne(){const queued=[...frames.values()];frames.clear();for(const callback of queued)callback(16);},flushAll(){let count=0;while(frames.size){assert.ok(++count<30,'drawing must finish without a recurring loop');this.flushOne();}return count;}};
}

test('gallery shows six worlds per page and lazily paints only those covers with one interactive viewer',()=>{
 const h=harness();try{
  assert.equal(CREATIVE_DIRECTIONS.length,12);assert.equal(CREATIVE_DIRECTIONS.length*CREATIVE_VARIANT_COUNT,36);
  assert.deepEqual(h.visible(),CREATIVE_DIRECTIONS.slice(0,6).map(direction=>direction.id));assert.equal(h.frames.size,0);assert.equal(h.painted.length,0);
  assert.ok(h.root.innerHTML.includes('36 Entwürfe'));h.lab.setActive(true);h.flushAll();
  assert.equal(h.painted.length,6);assert.equal(h.viewers,1);assert.ok(h.painted.every(item=>item.options.title===''&&item.options.subtitle===''&&item.options.format==='landscape'));
  assert.equal(h.lab.setPage(1),true);h.flushAll();assert.deepEqual(h.visible(),CREATIVE_DIRECTIONS.slice(6,12).map(direction=>direction.id));assert.equal(h.painted.length,12);assert.equal(h.viewers,1);
  assert.equal(h.lab.setPage(0),true);h.flushAll();assert.equal(h.painted.length,12);
  h.lab.setActive(false);h.lab.setActive(true);h.flushAll();assert.equal(h.painted.length,12);assert.equal(h.frames.size,0);
  assert.equal(h.opened.length,0);assert.equal(h.covers.length,0);assert.equal(h.config.name,'Meine Werkstatt');
 }finally{h.lab.dispose();}
});

test('search, mode filters and pagination preserve the separate draft and announce real result counts',()=>{
 const h=harness();try{
  h.lab.setActive(true);h.flushAll();const original=h.lab.draft,config=structuredClone(h.config),search=h.root.querySelector('#creativeDirectionSearch');
  search.value='kUPFERpause';h.root.fire('input',{target:search});h.flushAll();assert.deepEqual(h.visible(),['kupferpause']);assert.equal(h.lab.draft,original);
  assert.equal(h.root.querySelector('[data-creative-count]').textContent,'1 von 12 Welten');assert.match(h.root.querySelector('#creativeGalleryStatus').textContent,/1–1 von 1 Welten/);
  h.lab.setSearch('keine-welt-xyz');h.flushAll();assert.deepEqual(h.visible(),[]);assert.equal(h.root.querySelector('[data-creative-empty]').hidden,false);
  assert.ok(h.root.querySelectorAll('[data-creative-page]').every(button=>button.disabled));assert.equal(h.lab.setPage(1),false);
  h.lab.resetGallery();h.lab.setFilter('obby');h.flushAll();assert.equal(h.visible().length,6);assert.ok(h.visible().every(id=>CREATIVE_DIRECTIONS.find(direction=>direction.id===id).mode==='obby'));
  h.lab.setSearch('Tautreppe');h.flushAll();assert.deepEqual(h.visible(),['tautreppe']);h.lab.select('nachtgarten');h.flushAll();
  assert.equal(h.lab.search,'');assert.ok(h.visible().includes('nachtgarten'));assert.equal(h.root.querySelector('[data-creative-direction="nachtgarten"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(h.config,config);assert.equal(h.opened.length,0);assert.equal(h.covers.length,0);
 }finally{h.lab.dispose();}
});

test('queued gallery drawing cancels on inactive, busy, stale revision, hidden documents and disposal',()=>{
 const h=harness();try{
  h.lab.setActive(true);h.lab.setActive(false);h.flushAll();assert.equal(h.painted.length,0);assert.equal(h.frames.size,0);
  h.lab.setActive(true);h.lab.setBusy(true);h.flushAll();assert.equal(h.painted.length,0);assert.equal(h.lab.setSearch('Wolke'),false);assert.equal(h.lab.setPage(1),false);
  h.lab.setBusy(false);h.change({cashSmallId:'54321',plots:3});h.flushAll();assert.equal(h.painted.length,0);
  h.lab.refresh();h.flushAll();assert.equal(h.painted.length,6);assert.ok(h.painted.every(item=>item.map.config.cashSmallId==='54321'&&item.map.config.plots===3));
  h.lab.setPage(1);h.document.hidden=true;h.document.visibilityState='hidden';h.document.fire('visibilitychange');h.flushAll();assert.equal(h.painted.length,6);
  h.document.hidden=false;h.document.visibilityState='visible';h.document.fire('visibilitychange');h.flushAll();assert.equal(h.painted.length,12);
  h.lab.setPage(0);h.change({name:'Anderer Entwurf'});h.lab.refresh();h.lab.dispose();h.flushAll();assert.equal(h.painted.length,12);assert.equal(h.frames.size,0);
  assert.equal(h.document.listeners.get('visibilitychange').size,0);assert.equal(h.root.listeners.get('input').size,0);
 }finally{h.lab.dispose();}
});

test('failed card artwork has a bounded fallback and recovers on later activation without extra viewers',()=>{
 const h=harness();try{
  let attempts=0;h.lab.renderArtwork=()=>{attempts++;return false;};h.lab.setActive(true);h.flushAll();assert.equal(attempts,6);assert.equal(h.frames.size,0);
  assert.ok(h.root.querySelectorAll('[data-creative-card-artwork]').filter(canvas=>h.visible().includes(canvas.dataset.creativeCardArtwork)).every(canvas=>canvas.getAttribute('data-artwork-state')==='unavailable'));
  assert.equal(h.root.querySelector('.creative-stage').getAttribute('data-preview-state'),'ready');
  h.lab.renderArtwork=()=>{attempts++;return true;};h.lab.setActive(false);h.lab.setActive(true);h.flushAll();assert.equal(attempts,12);assert.equal(h.viewers,1);
 }finally{h.lab.dispose();}
});

test('mobile jump buttons scroll only on explicit clicks and focus the search or usable preview',()=>{
 const h=harness();try{
  h.lab.setActive(true);h.flushAll();const palette=h.root.querySelector('.creative-palette'),stage=h.root.querySelector('.creative-stage'),canvas=h.root.querySelector('[data-creative-canvas]'),search=h.root.querySelector('#creativeDirectionSearch');
  h.lab.setSearch('Kupferpause');h.lab.select('nachtgarten');h.flushAll();assert.equal(palette.scrolls,undefined);assert.equal(stage.scrolls,undefined);
  const discover=h.root.querySelector('[data-creative-jump="gallery"]'),back=h.root.querySelector('[data-creative-jump="preview"]');assert.equal(discover.hasAttribute('href'),false);assert.equal(back.hasAttribute('href'),false);
  h.root.fire('click',{target:discover});assert.deepEqual(palette.scrolls,[{block:'start',behavior:'instant'}]);assert.equal(h.document.activeElement,search);assert.deepEqual(search.focusOptions,{preventScroll:true});
  h.root.fire('click',{target:back});assert.deepEqual(stage.scrolls,[{block:'start',behavior:'instant'}]);assert.equal(h.document.activeElement,canvas);assert.deepEqual(canvas.focusOptions,{preventScroll:true});
  h.lab.renderPreview=()=>false;h.lab.moveCamera('reset');h.flushAll();h.root.fire('click',{target:back});assert.equal(h.document.activeElement,stage);assert.equal(stage.getAttribute('tabindex'),'-1');assert.deepEqual(stage.focusOptions,{preventScroll:true});
  h.lab.setActive(false);assert.equal(h.lab.jump('gallery'),false);assert.equal(palette.scrolls.length,1);assert.equal(h.lab.jump('unknown'),false);
 }finally{h.lab.dispose();}
});

test('story follows the visible choice and Cover gestalten passes the exact current or remembered map safely',()=>{
 const h=harness();try{
  h.lab.setActive(true);h.flushAll();const first=h.lab.draft.map,direction=h.lab.direction();
  assert.equal(h.root.querySelector('#creativeStoryPanel').hidden,false);assert.equal(h.root.querySelector('[data-creative-story-premise]').textContent,direction.story.premise);
  assert.equal(h.root.querySelector('[data-creative-story-role]').textContent,direction.story.playerRole);
  assert.equal(h.root.querySelector('[data-creative-story-details]').tag,'details');assert.equal(h.root.querySelector('[data-creative-story-details]').hasAttribute('open'),false);
  assert.equal(h.root.querySelector('#creative-story-chapters-summary').tag,'summary');
  assert.equal([...h.root.querySelector('[data-creative-story-chapters]').innerHTML.matchAll(/<li>/g)].length,3);
  h.lab.remember();h.lab.stepVariant(1);h.lab.compare(true);assert.equal(h.lab.artwork(),true);
  assert.equal(h.covers.length,1);assert.equal(h.covers[0].map,first);assert.equal(h.covers[0].direction,direction);assert.equal(h.opened.length,0);
  h.lab.setBusy(true);assert.equal(h.lab.artwork(),false);h.lab.setBusy(false);
  h.change({cashSmallId:'12345'});assert.equal(h.lab.artwork(),false);assert.equal(h.covers.length,1);assert.equal(h.lab.artwork(),true);assert.equal(h.covers.at(-1).map.config.cashSmallId,'12345');
  h.lab.setActive(false);assert.equal(h.lab.artwork(),false);h.lab.dispose();assert.equal(h.lab.artwork(),false);
 }finally{h.lab.dispose();}
});
