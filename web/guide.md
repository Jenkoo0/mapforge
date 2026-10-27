# MapForge 3.22.0 — Trend View & Tycoon Studio

## Neu in 3.21: Bewegung passend zur Map

Unter **Spielablauf → Spielerbewegung** das Profil für diese Map wählen:

| Profil | Gehen | Sprungkraft | Sprint | Geeignet für |
| --- | --- | --- | --- | --- |
| Klassisch | 16 | 50 | aus | Bestehende Maps, normale Obbys |
| Präzise | 14 | 50 | aus | Schmale Plattformen, gezielte Sprünge |
| Erkunden | 16 | 50 | 24 | Tycoons und längere Laufwege |
| Parkour | 18 | 55 | 26 | Größere, zügige Parcours |

Tempo in Studs pro Sekunde; Sprungkraft ist keine Sprunghöhe. Die normale Roblox-Kamera, der Thumbstick und das Springen bleiben erhalten. In den Sprintprofilen am PC **linke Umschalttaste halten**; auf Controller **L3** und auf Touch **Sprint** zum Umschalten antippen. Der Touchbutton zeigt bei laufendem Sprint **Gehen**. Umschalt ist dort für Sprint reserviert, Shift-Lock ist deaktiviert.

Die Map-Datei erneut exportieren und in Studio öffnen, damit das Profil im Spiel ankommt. Das Startpaket enthält **Spielerbewegung.md** mit den tatsächlichen Werten und Kontrollen. Eine vorhandene, bereits auf Roblox veröffentlichte Experience wird durch die Auswahl in MapForge nicht automatisch aktualisiert. Bestehende Konfigurationen starten als Klassisch.

Nach Tod, Respawn, Sitzen, Schwimmen, Klettern, Chat, Menü oder Fensterwechsel Sprint erneut starten. Schwerkraft, Speicherstände und Kaufbelohnungen bleiben unabhängig vom Profil. Keine Dash-, Slide-, Wandlauf- oder Doppelsprungmechanik eingebaut. Obby-Sprünge immer ohne Sprint, mit Touch und nach Respawn tatsächlich testen; das Präzisionsprofil kann engere Abstände erfordern.

## Neu in 3.20: Geschichten mitnehmen und Cover verfeinern

Unter **Deine Welt → Weltgeschichte** eine der sechs passenden Geschichten auswählen oder bewusst ausschalten. Neue Seeds, Layouts und Detailgrade behalten die Auswahl. Ein Wechsel zwischen Tycoon und Obby entfernt eine inkompatible Geschichte. Bei Obbys folgen die drei Kapitel der aktuellen Streckenlänge, den Checkpoints und dem Ziel.

Im exportierten Spiel öffnet **Geschichte** das Kapiteljournal. Im Tycoon stehen drei Kapitel passend zur Zahl gekaufter Ausbauten bereit; im Obby zählt der erreichte Abschnitt. Verborgene Kapitel zeigen nur den benötigten Fortschritt. Rebirth beziehungsweise Neustart setzt die Freigabe entsprechend zurück. Die vorhandenen Spielziele und Belohnungen bleiben maßgeblich.

Im **Cover-Studio** zwischen **Titel links**, **Großes Motiv** und **Nur die Welt** wählen. **Motivgröße** verändert den Zoom; Vorschau und Vollauflösung verwenden denselben relativen Ausschnitt. Text, Format und Ausschnitt bleiben für bis zu acht Maps während dieser Sitzung erhalten. Schließen verwirft die Auslieferung eines noch laufenden Exports; ein Timeout zeigt einen erneuten Versuch an. Coverentwürfe werden nicht über einen Browserneustart gespeichert.

**Details ausblenden** reduziert Ergebnis & Downloads auf den Mapnamen, Status, Dateianzahl, neuesten Download und eine gegebenenfalls verfügbare Rücknahme. Neue Bau-/Exportvorgänge und Fehler zeigen die Details wieder.

## Neu in 3.19: zwölf Welten und eigene Cover

Die Ideenwerkstatt enthält zwölf unterschiedliche Richtungen: sechs Tycoons und sechs Obbys, jeweils mit drei Formvarianten. Suche nach Name, Stimmung oder Form; jede Seite zeigt sechs echte Geometrie-Cover. Die gewählte Welt bleibt beim Suchen und Blättern erhalten. **Die drei Kapitel lesen** öffnet die Weltgeschichte mit deiner Rolle, dem Spielziel und drei Etappen. Drei Tafeln erzählen die Kapitel auch in der Map. Tycoon-Tafeln erscheinen mit dem zugehörigen Ausbau, Obby-Tafeln stehen seitlich an den Etappen. Es sind keine neuen NPC-, Transport- oder Belohnungsquests eingebaut.

**Cover gestalten** öffnet das Cover-Studio für genau den sichtbaren Entwurf. Im Generator gibt es denselben Button für die aktuelle Map. Passe Titel, Untertitel, Blickwinkel und beim Tycoon den Bildausschnitt an. Thumbnail: 1920×1080 Pixel, Spiel-Icon: eigener quadratischer Bildausschnitt in 512×512 Pixeln. PNG-Dateien werden unter 3 MB erstellt; eine misslungene Vorschau oder Dateierstellung wird angezeigt. Die Bilder zeigen tatsächliche Geometrie. Prüfe Beleuchtung, Lesbarkeit und Spielansicht in Roblox Studio vor dem Upload.

**12 Starter-Maps laden** baut die gesamte Sammlung ohne Änderung deiner aktuellen Map. Jeder Ordner enthält eine eigene .rbxlx, Projektkonfiguration, Weltgeschichte, vollständige Anleitung und Geometrie-Cover/Icon. Die Tycoons verwenden zwei Grundstücke. Shops und Analytics sind aus; alle Produkt- und Pass-IDs leer. Richte jedes veröffentlichte Spiel getrennt ein und teste es in Studio. Der Fortschritt zeigt die tatsächlich vorbereiteten Maps; **Sammlung abbrechen** stoppt vor dem Download.

## Neu in 3.18: Varianten vergleichen

Im Design-Labor hat jede der sechs Richtungen drei Formstudien. Mit den Pfeilen blätterst du reproduzierbar vor und zurück; der Seed steht unter der Vorschau. Varianten verändern Gebäudeformen, Landschaft oder Hindernisse innerhalb derselben Richtung. Beim Tycoon bleiben Kaufplätze und Hauptwege erhalten.

**Zum Vergleich merken** setzt einen einzigen Merkpunkt für diese Sitzung. Wähle danach eine andere Variante oder Richtung. **Aktueller Entwurf** und **Merkpunkt ansehen** wechseln die sichtbare Map bei gemeinsamer Kamera, Ausbaustufe und gemeinsamem Bildausschnitt. **Im Generator ausprobieren** übernimmt genau den sichtbaren Entwurf. **×** entfernt den Merkpunkt. Änderst du Map-Einstellungen, wird der Vergleich zurückgesetzt, damit alte Produkt-IDs und Einstellungen nicht übernommen werden.

