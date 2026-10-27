// Editorial observations from official game descriptions; no claim of causal success.
export const IDEA_REFERENCES=[
 {id:'park',name:'Theme Park Tycoon 2',url:'https://www.roblox.com/games/69184822/Theme-Park-Tycoon-2',checkedAt:'2026-10-24',observation:'Eigene Grundstücke, frei gestaltete Fahrgeschäfte und Dekoration.',transfer:'Sichtbarer Ausbau und eigene Gestaltung',limit:'Achterbahnen und freies Bauen sind nicht enthalten.'},
 {id:'restaurant2',name:'Restaurant Tycoon 2',url:'https://www.roblox.com/games/3398014311/Restaurant-Tycoon-2',checkedAt:'2026-10-24',observation:'Restaurant aufbauen, kochen und Restaurants von Freunden besuchen.',transfer:'Verständliche Arbeitsschleife und sichtbarer Betrieb',limit:'Kochsystem, Kunden und Bedienpersonal sind nicht enthalten.'},
 {id:'restaurant3',name:'Restaurant Tycoon 3',url:'https://www.roblox.com/games/119048529960596/Restaurant-Tycoon-3',checkedAt:'2026-10-24',observation:'Kunden bedienen, Gerichte kochen, Restaurant ausbauen und Offline-Einnahmen.',transfer:'Aktive Aufgaben neben wachsender Produktion',limit:'Bedienung, Küche und Kunden-KI sind noch Erweiterungsideen.'},
 {id:'retail',name:'Retail Tycoon 2',url:'https://www.roblox.com/games/5865858426/Retail-Tycoon-2',checkedAt:'2026-10-24',observation:'Die offizielle Beschreibung nennt Dekoration, neue Waren und steuerbare Kundenwege.',transfer:'Lesbare Werkbereiche und gestaltete Wege',limit:'Warenlager, Fahrzeuge und Kundenwege-KI sind nicht enthalten.'},
 {id:'lumber',name:'Lumber Tycoon 2',url:'https://www.roblox.com/games/13822889/Lumber-Tycoon-2',checkedAt:'2026-10-24',observation:'Rohstoffe gewinnen und den eigenen Betrieb bauen.',transfer:'Natur-Thema und selbst aufgebauter Betrieb',limit:'Fällbare Bäume und Holztransport sind nicht enthalten.'}
];
export const IDEA_PATTERNS={
 growth:{name:'Sichtbares Wachstum',implementation:'48 kaufbare Ausbauten und drei Gebäudeanordnungen'},
 identity:{name:'Eigener Stil',implementation:'12 erspielbare Skins und vier Designwelten'},
 activity:{name:'Aktive Zwischenziele',implementation:'Drei Kalibrierungsstationen und wählbare Aufträge'},
 permanence:{name:'Langfristige Entwicklung',implementation:'Forschung, Rebirth und begrenzte Offline-Produktion'}
};
const text=(v,n)=>String(v||'').replace(/[\x00-\x1f]/g,' ').slice(0,n);
export function cleanConcept(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==1)return null;
 const refs=Array.isArray(raw.references)?raw.references.slice(0,6).filter(r=>r&&/^https:\/\/www\.roblox\.com\/games\/\d+(?:\/[A-Za-z0-9-]+)?$/.test(r.url||'')).map(r=>({name:text(r.name,160),url:r.url,kind:r.kind==='live'?'live':'editorial',observedAt:text(r.observedAt,40),playing:r.kind==='live'&&Number.isSafeInteger(r.playing)&&r.playing>=0?r.playing:null})):[];
 return {schema:1,title:text(raw.title,70),hook:text(raw.hook,500),twist:text(raw.twist,500),patterns:Array.isArray(raw.patterns)?[...new Set(raw.patterns.filter(p=>Object.hasOwn(IDEA_PATTERNS,p)))].slice(0,4):[],references:refs,roadmap:Array.isArray(raw.roadmap)?raw.roadmap.slice(0,5).map(s=>text(s,300)):[]};
}
export function conceptMarkdown(config){
 const c=cleanConcept(config.concept);if(!c)return '# Map-Idee\n\nDiese Map wurde ohne gespeicherten Ideenmix gebaut.\n';
 return `# Eigener Ideenmix — ${c.title}\n\n${c.hook}\n\nEigene Kombination: ${c.twist}\n\n## Tatsächlich enthaltene Systeme\n${c.patterns.map(p=>'- '+IDEA_PATTERNS[p].name+': '+IDEA_PATTERNS[p].implementation).join('\n')}\n\nBaukonfiguration beim Export: ${config.theme}, ${config.layout}, Tempo ${config.pacing}, Seed ${config.seed}. Es ist eine Produktions-Tycoon-Adaption. Referenznamen bezeichnen keine kopierten Spiele.\n\n## Referenzen\n${c.references.map(r=>`- ${r.name}: ${r.url} · ${r.kind==='live'?`Live-Beobachtung ${r.observedAt}, ${r.playing} Spieler im Abruf`:`Redaktionell geprüfte Spielbeschreibung ${r.observedAt}; kein aktueller Chartplatz`}`).join('\n')}\n\n## Noch nicht implementierte Ausbauideen\n${c.roadmap.map(r=>'- '+r).join('\n')}\n\n## Grenzen\nLokale Kombination von Vorlagen und Designmustern, ohne Sprachmodell. Spielerzahlen zeigen eine Momentaufnahme; sie belegen weder Einnahmen noch die Ursache des Erfolgs. Die Übertragung der Muster ist eine eigene Design-Hypothese. Keine fremden Skripte, Karten oder Assets übernommen. Studio und echte Spieler müssen das Ergebnis prüfen.\n`;
}
