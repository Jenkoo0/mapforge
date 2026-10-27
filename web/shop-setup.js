import {COSMETICS} from './cosmetics.js';
import {TYCOON_PRODUCTS,TYCOON_PASSES} from './tycoon.js';
export const SHOP_REFERENCES=[
 ['Developer Products','https://create.roblox.com/docs/production/monetization/developer-products'],
 ['MarketplaceService','https://create.roblox.com/docs/reference/engine/classes/MarketplaceService'],
 ['Regional pricing','https://create.roblox.com/docs/production/monetization/regional-pricing'],
 ['Quests','https://create.roblox.com/docs/production/game-design/introduction-to-quest-design']
];
export function shopPlan(c){return [...TYCOON_PRODUCTS.map(p=>({...p,type:'product'})),...TYCOON_PASSES.map(p=>({...p,type:'pass'}))].map(p=>({...p,id:c[p.field]||'',reset:/Cash/.test(p.name)||p.key==='TBundle'?'Cash wird beim Rebirth zurückgesetzt.':p.key==='TBoost15'?'Restzeit bleibt gespeichert.':'Bleibt beim Rebirth erhalten.'}));}
export function parseShopImport(text,c){
 if(typeof text!=='string'||text.length>20000)throw Error('Der ID-Block ist zu groß.');
 let data;try{data=JSON.parse(text);}catch{throw Error('Den vollständigen JSON-Block aus Studio einfügen.');}
 if(!data||data.app!=='MapForgeShop'||Object.keys(data).some(k=>!['app','universeId','products','passes'].includes(k)))throw Error('Kein gültiger MapForge-Shop-Block.');
 if(data.universeId!==undefined&&(!Number.isSafeInteger(data.universeId)||data.universeId<=0))throw Error('Ungültige Roblox-Spiel-ID. Zuerst veröffentlichen.');
 const next={...c},changes=[];
 for(const [section,definitions] of [['products',TYCOON_PRODUCTS],['passes',[...TYCOON_PASSES,...COSMETICS]]]){
  const group=data[section]??{};
  if(!group||typeof group!=='object'||Array.isArray(group))throw Error('Produkte und Pässe müssen JSON-Objekte sein.');
  for(const [key,value] of Object.entries(group)){
   const p=definitions.find(p=>p.key===key);
   if(!p)throw Error('Unbekannter Shop-Schlüssel: '+key);
   const id=String(value);
   if(!/^[1-9]\d{0,14}$/.test(id))throw Error('Ungültige ID für '+p.name+'.');
   if(next[p.field]!==id){changes.push({field:p.field,name:p.name,before:next[p.field]||'',after:id});next[p.field]=id;}
  }
  const ids=definitions.map(p=>next[p.field]).filter(Boolean);
  if(new Set(ids).size!==ids.length)throw Error('Doppelte IDs innerhalb von '+section+'. Jedes Angebot braucht eine eigene ID.');
 }
 if(!changes.length)throw Error('Keine neuen IDs gefunden. Bestehende Zuordnungen bleiben erhalten.');
 return {config:next,changes,universeId:data.universeId??null};
}
export function studioShopScanner(){
 const names=Object.fromEntries(TYCOON_PRODUCTS.map(p=>[p.name,p.key]));
 const luaNames=Object.entries(names).map(([name,key])=>`[${JSON.stringify(name)}]=${JSON.stringify(key)}`).join(',');
 return `-- MapForge: nur lesen. In der Studio-Befehlsleiste des richtigen veröffentlichten Spiels ausführen.\nassert(game:GetService("RunService"):IsStudio(),"Nur in Studio ausführen")\nassert(game.GameId>0,"Zuerst dieses Spiel auf Roblox veröffentlichen")\nlocal names={${luaNames}}\nlocal found,ambiguous={},{}\nlocal ok,message=pcall(function()\n local pages=game:GetService("MarketplaceService"):GetDeveloperProductsAsync()\n repeat\n  for _,info in ipairs(pages:GetCurrentPage()) do\n   local key=names[info.Name]\n   if key and type(info.ProductId)=="number" and info.ProductId>0 then\n    if found[key] then ambiguous[key]=true else found[key]=info.ProductId end\n   end\n  end\n  if pages.IsFinished then break end\n  pages:AdvanceToNextPageAsync()\n until false\nend)\nassert(ok,"Produktabruf fehlgeschlagen. Später erneut versuchen: "..tostring(message))\nfor key in pairs(ambiguous) do found[key]=nil warn("Doppelter Produktname; ID manuell zuordnen: "..key) end\nprint("MAPFORGE SHOP JSON (nur diese JSON-Zeile kopieren):")\nlocal payload={app="MapForgeShop",universeId=game.GameId}\nif next(found) then payload.products=found end\nprint(game:GetService("HttpService"):JSONEncode(payload))\n-- Pässe separat aus dem Creator Hub übernehmen. Dieses Skript verändert weder Spiel noch Guthaben.\n`;
}
export function shopGuide(c){
 return `# Robux-Shop einrichten\n\nMapForge bereitet neun Angebote mit festen Inhalten vor. Ohne eigene Produkt-IDs bleiben sie deaktiviert. Das Spiel ist komplett ohne Robux spielbar.\n\n1. Die frisch exportierte Map in Studio öffnen und im richtigen Spiel veröffentlichen. Vor einem Update eine Sicherung erstellen.\n2. Creator Hub → dein Spiel → Monetization → Developer Products. Gewünschte wiederholbare Produkte mit den Namen unten erstellen; einen eigenen Preis festlegen. Dauerhafte Angebote unter Passes anlegen und zum Verkauf freigeben. Auch wenige Angebote reichen.\n3. Shop-IDs-aus-Studio.lua öffnen, den Text in die Studio-Befehlsleiste des veröffentlichten Spiels einsetzen und ausführen. Es liest ausschließlich den Produktkatalog. Die ausgegebene JSON-Zeile in MapForge unter Monetarisierung einfügen, Unterschiede prüfen und übernehmen. Unbekannte/mehrdeutige Namen werden nicht erraten. Pässe manuell ergänzen.\n4. Robux-Shop und Speichern einschalten, Shop übernehmen. Neu exportieren → Studio öffnen → Publish As zum bestehenden Startplatz. Keine neuen IDs für bereits verkaufte Vorteile vergeben.\n5. Eigenes separates Testspiel: Produktzuordnung, Kaufabbruch, Belegwiederholung, Speicherfehler und Rejoin prüfen. Für abweichende regionale Preise den Dynamic Price Check im Creator Hub nutzen. Ein Code-Test bestätigt keinen echten Kauf.\n\n| Typ | Name bei Roblox | Skript-Schlüssel | ID | Inhalt und Reset |\n| --- | --- | --- | --- | --- |\n${shopPlan(c).map(p=>`| ${p.type==='pass'?'Pass (einmalig)':'Developer Product (wiederholbar)'} | ${p.name} | ${p.key} | ${p.id||'fehlt'} | ${p.detail} ${p.reset} |`).join('\n')}\n\nPreise werden im Client aus Roblox gelesen, maximal 120 Sekunden zwischengespeichert und nach Fehlern frühestens nach 15 Sekunden erneut abgefragt. Der Roblox-Kaufdialog bestätigt den endgültigen Preis. Developer-Product-Zuordnung wird serverseitig mit dem vollständigen Katalog dieses Spiels geprüft; bei Ausfällen bleiben neue Produktkäufe gesperrt. Bereits bezahlte Belege werden unabhängig davon weiter verarbeitet. Pass-IDs müssen zum eigenen Spiel gehören; der Scanner ordnet Pässe nicht automatisch zu. Keine automatischen Kaufdialoge, kein Zufallsgewinn und keine falschen Rabatte.\n\n## Referenzen (21.10.2026)\n${SHOP_REFERENCES.map(([name,url])=>`- ${name}: ${url}`).join('\n')}\nKonkrete Bonuswerte und Angebotsauswahl sind eigene Testannahmen; keine garantierten Einnahmen.\n`;
}