**Vorherige Map wiederherstellen** stellt auch die vorherige Kamera, Draufsicht, Wege, Grundstücksansicht und Ausbaustufe wieder her. Die Variantenwahl und der Merkpunkt sind Sitzungszustand; gespeicherte Maps bleiben bis zum ausdrücklichen Öffnen erhalten.

## Neu in 3.17: Entwürfe wirklich untersuchen

Im **Design-Labor** die Richtungen nach **Alle**, **Tycoon** oder **Obby** filtern. Das Bild lässt sich durch Ziehen und die Pfeiltasten drehen. Plus/Minus zoomt, Pos1 setzt die Kamera zurück. Alternativ die Schaltflächen unter dem Bild nutzen. **Draufsicht**, **Wege** und bei Tycoons **Alle Grundstücke** helfen beim Prüfen des Layouts.

Bei Tycoons zwischen **Spielstart**, **6 Ausbauten** und **Vollausbau** wechseln. **Im Generator ausprobieren** übernimmt auch diese Ausbaustufe; **Vorherige Map wiederherstellen** macht die Auswahl rückgängig. Kamera, Filter und Vergleich speichern oder exportieren keine Map. Die Bauteilzahl zählt weiterhin die ganze exportierte Map. Eine Auswahl mit ungültigen Einstellungen zeigt eine Fehlermeldung statt des vorherigen Bilds. Ist nur die Bilddarstellung ausgefallen, bleibt der gültige Bauplan erreichbar.

## Neu in 3.16: Deine Werkstatt

Unter **Ideenwerkstatt → Design-Labor** kannst du sechs kreative Richtungen ohne Trendabruf ansehen. Die drei Tycoons unterscheiden sich in Maschinenanordnung und Atmosphäre; die drei Obbys in Verlauf, Länge, Höhe und Schwierigkeit. Das Bild zeigt jeweils die tatsächliche Geometrie. Bei Tycoons zeigt es ein Grundstück im Vollausbau, die Bauteilzahl zählt alle Grundstücke. **Im Generator ausprobieren** öffnet deinen Entwurf; **Vorherige Map wiederherstellen** bringt die frühere Map zurück. Das bloße Vergleichen startet keinen Download. Es handelt sich um vorhandene Spielsysteme mit unterschiedlichen Bauplänen.

Die große Vorschau steht vor dem Inspector. Öffne **Deine Welt**, **Spielablauf** oder **Variation**, um gezielt Einstellungen zu bearbeiten. Die Bau- und Downloadaktionen bleiben unter diesen Gruppen erreichbar. **Fokus** gibt der Map mehr Platz; über **Fokus verlassen** oder Escape kehrst du zurück. In Eingabefeldern und Dialogen bleibt Escape für deren Bedienung reserviert.

Oben schaltest du zwischen **Hell** und **Dunkel** um. Die Darstellung wird unabhängig von deinen Maps gespeichert. Kurze Animationen begleiten Auswahl und Seitenwechsel. Bei reduzierter Bewegung entfallen sie; Status und Bedienung bleiben erhalten. Die Anzeige über der Vorschau meldet tatsächliche Bau- und Exportaktionen. Designreferenzen: [Recherche zur Werkstatt](studio-research.md).

## Neu in 3.15: Drei Maps zuerst ansehen und vergleichen

In **Ideenwerkstatt** über **Erst 3 Ideen mit Vorschau vergleichen** oder **3 Map-Ideen entwickeln** drei eigene Konzepte erzeugen. Die Live-Option entscheidet wie bisher zwischen aktuellen Roblox-Beobachtungen und redaktionellen Referenzen. Jede Karte zeigt echte Generator-Geometrie eines Grundstücks, die tatsächliche Bauteilzahl aller Grundstücke, das verbleibende Budget und die Datenprüfungen. **Spielstart**, **Erste Ausbauten** und **Vollausbau** ändern die drei Ansichten gemeinsam. Die Modellzeit zählt reine Produktion; sie ist keine gemessene Sitzungslänge.

**Im Generator ansehen** übernimmt genau den geprüften Bauplan und die gewählte Ausbaustufe. Eigene Namen und Shop-IDs bleiben erhalten. Die vorherige Map wird gesichert; **Vorherige Map wiederherstellen** macht die Auswahl rückgängig. Das Ansehen startet keinen Download. **Diese Idee bauen & ZIP laden** verwendet denselben Bauablauf und erzeugt das vollständige Startpaket. Nach eigenen Einstellungsänderungen neue Ideen entwickeln, damit keine alte Karte unbemerkt den neuen Stand überschreibt.

Der Vergleich speichert und exportiert keine ungefragten Map-Varianten. Ausgewählte Vorschauen werden als gesicherte Vorschau bezeichnet; echte Generierung und Studio-Test bleiben getrennt. Bilder simulieren weder Roblox-Beleuchtung noch Physik. Alle Spieltest-Häkchen bleiben manuell.

## Orientierung und Map-Qualität

Die Navigation führt durch **Entdecken → Bauen → Prüfen & veröffentlichen**. Mit **Strg/⌘+K** eine Ansicht suchen; am Handy das Menü oben öffnen. Im Generator führen die drei Schritte von der Konfiguration über den Qualitätscheck zum Studio-Test. Die vier Designkarten zeigen Geometriebeispiele, die große Vorschau deinen aktuellen Bauplan. Pfeiltasten drehen bzw. zoomen, Plus/Minus zoomen, Pos1 setzt die Kamera zurück.

Unter **Qualitätscheck** das **Map-Dossier** und **Studio-Prüfskript** laden. Beides sowie die JSON-Messwerte stehen auch im Startpaket. Das Skript liest den tatsächlich geladenen Platz und verändert keine Objekte oder Spielstände. In einem separaten Studio-Testspiel Play starten, auf Server wechseln und den Lua-Text über die Command Bar ausführen. Zuerst den Spielstart prüfen, dann über die Studio-Testhelfer voll ausbauen und erneut prüfen. Berechnete Tycoon-Wege ersetzen keine echten Spieltests; Obby-Sprünge, Handy, Mehrspieler, Streaming, Speicher und Käufe separat testen. **Recherche & Kriterien laden** enthält die Quellen und den Qualitätsplan.

## Direkt von deiner Idee zum Download

In der Bot-Zentrale deinen Spielwunsch eingeben und **Bauen & Startpaket laden** wählen. Die App plant und baut die Map, prüft das Layout, sichert sie in **Meine Maps** und erstellt das vollständige ZIP-Startpaket. **Nur Map bauen** erzeugt das Ergebnis ohne Download. Unter **Ergebnis & Downloads** stehen Dateiname, Größe, Erstellzeit und der Link zum erneuten Herunterladen. „Download angefordert“ bestätigt noch keinen gespeicherten Download.

Falls nur die Datei-Erstellung fehlschlägt, **Startpaket erneut erstellen** wählen. Das baut keine neue Map und ändert weder Namen noch Seed. Wurde die Vorschau inzwischen bearbeitet, verwende deren aktuelle Export-Buttons oder öffne zuerst die gewünschte Map wieder. Bei blockiertem Browser-Speicher die Map als Datei sichern.

