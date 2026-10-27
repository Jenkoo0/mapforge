import test from 'node:test';
import assert from 'node:assert/strict';
import {appHarness} from './support/app-harness.mjs';
import {mapMetrics} from '../web/quality-report.js';

test('quality downloads use the current map after an editor change without rebuilding or altering it',async()=>{
 const h=await appHarness({config:{mode:'tycoon',seed:'FIRST-MAP',plots:2}});
 try{
  h.app.update({...h.app.config,theme:'jungle',seed:'SECOND-MAP',plots:6,polish:2});
  const before=h.generations,current=JSON.stringify(h.app.config),fingerprint=mapMetrics(h.app.map).fingerprint;
  await h.click('downloadQualityDossier');await h.click('downloadQualityAudit');
  assert.equal(h.generations,before);assert.equal(JSON.stringify(h.app.config),current);
  const files=[...h.app.output.downloads.files.values()];
  const dossier=files.find(f=>f.name.endsWith('-Map-Dossier.md')),audit=files.find(f=>f.name==='Studio-Map-Audit.lua');
  assert.ok(dossier&&audit);assert.ok((await h.blobs.get(dossier.url).text()).includes('SECOND-MAP'));
  assert.ok((await h.blobs.get(audit.url).text()).includes(fingerprint));
  assert.ok(h.doc.getElementById('mapMetrics').innerHTML.includes(fingerprint));
 }finally{h.dispose();}
});
