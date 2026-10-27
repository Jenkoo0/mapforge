# MapForge 1.0 — Dein Start

MapForge erzeugt eigene Roblox-Obby-Parcours aus vier parametrischen Designs.
Du erhältst bearbeitbare Bauteile und Skripte als `.rbxlx` für Roblox Studio.
Die Vorschau zeigt die erzeugte Geometrie; sie simuliert keine Roblox-Physik.

## In fünf Minuten anfangen

1. Öffne den Map-Generator. Wähle Cloud Kingdom, Neon District, Molten Canyon oder Lost Islands.
2. Starte mit 24–36 Abschnitten, normaler Schwierigkeit und einem Checkpoint alle fünf Abschnitte.
3. Passe den Seed an, um eine andere Variante zu erzeugen. Gleiche Einstellungen erzeugen dieselbe Map.
4. Öffne den Qualitätscheck und behebe rote Meldungen. „Sichere Korrekturen“ begrenzt problematische Einstellungen.
5. Wähle „Studio-Export“. Öffne die heruntergeladene `.rbxlx` in Roblox Studio auf Windows oder macOS.

Du kannst am Handy konfigurieren und Dateien herunterladen. Roblox Studio muss auf einem Computer laufen.

## Map-Referenzen

- **Island Jump / Roblox:** gestaffelte Inseln, sichtbare Ziele und der Übergang vom einfachen Layout zur Umgebung.
  https://create.roblox.com/docs/tutorials/curriculums/core/building/apply-polished-assets
- **Modulare Umgebungen / Roblox:** kombinierbare Bauteile mit konsistenten Maßen.
  https://create.roblox.com/docs/tutorials/use-case-tutorials/modeling/assemble-modular-environments
- **Greyboxing / Roblox:** Laufwege und Größen zuerst prüfen, anschließend Details ergänzen.
  https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment
- **Tower of Hell:** Genre-Referenz für kurze Obby-Abschnitte. MapForge verwendet eigene Formen und eine eigene Route mit Checkpoints.
  https://www.roblox.com/games/1962086868/Tower-of-Hell

Es werden keine fremden Karten, Bilder, Skripte oder Store-Assets kopiert.

## Was automatisch entsteht

- 12–80 Abschnitte mit Start, Ziel und wiederkehrenden Checkpoints.
- Spiralförmige Inselwege oder gewundene Stadt-/Canyon-Parcours.
- Rotierende Gefahren, zeitgesteuerte Pulshindernisse, Hürden und Slalom-Blöcke.
- Passende Wolken, Bäume, Felsen oder Gebäude je nach Design und Detailgrad.
- Münzen pro Spieler, Fortschrittsanzeige, Respawn und eine Leuchtspur zum Erspielen.
- Optionale Developer Products für einen 15-Minuten-Münzboost und 500 Münzen.
- Serverprüfung von Distanz und Fortschrittsreihenfolge sowie einfache Zeitgrenzen.
- Startprüfung markierter Bauteile mit konservativen Korrekturen.

Das ist ein Vorlagen-Generator. Das Textbriefing erkennt Design, Schwierigkeit und Anzahl anhand von Stichworten. Es programmiert keine beliebigen neuen Spielideen und benötigt keinen KI-API-Schlüssel.

## Erstes Spiel in Studio

1. Studio installieren: https://create.roblox.com/
2. Über das Datei-Menü die `.rbxlx` aus `examples/` oder deinem Export öffnen.
3. Play starten. Über Window/Ansicht das Output-Fenster öffnen.
4. Von Start bis Ziel spielen. Nicht nur in der Vorschau nachsehen.
5. Beim Testen sterben und prüfen, ob der letzte Checkpoint funktioniert.
6. Unter den Testwerkzeugen einen Server mit zwei Spielern starten. Münzen müssen je Spieler separat vergeben werden.
7. Den Geräteemulator und anschließend ein echtes Handy testen.

Steuerung im Spiel: normales Roblox-Inputsystem mit dem in MapForge gewählten Bewegungsprofil. In den Profilen Erkunden und Parkour: linke Umschalttaste halten oder L3/Touch-Sprint zum Umschalten antippen. Tempo und Sprungkraft stehen in Spielerbewegung.md des Startpakets. Der Shop ist ein freiwilliger Button oben rechts. „Neustart“ benötigt einen zweiten Tipp und beginnt die Runde erneut; Münzen bleiben erhalten. Eine erfolgreiche Runde gibt 50 Münzen.