Unter **Mit Claude am PC arbeiten** kannst du einen Auftrag für deinen bereits eingerichteten Browser-Assistenten kopieren. Er enthält deinen Spielwunsch, Ausgangseinstellungen, Namensautomatik und Trend-Auswahl. Füge ihn in die Seitenleiste deines Assistenten ein und gib dort den Seitenzugriff frei. Der Text richtet die Verbindung nicht selbst ein. Falls Kopieren blockiert ist, wird der Text zum manuellen Kopieren markiert. Roblox-Studio- und Kauf-Tests bleiben offen, bis du sie tatsächlich durchgeführt hast.

## Schritt-für-Schritt direkt in der App

Öffne **Schritt-für-Schritt** in der Navigation. Der Assistent führt dich in zehn Schritten durch Studio-Vorbereitung, Generierung, Layoutprüfung, Download und Entpacken, Öffnen in Studio, privates Speichern, Shop-Einrichtung, echte Spieltests, Freigabe und Sicherung.

Jeder Schritt erklärt, ob du in MapForge oder Roblox Studio arbeitest. Die Buttons öffnen den passenden App-Bereich oder eine offizielle Roblox-Seite. **Zurück**, **Weiter** und die Schrittliste helfen beim Navigieren. Weiterblättern setzt keine Häkchen. Bestätigungen speichert der Browser für die aktuelle Konfiguration; die Studio-Vorbereitung bleibt auch für andere Maps erhalten. Die Spieltest-Häkchen entsprechen demselben Protokoll wie unter **Veröffentlichung**.

Dateiname, Grundstückszahl, Modus, Layoutfehler und Shop-IDs werden aus deinem Projekt übernommen. Fehlende Export-Skripte oder blockierende Layoutfehler sperren die Exportaktionen. Unter **Schrittanleitung laden** erhältst du die aktuelle Anleitung für deinen Computer. Jede Startpaket-ZIP enthält außerdem **Schritt-fuer-Schritt.md**.

## Dein nächster Schritt

Öffne zuerst den Trend View. Klicke auf **Live-Daten abrufen**, wähle eine Referenz und **Tycoon ableiten**. Anschließend kannst du Design, Seed, Grundstückszahl und Details ändern. Der Regler für Ausbaustufen zeigt, wie die Fabrik im Spiel wächst. Die exportierte Map startet unbebaut. Mit **Spielbereit voreinstellen** setzt du Details, Laufwege, Speicherung und Shop auf die empfohlenen Werte. **Startpaket herunterladen** liefert alle Dateien einschließlich KI-Übergabe und Creator-Hub-Vorlagen.

**Map generieren** prüft bei aktiviertem Trend-Schalter zuerst Roblox. **Mit meinen Einstellungen bauen** verwendet deine aktuelle Konfiguration ohne automatische Trendwahl.

Exportiere die Studio-Datei und öffne sie in Roblox Studio auf Windows oder macOS. Am Handy kannst du recherchieren, konfigurieren und exportieren.

## Was Trend View tatsächlich misst

- Roblox **Top Trending** und **Top Playing Now**, mit den Standardfiltern des öffentlichen Abrufs.
- Spielerzahl beim Abruf, Rang innerhalb der jeweiligen Liste und Zustimmung, sofern diese Daten verfügbar sind.
- Eine ergänzende, ausdrücklich benannte Watchlist mit Theme Park Tycoon 2 und Restaurant Tycoon 2.
- Änderungen der Spielerzahl erst, wenn in diesem Browser zwei unterschiedliche Messungen mit mindestens einer Minute Abstand vorliegen. Das ist keine langfristige Zeitreihe.

Quellen werden zusammen mit der Abrufzeit angezeigt. Der Server hält einen erfolgreichen Abruf bis zu zwei Minuten vor. Beim Ausfall zeigt die Oberfläche einen gespeicherten Stand höchstens 24 Stunden lang und bezeichnet ihn als gespeichert. Die automatische Trend-Generierung benötigt einen erfolgreichen neuen Abruf. Fehlende Daten werden nicht erfunden.

Öffentliche Quellen:

- https://www.roblox.com/charts/top-trending
- https://www.roblox.com/charts/top-playing-now
- https://apis.roblox.com/explore-api/v1/get-sort-content
- https://games.roblox.com/docs/index.html

Spielerzahlen sind kein Umsatznachweis. Der Vorschlag bewertet die Passung zur verfügbaren Tycoon-Vorlage anhand von Name, Genre und verfügbaren Beschreibungen. Er ist keine Prognose für den Erfolg deines eigenen Spiels.

## Was aus einer Referenz entsteht

Ein eigener Produktions-Tycoon mit eigener Geometrie und eigenen Skripten. Die Referenz beeinflusst Design und Ausrichtung. Der Generator übernimmt allgemeine Prinzipien wie Grundstücke, Sammeln, Ausbau und Prestige. Er lädt keine fremden Karten, Grafiken oder Skripte herunter. Ein Referenzspiel mit Kämpfen, Haustierhandel oder Diebstahl wird dadurch nicht automatisch mit demselben Funktionsumfang nachgebaut.

Die verfügbaren Mechaniken stehen bei jeder Ableitung. Das System ist regelbasiert und benötigt keinen KI-API-Schlüssel.

## Tycoon-Spielablauf

1. Beim Beitritt wird ein freies Grundstück zugewiesen. Bei voller Belegung kann ein Spieler auf einen freien Platz warten oder den Server wechseln.
2. Das erste leuchtende Kauf-Feld schaltet den kostenlosen Starterbohrer frei.
3. Produktion landet im Tresor. Am Tresor per Interaktion oder über den HUD-Button in der Nähe abholen.
4. Mit Cash den nächsten Ausbau kaufen. Der HUD-Bereich **Fabrikmenü → Ausbau** zeigt Kosten und führt zum passenden Feld.
5. Insgesamt gibt es 48 aufeinander aufbauende Kaufstufen: Maschinen, Förderbänder, Reaktoren, Hallen und Türme.
6. Nach allen Stufen ist ein Rebirth möglich. Der Dialog verlangt einen zweiten Tipp und erklärt den Reset.

Kosten und Produktion stammen aus demselben Plan im Editor und im Server-Modul. Im rechnerischen Modell dauert der reine, unbeschleunigte Erwerb der Stufen etwa 120 Minuten. Laufwege, manuelles Sammeln und tatsächliches Verhalten kommen hinzu; das ist kein gemessener Roblox-Spieltest.

Die sichtbaren Produktionspartikel sind lokale Dekoration. Cash wird ausschließlich vom Server berechnet. Fremde Spieler können keine Ausbauten oder Tresore eines anderen Grundstücks bedienen.

**Vor Veröffentlichung die maximale Server-Spielerzahl im Creator Hub auf die Anzahl der Grundstücke setzen.** Standardmäßig sind vier Grundstücke konfiguriert; wählbar sind zwei bis sechs.

## Weitere Ziele

