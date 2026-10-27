import {proposeConcepts,applyConcept} from './idea-core.js';
import {IDEA_REFERENCES,conceptMarkdown} from './idea-data.js';
import {buildBotRun} from './bot-core.js';
import {prepareIdeaPreview,ideaCardsHtml} from './idea-preview.js';
import {drawPreview} from './preview.js';
import {reviewRevision} from './improve.js';
import {browserTask} from './browser-task.js';
import {VERSION} from './engine.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class BotStudio{
 constructor(root,{getConfig,fetchTrends,apply,navigate,toast,download,onNamingChange,begin,complete,fail,end,exportMap,exportBundle,onPreview,renderIdeaPreview=drawPreview}){
  Object.assign(this,{root,getConfig,fetchTrends,apply,navigate,toast,download,onNamingChange,begin,complete,fail,end,exportMap,exportBundle,onPreview,renderIdeaPreview});
  this.ideaPreviews=[];this.ideaLevel=48;this.active=false;this.paintVersion=0;
  root.innerHTML=`<div class="bot-layout"><div class="panel padded"><span class="tiny-label">BOT-ZENTRALE · MAPFORGE ${VERSION}</span><h2>Von deiner Idee bis zum Download.</h2><p>Trendprüfung, Vorlagenbau, lokale Überarbeitung und Layoutprüfung in einem Durchlauf.</p><label for="botBrief">Was soll dein Spiel bieten?</label><textarea id="botBrief" rows="5" maxlength="2000" placeholder="Ein schöner Neon-Tycoon, schnelle erste Erfolge, wenig Wartezeit und dezente Shop-Hinweise"></textarea><div class="action-row"><button class="quiet" data-preset="Neon-Tycoon, schöner, schneller, weniger Shop-Hinweise">Neon-Tycoon</button><button class="quiet" data-preset="Dschungel-Tycoon, Handy, weniger warten">Fürs Handy</button><button class="quiet" data-preset="Einfacher Obby, leichtere Sprünge, schöne Wolken">Einfacher Obby</button></div><label class="manual-row"><input id="botTrends" type="checkbox" checked><span>Aktuelle Roblox-Trends vor dem Bau prüfen</span></label><label class="manual-row"><input id="botIdeas" type="checkbox" checked><span>Eigene Tycoon-Idee aus mehreren Referenzen entwickeln</span></label><label class="manual-row"><input id="botAutoName" type="checkbox"><span>Eigene Map-Namen automatisch finden</span></label><div class="bot-run-actions"><button id="botRunBundle" class="primary full" aria-describedby="botBundleHint">Bauen & Startpaket laden</button><button id="botRun" class="quiet full">Nur Map bauen</button><button id="botCompareIdeas" class="text-btn">Erst 3 Ideen mit Vorschau vergleichen →</button></div><p class="micro" id="botBundleHint">Baut und prüft deine Map, sichert sie in „Meine Maps“ und erstellt anschließend eine ZIP mit Studio-Datei, Anleitung, Projektdatei und KI-Update.</p><p class="micro">Die Vorlagenautomatik setzt deine Wünsche in vorhandene Einstellungen um. Tycoon und Obby werden unterstützt.</p><details class="browser-assistant"><summary>Mit Claude am PC arbeiten</summary><p>Öffne diese App in dem Browser, in dem dein Assistent eingerichtet ist. Kopiere den Auftrag in dessen Seitenleiste. Der Text berücksichtigt deine aktuellen Einstellungen und den Spielwunsch oben.</p><label for="browserTask">Auftrag für deinen Browser-Assistenten</label><textarea id="browserTask" rows="8" readonly spellcheck="false"></textarea><button class="quiet" id="copyBrowserTask">Auftrag für Claude kopieren</button><p id="browserTaskStatus" class="micro" role="status" aria-live="polite">Der Text richtet keine Verbindung ein. Dein Browser-Assistent benötigt Zugriff auf diese geöffnete Seite.</p></details><details><summary>Was dein Charts-Screenshot als Referenz zeigt</summary><p>„Verkaufe Pommes!“: sichtbarer Betriebsaufbau als Inspiration. „Dress To Impress“: Gestaltung und Selbstausdruck. Rettungs- und Kampfspiele: klares Rollenziel. MapForge übernimmt daraus verständliche Ziele und sichtbaren Fortschritt. Modewettbewerbe, Restaurantbetrieb oder Kampf-KI sind damit noch nicht implementiert.</p><a class="text-btn" href="https://www.roblox.com/charts" target="_blank" rel="noopener">Roblox-Charts ansehen ↗</a></details></div><div class="panel padded"><span class="tiny-label">DEIN LAUFENDER AUFTRAG</span><h2>Du siehst, was passiert.</h2><p id="botStatus" class="bot-status" role="status" aria-live="polite">Bereit für deinen Auftrag.</p><ol id="botEvents" class="launch-steps"><li>Wähle „Bauen & Startpaket laden“ für den gesamten Ablauf.</li></ol><div id="botResult"></div><div class="action-row"><button class="quiet" id="botRetryBundle" hidden>Startpaket erneut erstellen</button><button class="quiet" data-bot-page="improve">Externe KI-Prüfung & Feedback</button><button class="quiet" data-bot-page="publish">Zum Upload</button><button class="quiet" id="botReport" disabled>Ablaufbericht laden</button></div></div></div><section class="panel padded idea-workshop" aria-labelledby="ideas-title"><span class="tiny-label">IDEENWERKSTATT</span><h2 id="ideas-title">Aus guten Ansätzen wird deine eigene Welt.</h2><p>Drei eigene Produktions-Tycoon-Konzepte aus mehreren Referenzen. Vergleiche drei echte Map-Layouts, ihre Bauteile und den Spielstart. Öffne deinen Favoriten im Generator oder lade direkt sein Startpaket.</p><button class="primary" id="botProposeIdeas">3 Map-Ideen entwickeln</button><p id="ideaStatus" class="micro" role="status" aria-live="polite">Verwendet die Live-Option oben. Ohne Live-Daten werden geprüfte Spielbeschreibungen kombiniert.</p><div id="ideaPreviewControls" class="idea-preview-controls" hidden><div class="segmented" role="group" aria-label="Ausbaustufe im Ideenvergleich"><button data-idea-level="0" aria-pressed="false">Spielstart</button><button data-idea-level="6" aria-pressed="false">Erste Ausbauten</button><button data-idea-level="48" class="selected" aria-pressed="true">Vollausbau</button></div><p class="micro">Echte Generator-Geometrie eines Grundstücks. Bauteilzahlen zählen alle Grundstücke. Roblox-Beleuchtung und Spielphysik separat testen.</p></div><div id="botIdeaCards" class="idea-grid"></div><details><summary>Tycoon-Referenzen und Übertragung</summary><p>Die Muster sind eigene Design-Hypothesen. Besucherzahlen erklären nicht, warum ein Spiel erfolgreich ist. Die lokale Ideenautomatik kombiniert vorhandene Systeme; sie ist kein angeschlossenes Sprachmodell.</p>${IDEA_REFERENCES.map(r=>`<article class="idea-source"><a href="${r.url}" target="_blank" rel="noopener"><strong>${r.name} ↗</strong></a><p>${r.observation}</p><p class="micro">Unsere Übertragung: ${r.transfer}. ${r.limit} · Beschreibung geprüft: ${r.checkedAt}</p></article>`).join('')}</details></section>`;
  root.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||b.disabled)return;
   if(b.dataset.preset&&!this.busy&&!this.appBusy){root.querySelector('#botBrief').value=b.dataset.preset;if(/Obby/i.test(b.dataset.preset))root.querySelector('#botTrends').checked=false;root.querySelector('#botIdeas').checked=!/Obby/i.test(b.dataset.preset);this.refreshAssistant();}
   if(b.dataset.botPage)this.navigate(b.dataset.botPage,true);
   if(b.id==='botProposeIdeas'||b.id==='botCompareIdeas'){this.focusWorkshop();return this.proposeIdeas();}
   if(b.dataset.ideaLevel!==undefined)return this.setIdeaLevel(Number(b.dataset.ideaLevel));
   if(b.dataset.ideaPreview)return this.previewIdea(b.dataset.ideaPreview);
   if(b.dataset.ideaBuild){try{const preview=this.currentIdea(b.dataset.ideaBuild);return this.run({bundle:true,idea:preview.idea});}catch(error){this.ideaMessage(error.message);}return;}
   if(b.dataset.ideaPlan){try{const preview=this.currentIdea(b.dataset.ideaPlan);this.download('MapForge-Idee-'+preview.idea.id+'.md',conceptMarkdown(preview.config),'text/markdown;charset=utf-8');}catch(error){this.ideaMessage(error.message);}return;}
   if(b.id==='botRun')return this.run();
   if(b.id==='botRunBundle')return this.run({bundle:true});
   if(b.id==='botRetryBundle')return this.retryBundle();
   if(b.id==='copyBrowserTask')return this.copyTask();
   if(b.dataset.botDownload==='map')return this.exportMap();
   if(b.dataset.botDownload==='bundle')return this.exportBundle();
   if(b.id==='botReport'&&this.last)this.download('MapForge-Bot-Ablauf.json',JSON.stringify(this.last,null,2),'application/json');
  });
  root.querySelector('#botAutoName').addEventListener('change',e=>this.onNamingChange(e.target.checked));
  root.querySelector('#botBrief').addEventListener('input',()=>this.refreshAssistant());
  root.querySelector('#botIdeas').addEventListener('change',()=>this.refreshAssistant());
  root.querySelector('#botTrends').addEventListener('change',()=>this.refreshAssistant());
  this.refresh();
 }
 ideaMessage(text){this.root.querySelector('#ideaStatus').textContent=text;}
 focusWorkshop(){const title=this.root.querySelector('#ideas-title');title.tabIndex=-1;title.scrollIntoView?.({block:'start',behavior:'instant'});title.focus?.({preventScroll:true});}
 currentIdea(id){
  const preview=this.ideaPreviews.find(p=>p.idea.id===id);
  if(!preview||this.ideaBase!==reviewRevision(this.getConfig()))throw Error('Deine Einstellungen wurden geändert. Bitte neue Ideen entwickeln.');
  applyConcept(this.getConfig(),preview.idea); // Recheck the age of live sources at action time.
  return preview;
 }
 previewIdea(id){
  if(this.busy||this.appBusy||this.ideaBusy)return false;
  try{
   const preview=this.currentIdea(id);
   if(!this.onPreview)throw Error('Die Generator-Vorschau ist nicht verfügbar.');
   const result=this.onPreview(preview.config,{level:this.ideaLevel});if(!result)return false;
   this.ideaBase=reviewRevision(this.getConfig());this.refresh();
   this.ideaMessage('Im Generator geöffnet: '+preview.config.name+'. Über „Vorherige Map wiederherstellen“ kannst du zurück. Es wurde kein Download gestartet.');
   return true;
  }catch(error){this.ideaMessage(error.message);this.toast(error.message);return false;}
 }
 async proposeIdeas(){
  if(this.busy||this.appBusy||this.ideaBusy)return;
  this.ideaBusy=true;this.ideas=null;this.ideaPreviews=[];this.paintVersion++;this.setBusy();
  this.root.querySelector('#botIdeaCards').innerHTML='';this.root.querySelector('#ideaPreviewControls').hidden=true;
  const config=this.getConfig(),base=reviewRevision(config),useTrends=this.root.querySelector('#botTrends').checked;
  this.ideaMessage(useTrends?'Aktuelle Referenzen werden abgerufen …':'Geprüfte Designmuster werden kombiniert …');
  try{
   const trends=useTrends?await this.fetchTrends():null;
   if(useTrends&&!trends)throw Error('Live-Daten nicht erreichbar. Erneut versuchen oder die Live-Option oben ausschalten.');
   const ideas=proposeConcepts(config,{seed:String(Date.now())+'-'+(this.ideaSequence=(this.ideaSequence||0)+1),trends}),previews=[];
   for(const idea of ideas){
    if(base!==reviewRevision(this.getConfig())||this.appBusy)throw Error('Einstellungen inzwischen geändert. Bitte neue Ideen entwickeln.');
    this.ideaMessage('Map '+(previews.length+1)+' von 3 wird als Layout aufgebaut und geprüft …');
    await new Promise(resolve=>requestAnimationFrame(resolve));
    previews.push(await prepareIdeaPreview(config,idea));
   }
   if(base!==reviewRevision(this.getConfig())||this.appBusy)throw Error('Einstellungen inzwischen geändert. Bitte neue Ideen entwickeln.');
   this.ideas=ideas;this.ideaPreviews=previews;this.ideaBase=base;
   this.root.querySelector('#botIdeaCards').innerHTML=ideaCardsHtml(previews);
   this.root.querySelector('#ideaPreviewControls').hidden=false;this.setIdeaLevel(this.ideaLevel);
   this.ideaMessage('Drei geprüfte Layouts bereit. Deine aktuelle Map bleibt unverändert, bis du eine Idee auswählst.');
  }catch(error){this.ideas=null;this.ideaPreviews=[];this.root.querySelector('#botIdeaCards').innerHTML='';this.ideaMessage(error.message);}
  finally{this.ideaBusy=false;this.setBusy();}
 }
 setActive(value){this.active=!!value;this.paintVersion++;if(this.active)this.paintPreviews();}
 setIdeaLevel(level){
  if(![0,6,48].includes(level))return;
  this.ideaLevel=level;
  for(const button of this.root.querySelectorAll('[data-idea-level]')){const selected=Number(button.dataset.ideaLevel)===level;button.setAttribute('aria-pressed',selected);button.classList.toggle('selected',selected);}
  for(const label of this.root.querySelectorAll('[data-idea-state]'))label.textContent=level+' / 48 Ausbauten';
  this.paintPreviews();
 }
 paintPreviews(){
  const version=++this.paintVersion;if(!this.active)return;
  const queue=[...this.root.querySelectorAll('[data-idea-canvas]')];
  const next=()=>{
   if(!this.active||version!==this.paintVersion)return;
   const canvas=queue.shift();if(!canvas)return;
   const preview=this.ideaPreviews.find(p=>p.idea.id===canvas.dataset.ideaCanvas);
   if(preview){const status=this.root.querySelector('[data-idea-render="'+preview.idea.id+'"]');
    try{this.renderIdeaPreview(canvas,preview.map,{angle:-.8,focusPlot:1,level:this.ideaLevel,labels:this.ideaLevel<48});canvas.setAttribute('aria-label','Layout von '+preview.config.name+' · '+this.ideaLevel+' von 48 Ausbauten · ein Grundstück');if(status)status.hidden=true;}
    catch{if(status){status.hidden=false;status.textContent='Bildvorschau nicht verfügbar. Öffne die Idee im Generator.';}canvas.setAttribute('aria-label','Bildvorschau nicht verfügbar. Öffne diese Idee im Generator.');}
   }
   if(queue.length)requestAnimationFrame(next);
  };requestAnimationFrame(next);
 }
 refresh(){
  this.root.querySelector('#botAutoName').checked=this.getConfig().autoName;this.refreshAssistant();
  if(this.last&&!this.busy)this.renderResult();
  if(this.ideaPreviews.length&&this.ideaBase!==reviewRevision(this.getConfig()))this.ideaMessage('Einstellungen geändert: Die Bilder zeigen den vorherigen Stand. Bitte neue Ideen entwickeln.');
  this.setBusy();
 }
 refreshAssistant(){this.root.querySelector('#browserTask').value=browserTask({config:this.getConfig(),brief:this.root.querySelector('#botBrief').value,useTrends:this.root.querySelector('#botTrends').checked,useIdeas:this.root.querySelector('#botIdeas').checked});}
 async copyTask(){
  this.refreshAssistant();const field=this.root.querySelector('#browserTask'),status=this.root.querySelector('#browserTaskStatus');
  try{await navigator.clipboard.writeText(field.value);status.textContent='Auftrag kopiert. Füge ihn in deinen Browser-Assistenten ein.';}
  catch{field.focus();field.select();status.textContent='Kopieren ist hier nicht verfügbar. Der Auftrag ist markiert: kopiere ihn mit Strg+C oder über das Textmenü.';}
 }
 setBusy(value=this.appBusy){
  this.appBusy=!!value;const busy=!!(this.busy||this.appBusy||this.ideaBusy);
  for(const id of ['botRun','botRunBundle','botBrief','botTrends','botAutoName','botIdeas','botProposeIdeas','botCompareIdeas'])this.root.querySelector('#'+id).disabled=busy;
  for(const b of this.root.querySelectorAll('[data-idea-build],[data-idea-plan],[data-idea-preview]'))b.disabled=busy||this.ideaBase!==reviewRevision(this.getConfig());
  for(const b of this.root.querySelectorAll('[data-idea-level]'))b.disabled=busy;
  this.root.querySelector('#botReport').disabled=busy||!this.last;
  this.root.querySelector('#botRetryBundle').disabled=busy||!this.last||reviewRevision(this.last.config)!==reviewRevision(this.getConfig());
  this.root.setAttribute('aria-busy',busy?'true':'false');
 }
 status(phase,text){this.phase=phase;this.root.setAttribute('data-bot-state',phase);this.root.querySelector('#botStatus').textContent=text;}
 event(entry){const li=document.createElement('li');li.textContent=entry.step+': '+entry.detail;this.root.querySelector('#botEvents').append(li);}
 record(step,detail){const entry={step,detail};this.last?.events.push(entry);this.event(entry);}
 renderResult(){
  const run=this.last;if(!run)return;
  const changed=reviewRevision(run.config)!==reviewRevision(this.getConfig());
  this.root.querySelector('#botRetryBundle').hidden=!run.exportError||changed;
  this.root.querySelector('#botResult').innerHTML=`<div class="bot-result"><strong>Map fertig: ${esc(run.config.name)}</strong><p>${esc(run.plan.goal)}</p><p>${esc(run.plan.first)}</p>${run.reference?`<p>Referenz: <a target="_blank" rel="noopener" href="${esc(run.reference.url)}">${esc(run.reference.name)}</a> · ${esc(run.reference.fetchedAt)}</p>`:''}${run.config.concept?`<p><strong>Eigener Ideenmix:</strong> ${esc(run.config.concept.title)} · ${run.config.concept.references.length} Referenzen. Bauplan und offene Erweiterungen stehen im Startpaket.</p>`:''}${changed?'<p class="output-problem">Die Vorschau wurde seit diesem Auftrag geändert. Downloads oben verwenden deine aktuelle Vorschau. Für dieses Ergebnis ist kein automatischer Wiederholungs-Export möglich.</p>':run.exportError?`<p class="output-problem">Deine Map ist gebaut. Nur das Startpaket fehlt: ${esc(run.exportError)}. Nutze „Startpaket erneut erstellen“.</p>`:run.download?`<p><strong>${esc(run.download.name)}</strong> · ${run.download.requested?'Download angefordert':'Datei erstellt; nutze den Dateilink oben'}.</p>`:'<p>Dein Ergebnis mit Download-Buttons steht oben unter „Ergebnis & Downloads“.</p>'}${changed||run.exportError?'':'<div class="action-row"><button class="primary" data-bot-download="map">Studio-Datei herunterladen</button><button class="quiet" data-bot-download="bundle">Startpaket herunterladen</button></div>'}</div>`;
 }
 async createBundle(){
  if(!this.last||reviewRevision(this.last.config)!==reviewRevision(this.getConfig()))throw Error('Die Vorschau wurde geändert. Bitte die gewünschte Map zuerst wieder öffnen.');
  this.status('exporting','Map gebaut und geprüft. Dein Startpaket wird erstellt …');this.record('Startpaket','Studio-Datei, Anleitung, Projektdatei und KI-Update werden verpackt.');
  const result=await this.exportBundle({prepare:true,expectedRevision:JSON.stringify(this.last.config)});
  if(!result?.ok)throw Error(result?.error||'Startpaket konnte nicht erstellt werden.');
  const {name,size,createdAt,requested}=result.file;this.last.download={name,size,createdAt,requested};delete this.last.exportError;
  this.record('Datei',name+' · '+size+' Bytes · '+(requested?'Download angefordert.':'Dateilink bereit.'));
  this.status('ready',requested?'Fertig! Dein Startpaket steht oben unter „Ergebnis & Downloads“.':'Startpaket erstellt. Nutze den Dateilink unter „Ergebnis & Downloads“.');this.renderResult();return {ok:true,file:result.file,run:this.last};
 }
 bundleFailed(error){this.last.exportError=error.message;this.record('Exportfehler',error.message);this.status('export-failed','Map fertig; Startpaket noch nicht erstellt. Du kannst nur den Export wiederholen.');this.renderResult();this.toast(error.message);return {ok:false,error:error.message,run:this.last};}
 async retryBundle(){
  if(this.busy||this.appBusy||!this.last)return {ok:false};
  this.busy=true;this.setBusy();
  try{return await this.createBundle();}catch(error){return this.bundleFailed(error);}finally{this.busy=false;this.setBusy();}
 }
 async run({bundle=false,idea=null}={}){
  if(this.busy||this.appBusy||this.ideaBusy||!this.begin())return {ok:false};
  this.busy=true;let generationLocked=true,built=false;
  this.last=null;this.root.querySelector('#botEvents').innerHTML='';this.root.querySelector('#botResult').textContent='';this.root.querySelector('#botRetryBundle').hidden=true;
  const config=this.getConfig(),brief=this.root.querySelector('#botBrief').value,useTrends=this.root.querySelector('#botTrends').checked&&!idea,useIdeas=!/obby|parcours/i.test(brief)&&this.root.querySelector('#botIdeas').checked;
  this.status('building','Dein Auftrag wird geplant und gebaut …');this.setBusy();
  try{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const run=await buildBotRun({config,brief:idea?'':brief,useTrends,useIdeas,idea,fetchTrends:this.fetchTrends,progress:entry=>{this.event(entry);this.status('building',entry.step+': '+entry.detail);}});
   if(run.baseRevision!==reviewRevision(this.getConfig()))throw Error('Deine Einstellungen wurden während des Abrufs geändert. Auftrag bitte erneut starten; es wurde nichts überschrieben.');
   this.apply(run.config);this.last=run;built=true;
   const saved=this.complete();this.record('Sicherung',saved?.persisted?'In „Meine Maps“ auf diesem Gerät gesichert.':'Nur in dieser Sitzung verfügbar; sichere die Map als Datei.');
   this.renderResult();
   if(bundle){generationLocked=false;this.end();return await this.createBundle();}
   this.status('ready','Map gebaut und geprüft. Dein Ergebnis mit Download-Buttons steht oben bereit.');this.toast('Map fertig: '+run.config.name+'. Dein Download steht oben bereit.');return {ok:true,run};
  }catch(error){
   if(built)return this.bundleFailed(error);
   this.root.querySelector('#botResult').textContent=error.message;this.status('failed','Auftrag nicht abgeschlossen: '+error.message);this.fail(error.message);this.toast(error.message);return {ok:false,error:error.message};
  }finally{if(generationLocked)this.end();this.busy=false;this.setBusy();}
 }
}
