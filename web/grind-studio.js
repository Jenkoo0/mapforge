import {MINIGAMES,normalizeMinigame,GRIND_COSTS} from './minigames.js';

/** The studio describes configuration, never a made-up player account. */
export function mountGrindStudio(root,{getConfig,onChange,onCollection=()=>{},onCancelCollection=()=>{}}){
 root.classList.add('grind-studio');
 root.innerHTML=`<div class="grind-topline"><span class="grind-kicker">SPIELEN · SAMMELN · AUSBAUEN</span><span class="grind-plan-badge">Ausbauplan</span></div>
 <div class="grind-heading"><h3>Noch eine Runde.</h3><label class="grind-switch"><input type="checkbox" id="grindEnabled"><span>Werkstatt-Grind</span></label></div>
 <p class="grind-intro">Sammle im Hauptspiel und in kurzen Minispielen Werkstattmarken. Baue passende Attribute über fünf Level aus.</p>
 <div class="grind-minigames" role="group" aria-label="Minispiel für die Arena">${Object.entries(MINIGAMES).map(([key,game])=>`<button type="button" data-minigame="${key}" aria-pressed="false"><svg viewBox="0 0 96 72" aria-hidden="true" focusable="false">${game.svg}</svg><span><strong>${game.label}</strong><small>${game.tagline}</small></span><b>${game.skill}</b></button>`).join('')}</div>
 <p class="grind-game-description"></p><p class="grind-arena-hint"></p>
 <section class="grind-upgrade-plan" aria-label="Geplanter Ausbau"><div class="grind-plan-title"><h4>Deine Werkstatt wächst.</h4><span>Level 0 → 5</span></div><div class="grind-attributes"></div><ol class="grind-costs" aria-label="Markenkosten für jeden nächsten Level">${GRIND_COSTS.map((cost,index)=>`<li><span>Level ${index+1}</span><strong>${cost}</strong><small>Marken</small></li>`).join('')}</ol><p class="grind-plan-note">108 Marken bis Level 5 je Attribut. Das ist ein Ausbauplan, kein angezeigter Spielstand.</p></section>
 <div class="grind-reward"><strong>Erster gültiger Minispiel-Abschluss je Serverrunde</strong><span>5–7 Marken + 10 XP</span><small>5 Marken Grundprämie · +1 unter 45 s · +1 unter 30 s. Weitere Versuche zählen für deine Bestzeit. Upgrades ändern keine Minispielzeiten oder Sprungkraft.</small><small class="grind-main-reward"></small></div>
 <div class="grind-downloads"><button type="button" id="downloadMinigames">3 Minispiel-Maps laden ↓</button><button type="button" id="cancelMinigames" hidden>Abbrechen</button><p id="minigameCollectionStatus" role="status">Drei Starter mit kurzem Obby und eigener Minispielauswahl. Mit Konfiguration, KI-Übergabe und Cover.</p></div>`;
 const toggle=root.querySelector('#grindEnabled'),choices=[...root.querySelectorAll('[data-minigame]')];
 toggle.addEventListener('change',()=>onChange({grind:toggle.checked}));
 choices.forEach(button=>button.addEventListener('click',()=>{
  const config=getConfig();if(normalizeMinigame(config.minigame)!==button.dataset.minigame||config.events!=='rally')onChange({minigame:button.dataset.minigame,events:'rally'});
 }));
 root.querySelector('#downloadMinigames').addEventListener('click',()=>onCollection());
 root.querySelector('#cancelMinigames').addEventListener('click',onCancelCollection);
 function refresh(){
  const config=getConfig(),key=normalizeMinigame(config.minigame),game=MINIGAMES[key],tycoon=config.mode==='tycoon';
  toggle.checked=config.grind!==false;root.dataset.grindEnabled=String(toggle.checked);root.style.setProperty('--grind-accent',game.accent);
  root.querySelector('.grind-reward').hidden=!toggle.checked;
  choices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.minigame===key)));
  root.querySelector('.grind-game-description').textContent=game.description;
  root.querySelector('.grind-arena-hint').textContent=config.events==='rally'?`${game.label} ist für die separate Arena ausgewählt. ${tycoon?'Deine Fabrik':'Dein Parcours'} bleibt das Hauptspiel.`:'Die Arena ist momentan ausgeschaltet. Wähle ein Minispiel, um Events + Minispiel zu aktivieren.';
  root.querySelector('.grind-attributes').innerHTML=tycoon?'<div><span>01</span><strong>Maschinenkraft</strong><p>+4 % Produktion pro Level<br><b>Bis +20 %</b></p></div>':'<div><span>01</span><strong>Sammelgeschick</strong><p>+1 Münze pro Fund und Level<br><b>Bis +5 Münzen</b></p></div><div><span>02</span><strong>Zielfokus</strong><p>+5 Zielmünzen pro Level<br><b>Bis +25 Münzen</b></p></div>';
  root.querySelector('.grind-main-reward').textContent=toggle.checked?(tycoon?'Jede erstmals gebaute Maschine: +1 Marke und +2 XP. Nach Wiedergeburt keine erneute Bauprämie.':'Jeder reguläre Obby-Zielabschluss: +3 Marken und +6 XP. Marken und Ausbau bleiben nach Wiederbeitritt erhalten, wenn Speichern verfügbar ist.'):'Grind-Prämien sind ausgeschaltet. Minispiel-Bestzeiten kannst du weiterhin spielen.';
  root.querySelector('.grind-plan-note').textContent=toggle.checked?'108 Marken bis Level 5 je Attribut. Das ist ein Ausbauplan, kein angezeigter Spielstand.':'Grind ausgeschaltet: Der Ausbau wird nicht angewendet. Gespeicherte Level bleiben erhalten.';
 }
 refresh();return {refresh,setCollectionStatus:text=>{root.querySelector('#minigameCollectionStatus').textContent=text;},setCollectionBusy:busy=>{root.querySelector('#downloadMinigames').disabled=busy;root.querySelector('#cancelMinigames').hidden=!busy;}};
}