- **Rebirth:** Cash, Tresor und Fabrikausbauten werden zurückgesetzt. Das betrifft auch noch vorhandenes Cash aus gekauften Paketen. Du erhältst 25 Kristalle (mit Prestige-Forschung bis zu 65) und +20 % Basisproduktion pro Rebirth; der Produktionszuwachs ist ab 100 Rebirths gedeckelt. Forschung, Kristalle, Skins, Pässe und verbleibende Boost-Zeit bleiben erhalten.
- **Tagesaufträge:** 3/12 Ausbauten bauen, 5/15 Minuten spielen und 500/10.000 Cash abholen. Die sechs Aufgaben geben zusammen 115 Kristalle pro UTC-Tag.
- **Offline-Produktion:** zunächst maximal zwei Stunden, mit Offline-Forschung bis zu sechs Stunden, zu 20 % der Basisproduktion einschließlich Rebirth- und Effizienzfaktor. Offline gelten keine Pass- oder Zeitboost-Multiplikatoren; Boost-Zeit läuft offline nicht ab.
- **Skins:** Mint, Violet, Gold, Ruby, Ice, Void, Ocean, Ember, Rose, Aurora, Royal und Prism. Preise: 0/50/100/150/250/400/500/600/700/850/1.100/1.500 Kristalle. Bereits erworbene Skins lassen sich kostenlos erneut auswählen.

## Neun optionale Robux-Angebote

| Art | Angebot | Effekt |
|---|---|---|
| Developer Product | Kleines Cash-Paket | 25.000 Cash |
| Developer Product | Großes Cash-Paket | 1.000.000 Cash |
| Developer Product | 100 Kristalle | Für auswählbare Skins |
| Developer Product | 500 Kristalle | Größeres Kristallpaket |
| Developer Product | 15-Minuten-Boost | 2× Produktion während Spielzeit |
| Developer Product | Empire-Paket | 250.000 Cash + 250 Kristalle |
| Game Pass | VIP | Titel, Gold-Akzente im Mint-Design und +25 % Produktion |
| Game Pass | Auto-Collect | Tresor automatisch ins Wallet sammeln |
| Game Pass | Dauerhaft 2× | Permanenter Produktionsfaktor |

Dauerhafte Pässe und der Zeitboost stapeln sich. Preise werden im Creator Hub festgelegt und im Spiel direkt von Roblox abgefragt. Es gibt keine fest eingebauten Robux-Preise, zufälligen Kaufbelohnungen oder automatisch aufspringenden Kaufdialoge. Der Ausbau ist ohne Robux durchspielbar.

### Einrichtung

1. Einen getrennten privaten Testplatz im eigenen Roblox-Konto veröffentlichen.
2. Im Creator Hub **Monetization → Developer Products** für die sechs wiederholbaren Angebote und **Passes** für die drei dauerhaften Angebote verwenden.
3. Passende IDs desselben Roblox-Spiels unter **Monetarisierung** in MapForge eintragen und übernehmen. Nur eingerichtete Angebote sind kaufbar. Doppelte IDs innerhalb eines Produkttyps werden blockiert.
4. Erneut exportieren und im richtigen Spiel veröffentlichen. Alternativ die gleichen IDs in `ReplicatedStorage → MapForgeConfig` setzen.
5. Alle angebotenen Käufe und den Umgang mit wiederholten Belegen prüfen. Bei Tests mit realen Käufen können Robux anfallen; Roblox-Testbedingungen beachten.

Bei Updates die Kaufverarbeitung für bereits verwendete Produkt-IDs erhalten. Unbekannte Belege bleiben unbestätigt. Game-Pass-Rechte werden beim Beitritt und nach einem Kauf auf dem Server bei Roblox geprüft.

Dokumentation:
https://create.roblox.com/docs/production/monetization/developer-products
https://create.roblox.com/docs/production/monetization/passes

## Speicherung und Fehlerfälle

Cash, Tresor, Kristalle, Ausbauten, Forschung, Skins, Rebirths und Boost-Zeit werden pro Roblox-Spiel gespeichert. Die Wallet bleibt bei einem Wechsel des Fabrik-Designs erhalten. Obby-Guthaben und Tycoon-Guthaben sind getrennte Felder; bestehende Obby-Daten bleiben erhalten.

Für Speichertests im Studio den Zugriff auf API-Dienste nur in einem separaten Testplatz erlauben, da Studio echte DataStores dieses Spiels ändern kann. Ohne Zugang läuft Studio mit temporären Demo-Profilen und gesperrten echten Käufen.

Das Datenmodul verwendet Session-Sperren, Autosave etwa alle 45 Sekunden und Speicherung beim Verlassen. Ein alter Server kann einen neuen Eigentümer des Profils nicht überschreiben. Ein abgebrochener Server kann das Profil bis zum Ablauf der 180-Sekunden-Sperre blockieren.

Kaufbelohnung und Beleg werden gemeinsam gespeichert. Bei einer verlorenen Netzwerkantwort wird genau derselbe ausstehende Vorgang zuerst geklärt. Weitere Änderungen dürfen ihn nicht überschreiben. Doppelte Belege geben keine zweite Belohnung. Bei abrupten Serverabbrüchen kann gewöhnlicher, noch nicht gespeicherter Spielfortschritt verloren gehen.

Der Health-Check repariert veränderte Verankerungen markierter Tycoon-Teile und prüft Grundstücksrollen und Kauf-Felder. Er schaltet keine gesperrten Ausbauten frei. Die Log-Hilfe erkennt bekannte Fehlermuster; unbekannter Code wird nicht automatisch umgeschrieben.

## Vor dem öffentlichen Start

- Zwei Spieler: getrennte Grundstücke, fremde Kauf-Felder und Tresore testen.
- Alle 48 Stufen ohne Robux durchspielen, Durchgänge und Kamera prüfen.
- Verlassen, Wiederbeitritt und Offline-Ertrag prüfen.
- Rebirth-Reset, Skins und Tagesaufträge prüfen.
- Echte Kaufbelege, Wiederholungen, Speicherfehler und Pass-Rechte prüfen.
- Mit einem echten Mobilgerät prüfen; Bauteilzahl allein ist kein FPS-Nachweis.
- Maximale Spielerzahl gleich Grundstückszahl konfigurieren.
- Maturity & Compliance und aktuelle Freigabeanforderungen im Creator Hub bearbeiten.

https://create.roblox.com/docs/production/publishing/publish-games-and-places

MapForge ist nicht mit deinem Roblox-Konto verbunden und veröffentlicht kein Roblox-Spiel automatisch. Die Studio-Dateien werden in deinem Konto von dir geöffnet und veröffentlicht.

## Obby-Modus

Die bisherigen vier Obby-Designs bleiben verfügbar. Wähle im Generator **Obby** oder importiere ein altes MapForge-Projekt. Die frühere Anleitung ist als `obby-guide.md` enthalten.

## Prüfung dieser Lieferung

Automatisiert geprüft: 360 Obby-Konfigurationen, 60 Tycoon-Konfigurationen, Wirtschaft ohne Robux, Kaufvoraussetzungen, Rebirth, Tagesbelohnungen, Offline-Begrenzung und Skins. Das reale Datenmodul wurde mit doppelten Belegen, allen sechs Tycoon-Produkten, Speicher-Ausfällen, verlorenen Antworten und Session-Wechseln geprüft. Acht Studio-Dateien wurden als XML und auf Runtime-Struktur geprüft.

