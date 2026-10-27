import {CREATIVE_DIRECTIONS,CREATIVE_VARIANT_COUNT,creativeDirectionConfig} from './creative-directions.js';
import {generate,validate} from './engine.js';
import {Preview,drawPreview,previewComparisonFrame} from './preview.js';
import {normalizeCreativeView} from './creative-session.js';
import {reviewRevision} from './improve.js';
import {drawMapArtwork} from './map-artwork.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GALLERY_PAGE_SIZE=6;
const searchText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').trim();
function galleryMarkup(){
 return `<div class="creative-palette"><div class="creative-palette-heading"><span class="tiny-label">DEINE WELTENSAMMLUNG</span><span data-creative-count>${CREATIVE_DIRECTIONS.length} Welten</span></div><div class="creative-gallery-search" role="search"><label for="creativeDirectionSearch">Eine Welt finden</label><input id="creativeDirectionSearch" type="search" maxlength="100" placeholder="Name, Stimmung oder Form …" autocomplete="off" aria-controls="creativeGalleryCards"></div><div class="segmented creative-filters" role="group" aria-label="Map-Richtungen filtern">${[['all','Alle'],['tycoon','Tycoon'],['obby','Obby']].map(([mode,label])=>`<button type="button" data-creative-filter="${mode}" aria-pressed="${mode==='all'}">${label} <span>${mode==='all'?CREATIVE_DIRECTIONS.length:CREATIVE_DIRECTIONS.filter(d=>d.mode===mode).length}</span></button>`).join('')}</div><div id="creativeGalleryCards" class="creative-directions" role="group" aria-label="Kreative Map-Richtungen">${CREATIVE_DIRECTIONS.map((d,i)=>`<button type="button" class="creative-direction" data-creative-direction="${esc(d.id)}" data-creative-kind="${d.mode}" aria-pressed="false"><span class="creative-card-art"><canvas data-creative-card-artwork="${esc(d.id)}" width="560" height="320" aria-hidden="true" data-artwork-state="loading"></canvas><span data-creative-card-status="${esc(d.id)}" aria-hidden="true">Map-Cover wird vorbereitet</span></span><span class="creative-card-body"><span class="creative-direction-meta"><small>${d.mode==='tycoon'?'TYCOON':'OBBY'}</small><b>${String(i+1).padStart(2,'0')}</b></span><strong>${esc(d.title)}</strong><span>${esc(d.hook)}</span></span></button>`).join('')}</div><div class="creative-gallery-empty" data-creative-empty hidden><strong>Hier ist es noch still.</strong><p>Versuche einen anderen Suchbegriff oder Spielmodus.</p><button type="button" class="text-btn" data-creative-reset-gallery>Suche und Filter zurücksetzen</button></div><nav class="creative-pagination" aria-label="Seiten der Weltensammlung"><button type="button" data-creative-page="previous">← Zurück</button><span data-creative-page-summary aria-hidden="true"></span><button type="button" data-creative-page="next">Weiter →</button></nav><p id="creativeGalleryStatus" class="creative-gallery-status" role="status" aria-live="polite"></p><button type="button" class="quiet creative-mobile-jump creative-jump-back" data-creative-jump="preview">Zur Vorschau ↑</button></div>`;
}
function storyMarkup(){return `<section id="creativeStoryPanel" class="creative-story" aria-labelledby="creative-story-title" hidden><div class="creative-story-heading"><div><span class="tiny-label">STORY-ENTWURF</span><h3 id="creative-story-title">Die Geschichte deiner Welt</h3></div><p>Eine Geschichte in drei Etappen – als Tafeln und Kapiteljournal in deiner Map.</p></div><p class="creative-story-premise" data-creative-story-premise></p><div class="creative-story-intro"><p><strong>Deine Rolle</strong><span data-creative-story-role></span></p><p><strong>Dein Ziel</strong><span data-creative-story-goal></span></p></div><details class="creative-story-details" data-creative-story-details><summary id="creative-story-chapters-summary">Die drei Kapitel lesen</summary><ol class="creative-story-chapters" data-creative-story-chapters></ol></details></section>`;}

