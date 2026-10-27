// Build a portable Worker artifact without a private Site/account identity.
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
for(const folder of ['server','.openai'])await mkdir(path.join(root,'dist',folder),{recursive:true});
await copyFile(path.join(root,'worker','index.js'),path.join(root,'dist/server/index.js'));
await writeFile(path.join(root,'dist/.openai/hosting.json'),'{}\n');
console.log('Built portable Worker artifact; no deployment target configured.');