Live-Chart-Abruf und Fehler-Fallbacks wurden geprüft. Geometrievorschauen wurden separat gerendert und angesehen. Die Werkzeugoberfläche, Designwechsel, Vorschaufortschritt, sechs Grundstücke und Startpaket-Erstellung wurden im Browser geprüft. Nicht ausgeführt: echte Roblox-Studio-Spieltests und echte Käufe. Diese offenen Tests stehen in der App.


## Neue Baudetails und Inhalte in Version 3

Die vier Tycoon-Themen nutzen differenzierte Maschinen statt gleichförmiger Blöcke: Bohrer, Förderanlagen, Pressen, Glasreaktoren, Laborhäuser, gestaffelte Türme, Solarpanels, Kühlanlagen, Gewächshäuser, Kran, Antenne, Portal, Garten, Helipad und Monumente. Fassaden und Leuchtleisten wachsen beim Ausbau mit. Themen unterscheiden sich durch Vegetation, Basalt/Magma, Kristalle/Wolken oder Hologramm-Totems.

Promenaden, drei Querverbindungen je Fabrik, Kanäle, Lampen und Sitzbänke gehören zur Umgebung. Der automatische Check prüft die Hauptlaufkorridore gegen die tatsächlichen kollidierenden Bauteile. Materialien, Rotationen, Lichtquellen und ursprüngliche Glas-Transparenz werden in Studio exportiert. Die Canvas-Vorschau ist eine Geometriedarstellung; Roblox rendert Licht und Material anders.

**Forschung** kostet Cash und bleibt beim Rebirth erhalten. Prozessoptimierung hat 12 Stufen mit jeweils +5 % Basisproduktion. Offline-Logistik hat acht Stufen mit jeweils +30 Minuten Offline-Fenster. Prestige-Forschung hat acht Stufen mit jeweils +5 Kristallen je Rebirth. Ohne Forschung gibt ein Rebirth 25 Kristalle, mit maximaler Prestige-Forschung 65.

Die zwölf Designs kosten gezielt 0–1.500 Kristalle. Es gibt keine Zufallsbelohnung beim Skin-Kauf. Neun optionale Robux-Angebote bleiben zusätzlich konfigurierbar.

## Schnell in Studio testen

Im HUD unter **Ausbau** erscheinen ausschließlich in Roblox Studio die Testhelfer **Test-Cash**, **Alle Ausbauten freischalten** und **Test-Fabrik zurücksetzen**. Der Server prüft `RunService:IsStudio()`, `StudioTestData` und `StudioTestTools`. Veröffentliche Server zeigen und akzeptieren diese Aktionen nicht.

Standardmäßig nutzt Studio `MapForge_Studio_v1`, Live-Server nutzen weiterhin `MapForge_v1`. Test-Cash und Test-Freischaltungen berühren damit keine Live-Spielstände. Für echte Speicher- und Kaufprüfungen einen separaten Testplatz verwenden. Die Studio-Helfer verkürzen die optische Prüfung, ersetzen aber keinen normalen Fortschritts- oder Kauf-Test.

## Übergabe an eine andere KI

Bei **Veröffentlichung → KI-Update herunterladen** wird ein Markdown-Update aus der aktuellen Map, Konfiguration und deinem Testprotokoll erstellt. Jedes Startpaket enthält automatisch `KI-Uebergabe.md`. Das vollständige Projektpaket enthält zusätzlich `UEBERGABE-KI.md` für die Weiterentwicklung des Generators. Nach jeder Codeänderung müssen Übergabe, Tests, Beispiele und herunterladbares Projektpaket aktualisiert werden.

## Kaufanlässe und Spieltest-Labor

1. Unter Monetarisierung eigene Produkt- und Pass-IDs setzen. Hinweise, frühesten Zeitpunkt (120–900 Sekunden), Angebotsfokus und Roblox-Einstiegsfunnel einstellen, dann **Shop übernehmen**. Neu exportieren, damit Studio die Änderungen erhält.
2. Im **Spieltest-Labor** Ausbaustufe, Spielzeit, Abholungen und Design-Interesse simulieren. Der Planer zeigt, wann ein Angebot passt und welche Einrichtung noch fehlt. Cash-Beträge werden mit der aktuellen Produktion verglichen, nicht mit einem erfundenen Robux-Preis.
3. Mit frischem Profil zuerst den kostenlosen Starter, Cash-Abholung und nächsten Ausbau spielen. Der Wegweiser markiert das Ziel. Vier Bau-Meilensteine schenken einmalig insgesamt 70 Kristalle; Aufträge und Rebirth bleiben weitere kostenlose Quellen.
4. Andere Menschen ohne Erklärung spielen lassen. Zeit bis zur ersten sinnvollen Aktion und Spielzeit beobachten. Rückkehrwunsch, größte Hürde, gewünschtes Extra und Verbesserung im Labor eintragen. Keine Kontodaten nötig.
5. Auswertung lesen und genau eine Änderung testen. Weniger als fünf Tests reichen kaum zur Orientierung; auch größere Selbstauskünfte beweisen keine Kaufconversion oder tatsächliche Rückkehr.
6. Projektdatei oder Startpaket sichern. Testdaten, Kaufplan, Quellen und KI-Update werden mitgegeben. Die Browserdaten allein sind kein dauerhaftes Backup.

Angebotshinweise erscheinen höchstens zweimal pro Sitzung mit zehn Minuten Abstand und lassen sich schließen oder für die Sitzung abschalten. Sie öffnen keine automatischen Kaufdialoge. Vollständiger Shop und kostenloser Spielfortschritt bleiben erreichbar. Schwellen sind eigene Startwerte für Spieltests, keine Erfolgsgarantie aus den Referenzen.

Der optionale Einstiegsfunnel protokolliert auf veröffentlichten Servern Beitritt → Gratis-Starter → erste positive Abholung → fünf Ausbauten. Aktive alte Fabriken sind von dieser neuen Kohorte ausgenommen. In Roblox Studio werden keine Analytics-Ereignisse gesendet. Ergebnisse und echte Monetarisierungskennzahlen im Creator Hub prüfen; MapForge ist nicht mit deinem Roblox-Konto verbunden.

## Nach der Generierung verbessern

1. Im Generator **Nach Generierung automatisch lokal verbessern** aktivieren, wenn du bei jeder bewussten Generierung auch Layout-/Detailregeln anwenden lassen möchtest. Im Vergleich stehen die tatsächlich geänderten Einstellungen.
2. Unter **Map verbessern** eigene Wünsche eingeben, beispielsweise „schöner, weniger warten“ oder „Handy, weniger Deko“. **Wünsche prüfen** zeigt den Vorschlag. **Automatisch verbessern** wendet sichere Vorlagenänderungen direkt an. Neue NPCs, Fahrzeuge oder andere Mechaniken benötigen zusätzliche Quellcode-Arbeit.
3. Änderungen mit **Letzte Verbesserung zurücknehmen** zurücksetzen. Nach anderen manuellen Änderungen kann eine nicht mehr passende Rücknahme gesperrt sein. Projektdatei/Startpaket für ein dauerhaftes Backup sichern.
4. Für eine externe KI das **KI-Prüfpaket** herunterladen. ZIP entpacken und einer KI deiner Wahl geben. Es enthält Vollausbau- und Einstiegsvorschau, vollständige Geometrie, Checks, Konfiguration, Übergabe und eine Prüfanfrage. Es wird nichts automatisch an einen KI-Anbieter gesendet.
5. Den JSON-Vorschlag der KI wieder einfügen. Die App prüft die Map-Version, erlaubte Felder, Werte, Geometrie und Budget. Produkt-IDs, fremde Skripte und Seeds können auf diesem Weg nicht geändert werden. Mit gesetzter Option werden gültige Vorschläge direkt angewendet; sonst zunächst vergleichen.
6. Danach Studio-Datei neu exportieren und echte Spieltests wiederholen. Die lokale Analyse führt kein Roblox Studio aus. Eine direkte KI-Modellverbindung ist aktuell nicht eingerichtet.