## Speichern einrichten

Veröffentliche zuerst einen **separaten privaten Testplatz** in deinem eigenen Roblox-Konto.
Aktiviere für diesen Testplatz unter den Sicherheitseinstellungen den Studio-Zugriff auf API-Dienste, wenn du Speichern aus Studio testen möchtest. Studio kann dabei echte DataStores dieses Spiels verändern.

Ohne API-Zugriff oder in einer unveröffentlichten Studio-Datei läuft MapForge mit einem temporären Demo-Profil. Echte Käufe bleiben dann gesperrt. Im veröffentlichten Spiel wird bei einem fehlgeschlagenen Profil-Ladevorgang kein leeres Ersatzprofil angelegt.

Speicherung: Autosave etwa alle 45 Sekunden und beim Verlassen. Eine Session-Sperre schützt Profile gegen gleichzeitige Bearbeitung durch zwei Server. Eine abgebrochene Sitzung kann bis zum Ablauf der 180-Sekunden-Sperre blockieren.

Bei unklarem Ausgang eines Schreibvorgangs bleibt dieselbe Transaktion ausstehend. Weitere Änderungen werden angehalten, bis die ausstehende Transaktion geklärt ist. So kann ein gespeicherter Kauf mit verlorener Netzwerkantwort nicht durch einen späteren Stand überschrieben werden.

Gewöhnlicher, noch nicht gespeicherter Spielfortschritt kann bei einem abrupten Serverabbruch verloren gehen. Kaufbelohnungen werden erst bestätigt, nachdem Belohnung und Beleg gemeinsam gespeichert wurden.

## Robux-Shop einrichten

1. Das Spiel im eigenen Konto veröffentlichen.
2. Im Creator Hub dein Spiel öffnen → Monetization → Developer Products.
3. Zwei **verschiedene Produkte in genau diesem Spiel** anlegen: „15 Minuten 2× Münzen“ und „500 Münzen“.
4. Preise im Creator Hub festlegen. Das Spiel fragt den aktuellen Preis auf dem Client bei Roblox ab; es zeigt keine fest einprogrammierten Robux-Preise.
5. Die Produkt-IDs unter „Monetarisierung“ in MapForge eintragen und übernehmen.
6. Eine neue Studio-Datei exportieren und im richtigen Spiel veröffentlichen. Alternativ im Explorer `ReplicatedStorage → MapForgeConfig` dieselben IDs setzen.
7. Mit einem getrennten Testspiel die tatsächliche Kaufabwicklung und einen erneuten Belegaufruf prüfen. Tests mit echten Käufen können Robux kosten; Bedingungen des jeweiligen Roblox-Testmodus prüfen.

Wichtig für Updates: Bereits verwendete Produkt-IDs weiterhin in der Kaufverarbeitung erhalten. Offene alte Belege müssen weiter verarbeitet werden können. Der Wallet-Speicher bleibt innerhalb desselben Roblox-Spiels gleich, auch wenn du Seed, Design oder Route änderst. Der `RouteKey` erkennt eine neue Route und setzt nur den unpassenden Checkpoint zurück; Münzen, Leuchtspur, Siege, Kaufbelege und verbleibender Boost bleiben erhalten. Ein vollständig neues Roblox-Spiel hat einen eigenen Speicher und eigene Produkte.

Die Leuchtspur kostet 250 erspielte Münzen. Bezahlte Angebote sind optional. Die Map enthält weder Kaufzwang noch automatisch aufspringende Kaufdialoge.

Entwickler-Dokumentation:
https://create.roblox.com/docs/production/monetization/developer-products
https://create.roblox.com/docs/cloud-services/data-stores/player-data-purchasing

## Fehlersuche

