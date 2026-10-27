import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),assets={};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.lua':'text/plain','.md':'text/markdown','.json':'application/json'};
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);else{const ext=path.extname(file),type=types[ext];if(type)assets['/'+path.relative(root+'/web',file).split(path.sep).join('/')]={body:await readFile(file,'utf8'),type:type+'; charset=utf-8'};}}}
await walk(root+'/web');
const core=(await readFile(root+'/web/trend-core.js','utf8')).replace(/^export /gm,'');
let worker=await readFile(root+'/worker/template.js','utf8');
worker=worker.replace(/\/\* TREND_CORE_BEGIN \*\/[\s\S]*?\/\* TREND_CORE_END \*\//,()=>`/* TREND_CORE_BEGIN */\n${core}\n/* TREND_CORE_END */`);
worker=worker.replace(/\/\* ASSETS_BEGIN \*\/[\s\S]*?\/\* ASSETS_END \*\//,()=>`/* ASSETS_BEGIN */${JSON.stringify(assets)}/* ASSETS_END */`);
await writeFile(root+'/worker/index.js',worker);
console.log('Embedded',Object.keys(assets).length,'application files');