## Spieltempo und Auftragsbrett

Im Generator bestimmt **Spieltempo** nur die Baukosten. Standard verwendet die verlängerte Baukurve mit rund 120 Minuten Modellzeit. Zügig senkt die Baukosten um 30 % (rund 84 Minuten), Langfristig erhöht sie um 25 % (rund 150 Minuten). Die ersten sechs Ausbauten behalten ihre bisherigen Grundpreise; danach steigen sie schrittweise. Der Überblick rechnet nur mit Produktion und sofortigem Bauen; echte Spielzeiten brauchen Laufwege, Sammeln und Forschung und können deutlich abweichen.

Ab drei Ausbauten unter **Aufträge** oder am Brett einen Bau-, Forschungs- oder Lieferauftrag annehmen. Ein Ziel gleichzeitig, bis zu drei zusätzliche Kristallbelohnungen pro UTC-Tag. Fortschritt beginnt bei Annahme. Aktive Aufträge laufen nicht ab und bleiben bei Wiederbeitritt und Rebirth erhalten. Vor Fertigstellung kannst du kostenlos wechseln; dabei den bisherigen Auftragsfortschritt bewusst verwerfen. Fertige Belohnungen zuerst abholen.


## Neu in 3.4: Spielziele und schneller Upload

Bot-Zentrale: Auftrag eingeben, mit oder ohne frische Roblox-Trends bauen und den tatsächlichen Ablaufbericht herunterladen. Die Automatik verwendet die vorhandenen Tycoon-/Obby-Vorlagen und lokale Regeln; kein Sprachmodell ist direkt verbunden. Freie neue Genres erfordern zusätzliche Generatorlogik. Externe KI-Prüfung ist unter Map verbessern erreichbar.

Spieler sehen Starten → Abholen → Bauen, können Spielziel / Hilfe jederzeit öffnen und bekommen dort den vollständigen Spielplan. Echte exportierte Schilder erklären den Kernablauf. Obbys zeigen nächstes Plattformziel und Abschluss.

Unter Veröffentlichung direkt die .rbxlx-Datei laden, ohne ZIP-Entpacken. Doppelklick oder Studio Strg+O. Blaues ▶ neben Test startet, rotes ■ beendet den Test. Neues Spiel: Datei → Publish. Frische Exportdatei in bestehendes Spiel: Publish As → dasselbe Spiel → bisherigen Startplatz, vorher sichern. Titel und Beschreibung sind kopierbar. Öffentliche Freigabe bleibt ein eigener Roblox-Schritt. Änderungen gelten erst nach erneutem Export und Aktualisierung in Studio.


## Neu in 3.5: Eigenständige Materialien und Naturdetails

Bloom nutzt Grasflächen, Holzwege, Blumenbeete, Hecken und mehrere Grüntöne. Kristall, Neon und Vulkan erhalten eigene Boden-/Metall-/Steinpaletten. Detailreiches Bloom mit sechs Grundstücken und polish 2 umfasst 5.164 Teile.

Große Tafeln sind an der Welt befestigte SurfaceGuis; lokale Hinweise erscheinen nur in der Nähe. Besitzer sehen fremde Beanspruchen-Prompts nicht mehr. Standardnamen passen sich dem Spielmodus an, eigene Namen bleiben erhalten.

Tycoon und Obby exportieren zurückhaltenderes Licht, Realistic LightingStyle, PrioritizeLightingQuality und Tonemapper Default. Future ist zusätzlich als Legacy-Import-Vorgabe gesetzt. Ob der Studio-Migrationsdialog damit ausbleibt, muss der Nutzer prüfen. Jedes Startpaket enthält Studio-Optik-Test.md. Die Vorschau simuliert keine Roblox-Beleuchtung.


## Neu in 3.6: Automatische Spieltexte und längerer Spielaufbau

Titel und Bio entstehen automatisch aus Spielmodus, Thema und tatsächlich eingebauten Inhalten. Der Generator zeigt eine Vorschau, unter **Veröffentlichung** stehen beide Texte direkt zum Kopieren bereit. Eigene Projektnamen bleiben erhalten. Ein Seed-Wechsel würfelt den Titel nicht neu. Speicherung/Offline-Ertrag werden nur bei aktiviertem Speicher erwähnt, optionale Shop-Extras nur mit eingerichteten IDs, aktiviertem Shop und aktivierter Speicherung. Keine erfundenen Spielerzahlen, Rankings oder Gratis-Robux-Versprechen.

Das Startpaket enthält zusätzlich `Roblox-Titel.txt`, `Roblox-Beschreibung.txt`, `Roblox-Metadaten.json`, `Spieltexte.md` und `Erste-Spieler-und-Werbung.md`. Dieselben Texte stehen in der exportierten Konfiguration und im KI-Update. MapForge erstellt sie automatisch; ins Roblox-Konto übernimmst du sie in Studio oder im Creator Hub.

Tycoon Standard: **120,1 Minuten rechnerische Bauzeit** statt 41,4. Zügig: 84,1, Langfristig: 150,1 Minuten. Kostenloser Starter und die ersten sechs Grundpreise bleiben unverändert; danach wachsen die Baukosten bis zum 4,2-fachen früheren Grundpreis. Modell: sofort bauen, sobald unverstärkte Produktion den Preis erwirtschaftet. Laufwege, Forschung, Sammelpausen und Rebirth fehlen, daher keine garantierte Spieldauer. Die letzte Standard-Bauwartezeit liegt im Modell bei rund 6,4 Minuten; Forschung, Designs und Aufträge bleiben weitere Ziele. Keine zusätzlichen Ausbauten oder geänderten Robux-Inhalte. Bestehende Ausbauten/Spielstände bleiben erhalten; offene Ausbauten verwenden nach neuem Export die neuen Preise.

### So lädst du hoch

1. Unter Veröffentlichung **Studio-Datei laden** und die `.rbxlx` in Roblox Studio öffnen.
2. Play starten, normal bauen und die offenen Tests aus dem Testprotokoll durchführen.
3. Neues Spiel: Datei → Publish / Auf Roblox veröffentlichen. Titel und Bio aus MapForge einsetzen. Bei einer frischen Exportdatei für ein bestehendes Spiel: Publish As → dasselbe Spiel → bisherigen Startplatz; vorher sichern.
4. Im Creator Hub die angezeigten Konto-, Alters- und Inhaltsangaben abschließen. **Publish settings → Manage Audience → Manage access → Public → Save Changes**. Beim Tycoon die maximale Spielerzahl auf die Grundstückszahl setzen.

