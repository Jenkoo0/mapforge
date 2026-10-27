// Roblox enum values verified against Creator Hub, 20 October 2026.
export const MATERIAL_IDS={SmoothPlastic:272,Metal:1088,DiamondPlate:1056,Concrete:816,Slate:800,Basalt:788,CrackedLava:804,Grass:1280,LeafyGrass:1284,Ground:1360,Glass:1568,Wood:512,WoodPlanks:528,Asphalt:1376};
export const TYCOON_SURFACES={
 sky:{floor:'#697b87',district:'#526673',path:'#a7b2b2',base:'#344654',metal:'#435965',silver:'#acb9bf',glass:'#88bac4',floorMat:'Concrete',pathMat:'Slate',baseMat:'Slate',bodyMat:'Metal',bed:'#48616a'},
 neon:{floor:'#303747',district:'#384154',path:'#687388',base:'#232b39',metal:'#4c596d',silver:'#9ca8bd',glass:'#969fcd',floorMat:'DiamondPlate',pathMat:'Metal',baseMat:'Metal',bodyMat:'Metal',bed:'#30374b'},
 lava:{floor:'#4b4441',district:'#5a4c43',path:'#a38c70',base:'#393534',metal:'#6f6b68',silver:'#ad9c86',glass:'#c78f62',floorMat:'Basalt',pathMat:'Slate',baseMat:'Basalt',bodyMat:'Basalt',bed:'#51413a'},
 jungle:{floor:'#4e714c',district:'#486746',path:'#9f896a',base:'#3b513b',metal:'#58715b',silver:'#a6b399',glass:'#9cbdab',floorMat:'Grass',pathMat:'WoodPlanks',baseMat:'Ground',bodyMat:'Wood',bed:'#72583e'}
};
export const FOLIAGE=['#326347','#4f8650','#739d59','#244e39'];
export const BLOSSOMS=['#ed86a8','#e7b451','#a990d9','#e69362','#d2dde2'];
export function lightingProfile(config,theme){
 const rgb=theme.fog.slice(1).match(/../g).map(x=>Math.round(parseInt(x,16)*.62));
 return {ambient:'#64717c',outdoor:'#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join(''),brightness:config.theme==='neon'?1.8:2.1,exposure:-.15,clock:config.theme==='neon'?18.3:config.theme==='lava'?16.8:14.4,diffuse:.5,specular:config.theme==='jungle'?.35:.55,bloom:config.theme==='neon'?.1:.06,threshold:1.6,density:.23,haze:.3,glare:.05,contrast:.06,saturation:config.mode==='tycoon'?.04:.08};
}
