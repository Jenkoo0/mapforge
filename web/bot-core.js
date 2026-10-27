import {proposeConcepts,applyConcept} from './idea-core.js';
import {fromBrief,normalize,generate,validate} from './engine.js';
import {localReview,reviewRevision} from './improve.js';
import {recommendTrend} from './trend-core.js';
import {playerPlan} from './player-plan.js';
import {nameForGeneration} from './map-names.js';
export async function buildBotRun({config,brief='',useTrends=false,useIdeas=false,idea=null,fetchTrends,progress=()=>{},now=Date.now}){
 const events=[];const log=(step,detail)=>{const entry={step,detail};events.push(entry);progress(entry);};
 let candidate=normalize(config),reference=null,trendData=null;
 const baseRevision=reviewRevision(candidate);
 log('Auftrag','Vorhandene Shop-IDs und Projektkonfiguration werden beibehalten.');
 if(useTrends&&!idea){
  log('Trends','Roblox-Abruf gestartet.');
  const data=await fetchTrends();trendData=data;
  if(!data||!Array.isArray(data.games)||!Number.isFinite(Date.parse(data.fetchedAt))||now()-Date.parse(data.fetchedAt)>900000||Date.parse(data.fetchedAt)>now()+60000)throw Error('Keine frischen Trenddaten. Erneut versuchen oder „Aktuelle Roblox-Trends“ ausschalten. Deine Map wurde nicht verändert.');
  const best=recommendTrend(data.games);if(!best)throw Error('Keine passende Tycoon-Referenz im Abruf. Mit eigenem Auftrag ohne Trends fortfahren.');
  reference={name:best.name,url:best.url,fetchedAt:data.fetchedAt,scope:best.idea.scope};
  candidate=normalize({...candidate,mode:best.idea.mode,theme:best.idea.theme});
  log('Referenz',best.name+' · '+data.fetchedAt+' · eigene Produktions-Tycoon-Adaption.');
 }
 if(useIdeas||idea){
  const choices=idea?null:proposeConcepts(candidate,{seed:String(now()),trends:trendData,now:now()});
  const selected=idea||choices.find(i=>i.build.theme===themeChoice(brief))||choices[0];
  candidate=applyConcept(candidate,selected,now());
  log('Ideenmix',selected.title+' · '+selected.references.length+' Referenzen · eigene Produktions-Tycoon-Adaption.');
 }
 const briefResult=fromBrief(String(brief).slice(0,2000),candidate);candidate=briefResult.config;
 log('Bauplan',briefResult.notes.join(' · ')||'Aktuelle Vorlage verwenden.');
 const review=localReview(candidate,brief);candidate=review.after;
 log('Überarbeitung',review.changes.length+' sichere Einstellungen angepasst. '+review.notes.join(' '));
 if(!useIdeas&&!idea)candidate=nameForGeneration(candidate,String(now()));log('Map-Name',candidate.name+(candidate.autoName?' · passend zum Design erstellt.':' · dein eigener Name bleibt erhalten.'));
 const map=generate(candidate),checks=validate(map),errors=checks.filter(c=>c.status==='error');
 if(errors.length)throw Error('Bauplan enthält Layoutfehler: '+errors.map(c=>c.title).join(', ')+'. Vorhandene Map bleibt erhalten.');
 log('Prüfung',map.parts.length+' Bauteile · '+checks.filter(c=>c.status==='pass').length+' Datenprüfungen bestanden. Studio-Test offen.');
 const plan=playerPlan(map.config);log('Spielziel',plan.goal+' '+plan.loop);
 return {baseRevision,config:map.config,reference,events,plan,createdAt:new Date(now()).toISOString()};
}

function themeChoice(brief){const s=String(brief).toLowerCase();return /neon|stadt|cyber/.test(s)?'neon':/lava|vulkan|feuer/.test(s)?'lava':/natur|blumen|wald|dschungel|bloom/.test(s)?'jungle':null;}
