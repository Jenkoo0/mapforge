import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generate,configLua,SCRIPT_FILES} from '../web/engine.js';
import {gameListing} from '../web/listing.js';
import {growthMarkdown,growthSnapshot} from '../web/growth.js';
import {listingDescription} from '../web/player-plan.js';
import {launchFiles} from '../web/launch-kit.js';
import {uploadHtml,listingPreviewHtml} from '../web/upload-ui.js';
const scripts=Object.fromEntries(Object.entries(SCRIPT_FILES).map(([key,file])=>[key,readFileSync(new URL('../web/lua/'+file+'.lua',import.meta.url),'utf8')]));
test('automatic titles and bios match all eight playable templates and their real content',()=>{
 const titles=new Set();
 for(const mode of ['tycoon','obby'])for(const theme of ['sky','neon','lava','jungle']){
  const c=generate({mode,theme,stages:24,checkpointEvery:3}).config,l=gameListing(c);
  titles.add(l.title);assert.match(l.title,new RegExp(mode,'i'));assert.ok([...l.title].length<=50);assert.equal(listingDescription(c),l.description);
  assert.match(l.description,/ohne Robux/);assert.doesNotMatch(l.description,/Optionale Extras|120 Minuten|garantiert|kostenlose Robux/);
  if(mode==='tycoon'){for(const text of ['48 Ausbauten','28 Forschungsstufen','3 wählbare Auftragstypen','6 Tagesaufträge','12 Designs'])assert.ok(l.description.includes(text));}
  else{assert.match(l.description,/24 Parcours-Abschnitte/);assert.match(l.description,/alle 3 Abschnitte/);assert.doesNotMatch(l.description,/Forschung|Rebirth/);}
 }
 assert.equal(titles.size,8);
});
test('custom titles are stable, bounded and do not promise disabled storage or unconfigured offers',()=>{
 const c=generate({mode:'tycoon',name:'Creators Blumenwelt',theme:'jungle',persistence:false}).config;
 const l=gameListing(c);assert.equal(l.title,'Creators Blumenwelt | Tycoon');assert.equal(gameListing({...c,seed:'different',detail:0}).title,l.title);assert.equal(c.name,'Creators Blumenwelt');assert.doesNotMatch(l.description,/Gespeicherter Fortschritt|Offline-Ertrag|Optionale Extras/);
 assert.doesNotMatch(gameListing({...c,cashSmallId:'123'}).description,/Optionale Extras/);
 assert.match(gameListing({...c,persistence:true,cashSmallId:'123'}).description,/Optionale Extras/);
 assert.doesNotMatch(gameListing({...c,shop:false,cashSmallId:'123'}).description,/Optionale Extras/);
 const long=gameListing({...c,name:'🌸'.repeat(70)}).title;assert.ok([...long].length<=50);assert.ok(!/[\uD800-\uDBFF]$/.test(long));
 assert.equal(gameListing({...c,name:'Mein Tycoon'}).title,'Mein Tycoon');
});
test('UI, launch files and exported configuration share the same automatic metadata',()=>{
 const map=generate({mode:'tycoon',name:'<Creator & Test>',theme:'jungle'}),l=gameListing(map.config),files=launchFiles(map,scripts);
 assert.equal(files['Roblox-Titel.txt'],l.title);assert.equal(files['Roblox-Beschreibung.txt'],l.description);
 const metadata=JSON.parse(files['Roblox-Metadaten.json']);assert.equal(metadata.title,l.title);assert.equal(metadata.description,l.description);
 assert.ok(configLua(map).includes('PublicTitle = '+JSON.stringify(l.title)));assert.ok(configLua(map).includes('PublicDescription = '+JSON.stringify(l.description)));
 assert.ok(files['KI-Uebergabe.md'].includes(l.title));assert.ok(files['Spieltexte.md'].includes(l.description));
 const html=uploadHtml(map,{manualTests:[{done:true},{done:false}],playtests:[{}]});assert.match(html,/1 \/ 2 Studio-Prüfungen/);assert.match(html,/1 manuell eingetragene/);assert.ok(html.includes('&lt;Creator &amp; Test&gt;'));assert.ok(!html.includes('<Creator'));
 assert.ok(listingPreviewHtml(map.config).includes('&lt;Creator &amp; Test&gt;'));assert.match(html,/Manage Audience/);assert.match(files['Creator-Hub-Vorlage.md'],/Titel: <Creator & Test> \| Tycoon/);
});
test('growth guidance uses only supplied observations and never claims measured retention or ad profit',()=>{
 assert.deepEqual(growthSnapshot(),{confirmed:0,total:0,observations:0});
 assert.deepEqual(growthSnapshot([{done:true},{done:1},{done:false}],[{},{}]),{confirmed:1,total:3,observations:2});
 const text=growthMarkdown({name:'Test'},[{done:true}],[]);assert.match(text,/1 von 1 Studio-Prüfungen/);assert.match(text,/0 manuell eingetragene/);assert.match(text,/Lifetime Budget/);assert.match(text,/Auto-Reload ausgeschaltet/);assert.match(text,/keine Roblox-Vorgabe/);assert.match(text,/kein Beweis für rentable Werbung/);
});
