import {UPGRADES,economySnapshot} from './tycoon.js';

// Starting hypotheses for playtests, not measured conversion thresholds.
export const OFFER_RULES = [
 {key:'AutoCollect',field:'autoCollectPassId',pass:true,name:'Auto-Collect',builds:5,seconds:180,collects:3,reason:'Nach mehreren manuellen Abholungen wird der Komfort verständlich.'},
 {key:'TBoost15',field:'tycoonBoostId',name:'15-Minuten-Boost',builds:8,seconds:240,collects:1,reason:'Erst bei laufender Produktion; während eines aktiven Boosts kein weiterer Hinweis.'},
 {key:'DoubleIncome',field:'doubleIncomePassId',pass:true,name:'Doppelte Produktion',builds:12,seconds:300,collects:1,reason:'Ein dauerhafter Ausbau für Spieler, die den Produktionskreislauf bereits kennen.'},
 {key:'VIP',field:'vipPassId',pass:true,name:'VIP',builds:18,seconds:360,collects:1,reason:'Titel, Akzente und +25 % Produktion für eine bereits aufgebaute Fabrik.'},
 {key:'TCashSmall',field:'cashSmallId',name:'25.000 Cash',builds:5,seconds:180,collects:1,cash:25000,reason:'Nur vorschlagen, wenn die Menge etwa 30 Sekunden bis 30 Minuten aktueller Produktion entspricht.'},
 {key:'TCashLarge',field:'cashLargeId',name:'1.000.000 Cash',builds:12,seconds:300,collects:1,cash:1000000,reason:'Der feste Betrag muss zur aktuellen Produktion passen und bleibt beim Rebirth nicht erhalten.'},
 {key:'TGems100',field:'gems100Id',name:'100 Kristalle',builds:5,seconds:180,collects:1,design:true,reason:'Erst nach Interesse an Designs. Aufträge und Meilensteine bleiben die kostenlose Alternative.'},
 {key:'TGems500',field:'gems500Id',name:'500 Kristalle',builds:12,seconds:300,collects:1,design:true,reason:'Gezielte Design-Wahl mit sichtbarem Preis; keine zufälligen Belohnungen.'},
 {key:'TBundle',field:'bundleId',name:'Cash + Kristalle',builds:12,seconds:300,collects:1,design:true,cash:250000,reason:'Nur bei Design-Interesse und passender Cash-Menge empfehlen; Inhalt bleibt fest.'}
];
export const PURCHASE_REFERENCES = [
 {title:'Roblox · Onboarding goals',url:'https://create.roblox.com/docs/production/game-design/onboarding',finding:'Spieler sollen Zweck und nächste Aktion sowie kurze und langfristige Ziele verstehen.',application:'Spielziel/Hilfe, drei wiederkehrende Aktionen und kostenloses Zwölf-Ausbau-Ziel.'},
 {title:'Roblox · Core loops',url:'https://create.roblox.com/docs/production/game-design/core-loops',finding:'Wiederholte Aktionen und Fortschritt bilden den Kern des Spiels.',application:'Produzieren → Tresor abholen → Ausbau kaufen wird im HUD und auf dem Start-Schild erklärt.'},
 {title:'Roblox · Contextual purchases',url:'https://create.roblox.com/docs/production/game-design/contextual-purchases',finding:'Roblox empfiehlt Angebote im passenden Spielkontext und warnt vor Unterbrechungen, bevor neue Spieler den Nutzen verstehen.',application:'Erst spielen, dann höchstens zwei schließbare Hinweise pro Sitzung. Der normale Shop bleibt direkt erreichbar.'},
 {title:'Roblox · Monetization foundations',url:'https://create.roblox.com/docs/production/game-design/monetization-foundations',finding:'Nützliche Extras und persönliche Gestaltung sind unterschiedliche Kaufanlässe. Klare Inhalte erleichtern die Entscheidung.',application:'Komfort, Produktion und Designs getrennt erklären. Preise direkt von Roblox; kostenlose Kristall-Ziele sichtbar halten.'},
 {title:'Roblox · Onboarding techniques',url:'https://create.roblox.com/docs/production/game-design/onboarding-techniques',finding:'Kurze, situationsbezogene Hilfen und sichtbares Feedback erleichtern den Einstieg. Testbeobachtungen helfen beim Timing.',application:'Gratis-Starter, erster Tresor-Ertrag und nächster Ausbau bekommen konkrete Ziele und einen sichtbaren Wegweiser.'},
 {title:'Roblox · Retention',url:'https://create.roblox.com/docs/production/analytics/retention',finding:'Ein verständlicher Kernablauf, technische Qualität und erreichbare Ziele sind Ansatzpunkte für bessere Bindung.',application:'Vier kostenlose Bau-Meilensteine und ein Labor für echte Spieltests. Rückkehrwunsch ist keine gemessene D1-Retention.'},
 {title:'Roblox · Funnel events',url:'https://create.roblox.com/docs/production/analytics/funnel-events',finding:'Funnel-Ereignisse messen tatsächliche Fortschrittsschritte auf veröffentlichten Servern. Übersprungene Schritte würden vorherige Schritte mitzählen.',application:'Optionaler Server-Funnel für neue Fabriken: Beitritt → Starter → erste Abholung → fünf Ausbauten. Keine Studio-Ereignisse.'},
 {title:'Roblox · Introduction to quest design',url:'https://create.roblox.com/docs/production/game-design/introduction-to-quest-design',finding:'Aufgaben verbinden ein verständliches Ziel mit Umfang und sichtbarer Belohnung. Kurze und längere Ziele erfüllen unterschiedliche Aufgaben im Spiel.',application:'Drei wählbare Aufträge ergänzen Bau-Meilensteine und Tagesaufträge. Ziele zählen erst ab Annahme und bleiben bei Pausen erhalten.'},
 {title:'Hamari et al. · Kaufmotive (2017)',url:'https://research.aalto.fi/en/publications/why-do-players-buy-in-game-content-an-empirical-study-on-concrete/',finding:'Eine Befragung mit 519 Personen untersuchte konkrete Kaufmotive. Komfort, soziale Aspekte und wahrgenommener Gegenwert waren mit Ausgaben verbunden.',application:'Als ergänzende Orientierung nutzen: keine Roblox-spezifische Kausalstudie und keine Prognose für dieses Spiel. Keine künstlichen Hindernisse daraus ableiten.'}
];
export function offerPlan(config,scenario={}){
 const count=Math.max(0,Math.min(UPGRADES.length,Math.floor(Number(scenario.builds)||0)));
 const seconds=Math.max(0,Number(scenario.seconds)||0),collects=Math.max(0,Number(scenario.collects)||0);
 const income=Math.max(0,Number.isFinite(scenario.income)?scenario.income:economySnapshot(count).income);
 return OFFER_RULES.map(rule=>{
  const reasons=[];
  if(config.mode!=='tycoon')reasons.push('Tycoon-Regel');
  if(count<rule.builds)reasons.push(`Ab ${rule.builds} Ausbauten`);
  if(seconds<Math.max(config.shopHintDelay||180,rule.seconds))reasons.push(`Ab ${Math.max(config.shopHintDelay||180,rule.seconds)} Sekunden Spielzeit`);
  if(collects<rule.collects)reasons.push(`${rule.collects} manuelle Abholung(en)`);
  if(rule.design&&!scenario.designInterest)reasons.push('Erst Designs ansehen');
  if(rule.key==='TBoost15'&&scenario.boost)reasons.push('Boost bereits aktiv');
  if(rule.pass&&scenario.flags?.[rule.key])reasons.push('Pass bereits vorhanden');
  if(count>=UPGRADES.length)reasons.push('Fabrik fertig: erst neues Ziel wählen');
  if(config.shopFocus==='designs'&&!rule.design)reasons.push('Nur Design-Hinweise gewählt');
  const cashSeconds=rule.cash&&income>0?rule.cash/income:null;
  if(rule.cash&&(!cashSeconds||cashSeconds<30||cashSeconds>1800))reasons.push('Cash-Menge passt nicht zur Produktionsrate');
  const contextReady=!reasons.length,configured=Boolean(config[rule.field]);
  if(!config.shop)reasons.push('Robux-Shop aus');
  if(!config.persistence)reasons.push('Speicher aus');
  if(config.shopHints===false)reasons.push('Angebotshinweise aus');
  if(!configured)reasons.push('Eigene Roblox-ID fehlt');
  return {...rule,cashSeconds,contextReady,configured,eligible:!reasons.length,reasons};
 });
}
const enums={blocker:['none','confusing','waiting','performance','bugs','goals','shop'],benefit:['none','looks','comfort','boost','unclear'],returnIntent:['yes','maybe','no']};
const bounded=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(v))?Number(v):a));
const clean=(v,n)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').slice(0,n);
export const projectScope=c=>JSON.stringify([c.mode,c.name,c.seed]);
export function normalizePlaytest(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 if(!Number.isFinite(Number(input.firstAction))||!Number.isFinite(Number(input.minutes)))return null;
 return {id:clean(input.id,80),scope:clean(input.scope,400),version:clean(input.version,24),revision:clean(input.revision,40),createdAt:clean(input.createdAt,40),firstAction:bounded(input.firstAction,0,3600),minutes:bounded(input.minutes,0,240),returnIntent:enums.returnIntent.includes(input.returnIntent)?input.returnIntent:'maybe',blocker:enums.blocker.includes(input.blocker)?input.blocker:'none',benefit:enums.benefit.includes(input.benefit)?input.benefit:'none',note:clean(input.note,500)};
}
export function restorePlaytests(value){return Array.isArray(value)?value.map(normalizePlaytest).filter(Boolean).slice(-200):[];}
const median=values=>{const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length?(a.length%2?a[m]:(a[m-1]+a[m])/2):null;};
export function summarizePlaytests(records=[]){
 const rows=restorePlaytests(records),n=rows.length,counts=Object.fromEntries(enums.blocker.map(k=>[k,rows.filter(r=>r.blocker===k).length]));
 const firstAction=median(rows.map(r=>r.firstAction)),minutes=median(rows.map(r=>r.minutes)),next=[];
 if(n<5)next.push('Erst mindestens fünf unabhängige Tests sammeln. Auch danach sind kleine Stichproben nur Hinweise.');
 if(!n)next.push('Mit frischem Profil fünf Minuten ohne Erklärung spielen lassen. Erste Aktion und Abbruchgrund beobachten.');
 if(counts.bugs||counts.performance)next.push('Zuerst Fehler und Leistung auf dem betroffenen Gerät prüfen; danach denselben Ablauf erneut testen.');
 if(counts.confusing||firstAction>60)next.push('Einstieg vereinfachen: Gratis-Starter und Tresor finden lassen. Eine Änderung testen und Zeit bis zur ersten Aktion vergleichen.');
 if(counts.waiting)next.push('Wartezeiten prüfen: frei erreichbare Ziele, Cash-Kosten und Sammelwege verbessern. Käufe sind kein Ersatz für einen guten Gratis-Ablauf.');
 if(counts.goals)next.push('Das nächste Ziel und die nächste kostenlose Belohnung sichtbarer machen.');
 if(counts.shop)next.push('Angebotshinweise ausschalten oder später zeigen und Nutzen/Preis verständlicher erklären.');
 if(n&&!next.length)next.push('Eine Variante mit genau einer Änderung testen. Tatsächliche Rückkehr und Käufe später im Creator Hub vergleichen.');
 const benefits=Object.fromEntries(enums.benefit.map(k=>[k,rows.filter(r=>r.benefit===k).length]));
 if(benefits.looks)next.push('Design-Interesse beobachten: Vorschau und erspielbare Freischaltung testen, bevor du Kristall-Angebote veränderst.');
 if(benefits.comfort)next.push('Bei Komfort-Interesse prüfen, ob Auto-Collect einen verständlichen Zusatznutzen hat. Kostenlose Sammelwege trotzdem angenehm halten.');
 return {n,firstAction,minutes,yes:rows.filter(r=>r.returnIntent==='yes').length,counts,benefits,next};
}
export function playtestMarkdown(records=[]){
 const rows=restorePlaytests(records),s=summarizePlaytests(rows);
 return `# Spieltest-Auswertung\n\n${s.n} manuell eingetragene Tests. Lokale Beobachtungen und Selbstauskunft, keine automatische Roblox-Telemetrie, Kaufconversion oder D1-Retention.\n\nMedian erste Aktion: ${s.firstAction??'offen'} Sekunden. Median Sitzung: ${s.minutes??'offen'} Minuten. Rückkehrwunsch Ja: ${s.yes}/${s.n}.\n\n## Nächste Experimente\n${s.next.map(t=>'- '+t).join('\n')}\n\n## Einträge\n${rows.map((r,i)=>`\n### Test ${i+1} · ${r.createdAt}\nVersion ${r.version} · Konfiguration ${r.revision}\nErste Aktion: ${r.firstAction}s · Sitzung: ${r.minutes}min · Rückkehrwunsch: ${r.returnIntent}\nHürde: ${r.blocker} · Gewünschtes Extra: ${r.benefit}\nBeobachtung: ${r.note||'Keine Notiz.'}\n`).join('')}\n`;
}
export function purchaseMarkdown(config){
 return `# Kaufanlässe und Spielqualität\n\nStand der Referenzprüfung: 20.10.2026. Regeln und Zeitwerte sind eigene Start-Hypothesen, keine nachgewiesenen Kaufquoten.\n\n## Konfiguration\nAngebotshinweise: ${config.shopHints?'an':'aus'}. Frühestens nach ${config.shopHintDelay}s; ${config.shopFocus==='designs'?'nur Design-Interesse':'passender Spielkontext'}. Maximal zwei Hinweise pro Sitzung, mindestens zehn Minuten Abstand. Keine automatisch geöffneten Kaufdialoge. Der vollständige Shop ist manuell erreichbar.\n\n## Regeln\n${OFFER_RULES.map(r=>`- ${r.name}: mindestens ${r.builds} Ausbauten, ${r.seconds}s und ${r.collects} manuelle Abholung(en). ${r.reason}`).join('\n')}\n\n## Freier Spielverlauf\nGratis-Starter → erster Tresor-Ertrag → nächster Ausbau. Vier einmalige Bau-Meilensteine bei 12/24/36/48 Ausbauten geben 10/15/20/25 Kristalle. Alle Designs sind erspielbar.\n\n## Referenzen\n${PURCHASE_REFERENCES.map(r=>`- [${r.title}](${r.url})\n  ${r.finding}\n  Umsetzung: ${r.application}`).join('\n')}\n\n## Auswertung\nOptionaler Onboarding-Funnel für neue Fabriken: Beitritt, Gratis-Starter, erste positive Abholung, fünf Ausbauten. Nur veröffentlichte Server; Creator-Hub-Daten separat prüfen. Lokale Spieltests sind kein Ersatz für echte Rückkehr- oder Umsatzdaten.\n`;
}
