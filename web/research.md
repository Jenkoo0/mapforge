# MapForge: Recherche und Qualitätsplan

Recherche- und Prüfdatum: **24. Oktober 2026, Europe/Berlin**. Ausgangspunkt des Quellcode-Audits: MapForge **3.13.0**. Die Umsetzung anderer Arbeitspakete kann diesen Ausgangsstand inzwischen verändert haben. Dieses Dokument trennt geprüfte Quellen, im Code beobachtete Eigenschaften, begründete Entscheidungen und noch zu testende Hypothesen.

Der Auftrag lautet, die App professioneller und ihre Maps deutlich besser zu machen. Dafür braucht es überprüfbare Layoutqualität, klare Gestaltung, zuverlässige Exporte und einen verständlichen Arbeitsablauf. Eine größere Bauteilzahl oder eine Trend-Anlehnung beweist keine bessere Map. **Diese Recherche enthält keinen neuen Roblox-Studio-Spieltest und keine Garantie für Optik, Erreichbarkeit, FPS, Spielerbindung oder Einnahmen.**

Während dieser Arbeitsrunde wurden zusätzlich das neue `web/quality-report.js` und der daraus erzeugte `Studio-Map-Audit.lua`-Quelltext gelesen. Das neue Dossier berechnet konkrete Geometriekennzahlen und beschreibt den Studio-Test. Der Export schreibt nun `CanQuery` gezielt und reduziert Schatten kleiner Dekoration. Das Studio-Audit bleibt hier eine geprüfte Skriptquelle: Es wurde noch nicht in Roblox ausgeführt. Die unten als Ausgangsbefund beschriebenen Lücken erklären den Änderungsbedarf; sie behaupten nicht, dass alle Lücken nach Abschluss der parallelen Umsetzung unverändert bestehen.

## 1. Tatsächlich untersuchter Ausgangsstand

Gelesen wurden die aktuellen Abschnitte und Architektur-/Erhaltungsregeln der `UEBERGABE-KI.md`, `package.json` sowie die für diese Recherche relevanten Implementierungen: `engine.js`, `tycoon.js`, `geometry.js`, `preview.js`, `preview-state.js`, `visual-checks.js`, `playability.js`, `walkthrough-core.js`, `bot-core.js`, `idea-core.js`, `trend-core.js`, `improve.js`, `review-kit.js`, `launch.mjs`, `preview-dev.mjs`, `scripts/build.sh` und die Lua-/XML-Prüfwerkzeuge. Historische Testberichte in der Übergabe wurden als historische Berichte behandelt, nicht als hier erneut ausgeführte Tests.

| Ebene | Im Ausgangsstand beobachtet | Konsequenz |
| --- | --- | --- |
| Web-App | Browser-Anwendung mit JavaScript-Modulen, HTML und CSS; `package.json` benötigt für die App selbst keine Framework-Abhängigkeiten. | Verbesserungen lassen sich gezielt ergänzen, ohne einen vollständigen Framework-Wechsel vorauszusetzen. |
| Geometrie | Seed-basierte, deterministische Generatoren für Obby und Produktions-Tycoon. Tycoon: vier Themen, drei Layouts, zwei bis sechs Grundstücke, 48 feste Ausbaustufen; Obby: 12 bis 80 Abschnitte. | Die App ist ein spezialisierter parametrischer Generator. Freie neue Spielgenres sind keine vorhandene Funktion. |
| Vorschau | Canvas projiziert dieselben Positions-, Maß-, Rotations- und Formdaten wie der Export. Fortschrittsfilter können leeres Grundstück, Zwischenstand oder Vollausbau zeigen. | Vorschau und Export haben eine gemeinsame Datenbasis; Material, Beleuchtung, Avatarbewegung und Sichtbarkeit werden im Browser vereinfacht dargestellt. |
| Prüfung | Obby bewertet benachbarte Plattformlücken und Anstieg. Tycoon prüft Rollen, Ausbauzuordnung, Budget, Daten und reservierte Hauptwege gegen rotierte Bounding-Boxen. | Das sind sinnvolle Datenprüfungen, aber keine vollständige Navigations- oder Physiksimulation. |
| Export | Vollständiges `.rbxlx` mit Parts, SpawnLocation, Metadaten, Material-/Lichtwerten und Laufzeitskripten; Browser-ZIP mit Dokumentation und Projektdatei. | Es muss die tatsächliche Geometrie exportiert werden. Eine Bildschirmvorschau oder eine Dateianforderung bestätigt keinen Studio-Import. |
| Spielsysteme | Serverlogik für Eigentum, Wirtschaft, Fortschritt und Kaufbelege; getrennte Studio-/Live-Datenspeicher; Studio-Testhelfer mit serverseitigen Schranken. | Eine optische Verbesserung darf stabile Upgrade-IDs, Produkt-IDs, Guthaben und Kaufbeleglogik nicht verändern. |
| Ideen und Trends | Redaktionelle Referenzen plus zeitlich gekennzeichnete öffentliche Metadaten; regelbasierte Übertragung auf vorhandene Vorlagen. | Aktive Spielerzahlen beschreiben eine Beobachtung, keinen nachgewiesenen Erfolgsfaktor. |
| Lokale Überarbeitung | Regelbasierte Änderungen sowie exportierbares KI-Prüfpaket und streng begrenzter, revisionsgebundener JSON-Rückimport. | Vorhandene reversible Änderungen und Identitätsschutz weiterverwenden. |
| Auslieferung | `launch.mjs` verwendet den eingebetteten Worker; `preview-dev.mjs` liest Web-Dateien direkt und delegiert Trends an den Worker. | Nach Web-Änderungen Worker neu erzeugen; sonst können lokale Starts einen älteren Stand zeigen. |

