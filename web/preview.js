import {vertices,rotationMatrix,transform} from './geometry.js';
import {visiblePreviewParts} from './preview-state.js';
// The viewer uses the exact shapes, rotations and opacity sent to Roblox Studio.
const tint=(hex,n)=>{const v=parseInt(hex.slice(1),16);return `rgb(${[v>>16&255,v>>8&255,v&255].map(c=>Math.min(255,Math.round(c*n))).join(',')})`;};
const blockFaces=[{v:[4,5,6,7],n:[0,1,0]},{v:[3,2,6,7],n:[0,0,1]},{v:[0,4,5,1],n:[0,0,-1]},{v:[1,5,6,2],n:[1,0,0]},{v:[0,3,7,4],n:[-1,0,0]},{v:[0,1,2,3],n:[0,-1,0]}];
// Maps are immutable snapshots. Cache world geometry across camera movements;
// discarded maps and saved-map cards can be collected without manual eviction.
const geometryCache=new WeakMap();
function geometryFor(p){let cached=geometryCache.get(p);if(!cached){const points=vertices(p);cached={points,faces:p.shape==='ball'?[]:mesh(p,points)};geometryCache.set(p,cached);}return cached;}
function mesh(p,points){
 const m=rotationMatrix(p.rotation);
 if(p.shape!=='cylinder')return blockFaces.map(f=>({points:f.v.map(i=>points[i]),normal:transform(f.n,m)}));
 const [h,dy,dz]=p.size,ring=side=>Array.from({length:12},(_,i)=>[side*h/2,Math.cos(i*Math.PI/6)*dy/2,Math.sin(i*Math.PI/6)*dz/2]);
 const a=ring(-1),b=ring(1),world=v=>transform(v,m).map((n,i)=>n+p.pos[i]),out=[{points:a.map(world),normal:transform([-1,0,0],m)},{points:b.map(world),normal:transform([1,0,0],m)}];
 for(let i=0;i<12;i++){const j=(i+1)%12,angle=(i+.5)*Math.PI/6;out.push({points:[a[i],a[j],b[j],b[i]].map(world),normal:transform([0,Math.cos(angle),Math.sin(angle)],m)});}return out;
}
function validPreviewFrame(frame){
 if(!frame||typeof frame!=='object')return null;
 try{
  if(Array.isArray(frame))return null;
  const {minX,maxX,minY,maxY}=frame;
  if(![minX,maxX,minY,maxY,maxX-minX,maxY-minY,minX+maxX,minY+maxY].every(Number.isFinite)||maxX<=minX||maxY<=minY)return null;
  return {minX,maxX,minY,maxY};
 }catch{return null;}
}
// A frame contains projected geometry only, not zoom, labels or camera state.
// Give both canvases the same dimensions and zoom for a shared visual scale.
export function previewComparisonFrame(entries){
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 try{
  if(!Array.isArray(entries))return null;
  for(const entry of entries){
   const map=entry?.map,view=entry?.view??{};
   if(!map?.config||!Array.isArray(map.parts))continue;
   const angle=view.angle??-.8,plan=view.plan??false;
   if(!Number.isFinite(angle))return null;
   const cos=Math.cos(angle),sin=Math.sin(angle),vertical=plan?0:.84,ground=plan?1:.48;
   for(const part of visiblePreviewParts(map,view))for(const [x,y,z] of geometryFor(part).points){
    const px=x*cos-z*sin,py=(x*sin+z*cos)*ground-y*vertical;
    if(!Number.isFinite(px)||!Number.isFinite(py))return null;
    minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
   }
  }
 }catch{return null;}
 return validPreviewFrame({minX,maxX,minY,maxY});
}
export function drawPreview(canvas,map,view={},frame=null){
 const ctx=canvas.getContext('2d');if(!ctx)return false;
 const w=canvas.width,h=canvas.height,angle=view.angle??-.8,zoom=view.zoom??1,plan=view.plan??false,tycoon=map.config.mode==='tycoon';
 const colors={sky:['#2c4059','#192735'],neon:['#242c49','#181d31'],lava:['#48343d','#271f2b'],jungle:['#2a4646','#172c31']}[map.config.theme];
 ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,colors[0]);bg.addColorStop(1,colors[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const cos=Math.cos(angle),sin=Math.sin(angle),vertical=plan?0:.84,ground=plan?1:.48;
 const project=([x,y,z])=>[x*cos-z*sin,(x*sin+z*cos)*ground-y*vertical,(x*sin+z*cos)*(plan?0:.84)+y*(plan?1:.48)];
 const parts=visiblePreviewParts(map,view);
 if(!parts.length)return true;
 const geometry=new Map(parts.map(p=>[p,geometryFor(p).points]));
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 const sharedFrame=validPreviewFrame(frame);
 if(sharedFrame)({minX,maxX,minY,maxY}=sharedFrame);
 else for(const p of parts)for(const point of geometry.get(p)){const [x,y]=project(point);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const paddingX=view.proportionalPadding?w*65/960:65,paddingY=view.proportionalPadding?h*85/540:85;
 const scale=Math.min((w-paddingX)/(maxX-minX||1),(h-paddingY)/(maxY-minY||1))*zoom;
 const screen=xyz=>{const p=project(xyz);return [w/2+(p[0]-cx)*scale,h/2+(p[1]-cy)*scale,p[2]];};
 const polygon=pts=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();};
 const mid=tycoon&&view.focusPlot?map.plots.find(p=>p.index===view.focusPlot)?.pos||[0,0,0]:map.stages[Math.floor(map.stages.length/2)].pos;
 ctx.strokeStyle='#b9d5d80c';ctx.lineWidth=1;
 for(let i=-18;i<=18;i++)for(const swap of [false,true]){const a=[i*20,-360],b=[i*20,360];ctx.beginPath();for(const [j,p] of [a,b].entries()){const pt=screen([mid[0]+p[swap?1:0],tycoon?-6:8,mid[2]+p[swap?0:1]]);j?ctx.lineTo(pt[0],pt[1]):ctx.moveTo(pt[0],pt[1]);}ctx.stroke();}
 const faces=[];
 for(const p of parts){
  if(p.shape==='ball'){
   const center=screen(p.pos),v=geometry.get(p).map(screen),rx=(Math.max(...v.map(v=>v[0]))-Math.min(...v.map(v=>v[0])))/2,ry=(Math.max(...v.map(v=>v[1]))-Math.min(...v.map(v=>v[1])))/2;
   faces.push({depth:center[2],ball:true,point:center,rx:rx*.84,ry:ry*.84,p});continue;
  }
  for(const f of geometryFor(p).faces){
   const [nx,ny,nz]=f.normal,rz=nx*sin+nz*cos;
   if((plan?ny:ny*.84+rz*.48)<=.001)continue;
   const pts=f.points.map(screen),shade=p.neon?1:Math.max(.47,Math.min(1.05,.7+ny*.25-nx*.10-nz*.12));
   faces.push({depth:pts.reduce((n,p)=>n+p[2],0)/pts.length,points:pts,color:tint(p.color,shade),top:ny>.6,p});
  }
 }
 const layer=f=>f.p.layer??2;faces.sort((a,b)=>layer(a)-layer(b)||a.depth-b.depth);
 let shadows=false;
 for(const f of faces){
  if(!shadows&&layer(f)>=2){
   shadows=true;ctx.save();ctx.fillStyle='#12202c';ctx.globalAlpha=.15;
   for(const p of parts)if((p.layer??2)>=2&&p.size[1]>3&&p.transparency!==1){const v=geometry.get(p);polygon([0,1,2,3].map(i=>screen([v[i][0]+p.size[1]*.17,tycoon?.42:p.pos[1]-p.size[1]/2-.1,v[i][2]+p.size[1]*.12])));ctx.fill();}ctx.restore();
  }
  ctx.save();ctx.globalAlpha=1-(f.p.transparency||0);
  if(f.p.neon){ctx.shadowColor=f.p.color;ctx.shadowBlur=Math.min(7,2.4*scale);}
  if(f.ball){
   const g=ctx.createRadialGradient(f.point[0]-f.rx*.32,f.point[1]-f.ry*.45,.1,f.point[0],f.point[1],Math.max(f.rx,f.ry));g.addColorStop(0,tint(f.p.color,1.08));g.addColorStop(.65,f.p.color);g.addColorStop(1,tint(f.p.color,.65));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(f.point[0],f.point[1],Math.max(.2,f.rx),Math.max(.2,f.ry),0,0,Math.PI*2);ctx.fill();
  }else{
   polygon(f.points);ctx.fillStyle=f.color;ctx.fill();
   if(f.top&&['Grass','LeafyGrass','WoodPlanks','Basalt','DiamondPlate'].includes(f.p.material)){
    const xs=f.points.map(p=>p[0]),ys=f.points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),sw=Math.max(...xs)-x,sh=Math.max(...ys)-y;
    if(sw*sh>140){
     ctx.save();ctx.clip();ctx.strokeStyle=f.p.material==='WoodPlanks'?'#3e2e2048':f.p.material==='Grass'||f.p.material==='LeafyGrass'?'#b7ce8d38':'#c8d5e322';ctx.lineWidth=.7;
     for(let k=1;k<9;k++){const yy=y+sh*k/9;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+sw,yy+(f.p.material==='WoodPlanks'?sw*.1:2));ctx.stroke();}ctx.restore();
    }
   }
   ctx.strokeStyle=f.p.material==='Glass'?'#d3f6ff6b':'#ffffff16';ctx.lineWidth=f.p.material==='Glass'?.9:.5;ctx.stroke();
  }ctx.restore();
 }
 if(view.path){
  ctx.strokeStyle='#e1f7bd99';ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();
  if(tycoon){for(const p of map.paths||[]){if(view.focusPlot&&p.plot!==view.focusPlot)continue;const a=screen([p.x-p.size[0]/2,.6,p.z-p.size[1]/2]),b=screen([p.x+p.size[0]/2,.6,p.z+p.size[1]/2]);ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}}
  else map.stages.forEach((s,i)=>{const p=screen([s.pos[0],s.pos[1]+3,s.pos[2]]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});ctx.stroke();ctx.setLineDash([]);
 }
 const objectiveLabels=tycoon?parts.filter(p=>p.role==='Button').map(p=>({pos:[p.pos[0],p.pos[1]+4,p.pos[2]],label:(p.upgrade==='u01'?'GRATIS STARTER':'NÄCHSTER KAUF')+'\n'+(map.upgrades.find(u=>u.id===p.upgrade)?.name||'')})):[];
 const labels=view.labels===false?[]:[...objectiveLabels,...parts.filter(p=>p.label)];
 if(!tycoon&&view.labels!==false)for(const s of [map.stages[0],map.stages.at(-1)])labels.push({pos:[s.pos[0],s.pos[1]+12,s.pos[2]],label:s.index?'ZIEL':'START'});
 const placed=[];
 for(const l of labels){
  const point=screen(l.pos),lines=String(l.label).split('\n'),font=Math.max(7,Math.round(Math.min(12,w/95)));ctx.font=`600 ${font}px system-ui`;
  const tw=Math.max(...lines.map(t=>ctx.measureText(t).width)),height=lines.length*(font+3)+8,rect={x:point[0]-tw/2-6,y:point[1]-height/2,w:tw+12,h:height};
  if(placed.some(r=>rect.x<r.x+r.w+4&&rect.x+rect.w+4>r.x&&rect.y<r.y+r.h+4&&rect.y+rect.h+4>r.y))continue;
  placed.push(rect);ctx.fillStyle='#14202ce6';ctx.fillRect(rect.x,rect.y,rect.w,rect.h);ctx.fillStyle='#d4e9e6';lines.forEach((text,i)=>ctx.fillText(text,point[0]-ctx.measureText(text).width/2,rect.y+font+3+i*(font+3)));
 }
 return true;
}
const VIEW_FIELDS=['angle','zoom','plan','path','focusPlot','level','labels','events'];
export class Preview {
 constructor(canvas,map,{render=drawPreview,onRender,onViewChange,view={},active=true}={}){
  this.canvas=canvas;this.map=map;this.render=render;this.onRender=onRender;this.onViewChange=onViewChange;
  this.angle=-.8;this.zoom=1;this.path=false;this.plan=false;this.drag=null;this.frame=null;this.active=!!active;this.disposed=false;this.listeners=[];
  this.document=canvas.ownerDocument??globalThis.document;this.window=this.document?.defaultView??globalThis.window;
  this.applyView(view);
  const host=this.window??globalThis;
  this.schedule=typeof host.requestAnimationFrame==='function'?callback=>host.requestAnimationFrame(callback):callback=>setTimeout(callback,16);
  this.cancelFrame=typeof host.cancelAnimationFrame==='function'?frame=>host.cancelAnimationFrame(frame):frame=>clearTimeout(frame);
  const Resize=host.ResizeObserver??globalThis.ResizeObserver;
  if(typeof Resize==='function'){
   try{this.resize=new Resize(()=>this.requestDraw());this.resize.observe(canvas);}
   catch{try{this.resize?.disconnect();}catch{}this.resize=null;}
  }
  if(!this.resize)this.listen(this.window,'resize',()=>this.requestDraw());
  this.listen(this.document,'visibilitychange',()=>{if(this.canDraw())this.requestDraw();else{this.cancelDraw();this.endDrag();}});
  this.listen(canvas,'pointerdown',e=>{
   if(!this.canDraw()||e.button!==0||e.isPrimary===false||this.drag!==null||!Number.isFinite(e.clientX))return;
   this.drag={pointerId:e.pointerId,x:e.clientX};
   try{canvas.setPointerCapture?.(e.pointerId);}catch{/* Pointer capture may disappear during a view change. */}
  });
  this.listen(canvas,'pointermove',e=>{
   if(!this.canDraw()||!this.drag||e.pointerId!==this.drag.pointerId||e.isPrimary===false||!Number.isFinite(e.clientX))return;
   const delta=e.clientX-this.drag.x;this.drag.x=e.clientX;if(!delta)return;
   this.angle+=delta*.009;this.viewChanged();this.requestDraw();
  });
  const end=e=>{if(this.drag&&e.pointerId===this.drag.pointerId)this.endDrag(e.type!=='lostpointercapture');};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.listen(canvas,type,end);
  this.listen(canvas,'keydown',e=>{
   if(!this.canDraw()||e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
   const angle=this.angle,zoom=this.zoom;
   if(e.key==='ArrowLeft')this.angle-=.12;else if(e.key==='ArrowRight')this.angle+=.12;
   else if(['+','=','ArrowUp'].includes(e.key))this.zoom=Math.min(2.5,this.zoom+.15);
   else if(['-','ArrowDown'].includes(e.key))this.zoom=Math.max(.5,this.zoom-.15);
   else if(e.key==='Home'){this.angle=-.8;this.zoom=1;}else return;
   e.preventDefault();if(angle!==this.angle||zoom!==this.zoom){this.viewChanged();this.requestDraw();}
  });
  if(this.active)this.draw();
 }
 listen(target,type,listener){if(typeof target?.addEventListener!=='function')return;target.addEventListener(type,listener);this.listeners.push([target,type,listener]);}
 applyView(view){if(!view||typeof view!=='object')return;for(const key of VIEW_FIELDS)if(Object.hasOwn(view,key)&&view[key]!==undefined)this[key]=view[key];}
 viewChanged(){try{this.onViewChange?.(Object.fromEntries(VIEW_FIELDS.map(key=>[key,this[key]])));}catch{/* A UI callback cannot interrupt the camera. */}}
 canDraw(){return !this.disposed&&this.active&&this.document?.hidden!==true&&this.document?.visibilityState!=='hidden';}
 endDrag(release=true){const drag=this.drag;this.drag=null;if(release&&drag)try{this.canvas.releasePointerCapture?.(drag.pointerId);}catch{/* Capture may already have ended. */}}
 cancelDraw(){if(this.frame===null)return;this.cancelFrame(this.frame);this.frame=null;}
 requestDraw(){if(!this.canDraw()||this.frame!==null)return;this.frame=this.schedule(()=>{this.frame=null;this.draw();});}
 draw(){
  this.cancelDraw();if(!this.canDraw())return null;
  let success,error;
  try{
   const r=this.canvas.getBoundingClientRect();
   // display:none and collapsed containers are deferred until a real resize.
   if(!(r.width>0&&r.height>0))return null;
   const ratio=Number(this.window?.devicePixelRatio)||1,dpr=Math.min(2,Math.max(1,ratio));
   const width=Math.max(1,Math.round(r.width*dpr)),height=Math.max(1,Math.round(r.height*dpr));
   if(this.canvas.width!==width)this.canvas.width=width;if(this.canvas.height!==height)this.canvas.height=height;
   success=this.render(this.canvas,this.map,this)!==false;
  }catch(cause){success=false;error=cause;}
  try{this.onRender?.(success,error);}catch{/* Rendering remains usable if a consumer callback fails. */}
  return success;
 }
 setMap(map,view){if(this.disposed)return null;this.map=map;this.applyView(view);return this.draw();}
 setActive(value){if(this.disposed)return;const before=this.active;this.active=!!value;if(!this.active){this.cancelDraw();this.endDrag();}else if(!before)this.requestDraw();}
 dispose(){
  if(this.disposed)return;this.disposed=true;this.active=false;this.cancelDraw();this.endDrag();
  try{this.resize?.disconnect();}catch{}
  for(const [target,type,listener] of this.listeners)target.removeEventListener?.(type,listener);
  this.listeners=[];
 }
}
