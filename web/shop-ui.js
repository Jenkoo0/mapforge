import {shopPlan,parseShopImport,shopGuide,studioShopScanner} from './shop-setup.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class ShopSetup{
 constructor(root,{getConfig,apply,download,toast}){
  this.root=root;this.getConfig=getConfig;
  root.innerHTML=`<div class="eyebrow">SHOP-ASSISTENT</div><h2>Deine Angebote. Einmal einrichten.</h2><p data-shop-summary aria-live="polite"></p><ol class="launch-steps"><li><strong>Bei Roblox anlegen</strong><p>Spiel zuerst veröffentlichen. Im Creator Hub die gewünschten Developer Products und Pässe mit den unten stehenden Namen anlegen und Preise festlegen.</p></li><li><strong>Produkt-IDs gesammelt einlesen</strong><p>Das Prüfskript in der Studio-Befehlsleiste des richtigen Spiels ausführen. Es liest den Katalog und gibt einen JSON-Block aus. Pässe weiterhin unten eintragen.</p></li><li><strong>Prüfen, übernehmen, neu exportieren</strong><p>JSON hier einsetzen und die geänderten Zuordnungen prüfen. Danach Shop übernehmen und die neue Studio-Datei im bestehenden Spiel veröffentlichen.</p></li></ol><div class="action-row"><button class="quiet" data-shop-scan>Studio-Prüfskript laden</button><button class="quiet" data-shop-guide>Einrichtung laden</button><a class="text-btn" href="https://create.roblox.com/dashboard/creations" target="_blank" rel="noopener">Creator Hub ↗</a></div><label for="shopImportJson">Shop-JSON aus Studio</label><textarea id="shopImportJson" rows="4" maxlength="20000" placeholder='{"app":"MapForgeShop","products":{},"passes":{}}'></textarea><div class="action-row"><button class="quiet" data-shop-review>IDs prüfen</button><button class="primary" data-shop-apply disabled>Änderungen übernehmen</button></div><div data-shop-diff role="status" aria-live="polite"></div><p class="micro">Keine Kontoverbindung. IDs werden erst im Roblox-Spiel auf Zugehörigkeit geprüft. Bestehende IDs nur ändern, wenn derselbe bezahlte Vorteil erhalten bleibt. Fehlende Angebote bleiben ausgeschaltet.</p>`;
  const input=root.querySelector('#shopImportJson'),button=root.querySelector('[data-shop-apply]'),diff=root.querySelector('[data-shop-diff]');
  const reset=()=>{button.disabled=true;diff.textContent='';this.pending=null;};
  input.addEventListener('input',reset);
  root.querySelector('[data-shop-scan]').addEventListener('click',()=>download('Shop-IDs-aus-Studio.lua',studioShopScanner()));
  root.querySelector('[data-shop-guide]').addEventListener('click',()=>download('Robux-Shop-Einrichtung.md',shopGuide(getConfig()),'text/markdown;charset=utf-8'));
  root.querySelector('[data-shop-review]').addEventListener('click',()=>{
   reset();try{const current=getConfig(),result=parseShopImport(input.value,current);this.pending={text:input.value,base:JSON.stringify(current)};diff.innerHTML=`<p>${result.changes.length} neue Zuordnungen${result.universeId?' · Roblox-Spiel '+result.universeId:''}:</p><ul>${result.changes.map(c=>`<li>${esc(c.name)}: ${esc(c.before||'leer')} → ${esc(c.after)}</li>`).join('')}</ul>`;button.disabled=false;}catch(e){diff.textContent=e.message;}
  });
  button.addEventListener('click',()=>{
   try{if(!this.pending||this.pending.base!==JSON.stringify(getConfig()))throw Error('Map wurde geändert. IDs bitte erneut prüfen.');const result=parseShopImport(this.pending.text,getConfig());reset();apply(result.config);input.value='';toast('IDs übernommen. Shop-Einstellungen übernehmen und neu exportieren.');}catch(e){reset();diff.textContent=e.message;}
  });
 }
 refresh(){const c=this.getConfig();this.root.hidden=c.mode!=='tycoon';const ready=shopPlan(c).filter(p=>p.id).length;this.root.querySelector('[data-shop-summary]').textContent=`${ready} von 9 IDs eingetragen. ${c.shop?'Shop an':'Shop aus'} · ${c.persistence?'Speichern an':'Speichern aus'}. Preise und Verkauf werden bei Roblox eingestellt.`;}
}
