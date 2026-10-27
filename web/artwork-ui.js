import {ARTWORK_FORMATS,artworkComposition,drawMapArtwork,artworkPng} from './map-artwork.js';
import {safeFilename} from './engine.js';

export class ArtworkStudio{
 constructor(root,{download,toast=()=>{},getBusy=()=>false,render=drawMapArtwork,encode=artworkPng,createCanvas=()=>root.ownerDocument?.createElement('canvas')??globalThis.document.createElement('canvas')}={}){
  Object.assign(this,{root,download,toast,getBusy,render,encode,createCanvas});this.map=null;this.format='landscape';this.pending=false;this.disposed=false;this.sequence=0;this.listeners=[];this.drafts=new Map();this.draftKey=null;
  this.canvas=this.$('artworkCanvas');this.status=this.$('artworkStatus');
  this.listen(this.$('artworkClose'),'click',()=>this.close());this.listen(root,'cancel',event=>{event.preventDefault();this.close();});
  for(const id of ['artworkTitle','artworkSubtitle','artworkCamera','artworkScope','artworkLayout','artworkZoom'])this.listen(this.$(id),'input',()=>this.paint());
  for(const button of root.querySelectorAll('[data-artwork-format]'))this.listen(button,'click',()=>{if(!this.pending){this.format=button.dataset.artworkFormat;this.paint();}});
  this.listen(this.$('artworkDownload'),'click',()=>this.export());
 }
 $(id){return this.root.querySelector('#'+id);}
 listen(el,event,fn){el.addEventListener(event,fn);this.listeners.push([el,event,fn]);}
 open(map,direction){
  if(this.disposed||this.pending||this.getBusy()||!map)return false;
  this.map=map;this.direction=direction;this.sequence++;this.draftKey=map.version+'|'+map.key+'|'+JSON.stringify(map.config);
  const saved=this.drafts.get(this.draftKey);this.format=saved?.format||'landscape';
  this.$('artworkTitle').value=saved?.title??(map.config.autoName===false?map.config.name:direction?.title||map.config.name);
  this.$('artworkSubtitle').value=saved?.subtitle??direction?.hook??'';this.$('artworkCamera').value=saved?.camera||'left';this.$('artworkScope').value=saved?.scope||'detail';this.$('artworkLayout').value=saved?.layout||(map.config.mode==='obby'?'cinematic':'editorial');this.$('artworkZoom').value=saved?.zoom??1;this.$('artworkScopeRow').hidden=map.config.mode!=='tycoon';
  this.root.showModal();this.paint();return true;
 }
 options(){return {title:this.$('artworkTitle').value,subtitle:this.$('artworkSubtitle').value,format:this.format,angle:this.$('artworkCamera').value==='right'?.8:-.8,plan:this.$('artworkCamera').value==='plan',scope:this.$('artworkScope').value,...artworkComposition({layout:this.$('artworkLayout').value,zoom:this.$('artworkZoom').value})};}
 syncFields(){const options=this.options();this.$('artworkTitleRow').hidden=options.layout==='image';this.$('artworkSubtitleRow').hidden=this.format==='square'||options.layout==='image';this.$('artworkZoomOutput').textContent=Math.round(options.zoom*100)+' %';}
 remember(){if(!this.draftKey)return;this.drafts.delete(this.draftKey);this.drafts.set(this.draftKey,{title:this.$('artworkTitle').value,subtitle:this.$('artworkSubtitle').value,format:this.format,camera:this.$('artworkCamera').value,scope:this.$('artworkScope').value,...artworkComposition({layout:this.$('artworkLayout').value,zoom:this.$('artworkZoom').value})});while(this.drafts.size>8)this.drafts.delete(this.drafts.keys().next().value);}
 paint(){
  if(this.disposed||this.pending||!this.map)return false;
  const spec=ARTWORK_FORMATS[this.format]||ARTWORK_FORMATS.landscape;this.format=this.format==='square'?'square':'landscape';
  this.canvas.width=this.format==='square'?512:960;this.canvas.height=this.format==='square'?512:540;
  this.syncFields();this.remember();
  this.canvas.style.aspectRatio=this.format==='square'?'1 / 1':'16 / 9';this.canvas.setAttribute('aria-label',spec.label+' für '+this.map.config.name);
  for(const b of this.root.querySelectorAll('[data-artwork-format]'))b.setAttribute('aria-pressed',String(b.dataset.artworkFormat===this.format));
  const ok=this.render(this.canvas,this.map,this.options());this.$('artworkDownload').disabled=!ok;this.status.textContent=ok?spec.label+' · PNG aus deiner tatsächlichen Map-Geometrie':'Bildvorschau nicht verfügbar. Bitte später erneut versuchen.';return ok;
 }
 async export(){
  if(this.pending||this.disposed||!this.map||this.getBusy())return false;
  const sequence=this.sequence,map=this.map,options=this.options(),spec=ARTWORK_FORMATS[options.format];this.pending=true;this.controls(true);this.status.textContent='Dein Bild wird in voller Auflösung erstellt …';
  try{
   const canvas=this.createCanvas();canvas.width=spec.width;canvas.height=spec.height;
   if(!this.render(canvas,map,options))throw Error('Das Bild konnte nicht gezeichnet werden.');
   const blob=await this.encode(canvas);if(this.disposed||sequence!==this.sequence)return false;
   this.download(safeFilename(options.title||map.config.name)+(options.format==='square'?'-Icon.png':'-Thumbnail.png'),blob,'image/png');
   this.status.textContent=spec.label+' bereit · '+Math.round(blob.size/1024)+' KB';this.toast('Cover erstellt. Den Download findest du bei Ergebnis & Downloads.');return true;
  }catch(error){if(!this.disposed&&sequence===this.sequence)this.status.textContent=error.message||'Bildexport fehlgeschlagen. Bitte erneut versuchen.';return false;}
  finally{if(sequence===this.sequence){this.pending=false;if(!this.disposed){this.controls(false);this.syncFields();}}}
 }
 controls(disabled){for(const el of this.root.querySelectorAll('input,select,button'))el.disabled=disabled;this.$('artworkClose').disabled=false;this.root.setAttribute('aria-busy',String(disabled));}
 close(){this.root.close();this.remember();this.map=null;this.pending=false;this.sequence++;this.controls(false);return true;}
 dispose(){this.disposed=true;this.sequence++;this.map=null;this.pending=false;this.drafts.clear();for(const [el,event,fn] of this.listeners)el.removeEventListener(event,fn);this.listeners=[];}
}