### Konkrete Grenzen der bisherigen Datenprüfung

- Die Prüfung „ein Spawn vorhanden“ beweist weder freien Kopfraum noch eine tragfähige Standfläche oder einen erreichbaren ersten Interaktionspunkt.
- Freie rechteckige Korridore beweisen keine zusammenhängende begehbare Oberfläche. Die Ausgangsprüfung untersucht Hindernisse in einem bestimmten Höhenbereich und kann beispielsweise Bodengaps, entfernte Ziele oder Kameraengstellen übersehen.
- Benachbarte Plattformabstände allein erkennen keine globale Selbstüberschneidung eines langen Obby, keine bewegte Gefahr in der Sprungbahn und keinen unbeabsichtigten Shortcut.
- Die Ausgangsbudgets von 800 Obby- bzw. 5.200 Tycoon-Teilen sind eigene Produktgrenzen. Sie sind keine allgemeinen Roblox-FPS-Grenzwerte.
- Viele dekorative Parts sind bereits nicht kollidierend; `CanQuery` wurde im untersuchten Ausgangsexport noch nicht explizit geschrieben. Licht- und Schattenaufwand wird nicht allein durch die Zahl der Parts beschrieben.
- Sichtbare UI-Bestätigungen, das Spieltest-Labor und historische Harness-Ergebnisse müssen weiterhin als unterschiedliche Evidenzarten erkennbar sein.

## 2. Was „prozedural“ und „KI“ hier bedeuten

**Prozedural:** Aus einer normalisierten Konfiguration entstehen über feste Regeln und einen Seed Geometrie und Spielkonfiguration. Derselbe Seed mit derselben Generatorversion und denselben Einstellungen soll dasselbe Ergebnis ergeben. Stilvariation, Namensautomatik und Regelreparaturen benötigen dafür kein Sprachmodell.

**Redaktionelle Inspiration:** Entwickler wählen Referenzen, beschreiben übertragbare Muster und kombinieren sie zu eigenen Entwürfen. Die App analysiert damit nicht automatisch die tatsächliche Spielmechanik einer fremden Experience.

**Live-Metadaten:** Öffentliche Namen, Beschreibungen und Spielerzahlen können eine passende vorhandene Vorlage beeinflussen. Das ist eine nachvollziehbare Heuristik. Ohne direkte Spielbeobachtung lassen sich daraus keine Ursachen für Erfolg, Qualität oder Monetarisierung ableiten.

**Externe KI-Prüfung:** Das vorhandene Paket übergibt Geometrie, Konfiguration und echte Canvas-Ansichten an einen externen Chat. Ein Rückimport darf nur erlaubte Parameter ändern und muss weiter gegen die ursprüngliche Revision geprüft werden. Das ist kein in der App laufender Modellaufruf.