/** A draft stays separate from the saved map until the user chooses to open it. */
export class CreativeStudio {
 constructor(root,{getConfig,onPreview,onArtwork=()=>false,toast,renderPreview=drawPreview,renderArtwork=drawMapArtwork,createPreview=(canvas,map,options)=>new Preview(canvas,map,options)}) {
  Object.assign(this,{root,getConfig,onPreview,onArtwork,toast,renderPreview,renderArtwork,createPreview});
  this.selected=CREATIVE_DIRECTIONS[0].id;this.active=false;this.busy=false;this.disposed=false;this.draft=null;this.viewer=null;this.camera=normalizeCreativeView({},'obby');this.level=48;this.allPlots=false;this.filter='all';this.variants=new Map();this.reference=null;this.showingReference=false;this.currentDraft=null;
  root.innerHTML=`<section class="creative-lab panel" aria-labelledby="creative-title"><div class="creative-heading"><div><span class="tiny-label">DEIN DESIGN-LABOR / ${CREATIVE_DIRECTIONS.length} WELTEN</span><h2 id="creative-title">Trau dich an eine andere Welt.</h2><p>${CREATIVE_DIRECTIONS.length*CREATIVE_VARIANT_COUNT} Entwürfe für deine nächste ruhige Baupause. Finde eine Welt, die dich reizt.</p></div><a class="text-btn" href="studio-research.md" target="_blank" rel="noopener">Design-Referenzen ↗</a><button type="button" class="quiet creative-mobile-jump" data-creative-jump="gallery">Welten entdecken ↓</button></div><div class="creative-workbench"><div class="creative-stage" data-preview-state="loading"><div class="creative-stage-heading"><span data-creative-mode></span><strong data-creative-title></strong><span class="creative-draft-badge">ENTWURF</span></div><div class="creative-variants" role="group" aria-label="Entwurfsvarianten"><div><span class="tiny-label">FORMSTUDIE</span><strong data-creative-variant>Variante 01 / 03</strong></div><button type="button" data-creative-variant-step="-1" aria-label="Vorherige Variante">←</button><button type="button" data-creative-variant-step="1" aria-label="Nächste Variante">→</button><button type="button" data-creative-remember>Zum Vergleich merken</button></div><div class="creative-comparison" data-creative-comparison hidden><span data-creative-reference-label></span><div role="group" aria-label="Entwürfe vergleichen"><button type="button" data-creative-compare="current" aria-pressed="true">Aktueller Entwurf</button><button type="button" data-creative-compare="reference" aria-pressed="false">Merkpunkt ansehen</button><button type="button" data-creative-forget aria-label="Vergleichsmerkpunkt entfernen">×</button></div></div><div class="creative-canvas-area"><canvas id="creativeMapCanvas" data-creative-canvas width="960" height="580" tabindex="0" aria-describedby="creative-view-help" role="img" aria-label="Entwurf wird vorbereitet"></canvas><p data-creative-render class="creative-render-message" role="status">Wähle eine Richtung, um ihren Bauplan anzusehen.</p></div><div class="creative-preview-controls"><div class="segmented creative-level-controls" data-creative-level-controls role="group" aria-label="Baufortschritt im Entwurf"><button type="button" data-creative-level="0" aria-pressed="false">Spielstart</button><button type="button" data-creative-level="6" aria-pressed="false">6 Ausbauten</button><button type="button" data-creative-level="48" aria-pressed="true">Vollausbau</button></div><div class="creative-camera-tools" role="group" aria-label="Kamera im Entwurf"><button type="button" data-creative-camera="left" aria-label="Entwurf nach links drehen" title="Entwurf nach links drehen">↶</button><button type="button" data-creative-camera="right" aria-label="Entwurf nach rechts drehen" title="Entwurf nach rechts drehen">↷</button><button type="button" data-creative-camera="out" aria-label="Entwurf verkleinern" title="Entwurf verkleinern">−</button><button type="button" data-creative-camera="in" aria-label="Entwurf vergrößern" title="Entwurf vergrößern">＋</button><button type="button" data-creative-camera="plan" aria-label="Draufsicht im Entwurf umschalten" title="Draufsicht im Entwurf umschalten" aria-pressed="false">▦</button><button type="button" data-creative-camera="path" aria-label="Wege im Entwurf anzeigen" title="Wege im Entwurf anzeigen" aria-pressed="false">Wege</button><button type="button" data-creative-camera="scope" aria-label="Alle Grundstücke im Entwurf anzeigen" title="Alle Grundstücke im Entwurf anzeigen" aria-pressed="false">Alle Grundstücke</button><button type="button" data-creative-camera="reset" aria-label="Kamera im Entwurf zurücksetzen" title="Kamera im Entwurf zurücksetzen">↺</button></div><p id="creative-view-help">Ziehen oder ← → drehen · + / − zoomen · Pos1 zurücksetzen</p></div><div class="creative-stage-footer"><span data-creative-metrics></span><span data-creative-view>Layout-Vorschau</span><code data-creative-seed></code></div></div>${galleryMarkup()}</div><div class="creative-detail"><div><span class="tiny-label">FORM & SPIELGEFÜHL</span><p data-creative-shape></p><p class="micro" data-creative-scope></p></div><div class="creative-open"><button class="primary" type="button" data-creative-open>Im Generator ausprobieren <svg aria-hidden="true"><use href="#i-arrow"/></svg></button><button class="quiet" type="button" data-creative-artwork>Cover gestalten <svg aria-hidden="true"><use href="#i-spark"/></svg></button><p class="micro">Öffnet genau den sichtbaren Entwurf. Deine bisherige Map lässt sich danach wiederherstellen.</p></div></div>${storyMarkup()}<p class="creative-status micro" data-creative-status role="status" aria-live="polite"></p></section>`;
  this.search='';this.page=0;this.thumbnailKeys=new Map();this.artworkFrame=null;this.artworkVersion=0;
  this.document=root.ownerDocument??globalThis.document;this.window=this.document?.defaultView??globalThis.window;
  const host=this.window??globalThis;
  this.scheduleFrame=typeof host.requestAnimationFrame==='function'?callback=>host.requestAnimationFrame(callback):callback=>setTimeout(callback,16);
  this.cancelFrame=typeof host.cancelAnimationFrame==='function'?frame=>host.cancelAnimationFrame(frame):frame=>clearTimeout(frame);
  this.onClick=event=>{
   const button=event.target.closest('button');if(!button||button.disabled||this.disposed)return;
   if(button.dataset.creativeJump){this.jump(button.dataset.creativeJump);return;}
   if(this.busy)return;
   if(button.dataset.creativeDirection)this.select(button.dataset.creativeDirection);
   else if(button.dataset.creativeFilter)this.setFilter(button.dataset.creativeFilter);
   else if(button.dataset.creativePage)this.setPage(this.page+(button.dataset.creativePage==='next'?1:-1));
   else if(button.hasAttribute('data-creative-reset-gallery'))this.resetGallery();
   else if(button.dataset.creativeVariantStep)this.stepVariant(Number(button.dataset.creativeVariantStep));
   else if(button.hasAttribute('data-creative-remember'))this.remember();
   else if(button.dataset.creativeCompare)this.compare(button.dataset.creativeCompare==='reference');
   else if(button.hasAttribute('data-creative-forget'))this.forget();
   else if(button.dataset.creativeLevel!==undefined)this.setLevel(Number(button.dataset.creativeLevel));
   else if(button.dataset.creativeCamera)this.moveCamera(button.dataset.creativeCamera);
   else if(button.hasAttribute('data-creative-open'))this.open();
   else if(button.hasAttribute('data-creative-artwork'))this.artwork();
  };
  this.onSearch=event=>{if(event.target?.id==='creativeDirectionSearch')this.setSearch(event.target.value);};
  this.onVisibility=()=>{if(this.document?.hidden||this.document?.visibilityState==='hidden')this.cancelArtwork();else this.scheduleArtwork();};
  root.addEventListener('click',this.onClick);root.addEventListener('input',this.onSearch);this.document?.addEventListener?.('visibilitychange',this.onVisibility);this.syncLabels();this.syncControls();
 }
 query(selector){return this.root.querySelector(selector);}
 choice(){return this.showingReference&&this.reference?this.reference:{id:this.selected,variant:this.variants.get(this.selected)||1};}
 direction(){return CREATIVE_DIRECTIONS.find(d=>d.id===this.choice().id);}
 choiceKey(){const c=this.choice();return c.id+':'+c.variant;}
 message(text){this.query('[data-creative-status]').textContent=text;}
 jump(destination){
  if(!this.active||this.disposed||!['gallery','preview'].includes(destination))return false;
  const target=this.query(destination==='gallery'?'.creative-palette':'.creative-stage');target.scrollIntoView?.({block:'start',behavior:'instant'});
  const input=this.query('#creativeDirectionSearch'),canvas=this.query('[data-creative-canvas]');
  if(destination==='gallery'&&!input.disabled)input.focus?.({preventScroll:true});
  else if(destination==='preview'&&target.getAttribute?.('data-preview-state')==='ready')canvas.focus?.({preventScroll:true});
  else{target.setAttribute('tabindex','-1');target.focus?.({preventScroll:true});}
  return true;
 }
 filteredDirections(){const query=searchText(this.search);return CREATIVE_DIRECTIONS.filter(d=>(this.filter==='all'||d.mode===this.filter)&&(!query||searchText([d.title,d.hook,d.shape,d.scope,d.story?.premise,d.story?.playerRole,d.story?.goal].join(' ')).includes(query)));}
 pageDirections(){const matches=this.filteredDirections();return matches.slice(this.page*GALLERY_PAGE_SIZE,(this.page+1)*GALLERY_PAGE_SIZE);}
 revealChoice(){
  const direction=this.direction();if(this.filter!=='all'&&this.filter!==direction.mode)this.filter='all';
  if(!this.filteredDirections().some(d=>d.id===direction.id)){this.search='';this.query('#creativeDirectionSearch').value='';}
  this.page=Math.max(0,Math.floor(this.filteredDirections().findIndex(d=>d.id===direction.id)/GALLERY_PAGE_SIZE));
 }
 syncGallery(){
  const matches=this.filteredDirections(),pages=Math.max(1,Math.ceil(matches.length/GALLERY_PAGE_SIZE));this.page=Math.min(this.page,pages-1);
  const visible=new Set(this.pageDirections().map(d=>d.id)),choice=this.choice();
  for(const button of this.root.querySelectorAll('[data-creative-direction]')){button.hidden=!visible.has(button.dataset.creativeDirection);button.setAttribute('aria-pressed',String(button.dataset.creativeDirection===choice.id));}
  for(const button of this.root.querySelectorAll('[data-creative-filter]'))button.setAttribute('aria-pressed',String(button.dataset.creativeFilter===this.filter));
  this.query('[data-creative-count]').textContent=`${matches.length} von ${CREATIVE_DIRECTIONS.length} Welten`;
  this.query('[data-creative-empty]').hidden=matches.length>0;
  this.query('[data-creative-page-summary]').textContent=`${this.page+1} / ${pages}`;
  const start=matches.length?this.page*GALLERY_PAGE_SIZE+1:0,end=Math.min(matches.length,(this.page+1)*GALLERY_PAGE_SIZE);
  this.query('#creativeGalleryStatus').textContent=matches.length?`${start}–${end} von ${matches.length} Welten · Seite ${this.page+1} von ${pages}`:'Keine passende Welt gefunden.';
  for(const button of this.root.querySelectorAll('[data-creative-page]'))button.disabled=this.busy||(button.dataset.creativePage==='previous'?this.page===0:this.page>=pages-1);
 }
 syncStory(){
  const story=this.direction().story,panel=this.query('#creativeStoryPanel');panel.hidden=!story;
  this.query('[data-creative-story-premise]').textContent=story?.premise??'';this.query('[data-creative-story-role]').textContent=story?.playerRole??'';this.query('[data-creative-story-goal]').textContent=story?.goal??'';
  this.query('[data-creative-story-chapters]').innerHTML=(story?.chapters??[]).slice(0,3).map((chapter,index)=>{
   const trigger=chapter.trigger,step=trigger?.kind==='upgrade'&&Number.isInteger(trigger.count)?`Ausbau ${trigger.count} / 48`:trigger?.kind==='stage'&&Number.isInteger(trigger.index)?`Abschnitt ${trigger.index}`:`Kapitel ${index+1}`;
   return `<li><span>${esc(step)}</span><h4>${esc(chapter.title)}</h4><p>${esc(chapter.text)}</p></li>`;
  }).join('');
 }
 setSearch(value){if(this.busy||this.disposed)return false;this.search=String(value??'').slice(0,100);this.page=0;this.query('#creativeDirectionSearch').value=this.search;this.syncGallery();this.scheduleArtwork();return true;}
 setPage(value){const count=Math.max(1,Math.ceil(this.filteredDirections().length/GALLERY_PAGE_SIZE));if(this.busy||this.disposed||!Number.isInteger(value)||value<0||value>=count)return false;this.page=value;this.syncGallery();this.scheduleArtwork();return true;}
 resetGallery(){if(this.busy||this.disposed)return false;this.search='';this.filter='all';this.page=0;this.query('#creativeDirectionSearch').value='';this.syncGallery();this.scheduleArtwork();return true;}
 cancelArtwork(){this.artworkVersion++;if(this.artworkFrame!==null)this.cancelFrame(this.artworkFrame);this.artworkFrame=null;}
 scheduleArtwork(){
  this.cancelArtwork();if(!this.active||this.busy||this.disposed||this.document?.hidden||this.document?.visibilityState==='hidden')return;
  const base=this.getConfig(),revision=reviewRevision(base),version=this.artworkVersion;
  const queue=this.pageDirections().map(direction=>({direction,variant:this.variants.get(direction.id)||1})).map(item=>({...item,key:`${revision}:${item.direction.id}:${item.variant}`})).filter(item=>this.thumbnailKeys.get(item.direction.id)!==item.key);
  const paintNext=()=>{
   this.artworkFrame=null;if(!this.active||this.busy||this.disposed||version!==this.artworkVersion||this.document?.hidden||this.document?.visibilityState==='hidden'||reviewRevision(this.getConfig())!==revision)return;
   const item=queue.shift();if(!item)return;
   const canvas=this.query(`[data-creative-card-artwork="${item.direction.id}"]`),status=this.query(`[data-creative-card-status="${item.direction.id}"]`);
   try{
    const current=this.draft?.choiceKey===item.direction.id+':'+item.variant&&this.draft.revision===revision?this.draft:null;
    const config=current?.config??creativeDirectionConfig(base,item.direction.id,item.variant),map=current?.map??generate(config);
    const success=this.renderArtwork(canvas,map,{title:'',subtitle:'',format:'landscape'})!==false;
    canvas.setAttribute('data-artwork-state',success?'ready':'unavailable');status.textContent=success?'':'Map-Cover derzeit nicht verfügbar';if(success)this.thumbnailKeys.set(item.direction.id,item.key);
   }catch{canvas.setAttribute('data-artwork-state','unavailable');status.textContent='Map-Cover derzeit nicht verfügbar';}
   if(queue.length)this.artworkFrame=this.scheduleFrame(paintNext);
  };
  for(const item of queue)this.query(`[data-creative-card-artwork="${item.direction.id}"]`).setAttribute('data-artwork-state','loading');
  if(queue.length)this.artworkFrame=this.scheduleFrame(paintNext);
 }
 syncLabels(){
  const d=this.direction(),choice=this.choice();
  this.query('[data-creative-variant]').textContent=`Variante ${String(choice.variant).padStart(2,'0')} / ${String(CREATIVE_VARIANT_COUNT).padStart(2,'0')}`;
  this.query('.creative-draft-badge').textContent=this.showingReference?'MERKPUNKT':'ENTWURF';
  this.query('[data-creative-title]').textContent=d.title;this.query('[data-creative-mode]').textContent=d.mode==='tycoon'?'TYCOON':'OBBY';
  this.query('[data-creative-shape]').textContent=d.shape;this.query('[data-creative-scope]').textContent=d.scope;
  this.syncGallery();this.syncStory();
 }
 syncControls(){
  const tycoon=this.direction().mode==='tycoon',unavailable=this.busy||!this.draft,choice=this.choice();
  for(const b of this.root.querySelectorAll('[data-creative-variant-step]'))b.disabled=this.busy||this.showingReference||(Number(b.dataset.creativeVariantStep)<0?choice.variant===1:choice.variant===CREATIVE_VARIANT_COUNT);
  const same=this.reference&&this.reference.id===choice.id&&this.reference.variant===choice.variant;
  this.query('[data-creative-remember]').disabled=unavailable||!!same;
  this.query('[data-creative-remember]').textContent=same?'Als Merkpunkt gesetzt':'Zum Vergleich merken';
  this.query('[data-creative-comparison]').hidden=!this.reference;
  this.query('[data-creative-reference-label]').textContent=this.reference?CREATIVE_DIRECTIONS.find(d=>d.id===this.reference.id).title+' · Variante '+String(this.reference.variant).padStart(2,'0'):'';
  for(const b of this.root.querySelectorAll('[data-creative-compare]')){b.disabled=this.busy||!this.reference;b.setAttribute('aria-pressed',String((b.dataset.creativeCompare==='reference')===this.showingReference));}
  this.query('[data-creative-forget]').disabled=this.busy;
  this.query('[data-creative-open]').disabled=unavailable;this.query('[data-creative-level-controls]').hidden=!tycoon;
  this.query('[data-creative-artwork]').disabled=unavailable;
  this.query('#creativeDirectionSearch').disabled=this.busy;
  this.query('[data-creative-reset-gallery]').disabled=this.busy;
  for(const b of this.root.querySelectorAll('[data-creative-level]')){b.disabled=unavailable;b.setAttribute('aria-pressed',String(Number(b.dataset.creativeLevel)===this.level));}
  for(const b of this.root.querySelectorAll('[data-creative-camera]')){const action=b.dataset.creativeCamera;b.disabled=unavailable;b.hidden=action==='scope'&&!tycoon;if(['plan','path','scope'].includes(action))b.setAttribute('aria-pressed',String(action==='scope'?this.allPlots:this.camera[action]));}
  for(const b of this.root.querySelectorAll('[data-creative-direction],[data-creative-filter]'))b.disabled=this.busy;
  this.syncGallery();
 }
 view(){const tycoon=this.direction().mode==='tycoon';return {...normalizeCreativeView({...this.camera,level:this.level},tycoon?'tycoon':'obby'),focusPlot:tycoon&&!this.allPlots?1:0,labels:!tycoon||this.level<48};}
 select(id){
  const d=CREATIVE_DIRECTIONS.find(d=>d.id===id);if(this.busy||this.disposed||!d)return false;
  if(this.filter!=='all'&&this.filter!==d.mode)this.filter='all';
  this.selected=id;this.showingReference=false;this.draft=null;this.revealChoice();this.syncLabels();this.message('Nur der Entwurf wechselt. Deine gespeicherte Map bleibt erhalten.');this.refresh();return true;
 }
 setFilter(filter){
  if(this.busy||this.disposed||!['all','tycoon','obby'].includes(filter))return false;
  this.showingReference=false;this.draft=null;this.filter=filter;this.page=0;if(filter!=='all'&&this.direction().mode!==filter)this.selected=CREATIVE_DIRECTIONS.find(d=>d.mode===filter).id;
  this.syncLabels();const count=this.filteredDirections().length;this.message(`${count} ${count===1?'Welt':'Welten'} in dieser Auswahl. Deine gespeicherte Map bleibt erhalten.`);this.refresh();return true;
 }
 stepVariant(step){
  if(this.disposed||this.busy||this.showingReference||![-1,1].includes(step))return false;const variant=(this.variants.get(this.selected)||1)+step;
  if(variant<1||variant>CREATIVE_VARIANT_COUNT)return false;this.variants.set(this.selected,variant);this.draft=null;this.syncLabels();this.message('Andere Formdetails, gleicher Bauplan-Rahmen. Deine Map bleibt erhalten.');this.refresh();return true;
 }
 remember(){
  if(this.disposed||this.busy||!this.draft)return false;
  if(this.draft.revision!==reviewRevision(this.getConfig())||this.draft.choiceKey!==this.choiceKey()){this.refresh();this.message('Einstellungen geändert. Prüfe den aktualisierten Entwurf vor dem Merken.');return false;}
  this.reference={...this.choice(),revision:this.draft.revision,config:this.draft.config,map:this.draft.map};this.syncControls();this.paint();this.message('Merkpunkt gesetzt. Wähle eine andere Variante oder Richtung und wechsle zum Vergleichen zwischen beiden.');return true;
 }
 compare(reference){
  if(this.disposed||this.busy||!this.reference||typeof reference!=='boolean')return false;this.showingReference=reference;
  this.revealChoice();
  this.draft=null;this.syncLabels();this.message(reference?'Merkpunkt bei gleicher Kamera und Ausbaustufe. Öffnen übernimmt diesen sichtbaren Entwurf.':'Zurück zu deinem aktuellen Entwurf.');this.refresh();return true;
 }
 forget(){
  if(this.disposed||this.busy||!this.reference)return false;const refresh=this.showingReference;this.reference=null;this.showingReference=false;
  this.revealChoice();
  this.syncLabels();this.syncControls();this.message('Vergleichsmerkpunkt entfernt.');if(refresh){this.draft=null;this.refresh();}else{this.paint();this.scheduleArtwork();}return true;
 }
 setLevel(level){if(this.disposed||this.busy||!this.draft||this.direction().mode!=='tycoon'||![0,6,48].includes(level))return false;this.level=level;this.syncControls();this.paint();return true;}
 moveCamera(action){
  if(this.disposed||this.busy||!this.draft||!['left','right','out','in','plan','path','scope','reset'].includes(action))return false;
  if(action==='left')this.camera.angle-=.2;else if(action==='right')this.camera.angle+=.2;
  else if(action==='in')this.camera.zoom+=.15;else if(action==='out')this.camera.zoom-=.15;
  else if(action==='plan'||action==='path')this.camera[action]=!this.camera[action];
  else if(action==='scope'&&this.direction().mode==='tycoon')this.allPlots=!this.allPlots;
  else if(action==='reset'){this.camera=normalizeCreativeView({},'obby');this.allPlots=false;}
  this.camera=normalizeCreativeView(this.camera,'obby');this.syncControls();this.paint();return true;
 }
 setActive(value){this.active=!!value&&!this.disposed;this.viewer?.setActive(this.active&&!this.busy);if(this.active)this.refresh();else this.cancelArtwork();}
 setBusy(value){this.busy=!!value;if(this.busy){this.viewer?.setActive(false);this.cancelArtwork();}else if(this.active)this.refresh();this.syncControls();}
 renderState(state,message){
  const canvas=this.query('[data-creative-canvas]'),status=this.query('[data-creative-render]');this.query('.creative-stage').setAttribute('data-preview-state',state);status.hidden=state==='ready';if(message)status.textContent=message;
  canvas.setAttribute('aria-hidden',String(state!=='ready'));canvas.setAttribute('tabindex',state==='ready'?'0':'-1');if(state!=='ready')canvas.setAttribute('aria-label',message||'Vorschau nicht verfügbar');
 }
 refresh(){
  if(!this.active||this.disposed)return;const revision=reviewRevision(this.getConfig());
  if(this.reference&&this.reference.revision!==revision){this.reference=null;this.showingReference=false;this.currentDraft=null;this.draft=null;this.syncLabels();this.message('Map-Einstellungen geändert. Der Vergleichsmerkpunkt wurde zurückgesetzt; deine Variantenwahl bleibt erhalten.');}
  if(!this.draft||this.draft.revision!==revision||this.draft.choiceKey!==this.choiceKey()){
   this.viewer?.setActive(false);this.renderState('loading','Entwurf wird dargestellt …');
   try{const choice=this.choice(),cached=this.showingReference?this.reference:this.currentDraft?.revision===revision&&this.currentDraft.choiceKey===this.choiceKey()?this.currentDraft:null;
    const config=cached?.config||creativeDirectionConfig(this.getConfig(),choice.id,choice.variant),map=cached?.map||generate(config),errors=validate(map).filter(c=>c.status==='error');
    if(errors.length)throw Error('Entwurf braucht eine Korrektur: '+errors.map(c=>c.title).join(' · ')+'. Prüfe die Einstellungen im Generator.');
    this.draft={config,map,revision,choiceKey:this.choiceKey()};if(!this.showingReference)this.currentDraft=this.draft;this.query('[data-creative-seed]').textContent=config.seed;this.query('[data-creative-metrics]').textContent=`${map.parts.length.toLocaleString('de-DE')} Bauteile gesamt · ${config.mode==='tycoon'?config.plots+' Grundstücke':config.stages+' Abschnitte'}`;
   }catch(error){this.draft=null;if(!this.showingReference)this.currentDraft=null;this.query('[data-creative-seed]').textContent='';this.query('[data-creative-metrics]').textContent='Kein gültiger Bauplan';this.query('[data-creative-view]').textContent='Einstellungen prüfen';this.renderState('error',error.message);this.message(error.message);this.syncControls();this.scheduleArtwork();return;}
  }
  this.syncControls();this.paint();this.scheduleArtwork();
 }
 paint(){
  if(!this.active||this.disposed||this.busy||!this.draft)return;
  const canvas=this.query('[data-creative-canvas]'),draft=this.draft,tycoon=draft.config.mode==='tycoon';
  this.query('[data-creative-view]').textContent=tycoon?(this.allPlots?'Alle Grundstücke':'1 Grundstück')+' · '+this.level+'/48 Ausbauten':'Vollständige Route';
  if(!this.viewer)this.viewer=this.createPreview(canvas,draft.map,{active:false,view:this.view(),render:(canvas,map,view)=>{const partner=this.showingReference?this.currentDraft?.map:this.reference?.map,other=partner?.config.mode==='tycoon';
   const frame=partner?previewComparisonFrame([{map,view},{map:partner,view:{...view,focusPlot:other&&!this.allPlots?1:0,level:other?this.level:48}}]):null;return this.renderPreview(canvas,map,view,frame);},onViewChange:view=>{if(this.busy||!this.active||this.disposed)return;this.camera=normalizeCreativeView(view,'obby');this.syncControls();},onRender:success=>{
   if(!this.active||this.disposed||!this.draft)return;
   if(success){this.renderState('ready');canvas.setAttribute('aria-label',this.direction().title+' · Variante '+this.choice().variant+' · '+this.query('[data-creative-view]').textContent+'. Pfeiltasten drehen, Plus und Minus zoomen, Pos1 setzt die Kamera zurück.');}
   else this.renderState('unavailable','Bildvorschau nicht verfügbar. Du kannst den gültigen Bauplan im Generator öffnen.');
  }});
  this.viewer.setActive(false);this.viewer.setMap(draft.map,this.view());this.viewer.setActive(true);
 }
 open(){
  if(!this.active||this.busy||!this.draft)return false;
  if(this.draft.revision!==reviewRevision(this.getConfig())||this.draft.choiceKey!==this.choiceKey()){this.refresh();this.message('Einstellungen geändert. Der Entwurf wurde aktualisiert; bitte erneut auswählen.');return false;}
  const opened=this.onPreview(this.draft.config,{level:this.direction().mode==='tycoon'?this.level:48});
  if(opened){this.message('Entwurf im Generator geöffnet. Über „Vorherige Map wiederherstellen“ kannst du zurück.');return true;}
  return false;
 }
 artwork(){
  if(!this.active||this.busy||this.disposed||!this.draft)return false;
  if(this.draft.revision!==reviewRevision(this.getConfig())||this.draft.choiceKey!==this.choiceKey()){this.refresh();this.message('Einstellungen geändert. Prüfe den aktualisierten Entwurf vor dem Gestalten.');return false;}
  try{return this.onArtwork(this.draft.map,this.direction())!==false;}catch{this.message('Die Cover-Ansicht konnte nicht geöffnet werden.');return false;}
 }
 dispose(){this.cancelArtwork();this.thumbnailKeys.clear();this.reference=null;this.currentDraft=null;this.draft=null;this.disposed=true;this.active=false;this.viewer?.dispose();this.root.removeEventListener?.('click',this.onClick);this.root.removeEventListener?.('input',this.onSearch);this.document?.removeEventListener?.('visibilitychange',this.onVisibility);}
}
