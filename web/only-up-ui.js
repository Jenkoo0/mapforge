import {onlyUpDifficulty} from './only-up-difficulty.js';
import {ONLY_UP_LAYOUTS} from './only-up-architecture.js';
// The ascent card reads configuration and generated geometry. Opening it never
// changes the project; presets apply only through an explicit button click.
const PALETTES={
 sky:{label:'Himmel',accent:'#a5b7f2',ink:'#3f4e85'},
 neon:{label:'Neon',accent:'#78d8c2',ink:'#266b64'},
 lava:{label:'Lava',accent:'#e9a276',ink:'#8a4b34'},
 jungle:{label:'Dschungel',accent:'#96bf91',ink:'#416f48'}
};
const CHAPTERS=[
 {title:'Ankommen',skill:'Linie finden'},
 {title:'Rhythmus',skill:'Sprünge verbinden'},
 {title:'Präzision',skill:'Sauber landen'},
 {title:'Zum Gipfel',skill:'Konzentriert bleiben'}
];
const number=new Intl.NumberFormat('de-DE',{maximumFractionDigits:1});
const styleFor=config=>config.obbyStyle==='onlyup'?'onlyup':'classic';
const layoutFor=config=>Object.hasOwn(ONLY_UP_LAYOUTS,config.ascentLayout)?config.ascentLayout:'spire';
const LAYOUT_SCHEMES={
 spire:'<path d="M22 51C5 39 21 21 46 24S78 44 55 48 20 34 34 20 67 8 74 14"/><path class="only-up-layout-structure" d="M45 53V10m-11 7 11-7 12 7m-23 0v32m23-32v32"/><circle cx="22" cy="51" r="3"/><path d="m68 13 6 1-2 6"/>',
 ridge:'<path class="only-up-layout-structure" d="m7 56 19-26 12 7L56 9l16 17 17-10v40Z"/><path d="m13 50 15-11 13 6 15-24 14 15 13-10"/><circle cx="13" cy="50" r="3"/><path d="m77 25 6 1-1 6"/>',
 switchback:'<path class="only-up-layout-structure" d="M11 50h74M11 34h74M11 18h74"/><path d="M15 50h61q8 0 8-8t-8-8H21q-8 0-8-8t8-8h58"/><circle cx="15" cy="50" r="3"/><path d="m74 13 5 5-5 5"/>'
};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const generationFields=['mode','theme','stages','seed','difficulty','gap','rise','checkpointEvery','detail','movement','events','storyId','ascentLayout'];

export function onlyUpSummary(config,map){
 const onlyUp=styleFor(config)==='onlyup';
 const raw=Number(config.stages),stages=Number.isFinite(raw)?Math.max(onlyUp?96:12,Math.min(onlyUp?240:80,Math.round(raw))):onlyUp?144:36;
 let chapters=CHAPTERS.map((chapter,index)=>({...chapter,start:Math.floor(index*stages/4)+1,end:Math.floor((index+1)*stages/4)}));
 const matching=map?.config&&styleFor(map.config)===styleFor(config)&&generationFields.every(key=>key==='ascentLayout'?layoutFor(map.config)===layoutFor(config):map.config[key]===config[key]);
 const route=matching&&Array.isArray(map.stages)?map.stages:[];
 if(matching&&map.onlyUp?.chapters?.length===4)chapters=map.onlyUp.chapters.map(chapter=>({title:chapter.title,start:Math.max(1,chapter.start),end:chapter.end,skill:[...new Set((chapter.sections||[]).map(section=>section.skill).filter(Boolean))].join(' · ')}));
 const heights=route.map(stage=>stage?.pos?.[1]);
 const height=heights.length>=2&&heights.every(Number.isFinite)?Math.max(0,heights.at(-1)-heights[0]):null;
 return {analysis:matching&&onlyUp?onlyUpDifficulty(map):null,onlyUp,stages,chapters,height,layout:layoutFor(config),theme:PALETTES[config.theme]||PALETTES.sky};
}