Im geprüften Ausgangsstand besteht **keine direkte Sprachmodell-Verbindung**. Eine spätere Anbindung wäre ein eigenes Arbeitspaket mit Backend, sicherer Schlüsselverwaltung, begrenztem strukturiertem Ausgabeformat, Kostenkontrolle, nachvollziehbarer Auswertung und menschlich prüfbaren Ergebnissen. Ein Modellversprechen ersetzt weder Generatorinvarianten noch Roblox-Tests.

## 3. Recherchierte Entscheidungen nach Priorität

### P0: Spielbare Struktur und Exportkonsistenz

Roblox empfiehlt, die räumliche Struktur zunächst mit einfachen Formen zu erproben, einschließlich Maßstab, Orientierung und unfairer Vorteile. Daraus folgt für MapForge: **Grundriss und Wege müssen vor Dekoration gültig sein.** Die Map benötigt einen freien Start, einen sichtbaren ersten Schritt und zusammenhängende Hauptwege. Die konkrete Breite einer MapForge-Promenade ist eine eigene Entscheidung und muss mit dem Avatar geprüft werden. [Greybox your environment](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment)

Ausbaustände sollten getrennt geprüft werden: Start, früher Ausbau, mittlerer Ausbau und Vollausbau. Neue Gebäude dürfen bestehende Laufwege und Interaktionen nicht verdecken. Der Generator kann dafür zulässige Bauzellen und geschützte Laufzonen verwenden. Höhe, Materialwechsel und Landmarken sollen die Orientierung unterstützen; der offizielle Weltbau-Kurs zeigt diese gestalterischen Mittel. [Construct your world](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/construct-your-world)

