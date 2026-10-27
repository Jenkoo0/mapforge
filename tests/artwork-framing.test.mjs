import test from 'node:test';
import assert from 'node:assert/strict';
import {generate} from '../web/engine.js';
import {drawMapArtwork} from '../web/map-artwork.js';
import {drawPreview} from '../web/preview.js';

// Capture actual projected polygons and ellipses from the real renderer. Text,
// backgrounds and grid strokes are deliberately excluded from geometry bounds.
function captureCanvas(width, height) {
 const geometry=[];
 let path=[];
 const gradient={addColorStop(){}};
 const ctx=new Proxy({
  createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
  measureText:text=>({width:Array.from(String(text)).length*12}),
  beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},
  ellipse(x,y,rx,ry){path.push([x-rx,y-ry],[x+rx,y+ry]);},
  fill(){geometry.push(...path.map(point=>[...point]));},
  drawImage(scene,x,y,drawWidth=scene.width,drawHeight=scene.height){
   geometry.push(...scene.geometry.map(([px,py])=>[x+px*drawWidth/scene.width,y+py*drawHeight/scene.height]));
  },
 },{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)});
 return {width,height,geometry,getContext:()=>ctx,ownerDocument:{createElement:()=>captureCanvas(1,1)}};
}

test('all cover layouts keep real projected geometry aligned between preview and full-resolution PNG',()=>{
 for(const mode of ['obby','tycoon']) {
  const map=generate({mode,plots:2,stages:18,detail:1,seed:'ARTWORK-RESOLUTION-FRAMING'});
  for(const layout of ['editorial','cinematic','image'])for(const zoom of [.7,1,1.4]) {
   const preview=captureCanvas(960,540),exported=captureCanvas(1920,1080);
   const options={layout,zoom,title:'Dieselbe Welt',subtitle:'Dieselbe Kamera',format:'landscape'};
   assert.equal(drawMapArtwork(preview,map,options),true);
   assert.equal(drawMapArtwork(exported,map,options),true);
   assert.ok(preview.geometry.length>100,'the actual renderer produced geometry');
   assert.equal(preview.geometry.length,exported.geometry.length);
   // The editorial offscreen scene rounds .84 * width to a whole pixel.
   const tolerance=layout==='editorial'?.001:1e-10;
   for(let i=0;i<preview.geometry.length;i++)for(const axis of [0,1]) {
    const a=preview.geometry[i][axis]/(axis?preview.height:preview.width);
    const b=exported.geometry[i][axis]/(axis?exported.height:exported.width);
    assert.ok(Math.abs(a-b)<=tolerance,`${mode}/${layout}/${zoom}: vertex ${i}, axis ${axis} differs by ${Math.abs(a-b)}`);
   }
  }
 }
});

test('the standard map viewer retains fixed padding unless proportional framing is explicitly requested',()=>{
 const map=generate({mode:'obby',stages:18,detail:1,seed:'VIEWER-PADDING-DEFAULT'});
 for(const [width,height] of [[960,540],[1920,1080]]) {
  const original=captureCanvas(width,height),explicit=captureCanvas(width,height);
  assert.equal(drawPreview(original,map,{labels:false}),true);
  assert.equal(drawPreview(explicit,map,{labels:false,proportionalPadding:false}),true);
  assert.deepEqual(original.geometry,explicit.geometry);
 }
 const baseline=captureCanvas(960,540),proportional=captureCanvas(960,540);
 drawPreview(baseline,map,{labels:false});drawPreview(proportional,map,{labels:false,proportionalPadding:true});
 assert.deepEqual(baseline.geometry,proportional.geometry,'the canonical 960 by 540 padding is unchanged');
});