export function mountOnlyUp(root,{getConfig,onChange,getMap=()=>null,onCollection=()=>{},onCancelCollection=()=>{}}){
 root.classList.add('only-up-studio');
 root.innerHTML=`<div class="only-up-heading"><span class="only-up-kicker">DEIN PARCOURS</span><span class="only-up-theme"></span></div>
  <h3>Dein Weg nach oben.</h3>
  <div class="only-up-styles" role="group" aria-label="Parcours-Stil">
   <button type="button" data-obby-style="classic" aria-pressed="false"><span class="only-up-choice-icon" aria-hidden="true">↗</span><strong>Klassischer Obby</strong><small>Kurze, freie Route</small></button>
   <button type="button" data-obby-style="onlyup" aria-pressed="false"><span class="only-up-choice-icon" aria-hidden="true">↑</span><strong>Only Up</strong><small>Ein langer Aufstieg</small></button>
  </div>
  <p class="only-up-classic">Dein klassischer Parcours: 12–80 Abschnitte. Länge und Sprungmaße stellst du unten ein.</p>
  <div class="only-up-plan">
   <p class="only-up-intro">Ein Aufstieg. Vier Kapitel. Plane eine lange Route, bei der saubere Sprünge und sichere Landungen zählen.</p>
   <div class="only-up-preset-label">LÄNGE WÄHLEN</div>
   <div class="only-up-presets" role="group" aria-label="Länge für Only Up">
    <button type="button" data-only-up-preset="96" aria-pressed="false"><b>96</b><span>Kompakt</span></button>
    <button type="button" data-only-up-preset="144" aria-pressed="false"><b>144</b><span>Empfohlen</span></button>
    <button type="button" data-only-up-preset="240" aria-pressed="false"><b>240</b><span>Expedition</span></button>
   </div>
   <section class="only-up-architecture" aria-label="Bauform für Only Up">
    <div class="only-up-preset-label">BAUFORM WÄHLEN</div>
    <div class="only-up-layouts" role="group" aria-label="Verlauf des Aufstiegs">${Object.entries(ONLY_UP_LAYOUTS).map(([key,layout])=>`<button type="button" data-ascent-layout="${escape(key)}" aria-pressed="false"><svg viewBox="0 0 96 64" aria-hidden="true" focusable="false">${LAYOUT_SCHEMES[key]||''}</svg><span><strong>${escape(layout.label)}</strong><small>${escape(layout.description)}</small></span></button>`).join('')}</div>
   </section>
   <figure class="only-up-journey" aria-labelledby="only-up-plan-title">
    <figcaption id="only-up-plan-title"><span>KAPITELPLAN</span><strong class="only-up-stage-count"></strong></figcaption>
    <div class="only-up-route"><svg viewBox="0 0 98 264" aria-hidden="true" focusable="false"><path class="only-up-route-line" d="M36 245 67 211 31 178 66 145 31 112 65 78 33 44 53 15"/><g class="only-up-terraces"><path d="m15 232 30-11 31 11-30 12Z"/><path d="m32 168 28-11 28 11-28 12Z"/><path d="m10 104 28-11 28 11-28 12Z"/><path d="m26 40 28-11 29 11-29 12Z"/></g><g class="only-up-route-dots"><circle cx="45" cy="231" r="4"/><circle cx="60" cy="167" r="4"/><circle cx="38" cy="103" r="4"/><circle cx="54" cy="39" r="4"/></g><path class="only-up-flag" d="M54 30V8m0 0 19 4-19 5"/></svg><ol class="only-up-chapters" reversed></ol></div>
   </figure>
   <div class="only-up-elevation" aria-live="polite"><span>Höhengewinn</span><strong></strong></div>
   <p class="only-up-footnote">Kapitelplan aus deiner Abschnittszahl. Die Höhe stammt aus der erzeugten Route.</p><div class="only-up-downloads"><div class="only-up-download-actions"><button type="button" id="downloadOnlyUp">4 Only-Up-Welten laden ↓</button><button type="button" id="downloadIndividualOnlyUp">12 individuelle Welten laden ↓</button><button type="button" id="cancelOnlyUp" hidden>Abbrechen</button></div><p id="onlyUpCollectionStatus" role="status">Vier Themen × drei Bauformen: zwölf individuelle Startpakete mit je 144 Etappen und Geometrie-Covern. Oder starte mit den vier Themenwelten als Turmspiralen.</p></div><section class="only-up-insight" aria-label="Gemessene Skill-Kurve"></section>
  </div>`;
 const styles=[...root.querySelectorAll('[data-obby-style]')],presets=[...root.querySelectorAll('[data-only-up-preset]')],layouts=[...root.querySelectorAll('[data-ascent-layout]')];
 styles.forEach(button=>button.addEventListener('click',()=>{
  if(styleFor(getConfig())!==button.dataset.obbyStyle)onChange({obbyStyle:button.dataset.obbyStyle});
 }));
 presets.forEach(button=>button.addEventListener('click',()=>onChange({obbyStyle:'onlyup',stages:Number(button.dataset.onlyUpPreset)})));
 layouts.forEach(button=>button.addEventListener('click',()=>{
  if(layoutFor(getConfig())!==button.dataset.ascentLayout)onChange({ascentLayout:button.dataset.ascentLayout});
 }));
 function refresh(){
  const config=getConfig();root.hidden=config.mode==='tycoon';
  const summary=onlyUpSummary(config,getMap());
  root.dataset.obbyStyle=summary.onlyUp?'onlyup':'classic';
  root.dataset.onlyUpTheme=Object.hasOwn(PALETTES,config.theme)?config.theme:'sky';
  root.style.setProperty('--only-up-accent',summary.theme.accent);
  root.style.setProperty('--only-up-ink',summary.theme.ink);
  root.querySelector('.only-up-theme').textContent=summary.theme.label;
  styles.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.obbyStyle===(summary.onlyUp?'onlyup':'classic'))));
  presets.forEach(button=>button.setAttribute('aria-pressed',String(summary.onlyUp&&Number(button.dataset.onlyUpPreset)===summary.stages)));
  layouts.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ascentLayout===summary.layout)));
  root.querySelector('.only-up-classic').hidden=summary.onlyUp;
  root.querySelector('.only-up-plan').hidden=!summary.onlyUp;
  root.querySelector('.only-up-stage-count').textContent=`${summary.stages} Abschnitte`;
  root.querySelector('.only-up-chapters').innerHTML=[...summary.chapters].reverse().map((chapter,index)=>`<li value="${4-index}"><span class="only-up-chapter-number" aria-hidden="true">0${4-index}</span><div><strong>${escape(chapter.title)}</strong><span>${escape(chapter.skill)}</span><small>Abschnitt ${escape(chapter.start)}–${escape(chapter.end)}</small></div></li>`).join('');
  const insight=root.querySelector('.only-up-insight'),analysis=summary.analysis;
  if(analysis?.valid&&analysis.sections.length===8){
   insight.innerHTML=`<div class="only-up-insight-title"><div><span class="only-up-kicker">GEOMETRISCHER ANSPRUCH</span><h4>Deine Skill-Kurve.</h4></div><b>${analysis.length.toLocaleString('de-DE',{maximumFractionDigits:0})} Studs Weg</b></div><p>Die acht Schwerpunkte verändern Landeflächen, Versatz und Anstieg. Der Index vergleicht Geometrie; er ist keine gemessene Spielerschwierigkeit.</p><ol class="only-up-skill-bars">${analysis.sections.map((section,index)=>`<li aria-label="Abschnitt ${index+1}: ${escape(section.skill)}, Index ${section.index} von 100"><b>${section.index}</b><span style="--skill-index:${section.index}"></span><small>0${index+1}</small></li>`).join('')}</ol><p class="only-up-measured">Kantenlücke max. <b>${analysis.maxGap.toLocaleString('de-DE')} Studs</b> · Anstieg max. <b>${analysis.maxRise.toLocaleString('de-DE')} Studs</b> · Checkpoints spätestens nach <b>${analysis.maxCheckpointSpan} Sprüngen</b>.</p><details><summary>Alle acht Abschnitte vergleichen</summary><div class="only-up-table-scroll" tabindex="0" role="region" aria-label="Sprungmaße je Abschnitt"><table><thead><tr><th>Schwerpunkt</th><th>Etappen</th><th>Lücke max.</th><th>Landung min.</th></tr></thead><tbody>${analysis.sections.map(section=>`<tr><th>${escape(section.skill)}</th><td>${section.start}–${section.end}</td><td>${section.maxGap.toLocaleString('de-DE')}</td><td>${section.minWidth.toLocaleString('de-DE')}</td></tr>`).join('')}</tbody></table></div><p>Maße in Studs. Index: 50 % relative Lücke, 30 % relativer Anstieg und 20 % schmalere Landefläche. Die vollständige Formel steht in Skillkurve.md im Startpaket. Sprünge, Physik und Steuerung in Roblox testen.</p></details>`;
  }else insight.textContent='Die Skill-Kurve erscheint nach dem Generieren einer vollständigen Only-Up-Route.';
  const elevation=root.querySelector('.only-up-elevation');
  elevation.querySelector('strong').textContent=summary.height===null?'Nach dem Generieren':`${number.format(summary.height)} Studs`;
  elevation.classList.toggle('only-up-awaiting',summary.height===null);
 }
 root.querySelector('#downloadOnlyUp').addEventListener('click',()=>onCollection({individual:false}));root.querySelector('#downloadIndividualOnlyUp').addEventListener('click',()=>onCollection({individual:true}));root.querySelector('#cancelOnlyUp').addEventListener('click',onCancelCollection);
 refresh();return {refresh,setCollectionStatus:text=>{root.querySelector('#onlyUpCollectionStatus').textContent=text;},setCollectionBusy:busy=>{root.querySelector('#downloadOnlyUp').disabled=busy;root.querySelector('#downloadIndividualOnlyUp').disabled=busy;root.querySelector('#cancelOnlyUp').hidden=!busy;}};
}
