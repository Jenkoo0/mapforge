/** Independent horizontal route architecture. Themes control materials and props;
 * layouts control the actual path. Old projects retain their original helix. */
export const ONLY_UP_LAYOUTS=Object.freeze({
 spire:Object.freeze({label:'Turmspirale',description:'Kompakter Aufstieg um eine zentrale Landmarke.'}),
 ridge:Object.freeze({label:'Klippenweg',description:'Ein weiter, geschwungener Weg über gestaffelte Felsrippen.'}),
 switchback:Object.freeze({label:'Faltenhöfe',description:'Lange Galerien, Querstege und bewusste Richtungswechsel.'})
});
export const normalizeAscentLayout=value=>Object.hasOwn(ONLY_UP_LAYOUTS,value)?value:'spire';

/** Heading for each step, solved against real platform edge distance upstream. */
export function ascentHeading(layout,index){
 if(layout==='ridge')return .25+Math.sin(index*.065)*.85;
 const cardinal=i=>{const step=(i-1)%30;return step<12?0:step<15?Math.PI/2:step<27?Math.PI:Math.PI/2;};
 const heading=cardinal(index),before=cardinal(index-1);
 // Bevel every corner with a diagonal transition. Two large checkpoints on
 // opposite arms of a sharp elbow must not overlap each other's headroom.
 return index>1&&heading!==before?(heading+before)/2:heading;
}

/** Original parametric scenery. All structures are below the route or beside it;
 * the caller additionally audits their bounds against every jump corridor. */
export function addAscentArchitecture({layout,stages,sections,theme:t,detail,part,beam}){
 if(!detail)return;
 for(const section of sections){
  const n=section.index,at=stages[Math.round((section.start+section.end)/2)],p=at.pos;
  if(layout==='ridge'){
   // Eight staggered rock ribs form a continuous geological silhouette.
   for(let rib=0;rib<(detail>1?4:2);rib++){
    const depth=38+rib*8;
    part('OU_RidgeButtress_'+n+'_'+rib,[p[0]-9+rib*6,p[1]-depth/2-12,p[2]+6],[5,depth,21-rib*2],rib%2?t.side:t.dark,'decor',{material:t.deck==='WoodPlanks'?'Slate':t.deck,architecture:true});
   }
   part('OU_RidgeStratum_'+n,[p[0],p[1]-12,p[2]+5],[30,1.3,24],t.side,'decor',{architecture:true});
   if(detail>1){
    part('OU_RidgeLookout_'+n,[p[0],p[1]-14,p[2]-23],[16,1.4,12],t.top,'decor',{architecture:true});
    for(const x of [-6,6])beam('OU_RidgeCantilever_'+n+'_'+x,[p[0]+x,p[1]-27,p[2]-8],[p[0]+x,p[1]-15,p[2]-25],1,t.accent,{architecture:true});
   }
  }else{
   part('OU_CourtRaft_'+n,[p[0],p[1]-16,p[2]+23],[28,2,28],t.side,'decor',{architecture:true});
   for(const x of [-11,11])for(const z of [12,34]){
    part('OU_CourtColumn_'+n+'_'+x+'_'+z,[p[0]+x,p[1]-31,p[2]+z],[1.8,28,1.8],t.dark,'decor',{architecture:true});
    if(detail>1)beam('OU_CourtTruss_'+n+'_'+x+'_'+z,[p[0]+x,p[1]-43,p[2]+z],[p[0]-x,p[1]-18,p[2]+z],.8,t.accent,{architecture:true});
   }
   if(detail>1)for(let rib=0;rib<5;rib++)part('OU_CourtGallery_'+n+'_'+rib,[p[0]-10+rib*5,p[1]-13,p[2]+35],[.65,5,6],t.top,'decor',{architecture:true});
  }
  // Theme-specific destinations sit on their own satellite platforms.
  const x=p[0],y=p[1]-12,z=p[2]+(layout==='ridge'?33:23);
  if(t.frame==='Wood'){
   part('OU_SatelliteTrunk_'+n,[x,y-9,z],[3,14,3],t.dark,'decor',{material:'Wood',architecture:true});
   part('OU_SatelliteCrown_'+n,[x,y,z],[17,5,12],t.top,'decor',{shape:'ball',material:'Grass',architecture:true});
  }else if(t.deck==='Basalt'){
   part('OU_SatelliteKiln_'+n,[x,y-7,z],[12,12,10],t.dark,'decor',{material:'Basalt',architecture:true});
   part('OU_SatelliteFurnaceGlow_'+n,[x,y-6,z-5.2],[7,3,.3],t.accent,'decor',{neon:true,architecture:true});
  }else if(t.deck==='DiamondPlate'){
   part('OU_SatelliteRelay_'+n,[x,y-7,z],[12,10,8],t.dark,'decor',{architecture:true});
   for(let fin=0;fin<4;fin++)part('OU_SatelliteRelayFin_'+n+'_'+fin,[x-6+fin*4,y-1,z],[.8,3,10],t.accent,'decor',{architecture:true});
  }else{
   part('OU_SatelliteObservatory_'+n,[x,y-6,z],[12,10,12],t.top,'decor',{architecture:true});
   part('OU_SatelliteTelescope_'+n,[x,y+1,z],[3,3,12],t.accent,'decor',{rotation:[-20,25,0],architecture:true});
  }
 }
 const last=stages.at(-1),p=last.pos;
 part('OU_DistantSummitLamp',[p[0],p[1]+12,p[2]+26],[4,7,4],t.accent,'decor',{neon:true,architecture:true});
}
