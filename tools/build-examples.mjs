import {studioShopScanner} from '../web/shop-setup.js';
import {studioMapAudit} from '../web/quality-report.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {launchFiles} from '../web/launch-kit.js';
import {makeZip} from '../web/zip.js';
import {TYCOON_THEMES,UPGRADES} from '../web/tycoon.js';
import {generate,toRBXLX,THEMES,validate,SCRIPT_FILES,VERSION} from '../web/engine.js';
import {ONLY_UP_STARTERS,INDIVIDUAL_ONLY_UP_STARTERS} from '../web/only-up-collection.js';
import {MINIGAME_STARTERS} from '../web/minigame-collection.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const scripts=Object.fromEntries(await Promise.all(Object.entries(SCRIPT_FILES).map(async([k,file])=>[k,await readFile(`${root}/web/lua/${file}.lua`,'utf8')])));
await mkdir(`${root}/examples`,{recursive:true});
await writeFile(`${root}/examples/Shop-IDs-aus-Studio.lua`,studioShopScanner());
const results=[];
for(const mode of ['obby','tycoon'])for(const [theme,t] of Object.entries(mode==='tycoon'?TYCOON_THEMES:THEMES)){
 const map=generate({mode,theme,name:t.name,seed:'EXAMPLE-'+theme.toUpperCase(),stages:36});
 const stem=(mode==='tycoon'?'Tycoon-':'')+t.name.replaceAll(' ','-');
 const filename=stem+'.rbxlx';
 await writeFile(`${root}/examples/${filename}`,toRBXLX(map,scripts));
 await writeFile(`${root}/examples/${stem}.mapforge.json`,JSON.stringify({app:'MapForge',version:VERSION,config:map.config},null,2));
 if(mode==='tycoon'&&theme==='sky'){
  await writeFile(`${root}/examples/Startpaket-Crystal-Industries.zip`,makeZip(launchFiles(map,scripts)));
  await writeFile(`${root}/examples/Studio-Map-Audit.lua`,studioMapAudit(map));
 }
 results.push({filename,mode,parts:map.parts.length,stages:mode==='tycoon'?UPGRADES.length:map.config.stages,checks:validate(map)});
}
for(const starter of [...ONLY_UP_STARTERS,...INDIVIDUAL_ONLY_UP_STARTERS.filter(s=>s.id==='onlyup-wolkenwerft-ridge'||s.id==='onlyup-wurzelgarten-switchback')]){
 const map=generate({mode:'obby',obbyStyle:'onlyup',ascentLayout:starter.ascentLayout,theme:starter.theme,name:starter.title,autoName:false,seed:starter.seed,stages:144,movement:'precise',shop:false,shopHints:false,analytics:false});
 const stem='OnlyUp-'+starter.id.replace('onlyup-',''),filename=stem+'.rbxlx';
 await writeFile(`${root}/examples/${filename}`,toRBXLX(map,scripts));
 await writeFile(`${root}/examples/${stem}.mapforge.json`,JSON.stringify({app:'MapForge',version:VERSION,config:map.config},null,2));
 results.push({filename,mode:'obby',obbyStyle:'onlyup',parts:map.parts.length,stages:map.config.stages,checks:validate(map)});
}
for(const starter of MINIGAME_STARTERS){
 const map=generate({mode:'obby',obbyStyle:'classic',grind:true,minigame:starter.minigame,events:'rally',theme:starter.theme,name:starter.title,autoName:false,seed:starter.seed,stages:starter.stages,movement:'classic',difficulty:'easy',shop:false,shopHints:false,analytics:false});
 const stem='Minispiel-'+starter.id,filename=stem+'.rbxlx';
 await writeFile(`${root}/examples/${filename}`,toRBXLX(map,scripts));
 await writeFile(`${root}/examples/${stem}.mapforge.json`,JSON.stringify({app:'MapForge',version:VERSION,config:map.config},null,2));
 results.push({filename,mode:'obby',minigame:starter.minigame,parts:map.parts.length,stages:map.config.stages,checks:validate(map)});
}
await writeFile(`${root}/examples/Pruefbericht.json`,JSON.stringify({generated:new Date().toISOString(),studioPlaytest:false,results},null,2));
console.log(JSON.stringify(results.map(({filename,parts,stages})=>({filename,parts,stages})),null,2));
