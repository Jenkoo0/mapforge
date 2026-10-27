// Executes the actual application with DOM/service doubles. This is not browser QA.
import {readFile} from 'node:fs/promises';
import {OutputCenter,DownloadStore} from '../../web/output-center.js';
import {BotStudio as RealBotStudio} from '../../web/bot-ui.js';
import {normalize} from '../../web/engine.js';
class ElementDouble{
 constructor(doc,id='',attrs=''){this.doc=doc;this.id=id;this.attrs={};this.style={setProperty(name,value){this[name]=value;}};this.dataset={};this.handlers={};this.innerHTML=id;this.textContent='';this.hidden=false;this.disabled=false;this.value=attrs.match(/\bvalue="([^"]*)"/)?.[1]||'';this.checked=/\bchecked\b/.test(attrs);this.classes=new Set((attrs.match(/class="([^"]*)"/)?.[1]||'').split(/\s+/));this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};for(const m of attrs.matchAll(/data-([\w-]+)="([^"]*)"/g))this.dataset[m[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[2];}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 removeEventListener(type,fn){this.handlers[type]=(this.handlers[type]||[]).filter(handler=>handler!==fn);}
 getBoundingClientRect(){return {width:960,height:580};}
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 querySelector(selector){return selector.startsWith('#')?this.doc.getElementById(selector.slice(1)):this.doc.getElementById(this.id+'-'+selector);}
 querySelectorAll(selector){return this.doc.querySelectorAll(selector);}
 matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s.startsWith('#'))return s.slice(1)===this.id;if(s.startsWith('.'))return this.classes.has(s.slice(1));const attr=s.match(/\[data-([\w-]+)\]/);return attr?Object.hasOwn(this.dataset,attr[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):s==='button';});}
 closest(selector){return this.matches(selector)?this:null;}
 append(node){(this.children??=[]).push(node);}
 remove(){}focus(){this.focused=true;}select(){this.selected=true;}scrollIntoView(){}click(){}
}
export async function appHarness({config={mode:'obby'},failScripts=false,storageEntries=null,failStorage=false}={}){
 const [html,rawSource]=await Promise.all(['index.html','app.js'].map(name=>readFile(new URL('../../web/'+name,import.meta.url),'utf8')));
 const source=rawSource.replace(/\r\n/g,'\n');
 const all=[],nodes=new Map(),doc={getElementById(id){if(!nodes.has(id)){const el=new ElementDouble(doc,id);nodes.set(id,el);all.push(el);}return nodes.get(id);},querySelectorAll(selector){return all.filter(el=>el.matches(selector));},querySelector(selector){return this.getElementById(selector);},createElement(tag){return new ElementDouble(doc,tag);}};doc.body=new ElementDouble(doc,'body');
 for(const m of html.matchAll(/<[a-z][\w-]*\b([^>]*)>/gi)){const id=m[1].match(/\bid="([^"]*)"/)?.[1];if(!id&&!/data-|class="(?:page|nav-item)/.test(m[1]))continue;const el=new ElementDouble(doc,id||'anonymous-'+all.length,m[1]);all.push(el);if(id)nodes.set(id,el);}
 const storage=storageEntries?new Map(storageEntries):new Map([['mapforge.config.v3',JSON.stringify(normalize(config))]]),blobs=new Map(),requested=[],bots=[];let serial=0,generations=0,scriptFailure=failScripts;
 const deps={};for(const m of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)){const exports=await import(new URL('../../web/'+m[2].replace('./',''),import.meta.url));for(const name of m[1].split(',').map(s=>s.trim()))deps[name]=exports[name];}
 const actualGenerate=deps.generate;deps.generate=(...args)=>{generations++;return actualGenerate(...args);};
 deps.OutputCenter=class extends OutputCenter{constructor(root,options){super(root,{...options,downloads:new DownloadStore({createURL:blob=>{const url='blob:app/'+(++serial);blobs.set(url,blob);return url;},revokeURL:url=>blobs.delete(url),requestFile:file=>requested.push({...file})})});}};
 deps.Preview=class{constructor(){this.level=48;this.angle=-.8;this.zoom=1;this.plan=false;this.path=false;}setMap(){}draw(){}setActive(){}dispose(){}};
 for(const name of ['ShopSetup','Walkthrough','PlaytestLab','ImproveView','UploadAssistant'])deps[name]=class{refresh(){}current(){return [];}run(){}import(){}};
 deps.TrendView=class{constructor(opts){Object.assign(this,opts);}async refresh(){return null;}async beforeGenerate(){return null;}};
 deps.BotStudio=class extends RealBotStudio{constructor(...args){super(...args);bots.push(this);}};
 const priorDocument=globalThis.document,priorRAF=globalThis.requestAnimationFrame;
 const raf=fn=>setImmediate(fn);doc.defaultView={requestAnimationFrame:raf,cancelAnimationFrame:clearImmediate,devicePixelRatio:1,addEventListener(){},removeEventListener(){},scrollTo(){}};globalThis.document=doc;globalThis.requestAnimationFrame=raf;
 const globals={document:doc,window:doc.defaultView,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(failStorage)throw Error('quota');storage.set(k,v);}},location:{hash:'#generator'},history:{replaceState(){}},requestAnimationFrame:raf,setTimeout:()=>1,clearTimeout(){},fetch:async file=>({ok:!scriptFailure,text:()=>readFile(new URL('../../web/'+file,import.meta.url),'utf8')})};
 const importsRemoved=source.replace(/^import \{[^}]+\} from '[^']+';\n/gm,'');
 const bindings={...deps,...globals};
 const app=new Function(...Object.keys(bindings),importsRemoved+'\nreturn {manualGenerate,exportMap,exportBundle,update,loadScripts,output,vault,openSavedMap,undoOpenMap,saveCurrentMap,navigate,get preview(){return preview;},get creativeStudio(){return creativeStudio;},get myMaps(){return myMaps;},get config(){return config;},get map(){return map;},get trendView(){return trendView;}};')(...Object.values(bindings));
 await app.loadScripts();
 return {app,doc,bots,blobs,requested,storage,get generations(){return generations;},setScriptFailure(value){scriptFailure=value;},async click(id){const el=doc.getElementById(id);if(el.disabled)return;return Promise.all((el.handlers.click||[]).map(fn=>fn({target:el})));},dispose(){app.output.downloads.dispose();globalThis.document=priorDocument;globalThis.requestAnimationFrame=priorRAF;}};
}
