import {COSMETICS,COSMETIC_ID_FIELDS,cosmeticsSetupHtml} from './cosmetics.js';
import {mountGrindStudio} from './grind-studio.js';
import {buildMinigameCollection} from './minigame-collection.js';
import {ONLY_UP_THEMES} from './only-up.js';
import {buildOnlyUpCollection} from './only-up-collection.js';
import {mountOnlyUp} from './only-up-ui.js';
import {mountEventPreview} from './event-ui.js';
import {movementForConfig} from './movement.js';
import {issueReport} from './issue-report.js';
import {metricsHtml,qualityDossier,studioMapAudit} from './quality-report.js';
import {previewStage} from './preview-state.js';
import {nameForGeneration,proposeMapName} from './map-names.js';
import {OutputCenter} from './output-center.js';
import {emitStudioEvent} from './studio-motion.js';
import {MapVault,savedProject,openMapConfig} from './map-vault.js';
import {MyMaps} from './maps-ui.js';
import {ShopSetup} from './shop-ui.js';
import {BotStudio} from './bot-ui.js';
import {CreativeStudio} from './creative-ui.js';
import {ArtworkStudio} from './artwork-ui.js';
import {ARTWORK_FORMATS,drawMapArtwork,artworkPng} from './map-artwork.js';
import {buildCreativeCollection} from './creative-collection.js';
import {CREATIVE_DIRECTIONS} from './creative-directions.js';
import {storyForConfig} from './creative-story.js';
import {UploadAssistant,listingPreviewHtml} from './upload-ui.js';
import {VERSION,DEFAULT,THEMES,SCRIPT_FILES,generate,normalize,fromBrief,validate,repair,diagnose,toRBXLX,safeFilename,hash} from './engine.js';
import {ImproveView} from './improve-ui.js';
import {reviewFiles} from './review-kit.js';
import {gameplayHtml} from './gameplay-ui.js';
import {PlaytestLab} from './playtest-ui.js';
import {Walkthrough} from './walkthrough.js';
import {guideMarkdown} from './walkthrough-core.js';
import {handoffUpdate} from './handoff.js';
import {makeZip} from './zip.js';
import {launchFiles} from './launch-kit.js';
import {TYCOON_THEMES,TYCOON_PRODUCTS,TYCOON_PASSES,UPGRADES,economySnapshot} from './tycoon.js';
import {TrendView} from './trend-ui.js';
import {Preview,drawPreview} from './preview.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(key,fallback){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}};
const vault=new MapVault(storage);
const previousProject=savedProject(storage.get('mapforge.config.v3',storage.get('mapforge.config.v2',null)))||vault.records[0]?.config||null;
let config=normalize(previousProject||{...DEFAULT,mode:'tycoon',name:'Crystal Industries'}),map=generate(config),scripts=null,toastTimer,trendView=null,walkthrough=null,playtestLab=null,improveView=null,uploadAssistant=null,shopSetup=null,botStudio=null,creativeStudio=null,myMaps=null,onlyUpStudio=null,eventStudio=null,grindStudio=null,previousMap=null;
const preview=new Preview($('mapCanvas'),map);
let generationBusy=false,exportBusy=false,scriptLoadPromise=null;
let collectionController=null;
const output=new OutputCenter($('outputCenter'),{onExport:exportMap,onBundle:()=>exportBundle(),onRetryScripts:loadScripts,onQuality:()=>navigate('quality',true),onMaps:()=>navigate('maps',true),onPublish:()=>navigate('publish',true),onUndo:undoOpenMap});
const artworkStudio=new ArtworkStudio($('artworkDialog'),{download,toast,getBusy:()=>generationBusy||exportBusy});
window.addEventListener('pagehide',e=>{if(!e.persisted){collectionController?.abort();artworkStudio.dispose();output.downloads.dispose();preview.dispose();creativeStudio?.dispose();}});
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const actionLabels=new WeakMap();
let thumbnailMode=null;
function drawThemeThumbnails(){
 const thumbnailKey=[config.mode,config.obbyStyle,config.ascentLayout].join('|');
 if(thumbnailMode===thumbnailKey)return;
 const probe=document.createElement('canvas');if(typeof probe.getContext!=='function')return;
 thumbnailMode=thumbnailKey;
 document.querySelectorAll('[data-theme]').forEach(button=>{
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=190;canvas.setAttribute('aria-hidden','true');
  const art=button.querySelector('.theme-art');art.replaceChildren(canvas);art.title='Geometriebeispiel für dieses Design';
  const example=generate({mode:config.mode,obbyStyle:config.obbyStyle,ascentLayout:config.ascentLayout,theme:button.dataset.theme,plots:2,stages:config.obbyStyle==='onlyup'?96:18,detail:2,polish:1,seed:'MAPFORGE-DESIGN'});
  drawPreview(canvas,example,{angle:-.8,focusPlot:config.mode==='tycoon'?1:0,level:48,labels:false});
 });
}
function syncActions(){
 for(const button of document.querySelectorAll('#generate,#generateManual,#applyBrief,#newMapName,#openArtwork,#downloadCollection,.export-button,[data-bundle],[data-bot-download]')){
  if(!actionLabels.has(button))actionLabels.set(button,button.innerHTML);
  const exporting=button.matches('.export-button,[data-bundle],[data-bot-download],#downloadCollection');
  button.disabled=generationBusy||exportBusy||(exporting&&!scripts);
  button.innerHTML=exporting&&!scripts?'Export wird vorbereitet …':exporting&&exportBusy?'Datei wird erstellt …':!exporting&&generationBusy?'Map wird gebaut …':actionLabels.get(button);
  button.setAttribute('aria-busy',generationBusy||exportBusy?'true':'false');
 }
 myMaps?.setBusy();
 botStudio?.setBusy(generationBusy||exportBusy);creativeStudio?.setBusy(generationBusy||exportBusy);
}
function beginGeneration(detail){if(generationBusy||exportBusy){toast('Bitte warte, bis der aktuelle Vorgang fertig ist.');return false;}generationBusy=true;output.begin(detail);syncActions();emitStudioEvent('work',{kind:'generation',state:'start',message:detail},window);return true;}
function endGeneration(){generationBusy=false;syncActions();}
function finishGeneration(){const saved=vault.remember(map,{source:'generated'});previousMap=null;output.setUndo(false);output.setPersistence(saved.persisted);output.complete();emitStudioEvent('work',{kind:'generation',state:'done',message:'Map gebaut und geprüft'},window);return saved;}
function saveCurrentMap(){if(generationBusy||exportBusy)return null;const result=vault.remember(map,{source:'saved'});output.setPersistence(result.persisted);output.restored(result.record,{title:result.persisted?'Map in Meine Maps gesichert':'Map für diese Sitzung gemerkt'});return result;}
function openMapSnapshot(){return {config:{...config},record:vault.remember(map,{source:'saved'}).record,view:Object.fromEntries(['angle','zoom','plan','path','focusPlot','level','labels','events'].map(key=>[key,preview[key]]))};}
function openSavedMap(id){
 if(generationBusy||exportBusy){toast('Bitte warte auf den laufenden Vorgang.');return false;}
 const row=vault.get(id);if(!row)return false;
 const target=openMapConfig(row,config);
 if(JSON.stringify(target)===JSON.stringify(config)){navigate('generator');output.restored(row);return true;}
 previousMap=openMapSnapshot();
 update(target);vault.remember(map,{source:'saved'});navigate('generator');output.setUndo(true);output.setPersistence(vault.persisted);output.restored(row);
 toast('Map geöffnet: '+config.name+'. Deine Shop-IDs bleiben erhalten.');return true;
}
function undoOpenMap(){
 if(!previousMap||generationBusy||exportBusy)return;
 const old=previousMap;previousMap=null;update(old.config,old.view);output.setUndo(false);output.setPersistence(vault.persisted);output.restored(old.record,{title:'Vorherige Map wiederhergestellt'});toast('Vorherige Map wiederhergestellt.');
}
function openIdeaPreview(next,{level=48}={}){
 if(generationBusy||exportBusy)return false;
 const changed=JSON.stringify(normalize(next))!==JSON.stringify(config);
 if(changed||Number(level)!==preview.level){
  previousMap=openMapSnapshot();
  if(changed)update(next);
 }
 setPreviewLevel(level);
 const saved=vault.remember(map,{source:'saved'});
 output.setUndo(!!previousMap);output.setPersistence(saved.persisted);
 output.restored(saved.record,{title:'Idee als Vorschau geöffnet'});
 navigate('generator',true);toast('Idee geöffnet. Prüfe Spielstart und Vollausbau; ein Download startet erst auf deinen Klick.');
 return true;
}
const obbyTests=['Alle Sprünge ohne Boost geschafft','Checkpoints und Respawn geprüft','Mit zwei Spielern gleichzeitig getestet','Touch-Steuerung und kleines Display geprüft','Speichern, Verlassen und Wiederbeitritt geprüft','Produktkauf und doppelten Beleg geprüft','Frischen Import und Obby-Beleuchtung auf PC und Handy geprüft'];
const tycoonTests=['Mit zwei Spielern getrennte Grundstücke geprüft','Fremde Kauf-Felder und Tresore bleiben geschützt','Alle 48 Ausbauten und Forschung geprüft','Speichern und erneuten Beitritt geprüft','Offline-Ertrag, sechs Tagesaufträge und Skins geprüft','Rebirth-Reset und erhaltene Skins/Kristalle geprüft','Robux-Kauf, doppelten Beleg, Pässe und Kontext-Hinweise geprüft','Echtes Handy und kleines Display geprüft','Wegweiser und einmalige Gratis-Meilensteine auch nach Rebirth geprüft','Auftragswahl, Fortschritt, Tageslimit und Rejoin geprüft','Baupreise passen zum eingestellten Spieltempo','Frischen Import ohne Migrationsdialog und Retro-Effekt geprüft','Beleuchtung, Materialien und Schilder aus Spielerhöhe geprüft','Claim-Prompts mit zwei Spielern und nach Streaming geprüft','Kalibrierung: Reihenfolge, Entfernung, Bonus, Rejoin und Speicherfehler geprüft','Shop-Katalog, Preisänderungen und Kaufabbruch geprüft'];
let manualLabels=config.mode==='tycoon'?tycoonTests:obbyTests;
const offers=[...TYCOON_PRODUCTS.map(p=>({...p,pass:false})),...TYCOON_PASSES.map(p=>({...p,pass:true}))];
let manuals=[],checkKey='';
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
function fillUI(){
 eventStudio?.refresh();onlyUpStudio?.refresh();grindStudio?.refresh();
 $('arenaView').hidden=config.events!=='rally';
 $('stages').min=config.obbyStyle==='onlyup'?96:12;$('stages').max=config.obbyStyle==='onlyup'?240:80;
 for(const [id,key] of [['mapName','name'],['stages','stages'],['checkpointEvery','checkpointEvery'],['detail','detail'],['seed','seed'],['gap','gap'],['rise','rise'],['boostId','boostId'],['coinsId','coinsId']])$(id).value=config[key];
 const movement=movementForConfig(config);$('movementProfile').value=movement.id;$('movementHint').textContent=movement.description+' Tempo '+movement.walk+' · Sprungkraft '+movement.jump+(movement.sprint>movement.walk?' · Sprint '+movement.sprint+' (Umschalt halten / L3 / Touch).':'');
 $('autoName').checked=config.autoName;botStudio?.refresh();
 $('namingHint').textContent=config.autoName?'Beim nächsten Generieren entsteht ein neuer Name passend zu deinem Design.':'Dein eigener Name bleibt beim Generieren erhalten.';
 const story=storyForConfig(config),choices=CREATIVE_DIRECTIONS.filter(entry=>entry.mode===config.mode);
 $('storyChoice').innerHTML='<option value="">Ohne Weltgeschichte</option>'+choices.map(entry=>`<option value="${esc(entry.id)}">${esc(entry.title)}</option>`).join('');$('storyChoice').value=story?.directionId||'';
 $('storySummary').textContent=story?story.premise+' Drei Kapitel begleiten deinen Fortschritt. Die Auswahl bleibt bei neuen Seeds und Layouts erhalten.':'Wähle eine Geschichte für deine Map. Drei Kapiteltafeln und ein Spieljournal begleiten die vorhandenen Spielziele.';
 $('shopHints').checked=config.shopHints;$('shopHintDelay').value=config.shopHintDelay;$('shopFocus').value=config.shopFocus;$('onboardingAnalytics').checked=config.analytics;
 $('cosmeticsEnabled').checked=config.cosmetics;for(const item of COSMETICS)$(item.field).value=config[item.field];$('cosmeticsSetupStatus').textContent=COSMETICS.filter(p=>config[p.field]).length+' von 3 Pass-IDs eingetragen. '+(!config.shop?'Käufe gesperrt: Robux-Shop ist aus.':!config.persistence?'Käufe gesperrt: Speichern ist aus.':'Fehlende IDs sind nicht kaufbar; echte Preise/Besitz prüft Roblox.');
 $('stageOutput').value=config.stages;$('shopEnabled').checked=config.shop;$('persistence').checked=config.persistence;
 const tycoon=config.mode==='tycoon';$('contextSettings').hidden=!tycoon;$('obbyOptions').hidden=tycoon;$('obbyAdvanced').hidden=tycoon||config.obbyStyle==='onlyup';$('tycoonOptions').hidden=!tycoon;$('tycoonShop').hidden=!tycoon;$('obbyShop').hidden=tycoon;
 $('layout').value=config.layout;
 $('polish').value=config.polish;$('pacing').value=config.pacing;$('plots').value=config.plots;$('tycoonDetail').value=config.detail;
 for(const offer of offers)$(offer.field).value=config[offer.field];
 document.querySelectorAll('[data-mode]').forEach(b=>{const selected=b.dataset.mode===config.mode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
 document.querySelectorAll('[data-theme]').forEach(b=>{const t=(tycoon?TYCOON_THEMES:config.obbyStyle==='onlyup'?ONLY_UP_THEMES:THEMES)[b.dataset.theme];b.querySelector('strong').textContent=t.name;b.querySelector('small').textContent=t.label;});
 document.querySelectorAll('[data-theme]').forEach(b=>{const selected=b.dataset.theme===config.theme;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
 document.querySelectorAll('[data-difficulty]').forEach(b=>{const selected=b.dataset.difficulty===config.difficulty;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
 drawThemeThumbnails();
}
function update(next=config,restoredView=null){
 const previousMode=config.mode;config=normalize(next);map=generate(config);
 const tycoon=config.mode==='tycoon';if(config.events!=='rally')preview.events=false;if(previousMode!==config.mode||preview.focusPlot===undefined)preview.focusPlot=tycoon?1:0;
 if(restoredView){Object.assign(preview,restoredView);$('buildLevel').value=restoredView.level;}
 $('buildLevel').max=UPGRADES.length;preview.level=Number($('buildLevel').value);$('levelOutput').textContent=preview.level+' / '+UPGRADES.length;fillUI();preview.setMap(map);
 manualLabels=tycoon?tycoonTests:obbyTests;
 $('previewName').textContent=config.name;$('statStages').textContent=tycoon?UPGRADES.length:config.stages;$('statCheckpoints').textContent=tycoon?config.plots:map.stages.filter(s=>s.checkpoint).length;$('statParts').textContent=map.parts.length;$('statHazards').textContent=tycoon?new Intl.NumberFormat('de-DE',{notation:'compact',maximumFractionDigits:1}).format(economySnapshot(preview.level).income):map.hazards.length;
 $('statLabelStages').textContent=tycoon?'AUSBAUSTUFEN':'ABSCHNITTE';$('statLabelPlots').textContent=tycoon?'GRUNDSTÜCKE':'CHECKPOINTS';$('statLabelHazards').textContent=tycoon?'PRODUKTION / SEK.':'GEFAHREN';
 const checks=validate(map),errors=checks.filter(c=>c.status==='error').length,warnings=checks.filter(c=>c.status==='warn').length,passed=checks.filter(c=>c.status==='pass').length;
 $('summaryTitle').textContent=errors?`${errors} Layout-Problem${errors>1?'e':''} gefunden`:`${passed} automatische Checks bestanden`;
 $('summaryDetail').textContent=errors?'Sichere Korrekturen im Bericht verfügbar.':`${warnings} Hinweis${warnings!==1?'e':''} · Spieltest in Roblox noch offen.`;
 $('navStatus').style.background=errors?'var(--danger)':warnings?'var(--warning)':'var(--lime)';
 drawChecks(checks);$('mapMetrics').innerHTML=metricsHtml(map);
 const newKey='mapforge.tests.'+hash(JSON.stringify(config)+'|'+VERSION);
 if(checkKey!==newKey){checkKey=newKey;const saved=storage.get(checkKey,[]);manuals=manualLabels.map((_,i)=>Array.isArray(saved)&&saved[i]===true);}
 $('gameplayPlan').hidden=!tycoon;$('gameplayPlan').innerHTML=tycoon?gameplayHtml(config):'';
 $('listingPreview').innerHTML=listingPreviewHtml(config);
 uploadAssistant?.refresh();shopSetup?.refresh();renderPreviewSession();syncPreviewViewControls();drawManuals();playtestLab?.refresh();updatePlayabilitySummary();improveView?.refresh();
 $('saveStatus').textContent=storage.set('mapforge.config.v3',config)?'Lokal gespeichert':'Speichern im Browser nicht verfügbar';
 output.setMap(map,checks);creativeStudio?.refresh();
 emitStudioEvent('map',{parts:map.parts.length,mode:config.mode,theme:config.theme,name:config.name},window);
}
function drawChecks(checks){$('checkList').innerHTML=checks.map(c=>`<article class="check-item ${c.status}"><div class="check-icon">${{pass:'✓',warn:'!',error:'×',manual:'↗'}[c.status]}</div><div><h3>${esc(c.title)}</h3><p>${esc(c.detail)}</p></div><span>${{pass:'Bestanden',warn:'Hinweis',error:'Korrigieren',manual:'Spieltest offen'}[c.status]}</span></article>`).join('');}
function drawManuals(){
 $('manualTests').innerHTML=manualLabels.map((label,i)=>`<label class="manual-row"><input type="checkbox" data-manual="${i}" ${manuals[i]?'checked':''}><span>${esc(label)}</span></label>`).join('');
 const done=manuals.filter(Boolean).length;$('launchProgress').style.width=(done/manualLabels.length*100)+'%';$('launchStatus').textContent=`${done} von ${manualLabels.length} Tests von dir bestätigt.`;walkthrough?.refresh();uploadAssistant?.refresh();
}
function navigate(page,focus=false){
 if(!document.getElementById('page-'+page))page='generator';
 document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));
 document.querySelectorAll('.nav-item').forEach(b=>{const active=b.dataset.nav===page;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const names={maps:'Meine Maps',bot:'Ideenwerkstatt',trends:'Trend View',generator:'Map-Generator',quality:'Qualitätscheck',debug:'Fehlersuche',shop:'Monetarisierung',publish:'Veröffentlichung',references:'Map-Referenzen',guide:'Schritt-für-Schritt',lab:'Spieltest-Labor',improve:'Map verbessern'};$('pageName').textContent=names[page];
 myMaps?.setActive(page==='maps');botStudio?.setActive(page==='bot');creativeStudio?.setActive(page==='bot');
 preview.setActive(page==='generator');
 if(location.hash!=='#'+page)history.replaceState(null,'','#'+page);
 if(page==='improve')improveView?.refresh();
 if(page==='lab')playtestLab?.refresh();
 if(page==='generator')preview.draw();
 if(page==='guide')walkthrough?.refresh();
 if(page==='trends'&&trendView&&!trendView.data)trendView.refresh();
 emitStudioEvent('page',{page},window);
 if(focus){const h=document.querySelector('#page-'+page+' h1');h.tabIndex=-1;h.focus({preventScroll:true});h.scrollIntoView({block:'start',behavior:'instant'});}
}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav,true)));
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
for(const [id,key] of [['stages','stages'],['checkpointEvery','checkpointEvery'],['detail','detail'],['seed','seed'],['gap','gap'],['rise','rise']])$(id).addEventListener(id==='stages'?'input':'change',()=>update({...config,[key]:$(id).value}));
$('mapName').addEventListener('change',()=>update({...config,name:$('mapName').value,autoName:false}));
$('storyChoice').addEventListener('change',()=>update({...config,storyId:$('storyChoice').value}));
onlyUpStudio=mountOnlyUp($('onlyUpStudio'),{getConfig:()=>config,getMap:()=>map,onChange:patch=>update({...config,...patch}),onCollection:options=>exportCollection(options?.individual?'individual':'onlyup'),onCancelCollection:()=>collectionController?.abort()});
grindStudio=mountGrindStudio($('grindStudio'),{getConfig:()=>config,onChange:patch=>update({...config,...patch}),onCollection:()=>exportCollection('minigames'),onCancelCollection:()=>collectionController?.abort()});
eventStudio=mountEventPreview($('eventStudio'),{getConfig:()=>config,onChange:events=>update({...config,events})});
$('movementProfile').addEventListener('change',()=>update({...config,movement:$('movementProfile').value}));
$('autoName').addEventListener('change',()=>update({...config,autoName:$('autoName').checked}));
$('newMapName').addEventListener('click',()=>{update({...config,name:proposeMapName(config,newSeed()),autoName:true});toast('Neuer Namensvorschlag: '+config.name);});
document.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{const theme=b.dataset.theme,all=[...Object.values(THEMES),...Object.values(TYCOON_THEMES)];update({...config,theme,name:all.some(t=>t.name===config.name)?(config.mode==='tycoon'?TYCOON_THEMES:THEMES)[theme].name:config.name});}));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.mode;update({...config,mode,name:[...Object.values(THEMES),...Object.values(TYCOON_THEMES)].some(t=>t.name===config.name)?(mode==='tycoon'?TYCOON_THEMES:THEMES)[config.theme].name:config.name});}));
function readyPreset(){const ready=repair({...config,detail:3,checkpointEvery:5,gap:4,rise:1.3,persistence:true,shop:true});$('buildLevel').value=UPGRADES.length;update(ready.config);toast('Voreinstellungen gesetzt. Prüfe die Map und kehre danach zur Anleitung zurück.');}
$('readyPreset').addEventListener('click',readyPreset);
$('layout').addEventListener('change',()=>update({...config,layout:$('layout').value}));
$('polish').addEventListener('change',()=>update({...config,polish:$('polish').value}));
$('pacing').addEventListener('change',()=>update({...config,pacing:$('pacing').value}));
$('plots').addEventListener('change',()=>update({...config,plots:$('plots').value}));$('tycoonDetail').addEventListener('change',()=>update({...config,detail:$('tycoonDetail').value}));
function renderPreviewSession(){const state=previewStage(config,preview.level);$('previewSession').hidden=config.mode!=='tycoon';$('previewStageTitle').textContent=state.title;$('previewStageDetail').textContent=state.detail;document.querySelectorAll('[data-preview-level]').forEach(b=>{const active=Number(b.dataset.previewLevel)===state.count;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});}
function syncPreviewViewControls(){$('planView').setAttribute('aria-pressed',String(!!preview.plan));$('pathView').setAttribute('aria-pressed',String(!!preview.path));$('plotView').textContent=preview.focusPlot?'Alle Grundstücke ansehen ↗':'Eine Fabrik im Detail ansehen ↗';$('arenaView').setAttribute('aria-pressed',String(!!preview.events));$('arenaView').textContent=preview.events?'Zur Map':'Rallye-Arena';}
function setPreviewLevel(level){$('buildLevel').value=level;$('levelOutput').textContent=level+' / '+UPGRADES.length;preview.level=Number(level);preview.draw();$('statHazards').textContent=config.mode==='tycoon'?new Intl.NumberFormat('de-DE',{notation:'compact',maximumFractionDigits:1}).format(economySnapshot(preview.level).income):map.hazards.length;renderPreviewSession();}
$('buildLevel').addEventListener('input',()=>setPreviewLevel(Number($('buildLevel').value)));
document.querySelectorAll('[data-preview-level]').forEach(b=>b.addEventListener('click',()=>setPreviewLevel(Number(b.dataset.previewLevel))));
$('arenaView').addEventListener('click',()=>{preview.events=!preview.events;syncPreviewViewControls();preview.draw();});
$('plotView').addEventListener('click',()=>{preview.events=false;preview.focusPlot=preview.focusPlot?0:1;$('plotView').textContent=preview.focusPlot?'Alle Grundstücke ansehen ↗':'Eine Fabrik im Detail ansehen ↗';preview.draw();});
document.querySelectorAll('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>update({...config,difficulty:b.dataset.difficulty})));
const newSeed=()=>globalThis.crypto?.getRandomValues?Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36).toUpperCase()).join('-'):Date.now().toString(36).toUpperCase();
$('randomSeed').addEventListener('click',()=>{update({...config,seed:newSeed()});toast('Neuer Seed. Die Vorschau zeigt die neue Variante.');});
async function runGeneration(produce,detail='Deine Einstellungen werden gebaut und geprüft.'){
 if(!beginGeneration(detail))return false;const base=JSON.stringify(config);
 try{await nextPaint();const candidate=await produce();if(base!==JSON.stringify(config))throw Error('Deine Einstellungen wurden während des Abrufs geändert. Bitte erneut generieren; es wurde nichts überschrieben.');update(nameForGeneration(normalize(candidate),newSeed()));postGenerate();finishGeneration();toast('Map fertig: '+config.name+'. Dein Download steht oben bereit.');return true;}
 catch(e){output.fail(e.message);emitStudioEvent('work',{kind:'generation',state:'error',message:'Bau angehalten · siehe Ergebnis'},window);toast(e.message);return false;}finally{endGeneration();}
}
function manualGenerate(){const next={...config,name:$('mapName').value,autoName:$('mapName').value===config.name?config.autoName:false,seed:$('seed').value,stages:$('stages').value,gap:$('gap').value,rise:$('rise').value};return runGeneration(()=>next);}
function trendConfig(game){$('generationSource').textContent='Trend-Quelle: '+game.name+' · Abruf '+new Date(trendView.data.fetchedAt).toLocaleString('de-DE')+'. Eigene Tycoon-Adaption.';return {...config,...game.idea,name:config.name,autoName:config.autoName,seed:newSeed()};}
function applyTrend(game){return runGeneration(()=>trendConfig(game));}
$('generate').addEventListener('click',()=>{if($('trendBefore').checked)return runGeneration(async()=>{const game=await trendView.beforeGenerate();if(!game)throw Error('Keine frischen Trenddaten. Nutze „Mit meinen Einstellungen bauen“ oder versuche es erneut. Deine Map wurde nicht ersetzt.');return trendConfig(game);},'Roblox-Trends werden abgerufen. Danach wird deine eigene Map gebaut.');return manualGenerate();});
$('generateManual').addEventListener('click',manualGenerate);
$('applyBrief').addEventListener('click',()=>{if(!$('brief').value.trim()){toast('Beschreibe Spielmodus und Design.');return;}const result=fromBrief($('brief').value,config);result.config.seed=newSeed();return runGeneration(()=>{$('briefResult').textContent=result.notes.join(' · ');return result.config;});});
$('repairAll').addEventListener('click',()=>{const result=repair(config);update(result.config);toast(result.changes.length?result.changes.join(' · '):'Keine automatisch korrigierbare Einstellung gefunden. Offene Hinweise manuell prüfen.');});
function analyze(){const results=diagnose($('logInput').value);$('diagnosis').innerHTML=results.length?results.map((r,i)=>`<article class="panel padded"><span class="tiny-label">MÖGLICHE URSACHE ${i+1}</span><h2 style="margin-top:8px">${esc(r.title)}</h2><p>${esc(r.detail)}</p></article>`).join(''):'<div class="empty-card"><h2>Noch keine Fehlermeldung</h2><p>Füge den Text aus Studio Output ein.</p></div>';}
$('downloadIssue').addEventListener('click',()=>{download(safeFilename(config.name)+'-Fehlerbericht.md',issueReport(map,{log:$('logInput').value,steps:$('issueSteps').value,expected:$('issueExpected').value,actual:$('issueActual').value,environment:$('issueEnvironment').value}),'text/markdown;charset=utf-8');toast('Fehlerbericht erstellt. Vor dem Weitergeben auf persönliche Angaben prüfen.');});
$('analyzeLog').addEventListener('click',analyze);$('demoLog').addEventListener('click',()=>{$('logInput').value='[MapForge] Studio DataStore unavailable: StudioAccessToApisNotAllowed.\nDataStoreService: Studio access to APIs is not allowed.\nServerScriptService.MapForgeData:65';analyze();});
$('saveShop').addEventListener('click',()=>{const fields=['boostId','coinsId',...offers.map(p=>p.field),...COSMETIC_ID_FIELDS];for(const id of fields)if(!/^([1-9]\d{0,14})?$/.test($(id).value.trim())){toast('IDs müssen positive Zahlen mit maximal 15 Stellen sein.');$(id).focus();return;}const values=Object.fromEntries(fields.map(id=>[id,$(id).value]));update({...config,...values,shop:$('shopEnabled').checked,cosmetics:$('cosmeticsEnabled').checked,persistence:$('persistence').checked,shopHints:$('shopHints').checked,shopHintDelay:$('shopHintDelay').value,shopFocus:$('shopFocus').value,analytics:$('onboardingAnalytics').checked});toast('Shop übernommen. Neue Studio-Datei exportieren, um die Änderung im Spiel zu nutzen.');});
function setManual(index,checked){if(!Number.isInteger(index)||index<0||index>=manualLabels.length)return;manuals[index]=checked===true;if(!storage.set(checkKey,manuals))toast('Testprotokoll konnte nicht im Browser gespeichert werden.');drawManuals();}
$('manualTests').addEventListener('change',e=>{if(e.target.dataset.manual!==undefined)setManual(Number(e.target.dataset.manual),e.target.checked);});
$('zoomOut').addEventListener('click',()=>{preview.zoom=Math.max(.5,preview.zoom-.15);preview.draw();});$('zoomIn').addEventListener('click',()=>{preview.zoom=Math.min(2.5,preview.zoom+.15);preview.draw();});
$('planView').addEventListener('click',()=>{preview.plan=!preview.plan;$('planView').setAttribute('aria-pressed',preview.plan);preview.draw();});$('pathView').addEventListener('click',()=>{preview.path=!preview.path;$('pathView').setAttribute('aria-pressed',preview.path);preview.draw();});
$('resetView').addEventListener('click',()=>{preview.angle=-.8;preview.zoom=1;preview.plan=false;preview.path=false;$('planView').setAttribute('aria-pressed','false');$('pathView').setAttribute('aria-pressed','false');preview.draw();});
function download(name,content,type='text/plain;charset=utf-8'){return output.download(name,content,type);}
async function collectionArtwork(snapshot,direction){
 const images={};
 for(const format of ['landscape','square']){
  const canvas=document.createElement('canvas'),spec=ARTWORK_FORMATS[format];canvas.width=spec.width;canvas.height=spec.height;
  if(!drawMapArtwork(canvas,snapshot,{title:direction.title,subtitle:direction.hook||(direction.minigame?'Werkmarken erspielen · Werkstatt ausbauen':snapshot.onlyUp?`${snapshot.config.stages} Etappen · ${Math.round(snapshot.onlyUp.height)} Studs Aufstieg`:''),format,scope:direction.minigame?'arena':'detail',layout:direction.mode==='obby'?'cinematic':'editorial'}))throw Error('Cover konnte nicht erstellt werden: '+direction.title);
  const blob=await artworkPng(canvas);images[format==='square'?'Icon.png':'Thumbnail.png']=new Uint8Array(await blob.arrayBuffer());
 }
 return images;
}
async function exportCollection(kind='creative'){
 const onlyUp=kind==='onlyup'||kind==='individual';
 if(generationBusy||exportBusy)return false;exportBusy=true;collectionController=new AbortController();syncActions();$('cancelCollection').hidden=false;onlyUpStudio?.setCollectionBusy(true);grindStudio?.setCollectionBusy(true);
 try{
  await loadScripts();if(!scripts)throw Error('Export-Skripte sind noch nicht verfügbar. Bitte erneut versuchen.');
  const buildCollection=kind==='minigames'?buildMinigameCollection:onlyUp?buildOnlyUpCollection:buildCreativeCollection;
  const result=await buildCollection(scripts,{individual:kind==='individual',signal:collectionController.signal,yieldTask:nextPaint,artwork:collectionArtwork,onProgress:({completed,total,title})=>{const text=`${completed} / ${total} Maps vorbereitet · ${title}`;$('collectionStatus').textContent=text;onlyUpStudio?.setCollectionStatus(text);grindStudio?.setCollectionStatus(text);}});
  if(collectionController.signal.aborted)throw Error('Sammlung abgebrochen.');
  await nextPaint();download(kind==='minigames'?'MapForge-3-Minispiel-Startpakete.zip':kind==='individual'?'MapForge-12-Individuelle-Only-Up-Welten.zip':onlyUp?'MapForge-4-Only-Up-Startpakete.zip':'MapForge-12-Welten-Startpakete.zip',makeZip(result.files),'application/zip');const status=result.records.length+' Starterprojekte mit Cover und eigenen Themen bereit.';$('collectionStatus').textContent=status;onlyUpStudio?.setCollectionStatus(status);grindStudio?.setCollectionStatus(status);return true;
 }catch(error){const text=error.message||'Sammlung konnte nicht erstellt werden. Bitte erneut versuchen.';$('collectionStatus').textContent=text;onlyUpStudio?.setCollectionStatus(text);grindStudio?.setCollectionStatus(text);return false;}
 finally{collectionController=null;exportBusy=false;$('cancelCollection').hidden=true;onlyUpStudio?.setCollectionBusy(false);grindStudio?.setCollectionBusy(false);syncActions();}
}
$('downloadCollection').addEventListener('click',()=>exportCollection());$('cancelCollection').addEventListener('click',()=>collectionController?.abort());
$('openArtwork').addEventListener('click',()=>artworkStudio.open(map));
const project=()=>download(safeFilename(config.name)+'.mapforge.json',JSON.stringify({app:'MapForge',version:VERSION,config,playtests:playtestLab?.current()||[],improvements:improveView?.current()||[],inspiration:trendView?.selected?{universeId:trendView.selected.id,name:trendView.selected.name,url:trendView.selected.url,fetchedAt:trendView.data?.fetchedAt}:null},null,2),'application/json');
for(const id of ['downloadConfig','saveProject'])$(id).addEventListener('click',project);
const report=()=>download(safeFilename(config.name)+'-Pruefbericht.txt',`MAPFORGE ${VERSION} — PRÜFBERICHT\nProjekt: ${config.name}\nSeed: ${config.seed}\nZeit: ${new Date().toISOString()}\n\n`+validate(map).map(c=>`[${c.status.toUpperCase()}] ${c.title}\n${c.detail}`).join('\n\n')+'\n\nSELBST BESTÄTIGTE SPIELTESTS\n'+manualLabels.map((t,i)=>`[${manuals[i]?'x':' '}] ${t}`).join('\n')+'\n\nDiese Prüfung ist kein automatisch ausgeführter Roblox-Spieltest.\n');
$('downloadReport').addEventListener('click',report);
$('downloadQualityDossier').addEventListener('click',()=>download(safeFilename(config.name)+'-Map-Dossier.md',qualityDossier(map),'text/markdown;charset=utf-8'));
$('downloadQualityAudit').addEventListener('click',()=>{download('Studio-Map-Audit.lua',studioMapAudit(map));toast('Prüfskript erstellt. In Studio Play auf dem Server über die Command Bar ausführen.');});
function downloadHandoff(){download(safeFilename(config.name)+'-KI-Update.md',handoffUpdate(map,manualLabels.map((label,i)=>({label,done:manuals[i]})),playtestLab?.current()||[],improveView?.current()||[]),'text/markdown;charset=utf-8');toast('KI-Update für die aktuelle Map erstellt.');}
$('downloadHandoff').addEventListener('click',downloadHandoff);

