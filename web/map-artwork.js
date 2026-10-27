import {drawPreview} from './preview.js';

export const ARTWORK_FORMATS=Object.freeze({landscape:Object.freeze({width:1920,height:1080,label:'Thumbnail · 1920 × 1080'}),square:Object.freeze({width:512,height:512,label:'Spiel-Icon · 512 × 512'})});
export const ARTWORK_LAYOUTS=Object.freeze({editorial:'Titel links',cinematic:'Großes Motiv',image:'Nur die Welt'});
export function artworkComposition(input={}){const number=Number(input.zoom);return {layout:Object.hasOwn(ARTWORK_LAYOUTS,input.layout)?input.layout:'editorial',zoom:Number.isFinite(number)&&number>0?Math.max(.7,Math.min(1.4,number)):1};}
const palettes={sky:['#192735','#d6f3a6','#eaf4ee'],neon:['#181d31','#78f0d0','#e9f1ff'],lava:['#271f2b','#ffc181','#fff0e2'],jungle:['#172c31','#c9e7a3','#edf3df']};
const clean=(text,max)=>String(text??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

export function artworkTextLines(ctx,text,width,maxLines=3){
 const words=clean(text,180).split(' ').filter(Boolean),lines=[];let line='';
 for(const word of words){
  if(ctx.measureText(word).width>width){
   if(line){lines.push(line);line='';}
   for(const character of Array.from(word)){if(line&&ctx.measureText(line+character).width>width){lines.push(line);line=character;}else line+=character;}
  }else{const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}
 }
 if(line)lines.push(line);
 if(lines.length>maxLines){lines.length=maxLines;let tail=lines.at(-1);while(tail&&ctx.measureText(tail+'…').width>width)tail=tail.slice(0,-1);lines[maxLines-1]=tail+'…';}
 return lines;
}

/** Artwork uses the actual map, without invented characters or gameplay. */
export function drawMapArtwork(canvas,map,{title=map?.config?.name||'',subtitle='',format='landscape',angle=-.8,plan=false,scope='detail',layout='editorial',zoom=1,renderScene=drawPreview,createCanvas=()=>canvas.ownerDocument?.createElement('canvas')??globalThis.document?.createElement('canvas')}={}){
 try{
  const ctx=canvas.getContext('2d');if(!ctx||!map?.config||!Array.isArray(map.parts))return false;
  const w=canvas.width,h=canvas.height;if(!(w>0&&h>0))return false;
  const composition=artworkComposition({layout,zoom}),cinematic=composition.layout==='cinematic';
  const square=format==='square',text=clean(title,70),caption=clean(subtitle,100),[dark,accent,light]=palettes[map.config.theme]||palettes.sky;
  const view={events:scope==='arena',angle:Number.isFinite(angle)?angle:-.8,zoom:(square?.95:.92)*composition.zoom,plan:plan===true,focusPlot:map.config.mode==='tycoon'&&scope!=='all'&&scope!=='arena'?1:0,level:48,labels:false,proportionalPadding:true};
  ctx.clearRect(0,0,w,h);ctx.fillStyle=dark;ctx.fillRect(0,0,w,h);
  if(!text||composition.layout==='image'){if(renderScene(canvas,map,view)===false)return false;ctx.fillStyle=accent;ctx.fillRect(0,h-3,w,3);return true;}
  const scene=createCanvas();if(!scene?.getContext)return false;
  scene.width=Math.max(1,Math.round(w*(square||cinematic?1:.84)));scene.height=Math.max(1,Math.round(h*(square&&!cinematic?.82:1)));
  if(renderScene(scene,map,view)===false)return false;
  ctx.drawImage(scene,square||cinematic?0:w*.19,square&&!cinematic?-h*.015:0,scene.width,scene.height);
  const fade=square||cinematic?ctx.createLinearGradient(0,h*(cinematic?.20:.46),0,h):ctx.createLinearGradient(0,0,w*.70,0);
  if(cinematic){fade.addColorStop(0,dark+'00');fade.addColorStop(.7,dark+'dd');fade.addColorStop(1,dark);}
  else{
  fade.addColorStop(0,square?dark+'00':dark);fade.addColorStop(square?1:.48,dark);if(!square)fade.addColorStop(1,dark+'00');
  }
  ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);
  const pad=w*(square?.065:.06),font=w*(square?.096:.044),maxWidth=w*(square?.87:cinematic?.83:.40),lineHeight=font*1.06;
  ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle=accent;ctx.font=`650 ${w*(square?.024:.011)}px system-ui, sans-serif`;
  ctx.fillText(scope==='arena'?'MINISPIEL':map.config.mode==='tycoon'?'TYCOON':map.config.obbyStyle==='onlyup'?'ONLY UP':'OBBY',pad,square?h*.65:h*(cinematic?.47:.15));
  ctx.font=`850 ${font}px system-ui, sans-serif`;ctx.fillStyle=light;
  const lines=artworkTextLines(ctx,text,maxWidth,square||cinematic?2:4),start=square?h*.71:h*(cinematic?.55:.24);
  lines.forEach((line,i)=>ctx.fillText(line,pad,start+i*lineHeight));
  if(caption&&!square){ctx.font=`450 ${w*.0135}px system-ui, sans-serif`;ctx.fillStyle='#c5d0cf';const y=start+lines.length*lineHeight+h*.05;artworkTextLines(ctx,caption,maxWidth,3).forEach((line,i)=>ctx.fillText(line,pad,y+i*w*.020));}
  ctx.fillStyle=accent;ctx.fillRect(pad,square?h*.965:h*(cinematic?.92:.82),w*(square?.12:.065),Math.max(2,h*.006));
  return true;
 }catch{return false;}
}

export function artworkPng(canvas,{timeoutMs=15000}={}){
 return new Promise((resolve,reject)=>{
  if(typeof canvas?.toBlob!=='function'){reject(Error('PNG-Export ist in diesem Browser nicht verfügbar.'));return;}
  let settled=false;const finish=(error,blob)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(blob);};
  const timer=setTimeout(()=>finish(Error('Der Bildexport dauert zu lange. Bitte erneut versuchen.')),Math.max(1,Number(timeoutMs)||15000));
  try{canvas.toBlob(blob=>{
   if(!blob||blob.type!=='image/png'||!blob.size){finish(Error('Das Bild konnte nicht als PNG erstellt werden.'));return;}
   if(blob.size>=3*1024*1024){finish(Error('Das Bild ist größer als 3 MB. Probiere einen engeren Bildausschnitt.'));return;}
   finish(null,blob);
  },'image/png');}catch{finish(Error('Das Bild konnte nicht exportiert werden.'));}
 });
}
