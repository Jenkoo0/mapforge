const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const date=value=>new Date(value).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'});
const size=value=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(value>=1048576?value/1048576:value/1024)+(value>=1048576?' MB':' KB');
let outputSequence=0;
export class DownloadStore{
 constructor({createURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),requestFile,onChange=()=>{},now=Date.now,limit=4}={}){
  Object.assign(this,{createURL,revokeURL,requestFile,onChange,now,limit});this.files=[];this.sequence=0;
 }
 download(name,content,type='text/plain;charset=utf-8'){
  const blob=new Blob([content],{type}),file={id:++this.sequence,name,url:this.createURL(blob),size:blob.size,createdAt:this.now(),requested:false,error:''};
  this.files.unshift(file);
  while(this.files.length>this.limit)this.revokeURL(this.files.pop().url);
  try{this.requestFile(file);file.requested=true;}catch{file.error='Der automatische Download konnte nicht angefordert werden. Nutze den Dateilink.';}
  this.onChange();return file;
 }
 dispose(){for(const file of this.files)this.revokeURL(file.url);this.files=[];}
}
export class OutputCenter{
 constructor(root,{onExport,onBundle,onRetryScripts,onQuality,onMaps,onPublish,onUndo,downloads,now=Date.now}={}){
  Object.assign(this,{root,onExport,onBundle,onRetryScripts,onQuality,onMaps,onPublish,onUndo,now});this.scriptState='loading';this.phase='idle';this.problem='';this.visible=false;this.busyExport=null;this.collapsed=false;this.layoutProblemKey='';this.detailsId=`mapforge-output-details-${++outputSequence}`;
  root.setAttribute('data-output-disclosure','');
  this.downloads=downloads||new DownloadStore({requestFile:file=>{
   const a=document.createElement('a');a.href=file.url;a.download=file.name;document.body.append(a);try{a.click();}finally{a.remove();}
  }});
  this.downloads.onChange=()=>{this.visible=true;if(this.downloads.files[0]?.error)this.collapsed=false;this.render();this.reveal();};
  root.addEventListener('click',e=>{const b=e.target.closest('button[data-output-action]');if(!b||b.disabled)return;if(b.dataset.outputAction==='details'){this.setCollapsed(!this.collapsed,{focus:true});return;}({map:this.onExport,bundle:this.onBundle,retry:this.onRetryScripts,quality:this.onQuality,maps:this.onMaps,publish:this.onPublish,undo:this.onUndo})[b.dataset.outputAction]?.();});
 }
 setMap(map,checks=[]){const failures=checks.filter(c=>c.status==='error'),key=JSON.stringify(failures.map(c=>({id:c.id,title:c.title,detail:c.detail})));this.map=map;this.errors=failures.length;if(this.errors&&key!==this.layoutProblemKey){this.collapsed=false;this.visible=true;}this.layoutProblemKey=key;this.render();}
 setScripts(state){if(state==='failed'){this.collapsed=false;this.visible=true;}this.scriptState=state;this.render();}
 begin(detail){this.phase='building';this.detail=detail;this.problem='';this.visible=true;this.collapsed=false;this.render();this.reveal();}
 complete(){this.phase='ready';this.loaded=null;this.problem='';this.generated={revision:JSON.stringify(this.map.config),createdAt:this.now()};this.render();this.reveal();}
 restored(record,{automatic=false,title}={}){this.phase='loaded';this.problem='';this.loaded={automatic,title,savedAt:record?.updatedAt};this.generated={revision:JSON.stringify(this.map.config),createdAt:record?.generatedAt||record?.createdAt||this.now()};this.visible=true;this.render();this.reveal();}
 setPersistence(value){if(value===false&&this.persisted!==false){this.collapsed=false;this.visible=true;}this.persisted=value;this.render();}
 setUndo(value){this.canUndo=value;this.render();}
 fail(message){this.phase='failed';this.problem=message;this.visible=true;this.collapsed=false;this.render();this.reveal();}
 beginExport(kind){this.busyExport=kind;this.problem='';this.visible=true;this.collapsed=false;this.render();this.reveal();}
 endExport(){this.busyExport=null;this.render();}
 exportFailed(message){this.problem=message;this.visible=true;this.collapsed=false;this.render();this.reveal();}
 download(...args){return this.downloads.download(...args);}
 reveal(){this.root.scrollIntoView?.({behavior:'instant',block:'start'});this.root.focus?.({preventScroll:true});}
 setCollapsed(value,{focus=false}={}){this.collapsed=!!value;this.render();if(focus)this.root.querySelector?.('button[data-output-action="details"]')?.focus?.({preventScroll:true});return this.collapsed;}
 render(){
  this.root.hidden=!this.visible;if(!this.visible||!this.map)return;
  const changed=this.generated&&this.generated.revision!==JSON.stringify(this.map.config),building=this.phase==='building',busy=building||!!this.busyExport;
  const loaded=this.phase==='loaded'&&this.loaded;
  const title=building?'Deine Map wird gebaut …':this.phase==='failed'?'Generierung nicht abgeschlossen':changed?'Vorschau aktualisiert':loaded?loaded.title||(loaded.automatic?'Deine letzte Map ist wieder da!':'Gespeicherte Map geöffnet'):this.generated?'Deine Map ist fertig!':'Deine aktuelle Map';
  const status=building?this.detail:this.busyExport?`${this.busyExport==='map'?'Studio-Datei':'Startpaket'} wird erstellt …`:this.phase==='failed'?'Die vorherige Map bleibt verfügbar.':changed?'Einstellungen seit der letzten Generierung geändert. Die Buttons exportieren die aktuelle Vorschau.':loaded?`${loaded.savedAt?'Stand vom '+date(loaded.savedAt)+'. ':''}Du kannst diese Map direkt wieder herunterladen.`:this.generated?`Generiert um ${time(this.generated.createdAt)} · bereit für deinen Download.`:'Vorschau bereit. Lade deine Datei hier herunter.';
  const available=!busy&&this.scriptState==='ready'&&!this.errors;
  const readiness=this.scriptState==='loading'?'Export wird vorbereitet …':this.scriptState==='failed'?'Die Export-Dateien konnten nicht geladen werden. Bitte erneut laden.':this.errors?`${this.errors} Layoutfehler: vor dem Export im Qualitätscheck korrigieren.`:'Studio-Datei: Map + Skripte. Startpaket: zusätzlich Anleitung, Projektdatei und KI-Update.';
  const summaryStatus=this.problem||(!busy&&(this.scriptState==='failed'||this.errors)?readiness:status);
  const fileHtml=file=>`<article class="download-file"><div><a href="${esc(file.url)}" download="${esc(file.name)}" class="download-name">${esc(file.name)} ↓</a><small>${size(file.size)} · erstellt ${time(file.createdAt)} · ${file.requested?'Download angefordert':'Datei bereit'}</small>${file.error?`<p class="output-problem">${esc(file.error)}</p>`:''}</div><a class="quiet small link-button" href="${esc(file.url)}" download="${esc(file.name)}">Erneut herunterladen</a></article>`;
  const [latest,...older]=this.downloads.files;
  const hasProblem=!!this.problem||this.phase==='failed'||this.scriptState==='failed'||this.errors>0;
  const fileCount=this.downloads.files.length,fileStatus=fileCount===0?'Noch keine Datei erstellt':fileCount===1?'1 Datei bereit':`${fileCount} Dateien bereit`;
  const savedNote=this.persisted===false?'<p class="output-problem" role="status">Nur in dieser Sitzung verfügbar: Speichern im Browser ist gerade nicht möglich. Sichere deine Map als Projektdatei oder Startpaket.</p>':this.persisted===true&&!changed&&!busy?'<p class="output-save-state">✓ In „Meine Maps“ auf diesem Gerät gesichert.</p>':'';
  const navigation=`${this.onMaps?'<button class="text-btn" data-output-action="maps">Meine Maps öffnen →</button>':''}${this.canUndo?`<button class="quiet small" data-output-action="undo" ${busy?'disabled':''}>Vorherige Map wiederherstellen</button>`:''}`;
  const nextStep=latest&&this.onPublish&&(/\.rbxlx$/i.test(latest.name)||/-Startpaket\.zip$/i.test(latest.name))?`<div class="output-next"><strong>Weiter mit deiner Map</strong><p>${/\.zip$/i.test(latest.name)?'Entpacke das Startpaket und öffne die enthaltene .rbxlx-Datei':'Öffne die .rbxlx-Datei'} in Roblox Studio auf deinem Computer. Dort kannst du spielen und testen.</p><button class="quiet" data-output-action="publish">Öffnen & Testen erklären →</button></div>`:'';
  this.root.innerHTML=`<div class="output-summary"><div class="output-heading"><span class="output-icon" aria-hidden="true">${busy?'↻':hasProblem?'!':'✓'}</span><div><span class="tiny-label">ERGEBNIS & DOWNLOADS</span><h2 id="output-title" class="output-map-name">${esc(this.map.config.name)}</h2><p class="output-summary-state">${esc(title)}</p></div></div><button type="button" class="quiet small output-details-toggle" data-output-action="details" aria-expanded="${!this.collapsed}" aria-controls="${this.detailsId}">${this.collapsed?'Details anzeigen':'Details ausblenden'}</button></div><p class="output-status" role="status" aria-live="polite">${esc(summaryStatus)}</p><div class="output-availability"><span class="output-file-count">${fileStatus}</span>${latest&&this.collapsed?`<a class="output-summary-download" href="${esc(latest.url)}" download="${esc(latest.name)}" title="${esc(latest.name)}">${esc(latest.name)} ↓</a>`:''}${this.canUndo&&this.collapsed?`<button class="quiet small" data-output-action="undo" ${busy?'disabled':''}>Vorherige Map wiederherstellen</button>`:''}</div><div id="${this.detailsId}" class="output-details" ${this.collapsed?'hidden':''}><div class="output-project"><p class="output-meta">${this.map.config.mode==='tycoon'?'Tycoon':'Obby'} · ${this.map.parts.length.toLocaleString('de-DE')} Bauteile · Seed ${esc(this.map.config.seed)}</p></div>${this.problem?`<p class="output-problem" role="alert">${esc(this.problem)}</p>`:''}<div class="action-row output-actions"><button class="primary" data-output-action="map" ${available?'':'disabled'}>${this.busyExport==='map'?'Studio-Datei wird erstellt …':'Studio-Datei herunterladen (.rbxlx)'}</button><button class="quiet" data-output-action="bundle" ${available?'':'disabled'}>${this.busyExport==='bundle'?'Startpaket wird erstellt …':'Komplettes Startpaket (.zip)'}</button>${this.scriptState==='failed'?'<button class="quiet" data-output-action="retry">Export erneut vorbereiten</button>':''}${this.errors?'<button class="quiet" data-output-action="quality">Zum Qualitätscheck →</button>':''}</div><p class="micro">${readiness}</p><div class="output-tail">${savedNote}<div class="action-row output-secondary">${navigation}</div></div>${latest?`<div class="download-list"><h3>Dein Download ist hier</h3>${fileHtml(latest)}<p class="micro">Keine Datei zu sehen? Klicke auf „Erneut herunterladen“ oder öffne die Downloads deines Browsers. Der Browser entscheidet, wo die Datei gespeichert wird.</p>${older.length?`<details><summary>Weitere Downloads (${older.length})</summary>${older.map(fileHtml).join('')}</details>`:''}<p class="micro">Die letzten vier Dateien bleiben verfügbar, solange diese Seite geöffnet ist.</p>${nextStep}</div>`:''}</div>`;
  this.root.setAttribute('aria-busy',busy?'true':'false');
  this.root.setAttribute('data-output-collapsed',String(this.collapsed));
  this.root.setAttribute('data-output-state',busy?'busy':hasProblem?'error':'ready');
 }
}
