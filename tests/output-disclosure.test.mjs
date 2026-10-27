import test from 'node:test';
import assert from 'node:assert/strict';
import {OutputCenter,DownloadStore} from '../web/output-center.js';
import {generate} from '../web/engine.js';

class Node{
 constructor(root,tag,source){this.root=root;this.tag=tag;this.attrs={};for(const match of source.matchAll(/([\w:-]+)(?:="([^"]*)")?/g))this.attrs[match[1]]=match[2]??'';this.dataset={outputAction:this.attrs['data-output-action']};this.disabled=Object.hasOwn(this.attrs,'disabled');}
 hasAttribute(name){return Object.hasOwn(this.attrs,name);}
 getAttribute(name){return this.attrs[name]??null;}
 closest(selector){return this.tag==='button'&&this.dataset.outputAction?this:null;}
 focus(options){this.root.activeElement=this;this.focusOptions=options;}
}
class Root{
 id='result';hidden=true;attrs={};handlers={};elements=[];scrolls=0;
 set innerHTML(value){this.html=value;this.elements=[...value.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map(match=>new Node(this,match[1],match[2]));}
 get innerHTML(){return this.html??'';}
 addEventListener(type,handler){this.handlers[type]=handler;}
 setAttribute(name,value){this.attrs[name]=value;}
 querySelector(selector){const id=selector.match(/^#(.+)/)?.[1],action=selector.match(/data-output-action="([^"]+)"/)?.[1];return this.elements.find(node=>id?node.attrs.id===id:action?node.dataset.outputAction===action:false)??null;}
 scrollIntoView(){this.scrolls++;}focus(){this.focused=true;}
 click(action){const target=this.querySelector(`button[data-output-action="${action}"]`);assert.ok(target,`${action} button exists`);this.handlers.click({target});}
}
const sample=generate({mode:'tycoon',plots:2,name:'Creators & <Werkstatt>',autoName:false});
function fixture({blocked=false}={}){
 const root=new Root(),revoked=[],requested=[],actions=[],blobs=new Map();let serial=0;
 const downloads=new DownloadStore({createURL:blob=>{const url='blob:disclosure/'+(++serial);blobs.set(url,blob);return url;},revokeURL:url=>{revoked.push(url);blobs.delete(url);},requestFile:file=>{if(blocked)throw Error('browser blocked');requested.push(file);},now:()=>1700000000000});
 const callbacks=Object.fromEntries(['Export','Bundle','RetryScripts','Quality','Maps','Publish','Undo'].map(name=>['on'+name,()=>actions.push(name)]));
 const ui=new OutputCenter(root,{downloads,...callbacks,now:()=>1700000000000});ui.setMap(sample);ui.setScripts('ready');ui.begin('Der Bauplan wird erstellt.');ui.complete();
 return {root,ui,downloads,revoked,requested,actions,blobs,details(){return root.querySelector('#'+ui.detailsId);},summary(){return root.innerHTML.split(`<div id="${ui.detailsId}"`)[0];}};
}

test('details toggle keeps its stable aria target, native focus and compact project status',()=>{
 const h=fixture(),id=h.ui.detailsId,scrolls=h.root.scrolls;
 assert.equal(h.root.querySelector('button[data-output-action="details"]').getAttribute('aria-controls'),id);
 assert.equal(h.details().hasAttribute('hidden'),false);
 h.root.click('details');assert.equal(h.ui.collapsed,true);assert.equal(h.details().hasAttribute('hidden'),true);
 const toggle=h.root.querySelector('button[data-output-action="details"]');assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(toggle.getAttribute('aria-controls'),id);
 assert.equal(h.root.activeElement,toggle);assert.deepEqual(toggle.focusOptions,{preventScroll:true});assert.equal(h.root.scrolls,scrolls);
 assert.match(h.summary(),/Creators &amp; &lt;Werkstatt&gt;/);assert.match(h.summary(),/Deine Map ist fertig/);assert.match(h.summary(),/Noch keine Datei erstellt/);assert.match(h.summary(),/Details anzeigen/);
 h.root.click('details');assert.equal(h.ui.collapsed,false);assert.equal(h.details().hasAttribute('hidden'),false);assert.equal(h.root.querySelector('button[data-output-action="details"]').getAttribute('aria-expanded'),'true');assert.match(h.root.innerHTML,/Details ausblenden/);
 assert.deepEqual(h.actions,[]);assert.deepEqual(h.revoked,[]);h.downloads.dispose();
});

test('collapsing preserves every download and exposes the newest file without reopening details',async()=>{
 const h=fixture();
 for(let i=0;i<4;i++)h.ui.download(`Map-${i}.rbxlx`,`real bytes ${i}`,'application/xml');
 const files=[...h.downloads.files],urls=files.map(file=>file.url),latest=files[0];h.root.click('details');
 assert.equal(h.ui.collapsed,true);assert.match(h.summary(),/4 Dateien bereit/);assert.ok(h.summary().includes(`href="${latest.url}"`));assert.ok(h.summary().includes(`download="${latest.name}"`));
 for(const file of files){assert.ok(h.root.innerHTML.includes(file.url));assert.equal(await h.blobs.get(file.url).text(),'real bytes '+file.name.match(/Map-(\d)/)[1]);}
 h.root.click('details');h.root.click('details');assert.deepEqual(h.downloads.files,files);assert.deepEqual(h.downloads.files.map(file=>file.url),urls);assert.deepEqual(h.revoked,[]);
 const next=h.ui.download('Cover.png','PNG','image/png');assert.equal(h.ui.collapsed,true);assert.equal(h.downloads.files[0],next);assert.ok(h.summary().includes(next.url));assert.deepEqual(h.revoked,[files.at(-1).url]);
 h.downloads.dispose();assert.equal(h.blobs.size,0);
});

test('new work and every actionable failure reopen the details',()=>{
 const transitions=[
  ui=>ui.begin('Neue Map wird gebaut'),ui=>ui.beginExport('map'),ui=>ui.exportFailed('Export konnte nicht erstellt werden'),ui=>ui.fail('Bau konnte nicht fertiggestellt werden'),
  ui=>ui.setScripts('failed'),ui=>ui.setMap(sample,[{id:'route',status:'error',title:'Weg blockiert'}]),ui=>ui.setPersistence(false),
 ];
 for(const transition of transitions){const h=fixture();h.ui.setCollapsed(true);transition(h.ui);assert.equal(h.ui.collapsed,false);assert.equal(h.details().hasAttribute('hidden'),false);h.downloads.dispose();}
 const blocked=fixture({blocked:true});blocked.ui.setCollapsed(true);const file=blocked.ui.download('Ergebnis.txt','bytes');assert.equal(file.requested,false);assert.equal(blocked.ui.collapsed,false);assert.match(blocked.root.innerHTML,/Nutze den Dateilink/);blocked.downloads.dispose();
});

test('a repeated acknowledged layout warning stays collapsed; a different failure opens at the same count',()=>{
 const h=fixture(),first={id:'route',status:'error',title:'Weg blockiert',detail:'Werkhalle'},second={id:'products',status:'error',title:'Doppelte Produkt-ID'};
 h.ui.setMap(sample,[first]);h.ui.setCollapsed(true);h.ui.setMap(sample,[first]);assert.equal(h.ui.collapsed,true);
 h.ui.setMap(sample,[second]);assert.equal(h.ui.collapsed,false);h.ui.setCollapsed(true);h.ui.setMap(sample,[]);assert.equal(h.ui.collapsed,true);
 h.ui.setMap(sample,[first]);assert.equal(h.ui.collapsed,false);h.ui.setCollapsed(true);assert.match(h.summary(),/1 Layoutfehler/);h.downloads.dispose();
});

test('routine map state updates keep the chosen compact mode and leave undo directly accessible',()=>{
 const h=fixture();h.ui.setCollapsed(true);h.ui.setMap(sample);h.ui.setUndo(true);h.ui.setPersistence(true);h.ui.setScripts('ready');h.ui.endExport();h.ui.restored({updatedAt:1700000000000});
 assert.equal(h.ui.collapsed,true);assert.match(h.summary(),/Vorherige Map wiederherstellen/);h.root.click('undo');assert.deepEqual(h.actions,['Undo']);
 h.ui.beginExport('bundle');assert.equal(h.ui.collapsed,false);h.ui.setCollapsed(true);assert.equal(h.root.querySelector('button[data-output-action="undo"]').disabled,true);h.root.click('undo');assert.deepEqual(h.actions,['Undo']);h.downloads.dispose();
});

test('existing export, recovery, navigation and quality actions retain their guards',()=>{
 const h=fixture();h.root.click('map');h.root.click('bundle');h.root.click('maps');
 h.ui.download('Map.rbxlx','XML');h.root.click('publish');assert.deepEqual(h.actions,['Export','Bundle','Maps','Publish']);
 h.ui.setScripts('failed');h.root.click('retry');h.root.click('map');assert.deepEqual(h.actions,['Export','Bundle','Maps','Publish','RetryScripts']);
 h.ui.setScripts('ready');h.ui.setMap(sample,[{status:'error'}]);h.root.click('quality');h.root.click('bundle');assert.deepEqual(h.actions,['Export','Bundle','Maps','Publish','RetryScripts','Quality']);
 h.ui.setCollapsed(true);h.ui.exportFailed('<Browserfehler>');assert.match(h.summary(),/&lt;Browserfehler&gt;/);assert.equal(h.root.attrs['data-output-state'],'error');assert.ok(!h.root.innerHTML.includes('<Browserfehler>'));h.downloads.dispose();
});

test('each result centre gets a unique disclosure target',()=>{
 const first=fixture(),second=fixture();assert.notEqual(first.ui.detailsId,second.ui.detailsId);first.ui.setCollapsed(true);assert.equal(second.ui.collapsed,false);first.downloads.dispose();second.downloads.dispose();
});
