// One catalogue for all generated games. IDs are supplied by the experience owner.
export const COSMETICS=Object.freeze([
 {id:'aurora',key:'CosmeticAurora',field:'auroraPassId',name:'Polarlicht-Spur',detail:'Mint und Rosé als weiche Figuren-Lichtspur.',colors:['#93eed4','#e3a7cd'],lifetime:.6},
 {id:'solar',key:'CosmeticSolar',field:'solarPassId',name:'Sonnenfunken-Spur',detail:'Gold und warmes Weiß als kurze Figuren-Lichtspur.',colors:['#ffd38c','#fff3db'],lifetime:.4},
 {id:'nebula',key:'CosmeticNebula',field:'nebulaPassId',name:'Nebelstrom-Spur',detail:'Violett und Eisblau als längere Figuren-Lichtspur.',colors:['#bbb4ff','#9dd8ff'],lifetime:.8}
].map(item=>Object.freeze({...item,colors:Object.freeze(item.colors)})));
export const COSMETIC_ID_FIELDS=Object.freeze(COSMETICS.map(item=>item.field));
export function cosmeticsLua(c,quote){return `{ Enabled=${c.cosmetics!==false}, Items={${COSMETICS.map(item=>`{Id=${quote(item.id)},Name=${quote(item.name)},PassId=${c[item.field]||0},ColorA=${quote(item.colors[0])},ColorB=${quote(item.colors[1])},Lifetime=${item.lifetime}}`).join(',')}} }`;}
export function cosmeticChecks(c,otherPasses=[]){
 const ids=[...otherPasses.map(p=>c[p.field]),...COSMETICS.map(p=>c[p.field])].filter(Boolean).map(id=>String(Number(id)));
 const configured=COSMETICS.filter(p=>c[p.field]);
 const duplicates=configured.filter(p=>ids.filter(id=>id===String(Number(c[p.field]))).length>1);
 return [{id:'cosmetics',status:c.cosmetics===false?'pass':duplicates.length?'error':!c.shop?'pass':configured.length?'manual':'warn',title:'Kosmetische Game Passes',detail:c.cosmetics===false?'Kosmetik-Menü ausgeschaltet.':duplicates.length?'Doppelte Pass-ID. Jeder kosmetische Stil und jeder bestehende Pass benötigt eine eigene Pass-ID.':!c.shop?'Kaufdialoge durch Shop aus gesperrt. Bereits besessene Stile können angelegt werden.':configured.length?`${configured.length} kosmetische IDs eingetragen. Zugehörigkeit zur Experience, Verkauf, Preis und Besitz in Roblox prüfen.`:'Drei Figuren-Lichtspuren vorbereitet; ohne eigene Game-Pass-IDs nicht kaufbar.'}];
}
export function cosmeticsSetupHtml(){return `<div class="eyebrow">KOSMETIK / ALLE SPIELMODI</div><h2>Ein Look, der dir gehört.</h2><p>Drei dauerhafte Figuren-Lichtspuren. Keine Vorteile bei Tempo, Sprungkraft, Produktion oder Rangliste. Die kostenlose Obby-Leuchtspur und erspielbare Fabrik-Skins bleiben erhalten.</p><label class="toggle-row"><span><strong>Kosmetik-Menü im Spiel anzeigen</strong><small>Kaufen benötigt zusätzlich Robux-Shop, Speichern und echte Pass-IDs.</small></span><input id="cosmeticsEnabled" type="checkbox" checked role="switch"></label><p id="cosmeticsSetupStatus" role="status" aria-live="polite"></p><div class="shop-grid">${COSMETICS.map(p=>`<article class="panel shop-card"><div class="shop-icon" style="background:linear-gradient(135deg,${p.colors.join(',')})">⌁</div><span class="tiny-label">EINMALIGER GAME PASS</span><h3>${p.name}</h3><p>${p.detail} Nur innerhalb dieser Experience.</p><label for="${p.field}">Game-Pass-ID</label><input id="${p.field}" inputmode="numeric" maxlength="15" placeholder="Noch nicht eingerichtet"><small>Eigenen Pass derselben Experience verwenden. Preis kommt im Spiel von Roblox.</small></article>`).join('')}</div><p class="micro">Das sind kosmetische Effekte für die Spielfigur, keine Roblox-Avatar-Kleidungsstücke. Kein Zufall, kein Abo. Zum Speichern unten „Shop übernehmen“ wählen. Neue Exporte enthalten das Menü automatisch; bestehende veröffentlichte Spiele werden dadurch nicht aktualisiert.</p>`;}
export function cosmeticsGuide(c={}){return `# Kosmetische Game Passes · alle MapForge-Spielmodi

Drei permanente Figuren-Lichtspuren: Polarlicht, Sonnenfunken und Nebelstrom. Jede ist ein eigener einmaliger Game Pass, kein wiederholbares Developer Product, Abo oder Zufallsartikel. Sie sind Ingame-Effekte dieser Experience, keine globalen Avatar-Kleidungsstücke. Es gibt keine Spielvorteile.

## Aktueller Stand
Kosmetik-Menü: ${c.cosmetics===false?'aus':'an'}. Robux-Shop: ${c.shop===false?'aus, Kaufdialoge gesperrt':'an'}. Speichern: ${c.persistence===false?'aus, Kaufdialoge gesperrt':'an'}. Eine eingetragene ID ist noch kein erfolgreicher Roblox-Test. Ohne passende ID bleibt der Kauf als „Nicht eingerichtet“ deaktiviert. Bestehende kostenlose Obby-Leuchtspur und zwölf erspielbare Tycoon-Skins bleiben erhalten. Game Passes und Ausrüstung überstehen Respawn und Rebirth; den Besitz bestätigt Roblox erneut beim Beitritt. Es wird nur der ausgewählte Stil im bestehenden Profil gespeichert, keine vom Client behauptete Besitzliste.

## Einrichten je Experience
1. Eine separate private Test-Experience verwenden. Änderungen an öffentlichen Spielen erst nach Tests und ausdrücklichem Veröffentlichungsauftrag vornehmen.
2. Creator Hub → Creations → das richtige Spiel → Monetization → Passes → Create pass. Namen und Beschreibung aus der Tabelle verwenden, dann unter Sales einen eigenen Preis festlegen und Verkauf aktivieren. Keine Produkt-ID und keine fremde Pass-ID einsetzen. Seit 30.05.2026 unterstützt Roblox keine spielübergreifenden Passverkäufe; jede Experience benötigt eigene passende Pässe.
3. Beim jeweiligen Pass „Copy Asset ID“ verwenden. Die ID in MapForge → Monetarisierung → Kosmetik eintragen. Robux-Shop und Speichern einschalten, „Shop übernehmen“, neu exportieren und im separaten Studio-Testplatz öffnen. Fehlende oder doppelte Pass-IDs bleiben gesperrt. Tycoon-VIP-/Produktzuordnungen unverändert lassen.
4. Im Spiel „Looks“ öffnen. Der Client lädt Verkauf und aktuellen individuellen Robux-Preis bei Roblox; der Roblox-Kaufdialog zeigt den endgültigen Preis. Es gibt keine eingebauten Fantasiepreise oder automatischen Kaufdialoge.
5. Nach dem Kauf erneut serverseitig UserOwnsGamePassAsync prüfen. Erst bestätigter Besitz erlaubt „Anlegen“. Ein Kauf-Finished-Signal allein schaltet nichts frei. Besitzprüfung fehlgeschlagen? „Besitz & Preise prüfen“ benutzen; kein erneuter Kauf als Lösung erzwingen.

| Stil | Pass-Schlüssel | MapForge-Feld | Eigene Pass-ID |
| --- | --- | --- | --- |
${COSMETICS.map(p=>`| ${p.name} | ${p.key} | ${p.field} | ${c[p.field]||'fehlt — nicht kaufbar'} |`).join('\n')}

IDs sind öffentliche Kennungen, keine Zugangsdaten. Die App verbindet sich nicht mit deinem Roblox-Konto und erstellt keine Pässe. Derselbe Creator allein beweist keine Experience-Zuordnung; diese im Creator Hub prüfen. Der bestehende Studio-Scanner liest nur Developer Products und ordnet diese Pass-IDs nicht automatisch zu.

## Laufzeit und Erhalt
Gemeinsame MapForgeCosmeticsServer-/Client-Skripte in Obby, Only Up, Tycoon und allen neu generierten Minispiel-Startern. Keine neue ProcessReceipt-Zuweisung: die vorhandenen wiederholbaren Käufe behalten ihren bisherigen Handler. Kosmetik prüft Passbesitz serverseitig, begrenzt Anfragen und legt nur bekannte Stil-IDs an. Wechsel wird über dieselbe atomare Profilspeicherung gesichert. Bei Speicherfehler bleibt die zuvor bestätigte Darstellung, bis der Speicherzustand geklärt ist. Der kostenlose Standard entfernt den bezahlten Effekt. Im Obby erscheint dann die bereits freigespielte Leuchtspur wieder.

Wenn der Robux-Shop ausgeschaltet wird, können bestätigte Besitzer ihre Stile weiter anlegen; neue Kaufdialoge sind gesperrt. Kosmetik-Menü aus blendet die Komponente ganz aus und erhält gespeicherte Auswahl und Roblox-Besitz. Nie einen bereits verkauften Pass einem anderen Vorteil zuordnen. Diese Erweiterung ändert keine veröffentlichten Spiele, keine vorhandenen Produkt-/Pass-IDs und keine bestehenden Roblox-Avatar-Outfits.

## Noch in Roblox prüfen
Zwei Clients: A kauft/legt an, B erhält nichts. Fremde/unbekannte Stil-ID und Besitzbehauptung ablehnen. Kauf abbrechen, off-sale, ungültige und doppelte ID, API-Fehler, Besitz nach Kauf und externem Erwerb prüfen. Stil anlegen/Standard wählen, Respawn, Wiederbeitritt und Rebirth. Preis kann regional/personalisiert sein; echten Client und Roblox-Dialog vergleichen. UI mit Touch und Controller sowie kurzem Querformat testen. Effekte von anderen Spielern sichtbar, keine Änderung an Movement, Produktion, Minispielzeiten oder Rangliste. Nach neuem Import müssen alte Coins, Workshop, Käufe, Skins und Receipts erhalten bleiben.

Ein Studio-Test bestätigt keinen echten Robux-Kauf. End-to-End-Kaufprüfung nur in der richtigen privaten Test-Experience mit eingerichteten echten Pässen und bewusstem Testkonto; dabei können echte Robux anfallen. Im Demo-Profil werden neue Kaufdialoge gesperrt. Diese Einrichtung wurde nicht automatisch veröffentlicht.

## Offizielle Quellen · geprüft 27.10.2026
- [Roblox Passes](https://create.roblox.com/docs/production/monetization/passes)
- [MarketplaceService](https://create.roblox.com/docs/reference/engine/classes/MarketplaceService)
`;}