### Erste Spieler und Werbung

Meine Empfehlung: zunächst 5–10 echte Testspieler ohne Erklärung starten lassen, Beobachtungen im Spieltest-Labor eintragen und häufige Hürden beheben. Die Anzahl ist keine Roblox-Vorgabe. Ein eigenes, zutreffendes Thumbnail verwenden; Roblox verlangt ein eigenes Thumbnail für Homepage-Empfehlungen. Echte Gameplay-Clips und den Spiellink dort teilen, wo es erlaubt ist.

Danach bei Bedarf einen begrenzten Werbetest: Ads Manager, Ziel **Plays**, vorher festes **Lifetime Budget**, Enddatum, **Auto-Reload aus**. Aktuelle Voraussetzungen und Beträge zeigt Roblox. Kosten pro Spielstart, tatsächliche Spielzeit und Rückkehr am Folgetag vergleichen. Keine garantierte Reichweite oder Rentabilität. MapForge kauft keine Werbung und veröffentlicht dein Roblox-Spiel nicht selbst.

Offizielle Quellen, am 20.10.2026 geprüft:
- https://create.roblox.com/docs/production/publishing/publish-games-and-places
- https://create.roblox.com/docs/discovery
- https://create.roblox.com/docs/production/analytics/acquisition
- https://create.roblox.com/docs/production/promotion/ads-manager


## Neu in 3.7: Map-Details, Gratis-Runde und Shop-Assistent

Gewächshäuser besitzen geneigte Glasdächer und Pflanzreihen. Weitere Maschinen haben je nach Thema Kristalllinsen, lebendige Pflanzenmodule, Vulkanöfen oder Hologramme. Wiederholte Zierstreifen wurden reduziert. Alle vier Designs bleiben mit sechs Grundstücken und maximalen Details unter 5.200 Teilen (Bloom: 5.164).

Ab drei Ausbauten kannst du die drei Kalibrierungsstationen der Reihe nach besuchen. Unter **Aufträge → Station markieren** zeigt ein Wegweiser das nächste Ziel. Jede Station in der eigenen Fabrik vor Ort bedienen. Zwischen Stationen mindestens vier Sekunden; nach Abschluss +15 % Produktion für 120 Sekunden Spielzeit. Neue Runde 180 Sekunden nach Abschluss. Schritt, Restbonus, Zeitabstand und Wartezeit werden gespeichert und bleiben beim Rebirth. Offline-Produktion erhält keinen Kalibrierungsmultiplikator.

Unter **Monetarisierung** führt der Shop-Assistent durch neun vorbereitete Angebote. Du kannst sechs Developer-Product-IDs per Studio-Prüfskript gesammelt einlesen und Änderungen vor dem Übernehmen prüfen. Die drei Pass-IDs weiterhin selbst eintragen. Fehlende IDs und Preise müssen im eigenen Creator Hub angelegt werden. Nach Änderungen frisch exportieren und das bestehende Spiel aktualisieren.

Preise werden pro Client und Produkttyp für 120 Sekunden gespeichert; Fehler frühestens nach 15 Sekunden erneut abgefragt. Der Kaufdialog zeigt den endgültigen Roblox-Preis. Produktkäufe werden erst angeboten, wenn der Server die ID im vollständigen Produktkatalog dieses Spiels gefunden hat. Ein Katalogfehler sperrt neue Produktangebote; bereits bezahlte Belege werden weiterhin verarbeitet.

**Offen:** Browserprüfung dieser Version (Zeitüberschreitung), echter Studio-/Touch-Test, Kaufabläufe, Licht und Migrationsdialog. Automatische Tests ersetzen diese Prüfungen nicht.


## Neu in 3.8: Baupläne, Themen und Spielstart-Vorschau

Im Generator unter **Fabrik-Bauplan** zwischen Produktionsstraße, Fabrik-Campus und zentraler Skyline wählen. Die drei Pläne verteilen die 48 Baukäufe anders auf die vorhandenen Grundstücke. Beim Skyline-Plan variiert der Seed zusätzlich die Turmhöhen. Hauptwege, Kosten, Kaufreihenfolge und Speicher-IDs bleiben erhalten. Das Budget bleibt bei maximal 5.164 Teilen für sechs Bloom-Grundstücke mit höchsten Details.

Maschinen tragen zum Thema passende Namen: Biofabriken bauen Saatgutsammler, Blütenpressen und Pflanzenlabore; Neon verwendet Photonen und Plasma, Vulkan Erz und Magma. Dieselben Namen erscheinen in Vorschauinformationen, Kostenplan und Roblox-Kaufzielen.

Unter der Vorschau **Spielstart**, **Erste Ausbauten** oder **Vollausbau** auswählen. Das zeigt den tatsächlichen Gebäudeumfang der gewählten Stufe und das nächste Kauf-Feld. Beim Spielstart hat der Gratis-Starter Vorrang vor anderen Schildern. Dies ist eine Geometrieansicht und keine laufende Roblox-Simulation. Der Schieberegler erlaubt weiterhin alle 49 Bauzustände.

Im Roblox-Spiel öffnet **Fabrikmenü** die Ziele Hilfe, Ausbau, Shop, Designs, Forschung, Aufträge und Rebirth in einer scrollbaren Liste. Nach einer Auswahl klappt sie zu; Studio-Test-Cash findest du unter **Fabrikmenü → Ausbau**. Bildschirm-, Touch- und Controller-Bedienung müssen weiterhin in Studio geprüft werden.


## Neu in 3.9: Eigene Map-Namen und sichtbare Downloads

In Generator und Bot-Zentrale findet MapForge beim Generieren einen neuen Namen passend zu Spielmodus und Design. Die Namensautomatik lässt sich abschalten. Sobald du selbst einen Namen eintippst, bleibt dieser erhalten. „Namen vorschlagen“ erstellt einen neuen Vorschlag; Namensvorschläge ändern den Seed und die Geometrie nicht. Alte Projekte mit eigenem Namen starten mit ausgeschalteter Namensautomatik.

Nach dem Generieren erscheint oben dauerhaft **Ergebnis & Downloads** mit Name, Uhrzeit, Bauteilen und Buttons für **Studio-Datei (.rbxlx)** und **Startpaket (.zip)**. Ein Download beginnt erst nach einem Klick auf einen Download-Button. Beim Bauen und Exportieren werden laufende Schritte angezeigt und weitere Starts gesperrt. Fehlende Trenddaten und Export-Dateien bekommen eine bleibende Fehlermeldung. Export-Dateien lassen sich erneut vorbereiten.

Nach einem Download siehst du Dateiname, Größe und Uhrzeit sowie **Erneut herunterladen**. Auch der Dateiname selbst ist ein direkter Download-Link. Die letzten vier Dateien bleiben verfügbar, solange diese Seite geöffnet ist. „Download angefordert“ bestätigt die Anforderung an den Browser; der Browser bestimmt den Speicherort und zeigt den tatsächlichen Downloadfortschritt. Bei späteren Änderungen zeigt die Ergebnisanzeige an, dass die Vorschau bearbeitet wurde. Der Export benutzt eine feste Momentaufnahme, damit Name und Datei auch bei Änderungen während der Erstellung zusammenpassen.

