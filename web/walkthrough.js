import {guideSteps,restoreGuide,completedStep} from './walkthrough-core.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class Walkthrough{
 constructor(root,{storage,getContext,navigate,actions,onTest,toast}){
  Object.assign(this,{root,storage,getContext,navigate,actions,onTest,toast});
  this.active=storage.get('mapforge.guide.active.v1','setup');
  root.addEventListener('click',e=>this.click(e));root.addEventListener('change',e=>this.change(e));this.refresh();
 }
 refresh(focus=false){
  const ctx=this.getContext(),steps=guideSteps(ctx);this.context=ctx;this.steps=steps;this.key='mapforge.guide.v1.'+ctx.scopeKey;
  this.answers=restoreGuide({...this.storage.get(this.key,{}),...this.storage.get('mapforge.guide.setup.v1',{})},steps);
  if(!steps.some(s=>s.id===this.active))this.active=steps[0].id;
  const index=steps.findIndex(s=>s.id===this.active),step=steps[index],done=steps.filter(s=>completedStep(s,this.answers)).length,complete=completedStep(step,this.answers),busy=this.busy;
  const oldFocus=this.root.contains(document.activeElement)?document.activeElement:null,ackFocus=oldFocus?.dataset.walkAck,testFocus=oldFocus?.dataset.walkTest;
  this.root.innerHTML=`<div class="walk-progress"><div><span class="tiny-label">DEIN WEG ZUM ROBLOX-SPIEL</span><strong aria-live="polite">${done} von ${steps.length} Schritten bestätigt</strong></div><div class="walk-track" role="progressbar" aria-label="Anleitungsfortschritt" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${done}"><span style="width:${done/steps.length*100}%"></span></div><p>Gespeichert für „${escape(ctx.map.config.name)}“. Du kannst jeden Schritt jederzeit ansehen.</p></div>
   <div class="walk-layout"><nav class="walk-nav" aria-label="Schritte der Anleitung"><ol>${steps.map((s,i)=>`<li><button data-walk-step="${s.id}" ${s.id===step.id?'aria-current="step"':''} class="${s.id===step.id?'current':''} ${completedStep(s,this.answers)?'done':''}"><span>${completedStep(s,this.answers)?'✓':String(i+1).padStart(2,'0')}</span><strong>${escape(s.short)}</strong></button></li>`).join('')}</ol></nav>
   <article class="panel walk-card"><div class="walk-card-top"><span class="tiny-label">SCHRITT ${index+1} / ${steps.length} · ${step.location}</span><span class="walk-state ${complete?'done':''}">${complete?'Bestätigt':'Noch offen'}</span></div><h2 id="walk-heading" tabindex="-1">${escape(step.title)}</h2><p class="walk-intro">${escape(step.intro)}</p><ol class="walk-instructions">${step.items.map(([title,detail])=>`<li><strong>${escape(title)}</strong><p>${escape(detail)}</p></li>`).join('')}</ol>
   ${step.gateText?`<p class="walk-gate ${step.gate===false?'error':''}" role="status">${escape(step.gateText)}</p>`:''}
   <div class="walk-actions">${step.actions.map((a,i)=>a.href?`<a class="quiet link-button" href="${escape(a.href)}" target="_blank" rel="noopener">${escape(a.label)}</a>`:`<button class="${i===0?'primary':'quiet'}" data-walk-action="${i}" ${busy||(a.needsScripts&&!ctx.scriptsReady)||(a.blockOnErrors&&ctx.checks.some(c=>c.status==='error'))?'disabled':''}>${escape(a.label)}</button>`).join('')}</div>
   <aside class="walk-tip"><span>GUT ZU WISSEN</span><p>${escape(step.tip)}</p></aside>
   <div class="walk-checks">${(step.acks||[]).map(([id,text])=>`<label><input type="checkbox" data-walk-ack="${id}" ${this.answers[id]?'checked':''}><span>${escape(text)}</span></label>`).join('')}${(step.tests||[]).map(test=>`<label><input type="checkbox" data-walk-test="${test.index}" ${test.done?'checked':''}><span>${escape(test.label)}</span></label>`).join('')}</div>
   <div class="walk-bottom"><button class="quiet" data-walk-move="-1" ${index===0?'disabled':''}>← Zurück</button><span>${index===steps.length-1?`${steps.length-done} Schritte noch offen`:`Danach: ${escape(steps[index+1].short)}`}</span>${index<steps.length-1?'<button class="primary" data-walk-move="1">Weiter →</button>':'<button class="primary" data-walk-finish>Zur Map →</button>'}</div></article></div>`;
  if(focus)this.root.querySelector('#walk-heading').focus({preventScroll:true});
  else if(ackFocus)this.root.querySelector(`[data-walk-ack="${ackFocus}"]`)?.focus({preventScroll:true});
  else if(testFocus!==undefined)this.root.querySelector(`[data-walk-test="${testFocus}"]`)?.focus({preventScroll:true});
 }
 select(id){if(!this.steps.some(s=>s.id===id))return;this.active=id;this.storage.set('mapforge.guide.active.v1',id);this.refresh(true);this.root.scrollIntoView({behavior:'instant',block:'start'});}
 async click(e){
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.walkStep){this.select(b.dataset.walkStep);return;}
  if(b.dataset.walkMove){const i=this.steps.findIndex(s=>s.id===this.active)+Number(b.dataset.walkMove);if(this.steps[i])this.select(this.steps[i].id);return;}
  if(b.hasAttribute('data-walk-finish')){this.navigate('generator',true);return;}
  if(b.dataset.walkAction===undefined)return;
  const a=this.steps.find(s=>s.id===this.active)?.actions[Number(b.dataset.walkAction)];if(!a)return;
  if(a.page){this.navigate(a.page,true);return;}
  if(!this.actions[a.action])return;
  this.busy=true;this.refresh();try{await this.actions[a.action]();}catch{this.toast('Aktion konnte nicht ausgeführt werden. Bitte versuche es erneut.');}finally{this.busy=false;this.refresh();}
 }
 change(e){
  const id=e.target.dataset.walkAck;
  if(id&&Object.hasOwn(this.answers,id)){
   this.answers[id]=e.target.checked;
   const key=id.startsWith('setup-')?'mapforge.guide.setup.v1':this.key;
   const values=id.startsWith('setup-')?Object.fromEntries(Object.entries(this.answers).filter(([key])=>key.startsWith('setup-'))):this.answers;
   if(!this.storage.set(key,values))this.toast('Fortschritt konnte nicht im Browser gespeichert werden.');this.refresh();
  }
  if(e.target.dataset.walkTest!==undefined)this.onTest(Number(e.target.dataset.walkTest),e.target.checked);
 }
}
