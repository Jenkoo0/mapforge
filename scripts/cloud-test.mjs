import {spawnSync} from 'node:child_process';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const packageInfo=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const report={version:packageInfo.version,commitSha:null,commands:[],robloxEngineTested:false,realRobuxPurchasesTested:false};
const top=spawnSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'});
if(top.status===0&&path.resolve(top.stdout.trim()).toLowerCase()===path.resolve(root).toLowerCase()){
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});if(head.status===0)report.commitSha=head.stdout.trim();
}
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const env={...process.env,PYTHONPATH:[path.join(root,'.cloud-deps'),process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)};
const testFiles=(await readdir(path.join(root,'tests'))).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>'tests/'+n);
const commands=[
 ['worker build',process.execPath,['tools/build-worker.mjs']],
 ['example generation',process.execPath,['tools/build-examples.mjs']],
 ['JavaScript suite',process.execPath,['--test','--test-concurrency=2',...testFiles]],
 ['Lua syntax and behaviour',python,['tools/check-lua.py']],
 ['XML and element bindings',python,['tools/check-export.py']],
 ['portable artifact build',process.execPath,['scripts/build.mjs']],
 ['artifact validation',process.execPath,['scripts/validate-artifact.mjs']]
];
for(const [label,exe,args] of commands){
 console.log('\n[MapForge check] '+label);
 const began=Date.now(),r=spawnSync(exe,args,{cwd:root,env,stdio:'inherit'});
 report.commands.push({label,exitCode:r.status,error:r.error?.message??null,durationMs:Date.now()-began});
 if(r.status!==0)break;
}
report.passed=report.commands.length===commands.length&&report.commands.every(c=>c.exitCode===0);
await mkdir(path.join(root,'outputs/cloud-test'),{recursive:true});
await writeFile(path.join(root,'outputs/cloud-test/verification.json'),JSON.stringify(report,null,2)+'\n');
console.log('\n[MapForge verification] '+JSON.stringify(report));
if(!report.passed)process.exitCode=1;