63 JavaScript-Tests einschließlich der tatsächlichen App- und Bot-Handler mit DOM-/Service-Doubles, XML-/Lua-Prüfungen und Build. Diese Tests ersetzen keine Browser- oder Roblox-Studio-Prüfung; beides für diese Version offen. Details stehen in UEBERGABE-KI.md.


## Neu in 3.10: Meine Maps und einfaches Weiterbauen

Unter **Meine Maps** findest du die letzten acht gesicherten Map-Versionen auf diesem Gerät. Erfolgreiche Bauvorgänge werden automatisch aufgenommen; **Aktuelle Map merken** sichert auch eine bearbeitete Vorschau. Echte Layout-Vorschauen, Suche und ein Filter für Tycoon/Obby helfen beim Wiederfinden. Gleiche Konfigurationen werden aktualisiert, statt doppelt abgelegt.

**Map öffnen** lädt Namen, Seed und Bau-Einstellungen. Die aktuell eingerichteten Produkt- und Pass-IDs bleiben dabei erhalten. Vor dem Wechsel wird die aktuelle Vorschau gesichert; **Vorherige Map wiederherstellen** macht den Wechsel rückgängig. Entfernte Einträge lassen sich direkt wiederherstellen. Die Sammlung umfasst höchstens acht Versionen; weitere Sicherungen verdrängen die älteste Version.

Mit **Sammlung sichern** erhältst du alle Einträge als JSON-Datei. Über **Sicherung laden** lässt sie sich auf einem anderen Gerät einlesen. Vor dem Hinzufügen siehst du Anzahl, Dubletten und verfügbaren Platz. Der Import füllt freie Plätze und ersetzt keine vorhandenen Einträge. Einzelne **Projektdateien** lassen sich wie bisher über **Projekt öffnen** laden. Die Sammlung wird in diesem Browser gespeichert und nicht automatisch zwischen Geräten synchronisiert.

Nach einem Neuladen erscheint die letzte Map mit einem Hinweis zur Wiederherstellung und kann direkt erneut exportiert werden. Wenn die aktuelle Projektablage beschädigt ist, kann der letzte gültige Sammlungseintrag einspringen. Gespeicherte Konfigurationen werden mit der aktuellen MapForge-Version neu aufgebaut; alte Download-Bytes werden nicht aufbewahrt. Bei blockiertem Browser-Speicher zeigt die App ausdrücklich **nur in dieser Sitzung verfügbar** und bietet Dateisicherungen an.

Nach Studio-/Startpaket-Downloads erklärt ein eigener Bereich den nächsten Schritt und führt zu Öffnen und Testen. Navigation bringt dich zum gewählten Arbeitsbereich, auch wenn oben noch ein Download-Ergebnis steht.

75 JavaScript-Tests, XML-/Lua-Prüfungen und Build. Tests der tatsächlichen App-/Galerie-Handler verwenden DOM-/Service-Doubles. Browser- und Roblox-Studio-Prüfung dieser Version sind offen.


## Studio-Fehler an eine KI weitergeben
Unter Fehlersuche das Studio-Log, die Testumgebung und Wiederholungsschritte eintragen. Erwartetes und tatsächliches Verhalten beschreiben, dann Fehlerbericht für KI herunterladen. Vor Weitergabe persönliche Angaben prüfen. Der Bericht enthält keine Skriptquellen; bei Bedarf das passende Projektpaket ergänzen.


## Ideenwerkstatt (3.14)
In der Bot-Zentrale „3 Map-Ideen entwickeln“ wählen. Die Live-Option oben entscheidet, ob aktuelle Roblox-Daten erforderlich sind. Ohne Live-Option kombiniert die lokale Automatik redaktionell geprüfte Beschreibungen aus fünf Tycoon-Referenzen. Mit Live-Option werden frische passende Beobachtungen ergänzt und die bevorzugte Designwelt von der meistgespielten passenden Referenz beeinflusst. Zahlen gelten nur für den Abruf; sie belegen keine Erfolgsursachen.

Jede Karte zeigt ein eigenes Konzept, drei oder mehr Referenzen und den Bauplan. „Diese Idee bauen & ZIP laden“ baut genau eine Produktions-Tycoon-Adaption mit den vorhandenen MapForge-Systemen. Eigene Namen und bestehende Shop-IDs bleiben erhalten. Das Startpaket enthält Map-Idee-und-Referenzen.md. Neue NPC-, Koch-, Transport- oder Freibaumechaniken stehen ausdrücklich unter späteren Ausbauideen und sind nicht implementiert.

Die Option „Eigene Tycoon-Idee aus mehreren Referenzen entwickeln“ im normalen Bot-Auftrag wählt selbst ein Konzept; ein ausdrücklicher Designwunsch wird berücksichtigt. Es gibt keine direkte Sprachmodellverbindung.

## Neues Spiel-Overlay
Cash, Tresor und Kristalle stehen in getrennten Karten rechts oben. Darunter sind Produktion, Ausbaufortschritt und genau ein nächstes Ziel. „Ziel zeigen“ markiert den Ausbau; bei Abholbedarf führt die Aktion zum Tresor. Das Fabrikmenü ist einklappbar, besitzt erklärende Untertitel und scrollt auf kleinen Ansichten. Die Roblox-Safe-Area bleibt aktiv. Echtes Touch-, Chat-, Playerlist- und Studio-Verhalten prüfen.

Nach dem Update die Map neu exportieren und diese Datei in Studio öffnen. Eine bereits geöffnete alte .rbxlx-Datei wird durch das Website-Update nicht verändert.


## Only Up und Events (3.22.0)

Im Modus Obby unter „Dein Weg nach oben“ Only Up wählen. 96/144/240 Etappen, vier Themen und acht echte Präzisionsabschnitte. Die Höhe stammt aus der aktuellen Geometrie. „4 Only-Up-Welten laden“ erzeugt vier eigenständige Startpakete mit je 144 Etappen, Cover, Projektdatei und KI-Update. Unter Spielablauf → Events & Wettbewerb zwischen Licht-Events + Rallye, nur Licht-Events und Aus wählen. „Rallye-Arena“ zeigt die exportierte Arenageometrie separat; „Zur Map“ kehrt zur Hauptvorschau zurück.

Im Roblox-Spiel führt das Terminal am Start in die Arena. Am mittleren Startfeld beginnt während aktiver Events der Zeitlauf. Acht Signale in der angezeigten Reihenfolge vor Ort bestätigen. Persönliche Bestzeit und Top 5 gelten für dieselbe Route in dieser Serverrunde. Die Eventanzeige unten öffnet Regeln, Restzeit und Ergebnisse. Lichteffekte lassen sich dort abschalten. Keine dauerhafte oder globale Bestenliste. Only-Up-Stürze unter den gesicherten Checkpoint lösen früher den normalen Respawn aus. Alle neuen Laufzeitfunktionen müssen noch in Roblox Studio mit mehreren Spielern und auf echten Geräten getestet werden.