- **DataStore / API-Zugriff:** Testplatz veröffentlichen, Berechtigungen und API-Einstellungen prüfen.
- **SESSION_BUSY:** Andere Sitzung schließen und kurz warten. Die aktive Session-Sperre nicht manuell löschen.
- **Infinite yield / fehlendes Objekt:** Die vollständige Datei verwenden und Namen im Explorer prüfen. `MapForgeConfig` muss in ReplicatedStorage liegen.
- **Unbekannte Produkt-ID:** Eigene Produkte desselben Spiels eintragen; niemals unbekannte Belege pauschal mit PurchaseGranted bestätigen.
- **Syntaxfehler:** Die erste rote Meldung mit Zeile und Stacktrace kopieren. In Studio Script Analysis öffnen.
- **Niedrige FPS:** Detailgrad reduzieren und auf dem tatsächlichen Gerät testen. Die Bauteilzahl allein ist kein FPS-Benchmark.

Der Log-Check läuft lokal und nutzt bekannte Fehlersignaturen. Er verändert keinen fremden Code. Das Health-Skript korrigiert ausschließlich markierte MapForge-Geometrie: Verankerung sowie grundlegende Touch-/Kollisionseinstellungen. Es meldet fehlende Abschnitte und auffällige Sprünge, erfindet aber keine fehlenden Spielsysteme.

## Veröffentlichen

Datei → Auf Roblox veröffentlichen. Anschließend im Creator Hub Zielgruppe und Maturity & Compliance einstellen. Roblox passt Freigabeanforderungen an; prüfe deshalb die aktuelle Seite für dein Konto und deine Zielgruppe:
https://create.roblox.com/docs/production/publishing/publish-games-and-places

MapForge ist nicht mit deinem Roblox-Konto verbunden. Es lädt keine Dateien automatisch in dein Konto und veröffentlicht kein Roblox-Spiel. Das Werkzeug selbst und seine Downloads kannst du über den bereitgestellten Link verwenden.

## Prüfung dieser Lieferung

Generator: 360 Kombinationen aus Design, Schwierigkeit, Größe und Seed auf vollständige Strecken, Start/Ziel, Checkpoints und konservative Sprunggrenzen geprüft. Exportdateien auf gültiges XML und Skriptstruktur geprüft. Die Lua-kompatible Syntax aller vier Laufzeitskripte sowie das reale Datenmodul mit simulierten Speicherfehlern, doppelten Belegen, verlorenen Antworten und Session-Wechseln geprüft.

Noch nicht ausgeführt: Öffnen in Roblox Studio, echte Roblox-Physik, Mehrspieler, reales Handy, echte DataStores und Kaufabwicklung. Eine Browser-Sichtprüfung der Werkzeugoberfläche war in der verfügbaren Umgebung ebenfalls nicht möglich; die Geometrievorschau wurde separat gerendert und angesehen.

MapForge ist ein eigenständiges Werkzeug, kein offizielles Roblox-Produkt. Erst testen, dann mit Spielern und Monetarisierung starten.


## Only Up und Events (3.22.0)

Im Modus Obby unter „Dein Weg nach oben“ Only Up wählen. 96/144/240 Etappen, vier Themen und acht echte Präzisionsabschnitte. Die Höhe stammt aus der aktuellen Geometrie. „4 Only-Up-Welten laden“ erzeugt vier eigenständige Startpakete mit je 144 Etappen, Cover, Projektdatei und KI-Update. Unter Spielablauf → Events & Wettbewerb zwischen Licht-Events + Rallye, nur Licht-Events und Aus wählen. „Rallye-Arena“ zeigt die exportierte Arenageometrie separat; „Zur Map“ kehrt zur Hauptvorschau zurück.

Im Roblox-Spiel führt das Terminal am Start in die Arena. Am mittleren Startfeld beginnt während aktiver Events der Zeitlauf. Acht Signale in der angezeigten Reihenfolge vor Ort bestätigen. Persönliche Bestzeit und Top 5 gelten für dieselbe Route in dieser Serverrunde. Die Eventanzeige unten öffnet Regeln, Restzeit und Ergebnisse. Lichteffekte lassen sich dort abschalten. Keine dauerhafte oder globale Bestenliste. Only-Up-Stürze unter den gesicherten Checkpoint lösen früher den normalen Respawn aus. Alle neuen Laufzeitfunktionen müssen noch in Roblox Studio mit mehreren Spielern und auf echten Geräten getestet werden.
