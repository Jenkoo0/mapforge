import {generate,safeFilename,VERSION} from './engine.js';
import {THEMES} from './engine.js';
import {TYCOON_THEMES,LAYOUTS} from './tycoon.js';
import {MAPS_LIMIT} from './map-vault.js';
import {drawPreview} from './preview.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>new Date(value).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});
export class MyMaps{
 constructor(root,{vault,getBusy,onOpen,onSave,download,toast,renderPreview=drawPreview}){
  Object.assign(this,{root,vault,getBusy,onOpen,onSave,download,toast,renderPreview});this.query='';this.mode='all';this.active=false;this.paintVersion=0;this.pending=null;this.removed=null;
  root.innerHTML=`<div class="panel maps-toolbar"><div><strong data-vault-count></strong><p data-vault-storage class="micro"></p></div><div class="action-row"><button class="primary" data-vault-action="save">Aktuelle Map merken</button><button class="quiet" data-vault-action="backup">Sammlung sichern ↓</button><button class="quiet" data-vault-action="import">Sicherung laden</button></div></div><div class="maps-filters"><label>Map suchen<input data-vault-search maxlength="100" placeholder="Name oder Design …"></label><label>Spielmodus<select data-vault-mode><option value="all">Alle Maps</option><option value="tycoon">Tycoons</option><option value="obby">Obbys</option></select></label></div><p data-vault-message role="status" aria-live="polite"></p><div data-vault-import></div><div data-vault-cards class="saved-maps-grid"></div><input data-vault-file type="file" accept=".json,application/json" hidden>`;
  root.addEventListener('click',e=>{const b=e.target.closest('button[data-vault-action]');if(b&&!b.disabled)this.action(b.dataset.vaultAction,b.dataset.mapId);});
  root.addEventListener('input',e=>{if(e.target.matches('[data-vault-search]')){this.query=e.target.value.toLocaleLowerCase('de-DE');this.renderCards();}});
  root.addEventListener('change',e=>{if(e.target.matches('[data-vault-mode]')){this.mode=e.target.value;this.renderCards();}if(e.target.matches('[data-vault-file]'))this.readImport(e.target);});
  this.refresh();
 }
 message(text){this.root.querySelector('[data-vault-message]').textContent=text;}
 setActive(value){this.active=value;if(value)this.renderCards();else this.paintVersion++;}
 setBusy(){this.root.querySelectorAll('button[data-vault-action]').forEach(b=>b.disabled=this.getBusy()||(b.dataset.vaultAction==='commit'&&!this.pending?.records.length));}
 refresh(){
  this.root.querySelector('[data-vault-count]').textContent=`${this.vault.records.length} / ${MAPS_LIMIT} Maps auf diesem Gerät`;
  this.root.querySelector('[data-vault-storage]').textContent=this.vault.persisted?'Die letzten acht Versionen bleiben in diesem Browser. Sichere die Sammlung als Datei für andere Geräte.':'Speichern im Browser gerade nicht möglich. Neue Maps sind nur in dieser Sitzung verfügbar. Bitte als Datei sichern.';
  if(this.pending&&this.pending.baseRevision!==this.vault.revision){this.pending=null;this.renderImport();this.message('Sammlung geändert. Sicherung bitte erneut auswählen.');}
  if(this.vault.ignored)this.message('Ein beschädigter Speichereintrag wurde übersprungen. Gültige Maps bleiben verfügbar.');
  this.renderCards();this.setBusy();
 }
 renderCards(){
  const rows=this.vault.records.filter(row=>(this.mode==='all'||row.config.mode===this.mode)&&[row.config.name,(row.config.mode==='tycoon'?TYCOON_THEMES:THEMES)[row.config.theme].label].join(' ').toLocaleLowerCase('de-DE').includes(this.query));
  this.root.querySelector('[data-vault-cards]').innerHTML=rows.length?rows.map(row=>{const c=row.config,theme=(c.mode==='tycoon'?TYCOON_THEMES:THEMES)[c.theme];return `<article class="panel saved-map"><div class="saved-map-preview"><canvas data-map-preview="${esc(row.id)}" width="480" height="300" role="img" aria-label="Layout-Vorschau von ${esc(c.name)}"></canvas><span>${c.mode==='tycoon'?'TYCOON':'OBBY'} · ${esc(theme.label)}</span></div><div class="saved-map-body"><div class="saved-map-topline"><span class="tiny-label">${row.source==='generated'?'GENERIERT':row.source==='recovered'?'LETZTE VORSCHAU':'GESICHERTE MAP'}</span><small>${date(row.updatedAt)}</small></div><h2>${esc(c.name)}</h2><p>${c.mode==='tycoon'?`${c.plots} Grundstücke · ${LAYOUTS[c.layout].name}`:`${c.stages} Abschnitte · Checkpoint alle ${c.checkpointEvery}`}</p><small>${row.parts.toLocaleString('de-DE')} Bauteile beim Sichern · MapForge ${esc(row.generatorVersion)}</small><div class="action-row"><button class="primary" data-vault-action="open" data-map-id="${esc(row.id)}">Map öffnen →</button><button class="quiet" data-vault-action="project" data-map-id="${esc(row.id)}">Projektdatei ↓</button><button class="text-btn" data-vault-action="remove" data-map-id="${esc(row.id)}" aria-label="${esc(c.name)} aus Meine Maps entfernen">Entfernen</button></div></div></article>`;}).join(''):`<div class="empty-card"><h2>${this.vault.records.length?'Keine passende Map gefunden.':'Deine Maps bekommen hier ihren Platz.'}</h2><p>${this.vault.records.length?'Ändere die Suche oder den Spielmodus.':'Generiere deine erste Map oder merke die aktuelle Vorschau. Danach kannst du sie hier wieder öffnen.'}</p></div>`;
  this.setBusy();const paint=++this.paintVersion;if(!this.active)return;
  const canvases=[...this.root.querySelectorAll('[data-map-preview]')];
  const next=()=>{if(paint!==this.paintVersion||!this.active)return;const canvas=canvases.shift();if(!canvas)return;const row=this.vault.get(canvas.dataset.mapPreview);if(row)try{const map=generate(row.config);this.renderPreview(canvas,map,{angle:-.8,focusPlot:map.config.mode==='tycoon'?1:0,level:48});}catch{canvas.setAttribute('aria-label','Vorschau nicht verfügbar. Öffne die Map für die vollständige Ansicht.');}requestAnimationFrame(next);};requestAnimationFrame(next);
 }
 async readImport(input){const file=input.files?.[0];if(!file)return;try{if(this.getBusy())throw Error('Bitte warte auf den laufenden Bau- oder Exportvorgang.');if(file.size>512000)throw Error('Die Sammlung ist zu groß (maximal 500 KB).');const revision=this.vault.revision,text=await file.text();if(this.vault.revision!==revision)throw Error('Sammlung inzwischen geändert. Sicherung bitte erneut auswählen.');this.pending=this.vault.prepareImport(text);this.renderImport();}catch(e){this.pending=null;this.renderImport();this.message(e.message);}finally{input.value='';}}
 renderImport(){const p=this.pending;this.root.querySelector('[data-vault-import]').innerHTML=p?`<div class="panel maps-import"><h2>Sicherung gefunden</h2><p>${p.total} Maps gelesen · ${p.records.length} neue Maps können hinzugefügt werden · ${p.duplicates} bereits vorhanden.</p>${p.skipped?`<p>${p.skipped} weitere Maps passen nicht mehr in die Sammlung. Bestehende Maps werden beim Import erhalten.</p>`:''}<div class="action-row"><button class="primary" data-vault-action="commit" ${p.records.length?'':'disabled'}>Maps hinzufügen</button><button class="quiet" data-vault-action="cancel">Schließen</button></div></div>`:'';this.setBusy();}
 action(action,id){
  if(this.getBusy()){this.message('Bitte warte auf den laufenden Bau- oder Exportvorgang.');return;}
  try{
   if(action==='open')this.onOpen(id);
   if(action==='save'){const result=this.onSave();if(result)this.message(result.persisted?'Aktuelle Map ist in Meine Maps gesichert.':'Map nur für diese Sitzung gemerkt. Bitte die Projektdatei sichern.');}
   if(action==='backup'){this.download('MapForge-Meine-Maps.json',this.vault.backup(),'application/json');this.toast('Map-Sammlung als Datei erstellt.');}
   if(action==='import')this.root.querySelector('[data-vault-file]').click();
   if(action==='project'){const row=this.vault.get(id);if(row)this.download(safeFilename(row.config.name)+'.mapforge.json',JSON.stringify({app:'MapForge',version:VERSION,config:row.config},null,2),'application/json');}
   if(action==='remove'){const token=this.vault.remove(id);if(token){this.removed=token;this.message('Map aus der Sammlung entfernt.');this.root.querySelector('[data-vault-import]').innerHTML='<div class="maps-undo"><span>Letztes Entfernen rückgängig machen.</span><button class="quiet small" data-vault-action="undo">Wiederherstellen</button></div>';}}
   if(action==='undo'&&this.removed){this.vault.undoRemove(this.removed);this.removed=null;this.renderImport();this.message('Map wieder in der Sammlung.');}
   if(action==='cancel'){this.pending=null;this.renderImport();}
   if(action==='commit'&&this.pending){const plan=this.pending;this.pending=null;const r=this.vault.applyImport(plan);this.renderImport();this.message(`${r.added} Maps hinzugefügt.${r.persisted?'':' Nur in dieser Sitzung verfügbar; bitte als Datei sichern.'}`);}
  }catch(e){this.message(e.message);}
 }
}
