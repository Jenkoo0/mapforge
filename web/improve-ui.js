import {normalize} from './engine.js';
import {projectScope} from './playability.js';
import {REVIEW_FIELDS,localReview,parseReview,reviewRevision,inspectPatch} from './improve.js';
import {PACING} from './tycoon.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={detail:'Detailgrad',polish:'Umgebungsdetails',plots:'Grundstücke',pacing:'Spieltempo',gap:'Sprungabstand',rise:'Anstieg',checkpointEvery:'Checkpoint-Abstand',theme:'Design',shopHints:'Angebotshinweise',shopHintDelay:'Hinweise frühestens nach',shopFocus:'Angebotsfokus'};
const display=(key,value)=>typeof value==='boolean'?(value?'An':'Aus'):key==='pacing'?PACING[value]?.name||value:key==='theme'?{sky:'Himmel',jungle:'Dschungel',lava:'Lava',neon:'Neon'}[value]:key==='shopFocus'?(value==='designs'?'Design-Interesse':'Spielkontext'):key==='polish'?['Sparsam','Wegmarken & Beete','Lichtlinien & Blüten'][value]:key==='detail'?['Minimal','Sparsam','Ausgewogen','Detailreich'][value]:String(value);
function restoreHistory(input){
 if(!Array.isArray(input))return [];
 return input.slice(-40).flatMap(h=>{
  if(!h||!h.before||!h.after||!['local','external-ai'].includes(h.source))return [];
  const before=normalize(h.before),after=normalize(h.after);
  if(projectScope(before)!==projectScope(after))return [];
  const changes=Object.keys(REVIEW_FIELDS).filter(key=>before[key]!==after[key]).map(key=>({key,from:before[key],to:after[key]}));
  try{inspectPatch({app:'MapForgeReview',baseRevision:reviewRevision(before),patch:Object.fromEntries(changes.map(c=>[c.key,c.to]))},before);}catch{return [];}
  return [{before,after,changes,source:h.source,createdAt:String(h.createdAt||'').slice(0,40),summary:String(h.summary||'').slice(0,700),notes:Array.isArray(h.notes)?h.notes.slice(0,12).map(n=>String(n).slice(0,700)):[],scope:projectScope(before)}];
 });
}
export class ImproveView{
 constructor(root,{storage,getMap,apply,toast,downloadReview,autoCheckbox}){
  Object.assign(this,{root,storage,getMap,apply,toast,downloadReview,autoCheckbox});this.records=restoreHistory(storage.get('mapforge.improvements.v1',[]));this.scope=null;this.pending=null;this.lastResult=null;
  autoCheckbox.checked=storage.get('mapforge.improve.auto.v1',true)===true;autoCheckbox.addEventListener('change',()=>{if(!storage.set('mapforge.improve.auto.v1',autoCheckbox.checked))toast('Automatik-Einstellung konnte nicht gespeichert werden.');});
  root.innerHTML=`<div class="improve-grid"><div class="panel padded"><span class="tiny-label">DEINE MAP WEITERENTWICKELN</span><h2>Was soll besser werden?</h2><p class="muted">Zum Beispiel „schöner, weniger warten“ oder „fürs Handy sparsamer“. Bekannte Wünsche werden in echte Generator-Einstellungen übersetzt.</p><label for="improveWish">Deine Verbesserungstipps</label><textarea id="improveWish" rows="4" maxlength="2000" placeholder="Mehr Details, kürzere Baupausen, weniger Shop-Hinweise …"></textarea><label for="improveFocus">Prüfschwerpunkt</label><select id="improveFocus"><option value="balanced">Layout & Vorlagenqualität</option><option value="visual">Aussehen & Details</option><option value="performance">Mobilgerät & Bauteilbudget</option></select><div class="action-row"><button class="quiet" data-improve="check">Wünsche prüfen</button><button class="primary" data-improve="auto">Automatisch verbessern</button></div><p class="micro">Lokale Analyse mit festen Regeln. Sie prüft Geometrie und Einstellungen; echte Roblox-Spieltests bleiben nötig.</p></div><div class="panel padded"><span class="tiny-label">VORHER → NACHHER</span><h2>Jede Änderung bleibt nachvollziehbar.</h2><div id="improveResult"><p class="muted">Prüfe zuerst deine Wünsche oder starte die automatische Verbesserung.</p></div><div class="action-row"><button class="primary" data-improve="apply" disabled>Vorschlag übernehmen</button><button class="quiet" data-improve="undo" disabled>Letzte Verbesserung zurücknehmen</button></div></div></div><div class="panel padded improve-ai"><div><span class="tiny-label">EXTERNE KI-PRÜFUNG</span><h2>Lass eine KI auf diese Map schauen.</h2><p>Das Prüfpaket enthält die aktuelle Vorschau, vollständige Geometrie, Einstellungen, Checks und eine klare Prüfanfrage. Gib es einer KI deiner Wahl. Sie kann einen Änderungsvorschlag zurückgeben, den diese App vor dem Anwenden kontrolliert.</p><button class="quiet" data-improve="package">KI-Prüfpaket herunterladen ↓</button><p class="micro">Keine direkte Modellverbindung eingerichtet. Dieses Paket verbindet deinen bestehenden KI-Chat mit der aktuellen Map; die lokale Automatik funktioniert direkt.</p></div><div><p class="micro">Prüfpaket für Map-Version <code id="reviewRevision"></code></p><label for="aiReviewJson">JSON-Vorschlag der KI einfügen</label><textarea id="aiReviewJson" rows="7" maxlength="50000" spellcheck="false" placeholder='{"app":"MapForgeReview","baseRevision":"…","patch":{…}}'></textarea><label class="manual-row"><input id="aiAutoApply" type="checkbox"><span>Gültigen KI-Vorschlag sofort anwenden</span></label><button class="primary" data-improve="import">KI-Vorschlag prüfen</button><p class="micro">Nur erlaubte Einstellungen derselben Map-Version. Fremde Skripte und Produkt-ID-Änderungen werden abgewiesen.</p></div></div><div class="panel padded improve-history"><h2>Dein Verbesserungsverlauf</h2><div id="improveHistory"></div></div>`;
  root.querySelector('#improveWish').addEventListener('input',e=>storage.set('mapforge.improve.wish.v1.'+this.scope,e.target.value));
  root.addEventListener('click',async e=>{const b=e.target.closest('[data-improve]');if(!b||b.disabled)return;try{
   const action=b.dataset.improve;
   if(action==='check')this.run(false);if(action==='auto')this.run(true);if(action==='apply'&&this.pending)this.commit(this.pending);if(action==='undo')this.undo();
   if(action==='package'){b.disabled=true;try{await this.downloadReview(this.wish());}finally{b.disabled=false;}}
   if(action==='import'){this.pending=parseReview(root.querySelector('#aiReviewJson').value,this.getMap().config);this.lastResult=null;if(root.querySelector('#aiAutoApply').checked)this.commit(this.pending);else this.refresh();}
  }catch(err){this.toast(err.message||'Änderung konnte nicht geprüft werden.');}});
 }
 wish(){return this.root.querySelector('#improveWish').value;}
 current(){return this.records.filter(h=>h.scope===projectScope(this.getMap().config)).slice(-10);}
 run(apply=false){this.pending=localReview(this.getMap().config,this.wish(),this.root.querySelector('#improveFocus').value);this.lastResult=null;if(apply&&this.pending.changes.length)this.commit(this.pending);else{this.refresh();if(apply)this.toast('Keine weitere sichere Vorlagenänderung gefunden. Hinweise und Spieltests prüfen.');}return this.pending;}
 commit(result){
  if(result.baseRevision!==reviewRevision(this.getMap().config))throw Error('Die Map wurde inzwischen geändert. Bitte neu prüfen.');
  if(!result.changes.length){this.toast('Der Vorschlag enthält keine geänderten Einstellungen.');return;}
  const record={...result,scope:projectScope(result.before)};
  const next=[...this.records,record].slice(-40);
  if(!this.storage.set('mapforge.improvements.v1',next))throw Error('Verlauf konnte nicht gespeichert werden. Die Map wurde noch nicht geändert.');
  this.records=next;this.pending=null;this.lastResult=result;this.apply(result.after);this.refresh();this.toast(result.changes.length+' Verbesserungen angewendet. Du kannst sie zurücknehmen.');
 }
 undo(){
  const current=this.getMap().config,entry=this.current().at(-1);
  if(!entry||reviewRevision(current)!==reviewRevision(entry.after))throw Error('Die Map wurde danach weiterbearbeitet. Rücknahme nur direkt nach der passenden Verbesserung möglich.');
  const patch=Object.fromEntries(entry.changes.map(c=>[c.key,c.from]));inspectPatch({app:'MapForgeReview',baseRevision:reviewRevision(current),patch},current);
  const next=this.records.filter(h=>h!==entry);if(!this.storage.set('mapforge.improvements.v1',next))throw Error('Verlauf konnte nicht gespeichert werden.');
  this.records=next;this.pending=null;this.lastResult=null;this.apply(normalize({...current,...patch}));this.refresh();this.toast('Vorherige Map-Einstellungen wiederhergestellt.');
 }
 import(rows){const existing=new Set(this.records.map(h=>h.createdAt+'|'+reviewRevision(h.after)));const next=[...this.records,...restoreHistory(rows).filter(h=>!existing.has(h.createdAt+'|'+reviewRevision(h.after)))].slice(-40);if(this.storage.set('mapforge.improvements.v1',next))this.records=next;}
 refresh(){
  const config=this.getMap().config,scope=projectScope(config);if(scope!==this.scope){this.scope=scope;this.root.querySelector('#improveWish').value=this.storage.get('mapforge.improve.wish.v1.'+scope,'');this.pending=null;this.lastResult=null;}
  this.root.querySelector('#reviewRevision').textContent=reviewRevision(config);
  if(this.lastResult&&reviewRevision(this.lastResult.after)!==reviewRevision(config))this.lastResult=null;
  const result=this.pending||this.lastResult,stale=this.pending&&this.pending.baseRevision!==reviewRevision(config);
  this.root.querySelector('[data-improve="apply"]').disabled=!this.pending||!this.pending.changes.length||!!stale;
  const history=this.current(),last=history.at(-1);this.root.querySelector('[data-improve="undo"]').disabled=!last||reviewRevision(last.after)!==reviewRevision(config);
  if(result)this.root.querySelector('#improveResult').innerHTML=`<span class="review-source">${result.source==='local'?'Lokale Prüfung':'Externer KI-Vorschlag'} · ${this.pending?'Vorschau':'Angewendet'}</span><p>${esc(result.summary)}</p>${stale?'<p class="review-stale">Map inzwischen geändert: bitte neu prüfen.</p>':''}${result.changes.length?`<table class="pacing-table"><thead><tr><th>Einstellung</th><th>Vorher</th><th>Nachher</th></tr></thead><tbody>${result.changes.map(c=>`<tr><td>${labels[c.key]}</td><td>${esc(display(c.key,c.from))}</td><td>${esc(display(c.key,c.to))}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Keine weitere sichere Änderung innerhalb der aktuellen Vorlage.</p>'}<p class="micro">Bauteile: ${result.metrics.partsBefore} → ${result.metrics.partsAfter} · Layoutfehler: ${result.metrics.errorsBefore} → ${result.metrics.errorsAfter}</p>${result.notes.map(n=>`<p class="review-note">${esc(n)}</p>`).join('')}`;
  else this.root.querySelector('#improveResult').innerHTML='<p class="muted">Prüfe zuerst deine Wünsche oder starte die automatische Verbesserung.</p>';
  this.root.querySelector('#improveHistory').innerHTML=history.length?[...history].reverse().map(h=>`<article class="review-entry"><strong>${esc(h.createdAt.slice(0,16).replace('T',' '))} · ${h.source==='local'?'Lokale Prüfung':'Externer KI-Vorschlag'}</strong><p>${h.changes.map(c=>esc(labels[c.key]+': '+display(c.key,c.from)+' → '+display(c.key,c.to))).join(' · ')}</p></article>`).join(''):'<p class="muted">Noch keine Verbesserungen für diese Map übernommen. Die letzten zehn Änderungen bleiben hier nachvollziehbar.</p>';
 }
}
