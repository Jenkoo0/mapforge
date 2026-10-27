import {recommendTrend} from './trend-core.js';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=n=>new Intl.NumberFormat('de-DE',{notation:'compact',maximumFractionDigits:1}).format(n);
export class TrendView{
 constructor({onApply,onNavigate,toast}){
  this.onApply=onApply;this.onNavigate=onNavigate;this.toast=toast;this.data=null;this.filter='tycoon';this.loading=null;this.selected=null;this.failed=false;
  try{this.previous=JSON.parse(localStorage.getItem('mapforge.trends.previous')||'null');this.saved=JSON.parse(localStorage.getItem('mapforge.trends.snapshot')||'null');}catch{}
  $('refreshTrends').addEventListener('click',()=>this.refresh());
  $('trendSearch').addEventListener('input',()=>this.render());
  document.querySelectorAll('[data-trend-filter]').forEach(b=>b.addEventListener('click',()=>{this.filter=b.dataset.trendFilter;document.querySelectorAll('[data-trend-filter]').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',x===b);});this.render();}));
  $('trendList').addEventListener('click',e=>{const b=e.target.closest('[data-trend-apply]');if(b)this.apply(Number(b.dataset.trendApply));});
  $('trendRecommendation').addEventListener('click',e=>{if(e.target.closest('[data-best-trend]')){const best=this.data&&recommendTrend(this.data.games);if(best)this.apply(best.id);}});
 }
 async refresh(){if(this.loading)return this.loading;this.loading=this.fetch();try{return await this.loading;}finally{this.loading=null;}}
 async fetch(){
  const btn=$('refreshTrends');btn.disabled=true;$('trendStatus').textContent='Roblox-Charts werden abgerufen …';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),17000);
  try{
   const r=await fetch('/api/trends',{signal:controller.signal,cache:'no-store'}),data=await r.json();
   if(!r.ok||!Array.isArray(data.games)||!Number.isFinite(Date.parse(data.fetchedAt)))throw new Error('unavailable');
   const prior=this.saved;
   if(prior&&Date.parse(data.fetchedAt)-Date.parse(prior.fetchedAt)>=60000){this.previous=prior;try{localStorage.setItem('mapforge.trends.previous',JSON.stringify(prior));}catch{}}
   this.data=data;this.saved=data;this.failed=false;
   try{localStorage.setItem('mapforge.trends.snapshot',JSON.stringify(data));}catch{}
   this.render();return data;
  }catch{
   this.failed=true;
   if(this.saved&&Array.isArray(this.saved.games)&&Date.now()-Date.parse(this.saved.fetchedAt)<86400000)this.data=this.saved;
   this.render();return null;
  }finally{clearTimeout(timeout);btn.disabled=false;}
 }
 render(){
  const d=this.data;
  if(!d){$('trendDot').style.background='var(--warning)';$('trendStatus').textContent=this.failed?'Roblox-Daten gerade nicht erreichbar':'Noch keine Daten';$('trendCoverage').textContent='Du kannst mit eigenen Einstellungen weiterbauen. Beim nächsten Versuch werden die echten Quellen erneut abgefragt.';return;}
  const date=new Date(d.fetchedAt).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}),fresh=Date.now()-Date.parse(d.fetchedAt)<900000&&!this.failed;
  $('trendDot').style.background=fresh?'var(--lime)':'var(--warning)';
  $('trendStatus').textContent=`${fresh?'Roblox-Abruf':'Gespeicherter Stand'} · ${date} · ${d.games.length} Spiele`;
  $('trendCoverage').textContent=d.coverage+(d.warnings?.length?' '+d.warnings.join(' '):'');
  const best=recommendTrend(d.games);
  $('trendRecommendation').innerHTML=best?`<div><span class="tiny-label">TYCOON-ABLEITUNG AUS EINER SPIELREFERENZ</span><h2>${esc(best.idea.name)}</h2><p>Quelle: <a href="${esc(best.url)}" target="_blank" rel="noopener">${esc(best.name)} ↗</a> · ${short(best.playing)} Spieler im Abruf</p><div class="trend-tags">${best.idea.mechanics.map(t=>`<span>${esc(t)}</span>`).join('')}</div><p class="micro">${esc(best.idea.scope)}</p></div><button class="primary" data-best-trend>Tycoon ableiten →</button>`:'<div><h2>Keine passende Tycoon-Referenz gefunden</h2><p>Die Charts bleiben sichtbar. Du kannst eine eigene Vorlage konfigurieren.</p></div>';
  const search=$('trendSearch').value.toLowerCase().trim();let games=d.games.filter(g=>!search||g.name.toLowerCase().includes(search));
  if(this.filter==='tycoon')games=games.filter(g=>g.idea.fit>=70).sort((a,b)=>b.playing-a.playing);
  if(this.filter==='trending')games=games.filter(g=>g.trendingRank).sort((a,b)=>a.trendingRank-b.trendingRank);
  if(this.filter==='playing')games=games.sort((a,b)=>b.playing-a.playing);
  $('trendList').innerHTML=games.length?games.slice(0,60).map((g,i)=>{
   const prior=this.previous?.games?.find(x=>x.id===g.id),minutes=this.previous?Math.round((Date.parse(d.fetchedAt)-Date.parse(this.previous.fetchedAt))/60000):0;
   const delta=prior&&prior.playing>0&&minutes>=1?Math.round((g.playing-prior.playing)/prior.playing*100):null;
   return `<article class="trend-card panel"><div class="trend-rank">${this.filter==='trending'?'#'+g.trendingRank:String(i+1).padStart(2,'0')}</div><div class="trend-game"><a href="${esc(g.url)}" target="_blank" rel="noopener"><h3>${esc(g.name)}</h3></a><p>${esc(g.genre||'Roblox-Spiel')} · ${g.idea.fit>=70?'Tycoon-Adaption möglich':'Andere Spielmechaniken'}</p><span class="micro">${esc(g.idea.reason)}</span></div><div class="trend-metric"><strong>${short(g.playing)}</strong><span>Spieler im Abruf</span>${delta!==null?`<small>${delta>=0?'+':''}${delta} % seit ${minutes} Min. in diesem Browser</small>`:''}</div><div class="trend-rating"><strong>${g.rating===null?'—':g.rating+' %'}</strong><span>Zustimmung</span></div><button class="quiet small" data-trend-apply="${g.id}" ${g.idea.fit<70?'disabled':''}>Ableiten →</button></article>`;
  }).join(''):'<div class="empty-card"><p>Keine passenden Spiele in diesem Abruf.</p></div>';
 }
 async apply(id){
  if(this.failed||!this.data||Date.now()-Date.parse(this.data.fetchedAt)>900000){const d=await this.refresh();if(!d){this.toast('Keine frischen Trenddaten. Du kannst mit eigenen Einstellungen bauen.');return;}}
  const game=this.data.games.find(g=>g.id===id);if(!game)return;
  this.selected=game;if(await this.onApply(game))this.onNavigate('generator');
 }
 async beforeGenerate(){const d=await this.refresh();if(!d)return null;const game=this.selected&&d.games.find(g=>g.id===this.selected.id)||recommendTrend(d.games);if(!game)return null;this.selected=game;return game;}
}
