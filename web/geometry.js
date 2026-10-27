// Shared transforms keep the preview and Roblox CFrame export in agreement.
export function rotationMatrix(rotation=[0,0,0]){
 const [x,y,z]=rotation.map(n=>n*Math.PI/180),cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
 return [cy*cz,-cy*sz,sy,cx*sz+sx*sy*cz,cx*cz-sx*sy*sz,-sx*cy,sx*sz-cx*sy*cz,sx*cz+cx*sy*sz,cx*cy];
}
export function transform(point,m){return [m[0]*point[0]+m[1]*point[1]+m[2]*point[2],m[3]*point[0]+m[4]*point[1]+m[5]*point[2],m[6]*point[0]+m[7]*point[1]+m[8]*point[2]];}
export function vertices(p){
 const m=rotationMatrix(p.rotation),[a,b,c]=p.size.map(n=>n/2);
 return [[-a,-b,-c],[a,-b,-c],[a,-b,c],[-a,-b,c],[-a,b,-c],[a,b,-c],[a,b,c],[-a,b,c]].map(v=>transform(v,m).map((n,i)=>n+p.pos[i]));
}
