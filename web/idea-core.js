import {normalize,hash} from './engine.js';
import {IDEA_REFERENCES,cleanConcept} from './idea-data.js';
const settings=[
 {theme:'jungle',layout:'campus',pacing:'brisk',name:['Mooslicht','Blütenhafen','Wurzelwerk'],hook:'Baue einen leuchtenden Naturbetrieb von der ersten Maschine bis zum belebten Fabrik-Campus.',twist:'Naturgestaltung trifft aktive Kalibrierungsrunden und frei wählbare Aufträge.',refs:['lumber','park','restaurant3'],patterns:['growth','activity','identity'],roadmap:['Eigene erntbare Pflanzen als zusätzliche Mechanik entwickeln.']},
 {theme:'neon',layout:'skyline',pacing:'balanced',name:['Photonenwerft','Nachtschimmer','Lichtbogen'],hook:'Verwandle eine kleine Werkstatt in eine gestaffelte Produktions-Skyline.',twist:'Markante Hochbauten, dauerhaftes Forschen und individuelle Designs verbinden Aufbau und Selbstausdruck.',refs:['retail','park','restaurant2'],patterns:['growth','identity','permanence'],roadmap:['Besucher und eine eigene Warenkette als neue Systeme entwickeln.']},
 {theme:'lava',layout:'flow',pacing:'brisk',name:['Glutgarten','Funkenhafen','Kupferkrone'],hook:'Starte eine industrielle Produktionsstraße und verbessere deinen Betrieb in kurzen aktiven Etappen.',twist:'Gut lesbare Produktionswege werden mit kostenlosen Aufgaben und langfristiger Forschung kombiniert.',refs:['restaurant3','retail','lumber'],patterns:['growth','activity','permanence'],roadmap:['Eigene Lieferaufträge mit Transport erst separat implementieren.']}
];
export function freshIdeaData(data,now=Date.now()){
 if(!data||!Array.isArray(data.games)||!Number.isFinite(Date.parse(data.fetchedAt))||now-Date.parse(data.fetchedAt)>900000||Date.parse(data.fetchedAt)>now+60000)throw Error('Keine frischen Referenzdaten. Erneut abrufen oder die Live-Option ausschalten.');
 return data;
}
export function proposeConcepts(config,{seed='1',trends=null,now=Date.now()}={}){
 const c=normalize(config),entropy=hash(c.seed+'|'+seed),live=trends?freshIdeaData(trends,now).games.filter(g=>g&&g.idea?.fit>=70&&Number.isSafeInteger(g.playing)&&g.playing>=0&&/^https:\/\/www\.roblox\.com\/games\/\d+(?:\/[A-Za-z0-9-]+)?$/.test(g.url||'')).sort((a,b)=>b.playing-a.playing).slice(0,3):[];
 if(trends&&!live.length)throw Error('Keine passenden Tycoon-Referenzen im aktuellen Abruf. Ohne Live-Daten kannst du redaktionelle Ideen entwickeln.');
 const preferred=live[0]?.idea?.theme;
 const plans=[...settings].sort((a,b)=>Number(b.theme===preferred)-Number(a.theme===preferred));
 return plans.map((s,i)=>{
  const sources=s.refs.map(id=>IDEA_REFERENCES.find(r=>r.id===id));
  const references=sources.map(r=>({name:r.name,url:r.url,kind:'editorial',observedAt:r.checkedAt}));
  const observed=live[i%Math.max(1,live.length)];
  if(observed){const ref={name:observed.name,url:observed.url,kind:'live',observedAt:trends.fetchedAt,playing:observed.playing};const index=references.findIndex(r=>r.url.split('/')[4]===observed.url.split('/')[4]);if(index>=0)references[index]=ref;else references.unshift(ref);}
  const concept=cleanConcept({schema:1,title:s.name[(entropy+i)%s.name.length]+' '+['Manufaktur','Werke','Imperium'][Math.floor(entropy/3+i)%3],hook:s.hook,twist:s.twist+(observed?' Aktuelle Referenz: '+String(observed.name).slice(0,160)+'; die Genre-/Design-Passung wird aus den abgerufenen Metadaten abgeleitet.':''),patterns:s.patterns,references,roadmap:s.roadmap});
  return {id:'idea-'+hash(seed+'|'+i).toString(36),...concept,build:{mode:'tycoon',theme:s.theme,layout:s.layout,pacing:s.pacing,polish:2,detail:3,seed:(c.seed.slice(0,48)+'-I'+hash(seed+'|'+i).toString(36))},createdAt:new Date(now).toISOString()};
 });
}
export function applyConcept(config,idea,now=Date.now()){
 if(!idea||!settings.some(s=>s.theme===idea.build?.theme&&s.layout===idea.build?.layout&&s.pacing===idea.build?.pacing))throw Error('Ungültiger Ideen-Bauplan. Bitte neue Ideen entwickeln.');
 const concept=cleanConcept(idea);if(!concept?.title||!concept.references.length)throw Error('Die Map-Idee ist unvollständig.');
 if(concept.references.some(r=>r.kind==='live'&&(!Number.isFinite(Date.parse(r.observedAt))||now-Date.parse(r.observedAt)>900000||Date.parse(r.observedAt)>now+60000)))throw Error('Die Live-Referenzen dieser Idee sind inzwischen veraltet. Bitte neue Ideen entwickeln.');
 const c=normalize(config);
 return normalize({...c,mode:'tycoon',theme:idea.build.theme,layout:idea.build.layout,pacing:idea.build.pacing,detail:3,polish:2,seed:idea.build.seed,name:c.autoName?concept.title:c.name,concept});
}