Spawnpunkte müssen als echte `SpawnLocation` exportiert werden. Für einen neutralen Start ist `Neutral=true` passend. Teamspawns benötigen echte Teamobjekte und passende `TeamColor`-Werte; die sichtbare Partfarbe stellt diese Zuordnung nicht her. Die bestehende neutrale Lösung muss nicht ohne Spielgrund auf Teams umgebaut werden. [Implement teams](https://create.roblox.com/docs/players/teams), [SpawnLocation](https://create.roblox.com/docs/reference/engine/classes/SpawnLocation)

**MapForge-Entscheidung:** Exportdaten erhalten explizite Rollen für begehbare Flächen, Hindernisse, Interaktionen und reine Dekoration. Prüfung und Export sollen dieselbe Bedeutung verwenden. Harte Fehler benötigen konkrete Objekt-/Zielnamen und eine verständliche Begründung. Ein zusammengefasster Qualitätsscore darf die einzelnen Fehler und offenen Studio-Tests nicht verdecken.

### P0: Reproduzierbarkeit und verständlicher Arbeitsablauf

**Eigene Softwareentscheidung:** Eine Qualitätskorrektur muss vor der Übernahme eine konkrete Änderung zeigen, auf dieselbe Konfiguration gebunden sein und sich zurücknehmen lassen. Name, Seed und Shop-IDs bleiben bei einer reinen Layoutkorrektur stabil. Ein Export wiederholt keinen Bau und würfelt keine neue Map aus.

**Eigene UX-Entscheidung:** Der Hauptablauf wird an den vorhandenen Funktionen ausgerichtet: Wunsch → passende vorhandene Vorlage → Geometrie → konkrete Prüfung → Vorschau → Export → echter Studio-Test. Ladezustand, Trendfehler, Exportfehler und fertige Datei benötigen unterscheidbare Meldungen. „Datei erstellt“ und „auf dem Computer gespeichert“ sind verschiedene Ergebnisse. Diese Entscheidungen ergeben sich aus der App-Architektur und dem in der Übergabe beschriebenen Nutzerverhalten, nicht aus einer Roblox-Vorgabe.

### P1: Performance mit kontrollierten Details

Statische Objekte sollen verankert bleiben. Reine Dekoration benötigt normalerweise weder physische Kollisionen noch Touch-Ereignisse; für nicht interaktive Objekte empfiehlt Roblox auch das Abschalten von Queries. Bei Meshes sind einfache Kollisionsformen günstiger als präzise Zerlegung. Daraus folgt: Deko getrennt von Böden, Deckung und Interaktionszielen behandeln, nicht pauschal alle Objekte deaktivieren. [Improve performance](https://create.roblox.com/docs/performance-optimization/improve), [Collisions](https://create.roblox.com/docs/workspace/collisions)

`CanQuery=false` ist eine bewusste Entscheidung: Ein so markiertes Objekt ist bei üblichen Raycasts kein Ziel mehr. Spielbare Oberflächen und Objekte, die Auswahl oder Treffererkennung brauchen, müssen entsprechend erreichbar bleiben. Bei Streaming können clientseitige Raycasts entfernte, noch nicht geladene Objekte ohnehin nicht zuverlässig treffen. [Raycasting](https://create.roblox.com/docs/workspace/raycasting)

**Eigene Umsetzungshypothese:** Ein ausführlicheres Budget zeigt Parts, kollidierende Parts, Schattenwerfer, lokale Lichter und transparente Teile. Hohe Dichte und überlagerte Transparenzen verdienen Aufmerksamkeit. Diese Zähler helfen beim Vergleich zweier Varianten; sie sind keine gemessenen Draw Calls oder FPS. Wenn eine Variante das Budget erreicht, zuerst kleine Nebenobjekte und unauffällige Schatten reduzieren, bevor die begehbare Struktur leidet.

### P1: Streaming und räumliche Modellstruktur

Roblox-Streaming lädt Inhalte nach Bedarf und kann Speicher und Startzeit verbessern. `StreamingEnabled` sowie mehrere Radien-/Integritätseinstellungen sind nicht durch normale Laufzeitskripte änderbar. **Wichtig für den bestehenden Export:** Das Schreiben einer Workspace-Eigenschaft in eine `.rbxlx`-Datei ist von einer Lua-Zuweisung im laufenden Spiel zu unterscheiden. Der vorhandene XML-Export darf Streaming-Einstellungen enthalten; seine tatsächliche Interpretation bleibt in Studio zu prüfen. [Instance streaming](https://create.roblox.com/docs/workspace/streaming), [Workspace API](https://create.roblox.com/docs/reference/engine/classes/Workspace)

Die offizielle Anleitung nennt unter anderem `Improved`, `PauseOutsideLoadedArea`, MinRadius 64, TargetRadius 1024 und `Opportunistic`. Sie empfiehlt räumlich kleine logische Modelle und einen sparsamen Umgang mit `Persistent`. Der Ausgangsexport nutzt TargetRadius 256. **Eigene Entscheidung:** Diesen Wert nicht blind ersetzen: 1024 ist eine aktuelle allgemeine Empfehlung, 256 eine bewusst zu vergleichende MapForge-Einstellung. Große Sammelmodelle sollen nicht pauschal `Atomic` oder `Persistent` werden. [Streaming techniques](https://create.roblox.com/docs/workspace/streaming/techniques)

### P1: Licht und Art Direction

Licht muss zum Thema passen und Wege, Spielfiguren und Hinweise lesbar halten. Die aktuelle Dokumentation beschreibt `LightingStyle.Realistic` und `Soft`; `ShadowSoftness` wirkt beim realistischen Stil. Ein helleres Bild ist nicht automatisch besser. Profile für Morgenlicht, Neon oder Vulkan sind eine gestalterische Auswahl, deren Werte an echten Szenen verglichen werden müssen. [Global lighting](https://create.roblox.com/docs/environment/lighting)

Bloom, Farbanpassung, Tiefenschärfe und andere Effekte sind dokumentierte Werkzeuge zur Stimmungsgestaltung. **Eigene Hypothese:** Moderates Bloom und zurückhaltende Farbanpassung bewahren in dieser App mehr Kontrast als eine starke globale Aufhellung. Eine spielbare Standardansicht sollte wichtige Ziele auch bei niedriger Grafik erkennen lassen. Ein Browser-Canvas kann diese Engine-Wirkung nicht bestätigen. [Post-processing effects](https://create.roblox.com/docs/environment/post-processing-effects)

`Lighting.Technology` ist inzwischen als deprecated dokumentiert. Der vorhandene Legacy-XML-Eintrag darf deshalb nicht unbesehen als aktuelle Standard-API verkauft oder entfernt werden: Er wurde laut Übergabe wegen eines beobachteten Importverhaltens ergänzt. Beim Thema `LightingStyle` besteht eine Dokumentationsabweichung: Der Light-Sources-Guide nennt eine Änderung über Properties, der aktuelle Klassen-Eintrag führt kein `Not Scriptable`-Tag auf. Export und Anleitung sollen daher nicht von einer ungeschützten Runtime-Zuweisung abhängen. [Lighting API](https://create.roblox.com/docs/reference/engine/classes/Lighting), [Light sources](https://create.roblox.com/docs/effects/light-sources)

### P1: Verständlicher Einstieg und zugängliches HUD

Roblox beschreibt für den Einstieg grundlegende Steuerung, einen schnell erlebbaren Nutzen und sichtbare weitere Ziele. Für den bestehenden Tycoon passt daher die schon vorhandene Abfolge Gratis-Starter → Produktion → Tresor → nächster Ausbau. **Eigene Qualitätsanforderung:** Der erste Punkt muss ohne Suche in mehreren Menüs auffindbar sein. Ein anderer Mensch soll die nächste Aktion aus Spielerhöhe verstehen. [Onboarding](https://create.roblox.com/docs/production/game-design/onboarding)

Die wiederkehrenden Aktionen und ihr Fortschritt müssen auch räumlich verständlich sein: eine Produktionsstraße kann den Ausbau zeigen, ein Campus kann verwandte Funktionen gruppieren. Diese Übertragung auf die drei vorhandenen Layouts ist eine Designentscheidung. Die Roblox-Dokumentation zu Kernschleifen liefert dafür das Prinzip, nicht einen fertigen MapForge-Grundriss. [Core loops](https://create.roblox.com/docs/production/game-design/core-loops)

Das HUD muss sichere Bildschirmbereiche, Touch-Steuerung, Chat und kleine Querformate berücksichtigen. `ScreenGui` bietet dafür unter anderem `ScreenInsets`, `SafeAreaCompatibility` und `ClipToDeviceSafeArea`. Ob die konkrete Anordnung funktioniert, kann nur im tatsächlichen Client geprüft werden. [ScreenGui API](https://create.roblox.com/docs/reference/engine/classes/ScreenGui)

Optionale Kaufhinweise dürfen den Einstieg nicht verdrängen. Die offizielle Beschreibung betont den passenden Kontext und die Gefahr zu vieler Unterbrechungen. Bereits vorhandene Zeit-/Fortschrittsschranken können erhalten bleiben; konkrete Sekundenwerte und erwartete Kaufwirkung sind weiterhin eigene Hypothesen. [Contextual purchases](https://create.roblox.com/docs/production/game-design/contextual-purchases)

### P2: Terrain und zusätzliche Spielmechaniken

Für organische Landschaften ist Roblox-Terrain eine spätere sinnvolle Erweiterung. Es gibt primitive Füllmethoden, prozedurale Erzeugung sowie Heightmap-/Colormap-Import. **Eigene Reihenfolge:** Zunächst die vorhandenen Parts und Routen verlässlich verbessern; ein neuer Terrain-Exporter verändert Geometrie, Vorschau und Prüfung gemeinsam und sollte separat eingeführt werden. [Environmental terrain](https://create.roblox.com/docs/parts/terrain)

`WriteVoxels` verlangt ein 4-Stud-Raster, dazu passende dreidimensionale Material-/Occupancy-Arrays und begrenzte Regionen; dokumentiertes Maximum sind 4.194.304 Voxels pro Aufruf. Diese Anforderungen müssen beim späteren Chunking beachtet werden. `Terrain:Clear()` löscht den gesamten Terrain-Inhalt und ist daher keine geeignete pauschale Aktualisierungsstrategie für bestehende Nutzerplätze. [Terrain API](https://create.roblox.com/docs/reference/engine/classes/Terrain)

NPC-Restaurants, freie Bauplatzierung, echte Lieferketten und Fahrgeschäfte sind weiterhin zusätzliche Systeme. Eine Referenzkarte darf sie als Idee benennen, aber ein vorhandener Produktions-Tycoon darf dafür keine implementierte Simulation behaupten.

## 4. Überprüfbare Kriterien für bessere Maps

Die folgenden Kriterien sind ein **eigener Abnahmevorschlag**. Wo keine tatsächliche Engine- oder Spielerprüfung vorliegt, bleibt der Status offen.

| Kriterium | Im Generator prüfbar | Zusätzlich in Studio/Client prüfen |
| --- | --- | --- |
| Start | Genau definierter Spawn, Boden darunter, geschützter Raum, Abstand zu Hindernissen. | Avatar spawnt ohne Sturz oder Feststecken; Kamera zeigt einen verständlichen ersten Schritt. |
| Wege | Zusammenhängende Boden-/Routendaten, Mindestbreite, Kopfbereich, blockierende Bounding-Boxen. | Standardavatar läuft vom Spawn zu Claim, Tresor und jedem notwendigen Kauf; kein Hängenbleiben an Kanten. |
| Obby | Positive Größen, kontrollierte Kantenlücken/Höhen, Checkpoints, Selbstüberschneidungen und geschützte Landeflächen. | Alle Sprünge ohne Boost mit der tatsächlichen Sprungkonfiguration; bewegte Gefahren und Respawn prüfen. |
| Ausbau | Alle 48 IDs zugeordnet; jedes Interaktionsfeld vorhanden; geschützte Wege in mehreren Fortschrittsständen. | Normaler Aufbau und separat Vollausbau; verdeckte Schilder, Reichweiten und Kameraengstellen prüfen. |
| Orientierung | Markante Zonen, Materialfamilien, klare Beschriftungsrollen. | Neue Tester erkennen Standort und nächstes Ziel ohne Entwicklererklärung. |
| Optik | Konsistente Farb-/Materialprofile, Höhenstaffelung, begrenzte Kleinteile und Überlappungen. | Spielerhöhe, helle/dunkle Blickrichtungen, hohe/niedrige Grafik, verschiedene Tagesstimmungen. |
| Leistung | Umfang, Dichte und grobe Kostenindikatoren. | Framezeiten, Speicher, Join-Zeit, Stream-in und längere Mobile-Sitzung messen. |
| Exporttreue | Determinismus, endliche Werte, IDs/Referenzen, Form-/Rotationswerte, Scripts und Paketdateien. | Frische `.rbxlx` in dokumentierter Studio-Version öffnen; Importdialoge und Output erfassen. |
| Mehrspieler | Rollen und serverseitige Eigentumsprüfungen strukturell/harnessbasiert testen. | Zwei Spieler gleichzeitig; Claim-Rennen, fremde Tresore, Rejoin und frei werdende Plätze. |
| Bedienung | Beschriftungen, Zustände und responsive Grenzfälle automatisiert prüfen. | Touch, Chat, Playerlist, echte Textumbrüche, Safe Insets und Gerätewechsel. |

Ein einziges „alles grün“ ist unpassend, solange echte Tests offen sind. Die App sollte mindestens **Datenprüfung**, **Browserprüfung**, **Lua-/Luau-Prüfung** und **tatsächlichen Roblox-Spieltest** getrennt ausweisen.

## 5. QA-Roadmap und sinnvolle Messungen

### Stufe A: Reproduzierbare lokale Prüfungen

1. Eine feste Konfigurationsmatrix für vier Themen, alle drei Tycoon-Layouts, zwei/vier/sechs Grundstücke, Randwerte für Detail/Polish und mehrere Seeds erzeugen. Obby zusätzlich kurz/lang und leicht/normal/schwer prüfen.
2. Geometrieinvarianten und den tatsächlichen XML-/ZIP-Inhalt prüfen. Eine Reparatur muss weniger oder gleich viele harte Fehler erzeugen und IDs erhalten.
3. Den echten Browserablauf prüfen: Start, Ideenwahl, Änderung, Bau, Qualitätsmeldung, Export, Rücknahme und Wiederherstellung. Fehlende Trends dürfen keinen Erfolg vortäuschen.
4. Exportierte Lua-Quellen syntaktisch prüfen; vorhandene Verhaltensharnesses ausführen. Ein erfolgreicher Lauf dieser Stufe bestätigt keine Roblox-API-Semantik.

### Stufe B: Frischer Studio-Import und Spielbarkeit

Jede Hauptvariante frisch exportieren und in einem separaten Testspiel öffnen. Studio-Version, Generatorversion, Seed, Layout, Grundstückszahl und Lichtprofil festhalten. Start, normalen Ausbau und Vollausbau getrennt ansehen. Der Nutzerbericht aus Version 3.4.1 bleibt ein historischer Bericht und ist kein Nachweis für neue Exporte.

Optional kann ein ausschließlich lesender Studio-Helfer Navigation von Spawn zu zentralen Zielen mit `PathfindingService` untersuchen. Dokumentierte Standardparameter sind AgentRadius 2 und AgentHeight 5. Ein fehlgeschlagener Pfad ist ein konkreter Prüfhinweis; ein erfolgreicher Pfad ersetzt keinen Test von Avatar/Kamera/Interaktion. Roblox nennt unter anderem 3.000 Studs direkte Distanz und ein Budget von 20.000 Knoten als Grenzen. [Pathfinding](https://create.roblox.com/docs/characters/pathfinding)

Studio bietet Solo-, Client-/Server- und Mehrspieler-Modi. Für erste Eigentums-/Replikationstests sind zwei Clients sinnvoll; diese konkrete Testauswahl ist eine MapForge-Empfehlung. Geräteemulation dient der Bedien-/Darstellungsprüfung und ist noch kein echter Hardwaretest. [Studio testing modes](https://create.roblox.com/docs/studio/testing-modes)

### Stufe C: Leistung auf echten Zielgeräten

Vor Optimierungen pro Variante einen Ausgangswert erfassen: Join-Zeit, Framezeiten in dichten Bereichen und vollständigem Ausbau, Speicher sowie wahrnehmbare Streamingpausen. Für die Diagnose stehen Developer Console, MicroProfiler, Scene Analysis und Performance Stats zur Verfügung. Studio-Zahlen sind durch die Editorumgebung beeinflusst; tatsächliche Clientmessungen sind aussagekräftiger. [Identify performance issues](https://create.roblox.com/docs/performance-optimization/identify)

Ein niedrig ausgestattetes Zielgerät früh bestimmen und wiederholt verwenden. Roblox weist darauf hin, dass die Geräteemulation keine verlässliche Speichersimulation liefert. Ein allgemeines Teilebudget kann die Grenzen dieses konkreten Geräts nicht vorhersagen. [Design for performance](https://create.roblox.com/docs/performance-optimization/design)

Auf einem echten Mobilgerät eine längere aktive Sitzung einplanen; die offizielle Anleitung nennt 10–15 Minuten zum Erkennen thermischer Drosselung. Auch Touch, Netzbedingungen und langsameres Stream-in beobachten. **Eigener Abnahmevorschlag:** Keine pauschale FPS-Zusage veröffentlichen; stattdessen Gerät, Grafikstufe, Szene und Messdauer zusammen mit dem Ergebnis nennen. [Test on hardware](https://create.roblox.com/docs/performance-optimization/test-on-hardware)

### Stufe D: Tatsächliche Spielerbeobachtung

**Eigener Versuchsplan:** Zunächst fünf unabhängige neue Tester ohne Entwicklererklärung beobachten. Notieren: Zeit bis zum Gratis-Starter, erste Abholung, erste Orientierungspause, größter Frustpunkt, freiwilliges nächstes Ziel und ungeplante Abkürzungen. Fünf Personen sind eine praktikable erste Suchrunde, keine statistische Erfolgsschwelle. Danach genau eine wichtige Änderung vergleichen. Rückkehrabsicht ist keine gemessene D1-Retention; beobachtete Freude ist keine Umsatzprognose.

## 6. Windows-Portabilität der Lua-Prüfung

### Ausgangsbefund am 24.10.2026

Das ursprüngliche `tools/check-lua.py` suchte `lua5.4` und griff danach auf `/usr/lib/x86_64-linux-gnu/liblua5.4.so.0.0.0` zurück. Auf diesem Windows-Rechner schlug der tatsächlich ausgeführte Start beim Laden der Bibliothek mit `FileNotFoundError` fehl. Das war ein fehlender Host-Runtime-Pfad, kein nachgewiesener Fehler in den Roblox-Skripten.

Read-only untersucht wurden vorhandene Commands, relevante gebündelte Runtime-/Paketverzeichnisse und die Python-Module. Verfügbar: Node, System-Python 3.14 und gebündelte Python 3.12. Keine passende Lua-/Luau-CLI und keine über `ctypes.util.find_library` auffindbare Lua-5.4-Bibliothek; Lupa war zunächst nicht installiert. Ein Aufruf von `wsl --list --quiet` lieferte lediglich Installationshilfe. Damit ist keine nutzbare WSL-Distribution bestätigt. Es wurde kein WSL installiert.

### Umgesetzter lokaler Prüfweg

`tools/check-lua.py` behält den nativen Lua-5.4-Weg bei. Ohne native Bibliothek verwendet es optional **`lupa.lua54`**, ausdrücklich nicht den unbestimmten Lupa-Default. Jede Quelle bzw. jeder Verhaltenstest erhält einen frischen Lua-Zustand; Quelldateien werden explizit als UTF-8 gelesen. Fehlende Runtime wird verständlich gemeldet. Beispielskripte mit `Shop-*.lua` und `Studio-*.lua` werden ausschließlich kompiliert, nicht ausgeführt. Lupa dokumentiert mehrere enthaltene Lua-Versionen und deren explizite Auswahl. [Lupa-Projekt](https://github.com/scoder/lupa)

Für diesen Lauf wurde das Windows-Wheel **Lupa 2.8 / CPython 3.12 / win_amd64** ausschließlich in `%TEMP%\mapforge-lua54` abgelegt. Es gab **keine systemweite Installation**, keine Änderung von Windows-PATH und keine Änderung der Lua-Spielregeln oder Harnesses. Die veröffentlichte Web-App benötigt dieses Prüfwerkzeug nicht. Windows-Wheels sind im Projektrelease verfügbar. [Lupa Release-Dateien](https://pypi.org/project/lupa/#files)

Wiederholung in PowerShell, mit dem tatsächlich vorhandenen gebündelten Interpreter:

```powershell
$env:PYTHONPATH = Join-Path $env:TEMP 'mapforge-lua54'
python3 tools/check-lua.py
```

**Tatsächlich erzieltes Ergebnis:** Exit-Code 0. Die acht Laufzeitquellen und der Shop-ID-Scanner bestanden die Syntaxprüfung. Alle fünf vorhandenen Harnesses (`data`, `economy`, `hud`, `claim`, `commerce`) liefen erfolgreich; sie prüfen unter anderem Kaufbeleg-Wiederholung/Ausfälle, Session-Sperren, Wirtschaft, HUD-Verhalten und serverseitige Eigentums-/Reichweitenregeln mit Service-Doubles. Zusätzlich wurde der unmittelbar aus `studioMapAudit(generate(...))` erzeugte Audit-Quelltext für Obby und Tycoon erfolgreich kompiliert, ohne ihn auszuführen. Dies bestätigt den ausgeführten Lua-5.4-Testumfang, **keine Luau-/Roblox-Engine-Ausführung**. Die native Bibliotheksvariante wurde in dieser Windows-Sitzung nicht ausgeführt.

Für spätere zusätzliche Luau-Prüfung stehen portable offizielle CLI-Binärdateien und `luau-analyze` zur Verfügung. Die bestehende Lua-Harness-Infrastruktur verwendet `io`/Dateizugriffe und ist nicht unverändert für die sandboxed Luau-CLI geeignet. Eine CLI kennt außerdem nicht automatisch alle Roblox-Services und deren tatsächliches Verhalten. [Luau Getting Started](https://luau.org/getting-started/), [Offizielles Luau-Repository](https://github.com/luau-lang/luau)

## 7. Offene Entscheidungen und sauberer Abschluss

- Die konkrete Gestaltung der Themen, größere Landmarken, sparsamere Deko und zusätzliche Qualitätsindikatoren sind begründete Entwurfsentscheidungen. Wirkung und Lesbarkeit müssen an tatsächlichen Maps beurteilt werden.
- Ein genauer Streamingradius, die Stärke von Bloom und die Teilbudgets sind keine universellen Konstanten. Änderungen benötigen Vergleichsmessungen.
- Zusätzliche prozedurale Variation darf keine kaufrelevanten IDs oder dauerhaft gespeicherten Fortschrittsdaten verändern.
- Neue Implementierungen benötigen einen aktualisierten Worker, neu erzeugte Beispiele, eine verständliche Übergabe und ein passendes Quellpaket. Dieses Recherchepapier meldet keine Veröffentlichung oder Änderung einer bestehenden Site.
- Noch offen bleiben insbesondere Studio-Import aktueller Exporte, echte Avatarphysik, realer Mehrspieler, Mobilgeräte-FPS, Touch, Kaufdialoge und dauerhaftes Speichern unter realen Roblox-Diensten.

Die oben verlinkten Dokumente sind Primärquellen von Roblox, dem Luau-Projekt oder Lupa. Sie wurden am 24.10.2026 abgerufen. Roblox-Dokumentation und Engine-Verhalten können sich ändern; dokumentierte Widersprüche und konkrete lokale Grenzen sind deshalb ausdrücklich benannt.
