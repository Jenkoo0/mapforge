import {buildBotRun} from './bot-core.js';
import {generate,validate} from './engine.js';
import {PART_BUDGET,LAYOUTS,PACING,TYCOON_THEMES} from './tycoon.js';
import {pacingPlan} from './gameplay.js';
import {IDEA_PATTERNS} from './idea-data.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>value.toLocaleString('de-DE');

// Use the same planning, local review and validation as the selected idea's build.
// Nothing is applied, saved or downloaded while preparing these comparisons.
export async function prepareIdeaPreview(config,idea,{now=Date.now}={}){
 const run=await buildBotRun({config,idea,now});
 const map=generate(run.config),checks=validate(map);
 return {idea,config:map.config,map,metrics:{parts:map.parts.length,budget:PART_BUDGET,
  headroom:PART_BUDGET-map.parts.length,passed:checks.filter(c=>c.status==='pass').length,
  warnings:checks.filter(c=>c.status==='warn').length,plots:map.config.plots,
  modelMinutes:Math.round(pacingPlan(map.config.pacing,map.config.theme).seconds/60)}};
}

export function ideaCardsHtml(previews){
 return previews.map(({idea,config:c,metrics:m},index)=>`<article class="idea-card idea-${esc(c.theme)}" aria-labelledby="${esc(idea.id)}-title">
  <div class="idea-visual"><canvas data-idea-canvas="${esc(idea.id)}" width="640" height="390" role="img" aria-label="Layout von ${esc(c.name)} · Vollausbau · ein Grundstück"></canvas><span class="idea-visual-label">${esc(TYCOON_THEMES[c.theme].label)} · ${esc(LAYOUTS[c.layout].name)}</span><span class="idea-preview-state" data-idea-state>48 / 48 Ausbauten</span><span class="idea-render-status" data-idea-render="${esc(idea.id)}" role="status">Vorschau wird gezeichnet …</span></div>
  <div class="idea-card-body"><span class="tiny-label">KONZEPT 0${index+1}</span><h3 id="${esc(idea.id)}-title">${esc(idea.title)}</h3>
  ${c.name!==idea.title?`<p class="micro">Dein Map-Name bleibt: ${esc(c.name)}</p>`:''}<p>${esc(idea.hook)}</p>
  <dl class="idea-metrics"><div><dt>BAUTEILE GESAMT</dt><dd>${number(m.parts)} <small>/ ${number(m.budget)}</small></dd></div><div><dt>GRUNDSTÜCKE</dt><dd>${m.plots}</dd></div></dl>
  <div class="idea-budget" role="img" aria-label="${number(m.parts)} von ${number(m.budget)} Bauteilen, ${number(m.headroom)} frei"><span style="width:${Math.min(100,m.parts/m.budget*100).toFixed(1)}%"></span></div>
  <p class="idea-check-note">✓ ${m.passed} Datenchecks · ${m.warnings} Hinweis${m.warnings===1?'':'e'} · Studio-Test offen</p>
  <p class="micro">${esc(PACING[c.pacing].name)} · ca. ${m.modelMinutes} Min. reine Produktion im Modell. Laufwege und Sammelpausen kommen hinzu.</p>
  <div class="trend-tags">${idea.patterns.map(p=>`<span>${esc(IDEA_PATTERNS[p].name)}</span>`).join('')}</div>
  <details><summary>Idee, Referenzen &amp; Lieferumfang</summary><p>${esc(idea.twist)}</p><ul>${idea.references.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a> · ${r.kind==='live'?esc(r.playing)+' Spieler im Abruf '+esc(r.observedAt):'geprüfte Beschreibung'}</li>`).join('')}</ul><p>Enthalten: 48 Ausbauten, Forschung, Designs, Aufträge und Kalibrierungsrunde als Produktions-Tycoon.</p><p>Noch nicht implementiert: ${esc(idea.roadmap.join(' '))}</p></details>
  <div class="idea-card-actions"><button class="quiet full" data-idea-preview="${esc(idea.id)}">Im Generator ansehen →</button><button class="primary full" data-idea-build="${esc(idea.id)}">Diese Idee bauen &amp; ZIP laden</button><button class="text-btn" data-idea-plan="${esc(idea.id)}">Ideen-Bauplan laden ↓</button></div></div></article>`).join('');
}
