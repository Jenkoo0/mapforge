# Kosmetische Game Passes · alle MapForge-Spielmodi

Drei permanente Figuren-Lichtspuren: Polarlicht, Sonnenfunken und Nebelstrom. Jede ist ein eigener einmaliger Game Pass, kein wiederholbares Developer Product, Abo oder Zufallsartikel. Sie sind Ingame-Effekte dieser Experience, keine globalen Avatar-Kleidungsstücke. Es gibt keine Spielvorteile.

## Aktueller Stand
Kosmetik-Menü: an. Robux-Shop: an. Speichern: an. Eine eingetragene ID ist noch kein erfolgreicher Roblox-Test. Ohne passende ID bleibt der Kauf als „Nicht eingerichtet“ deaktiviert. Bestehende kostenlose Obby-Leuchtspur und zwölf erspielbare Tycoon-Skins bleiben erhalten. Game Passes und Ausrüstung überstehen Respawn und Rebirth; den Besitz bestätigt Roblox erneut beim Beitritt. Es wird nur der ausgewählte Stil im bestehenden Profil gespeichert, keine vom Client behauptete Besitzliste.

## Einrichten je Experience
1. Eine separate private Test-Experience verwenden. Änderungen an öffentlichen Spielen erst nach Tests und ausdrücklichem Veröffentlichungsauftrag vornehmen.
2. Creator Hub → Creations → das richtige Spiel → Monetization → Passes → Create pass. Namen und Beschreibung aus der Tabelle verwenden, dann unter Sales einen eigenen Preis festlegen und Verkauf aktivieren. Keine Produkt-ID und keine fremde Pass-ID einsetzen. Seit 30.05.2026 unterstützt Roblox keine spielübergreifenden Passverkäufe; jede Experience benötigt eigene passende Pässe.
3. Beim jeweiligen Pass „Copy Asset ID“ verwenden. Die ID in MapForge → Monetarisierung → Kosmetik eintragen. Robux-Shop und Speichern einschalten, „Shop übernehmen“, neu exportieren und im separaten Studio-Testplatz öffnen. Fehlende oder doppelte Pass-IDs bleiben gesperrt. Tycoon-VIP-/Produktzuordnungen unverändert lassen.
4. Im Spiel „Looks“ öffnen. Der Client lädt Verkauf und aktuellen individuellen Robux-Preis bei Roblox; der Roblox-Kaufdialog zeigt den endgültigen Preis. Es gibt keine eingebauten Fantasiepreise oder automatischen Kaufdialoge.
5. Nach dem Kauf erneut serverseitig UserOwnsGamePassAsync prüfen. Erst bestätigter Besitz erlaubt „Anlegen“. Ein Kauf-Finished-Signal allein schaltet nichts frei. Besitzprüfung fehlgeschlagen? „Besitz & Preise prüfen“ benutzen; kein erneuter Kauf als Lösung erzwingen.

| Stil | Pass-Schlüssel | MapForge-Feld | Eigene Pass-ID |
| --- | --- | --- | --- |
| Polarlicht-Spur | CosmeticAurora | auroraPassId | fehlt — nicht kaufbar |
| Sonnenfunken-Spur | CosmeticSolar | solarPassId | fehlt — nicht kaufbar |
| Nebelstrom-Spur | CosmeticNebula | nebulaPassId | fehlt — nicht kaufbar |

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
