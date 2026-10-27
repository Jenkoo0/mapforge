import {test} from 'node:test';
import assert from 'node:assert/strict';
import {browserTask} from '../web/browser-task.js';
import {appHarness} from './support/app-harness.mjs';

test('browser handoff uses the real settings and omits product IDs and false completion claims',()=>{
 const text=browserTask({config:{mode:'tycoon',name:'Mein eigener Betrieb',autoName:false,theme:'jungle',layout:'campus',pacing:'brisk',plots:6,cashSmallId:'987654321',seed:'OWN-SEED'},brief:'Mehr Blumen und kurze Wartezeiten',useTrends:true});
 for(const expected of ['Mein eigener Betrieb','Bloom','Fabrik-Campus','Zügig','Grundstücke: 6','OWN-SEED','Mehr Blumen','Bauen & Startpaket laden','Startpaket erneut erstellen','Trendprüfung: eingeschaltet','Namensautomatik ausgeschaltet'])assert.ok(text.includes(expected),expected);
 assert.ok(!text.includes('987654321'));assert.match(text,/bestätigt noch keinen gespeicherten Download/);assert.match(text,/Keine Testhäkchen/);
 const obby=browserTask({config:{mode:'obby',stages:48,autoName:true},useTrends:false});assert.match(obby,/Abschnitte: 48/);assert.match(obby,/Namensautomatik: eingeschaltet/);assert.match(obby,/Trendprüfung: ausgeschaltet/);assert.doesNotMatch(obby,/Fabrik-Bauplan/);
});

test('copy uses current task data and provides a selected text fallback when clipboard access fails',async()=>{
 const h=await appHarness(),descriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator');let copied;
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
  h.doc.getElementById('botBrief').value='<img src=x onerror=alert(1)> Blumen';h.doc.getElementById('botTrends').checked=false;
  h.app.update({...h.app.config,name:'Kopiertest',autoName:false});await h.bots[0].copyTask();
  assert.match(copied,/Kopiertest/);assert.match(copied,/<img src=x/);assert.equal(h.doc.getElementById('browserTask').value,copied);assert.match(h.doc.getElementById('browserTaskStatus').textContent,/Auftrag kopiert/);
  globalThis.navigator.clipboard.writeText=async()=>{throw Error('denied');};await h.bots[0].copyTask();
  assert.equal(h.doc.getElementById('browserTask').selected,true);assert.match(h.doc.getElementById('browserTaskStatus').textContent,/Strg\+C/);
 }finally{if(descriptor)Object.defineProperty(globalThis,'navigator',descriptor);else delete globalThis.navigator;h.dispose();}
});