async function exportCurrent(kind,{prepare=false,expectedRevision}={}){
 if(exportBusy||generationBusy)return {ok:false,error:'Bitte warte auf den laufenden Vorgang.'};
 const reject=error=>{output.exportFailed(error);return {ok:false,error};};
 if(expectedRevision&&expectedRevision!==JSON.stringify(config))return reject('Die Vorschau wurde geändert. Export bitte für die gewünschte Map erneut starten.');
 if(!scripts&&!prepare)return reject('Export noch nicht bereit. Warte auf die Vorbereitung oder lade die Export-Dateien erneut.');
 if(validate(map).some(c=>c.status==='error'))return reject('Bitte markierte Layoutfehler im Qualitätscheck korrigieren.');
 const snapshot=map,manualTests=manualLabels.map((label,i)=>({label,done:manuals[i]})),playtests=structuredClone(playtestLab?.current()||[]),improvements=structuredClone(improveView?.current()||[]);let source=scripts;
 exportBusy=true;output.beginExport(kind);syncActions();emitStudioEvent('work',{kind:'export',state:'start',message:'Studio-Dateien werden erstellt'},window);
 try{
  if(!source&&prepare){await loadScripts();source=scripts;}
  if(!source)throw Error('Export-Dateien konnten nicht geladen werden. Versuche die Datei-Erstellung erneut.');
  await nextPaint();const filename=safeFilename(snapshot.config.name);
  const file=kind==='map'?download(filename+'.rbxlx',toRBXLX(snapshot,source),'application/xml'):download(filename+'-Startpaket.zip',makeZip(launchFiles(snapshot,source,manualTests,playtests,improvements)),'application/zip');
  emitStudioEvent('work',{kind:'export',state:'done',message:'Export erstellt · Download bereit'},window);toast('Datei erstellt. Den Download findest du oben unter „Ergebnis & Downloads“.');return {ok:true,file};
 }
 catch(e){const error='Datei konnte nicht erstellt werden: '+e.message;output.exportFailed(error);emitStudioEvent('work',{kind:'export',state:'error',message:'Export angehalten · siehe Ergebnis'},window);toast('Export fehlgeschlagen: '+e.message);return {ok:false,error};}
 finally{exportBusy=false;output.endExport();syncActions();}
}
function exportMap(){return exportCurrent('map');}
document.querySelectorAll('.export-button').forEach(b=>b.addEventListener('click',exportMap));
function exportBundle(options){return exportCurrent('bundle',options);}
document.querySelectorAll('[data-bundle]').forEach(b=>b.addEventListener('click',()=>exportBundle()));
$('downloadHealth').addEventListener('click',()=>{if(scripts)download('MapForgeHealth.server.lua',config.mode==='tycoon'?scripts.tycoonHealth:scripts.health);else toast('Skripte werden noch geladen.');});
$('downloadGuide').addEventListener('click',async()=>{try{const r=await fetch('guide.md');if(!r.ok)throw new Error();download('MapForge-Startanleitung.md',await r.text(),'text/markdown;charset=utf-8');}catch{toast('Anleitung konnte nicht geladen werden. Den Bauplan findest du auch direkt auf dieser Seite.');}});
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(generationBusy||exportBusy)throw Error('Bitte warte auf den laufenden Vorgang.');if(f.size>512000)throw Error('Datei ist zu groß.');const base=JSON.stringify(config),obj=JSON.parse(await f.text());if(obj.app!=='MapForge'||!obj.config||typeof obj.config!=='object'||Array.isArray(obj.config))throw Error('Keine gültige MapForge-Projektdatei.');if(generationBusy||exportBusy)throw Error('Bitte warte auf den laufenden Vorgang und öffne die Datei erneut.');if(base!==JSON.stringify(config))throw Error('Deine Map wurde während des Ladens geändert. Datei bitte erneut öffnen.');previousMap=openMapSnapshot();update(obj.config);if(Array.isArray(obj.improvements)){improveView?.import(obj.improvements);improveView?.refresh();}if(Array.isArray(obj.playtests)){playtestLab?.import(obj.playtests);playtestLab?.refresh();updatePlayabilitySummary();}const saved=vault.remember(map,{source:'imported'});navigate('generator');output.setUndo(true);output.setPersistence(saved.persisted);output.restored(saved.record,{title:'Projektdatei geöffnet'});toast('Projekt geöffnet.');}catch(err){toast('Import: '+err.message);}finally{e.target.value='';}});
function loadScripts(){
 if(scriptLoadPromise)return scriptLoadPromise;
 output.setScripts('loading');syncActions();
 scriptLoadPromise=(async()=>{try{const entries=Object.entries(SCRIPT_FILES);scripts=Object.fromEntries(await Promise.all(entries.map(async([k,file])=>{const r=await fetch(`lua/${file}.lua`);if(!r.ok)throw new Error(k);const text=await r.text();if(!text.includes('MapForge'))throw new Error(k);return[k,text];})));output.setScripts('ready');}catch{scripts=null;output.setScripts('failed');toast('Export-Dateien nicht geladen. Nutze „Export erneut vorbereiten“ oben.');}finally{scriptLoadPromise=null;walkthrough?.refresh();syncActions();}})();return scriptLoadPromise;
}
$('cosmeticsShop').innerHTML=cosmeticsSetupHtml();
$('tycoonShop').innerHTML=offers.map((p,i)=>`<article class="panel shop-card"><div class="shop-icon ${p.pass?'purple':''}">${p.pass?'★':i<2?'$':i<4?'◇':'×2'}</div><span class="tiny-label">${p.pass?'DAUERHAFTER PASS':'WIEDERHOLBARES PRODUKT'}</span><h2>${esc(p.name)}</h2><p>${esc(p.detail)}</p><label for="${p.field}">${p.pass?'Game-Pass-ID':'Developer-Product-ID'}</label><input id="${p.field}" inputmode="numeric" maxlength="15" placeholder="Noch nicht eingerichtet"><small>Preis im Creator Hub festlegen; Roblox zeigt ihn im Spiel.</small></article>`).join('');
shopSetup=new ShopSetup($('shopSetup'),{getConfig:()=>config,apply:update,download,toast});
trendView=new TrendView({onApply:applyTrend,onNavigate:page=>navigate(page),toast});
const guideContext=()=>({map,checks:validate(map),manualTests:manualLabels.map((label,i)=>({label,done:manuals[i]})),scriptsReady:!!scripts,scopeKey:checkKey});
function downloadSteps(){download(safeFilename(config.name)+'-Schritt-fuer-Schritt.md',guideMarkdown(guideContext()),'text/markdown;charset=utf-8');toast('Schrittanleitung für die aktuelle Map erstellt.');}
$('downloadSteps').addEventListener('click',downloadSteps);
walkthrough=new Walkthrough($('walkthrough'),{storage,getContext:guideContext,navigate,toast,onTest:setManual,actions:{preset:readyPreset,repair:()=>{const result=repair(config);update(result.config);toast(result.changes.join(' · ')||'Keine automatischen Korrekturen nötig.');},bundle:()=>exportBundle(),export:exportMap,project,handoff:downloadHandoff,instructions:downloadSteps,disableShop:()=>{update({...config,shop:false});toast('Robux-Shop ausgeschaltet. Erneut exportieren, damit die Änderung in Studio gilt.');}}});
function updatePlayabilitySummary(){const count=playtestLab?.current().length||0;$('playabilitySummary').textContent=config.mode==='tycoon'?`Gratis-Starter, Wegweiser, wählbare Aufträge und vier Bau-Meilensteine. ${config.shopHints?'Kontext-Angebote frühestens nach '+config.shopHintDelay+' Sekunden.':'Angebotshinweise aus.'} ${count} echte Spieltests eingetragen.`:'Checkpoints und erspielbare Leuchtspur. Beobachte Einstieg und Sprünge im Spieltest-Labor.';uploadAssistant?.refresh();}
playtestLab=new PlaytestLab($('playtestLab'),{storage,getConfig:()=>config,onChange:()=>updatePlayabilitySummary(),download,toast});
async function reviewPackage(wish){
 const snapshot=map,canvas=document.createElement('canvas');canvas.width=1280;canvas.height=900;
 const png=async level=>{drawPreview(canvas,snapshot,{angle:-.8,focusPlot:snapshot.config.mode==='tycoon'?1:0,level,path:true});const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Vorschau konnte nicht erstellt werden.')),'image/png'));return new Uint8Array(await blob.arrayBuffer());};
 const context={feedback:wish,manualTests:manualLabels.map((label,i)=>({label,done:manuals[i]})),playtests:playtestLab?.current()||[],improvements:improveView?.current()||[]};
 const previewBytes=await png(48),startPreviewBytes=await png(3);
 const files=reviewFiles(snapshot,{...context,previewBytes,startPreviewBytes});
 download(safeFilename(snapshot.config.name)+'-KI-Pruefpaket.zip',makeZip(files),'application/zip');toast('KI-Prüfpaket mit Vorschauen und Geometrie erstellt.');
}
function postGenerate(){if($('autoImprove').checked)improveView?.run(true);}
improveView=new ImproveView($('improveWorkspace'),{storage,getMap:()=>map,apply:next=>update(next),toast,downloadReview:reviewPackage,autoCheckbox:$('autoImprove')});
uploadAssistant=new UploadAssistant($('uploadAssistant'),{getMap:()=>map,getContext:()=>({manualTests:manualLabels.map((label,i)=>({label,done:manuals[i]})),playtests:playtestLab?.current()||[]}),exportMap,download,toast});
botStudio=new BotStudio($('botWorkspace'),{getConfig:()=>config,fetchTrends:()=>trendView.refresh(),apply:next=>update(next),navigate,toast,download,onNamingChange:value=>update({...config,autoName:value}),begin:()=>beginGeneration('Der Bot prüft deinen Auftrag und baut deine Map.'),complete:finishGeneration,fail:message=>{output.fail(message);emitStudioEvent('work',{kind:'generation',state:'error',message:'Bau angehalten · siehe Ergebnis'},window);},end:endGeneration,exportMap,exportBundle,onPreview:openIdeaPreview});
creativeStudio=new CreativeStudio($('creativeWorkspace'),{getConfig:()=>config,onPreview:openIdeaPreview,onArtwork:(draft,direction)=>artworkStudio.open(draft,direction),toast});
myMaps=new MyMaps($('myMapsWorkspace'),{vault,getBusy:()=>generationBusy||exportBusy,onOpen:openSavedMap,onSave:saveCurrentMap,download,toast});
vault.onChange=()=>{$('mapCount').textContent=vault.records.length;myMaps.refresh();};$('mapCount').textContent=vault.records.length;
update();
if(previousProject){let record=vault.find(config);if(!record)record=vault.remember(map,{source:'recovered'}).record;output.setPersistence(vault.persisted);output.restored(record,{automatic:true});}
navigate(location.hash.slice(1)||'bot');loadScripts();
