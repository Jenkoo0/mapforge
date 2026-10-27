# MapForge: UI- und Motion-Recherche

Stand: 26. Oktober 2026. Ausgangspunkt: MapForge 3.15.1, bestätigter Checkout `c19d99799564a09fe07b784f4ec31424623e78e0`.

Ziel: Die bestehende Generator-App als professionellen Arbeitsbereich weiterentwickeln. Diese Recherche untersucht dokumentierte Produktmuster; sie enthält keine Nutzerstudie, Nutzungsstatistik oder gemessene Wirkung auf MapForge.

## Sechs offizielle Referenzen

Alle folgenden Links wurden am Recherchetag geprüft. **Quellenbeleg** beschreibt die veröffentlichte Referenz. **Übertragung** ist eine eigene Entscheidung für MapForge, keine Behauptung des jeweiligen Herstellers.

| Referenz | Quellenbeleg | Übertragung auf MapForge |
| --- | --- | --- |
| [PlayCanvas: Editor Interface](https://developer.playcanvas.com/user-manual/editor/interface/) | Der Editor unterscheidet Toolbar, Hierarchy, Viewport, Inspector und Assets. Häufige Befehle und detaillierte Eigenschaften haben eigene Orte. | Die Vorschau bekommt den größten zusammenhängenden Arbeitsbereich. Generatorparameter bleiben in einem klar gegliederten Einstellungsbereich. Eine vollständige Objekthierarchie wird dadurch nicht erforderlich. |
| [Spline: Understanding Spline's UI](https://docs.spline.design/basics/understanding-splines-ui) | Der Editor trennt Preview, Edit und Code. Eigenschaften sind kontextbezogen; Zoom sowie Share/Export sind von den Bearbeitungswerkzeugen getrennt. | Ansichtswerkzeuge gehören direkt an die Vorschau. Generieren, Vorschau betrachten und Exportieren erhalten verständliche, unterschiedliche Zustände und Beschriftungen. Keine Schaltflächen für nicht vorhandene Editierfunktionen. |
| [Roblox: 3D art and Studio — Studio interface](https://create.roblox.com/docs/art/overview-studio#studio-interface) | Viewport, Explorer, Properties und Output haben unterschiedliche Aufgaben: räumliche Ansicht, Struktur, Eigenschaften und Diagnose. | Ergebnis und Prüfhinweise werden räumlich verbunden, aber verständlich getrennt angezeigt. Ein erfolgreicher Browser-Build belegt weder einen Roblox-Playtest noch Veröffentlichung oder gemessene Laufzeitqualität. |
| [Linear: How we redesigned the Linear UI, Teil II](https://linear.app/now/how-we-redesigned-the-linear-ui) | Das Produktteam beschreibt weniger visuelles Rauschen, ausgerichtete Seitennavigation und Header, abgestufte Flächen und eine gemeinsame visuelle Hierarchie. Verschiedene Ansichten und Zustände wurden geprüft. | Ein konsistenter Seitenrahmen, wiederkehrende Abstände und neutrale Oberflächen ersetzen viele konkurrierende Karten und Akzentflächen. Der Inhalt und die aktuelle Hauptaktion bestimmen die Hierarchie. |
| [IBM Carbon: Motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | Carbon unterscheidet dezente produktive Bewegung von seltener ausdrucksstarker Bewegung. Dokumentierte Dauern umfassen 110 ms, 150 ms und 240 ms. | Eine kleine gemeinsame Motion-Skala vermittelt Hover-/Statusfeedback, aufklappende Optionen und Panelwechsel. Bewegung erhält eine konkrete Aufgabe; dauerhafte Dekoration ist kein Ziel. |
| [W3C: Technik C39 für prefers-reduced-motion](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) | Die Technik beschreibt, wie CSS-Bewegung anhand der Systempräferenz unterdrückt werden kann, alternativ durch statische Basisstile und Motion nur bei `no-preference`. | Reduzierte Bewegung bekommt einen gleichwertigen statischen Zustand. Diese einzelne Technik ersetzt keine vollständige Barrierefreiheitsprüfung. |

Der direkt abgefragte Roblox-Pfad `/docs/studio/ui-overview` lieferte beim Abruf einen 404. Deshalb wird oben die tatsächlich abrufbare offizielle Studio-Einführung verwendet.

## Konkrete Designentscheidung für MapForge

Die Referenzen belegen keine allgemeine Überlegenheit von hellen oder dunklen UIs. Für diesen Umbau ist eine **helle Paper-/Graphit-Oberfläche mit großer dunkler Vorschau** die gewählte Richtung. Ein optionaler Dark Mode kann dieselben semantischen Farben und Zustände verwenden. Das bekannte Lime bleibt als präziser Markenakzent für Hauptaktion, aktiven Navigationspunkt und relevante Auswahl erhalten.

1. **Stabiler Arbeitsrahmen.** Eine schmale Navigation und eine kompakte Kopfzeile halten Bereich, aktuellen Entwurf und Hauptaktion auffindbar. Flächen, Schriftgewichte und Abstände unterscheiden Navigation, Inhalt und Vorschau. Nicht jeder Abschnitt benötigt einen eigenen farbigen Rahmen.
2. **Vorschau als Arbeitsgegenstand.** Kamerawahl, Zurücksetzen und vorhandene Ansichtsoptionen erscheinen am Viewport. Hilfetexte erklären echte Maus- und Tastatursteuerung. Eine ruhige leere Vorschau erklärt den nächsten Schritt, statt einen generierten Zustand vorzutäuschen.
3. **Lange Formulare portionieren.** Kernentscheidungen stehen zuerst; Detailoptionen werden in benannten Gruppen aufklappbar. Verborgene Werte bleiben erhalten. Auf kleinen Displays folgt eine eindeutige Lesereihenfolge; Einstellungen dürfen weder abgeschnitten noch hinter einer dauerhaft überlagerten Vorschau verschwinden.
4. **Ergebnisstatus bleibt überprüfbar.** „Bereit“, „Wird generiert“, „Erstellt“ und konkrete Fehler beruhen auf tatsächlichen Vorgängen. Keine simulierten Prozentwerte, Erfolgsquoten, Nutzerzahlen oder Leistungsversprechen. Exportoptionen erklären ihr jeweiliges Ergebnis und setzen einen verfügbaren Entwurf voraus.
5. **Bedienung vor Schmuck.** Sichtbarer Tastaturfokus, lesbare Labels, verständliche Fehlermeldungen und passende aktive/deaktivierte Zustände gehören zum Umbau. Ein Icon ergänzt die Beschriftung. Vorhandene Generator-, Speicher- und Exportverträge werden durch das neue Layout nicht umgedeutet.

## Motion-Spezifikation als eigener Umsetzungsvorschlag

| Einsatz | Dauer | Verhalten |
| --- | --- | --- |
| Button-/Auswahlfeedback | 110 ms | Dezenter Farb- oder Deckkraftwechsel, kein springendes Layout. |
| Aufklappende Detailgruppe | 150 ms | Kurzer Übergang; Inhalt bleibt sofort bedienbar. |
| Wechsel eines Panels oder einer Ergebnisansicht | 240 ms | Ruhiger Wechsel mit stabilen Orientierungspunkten. |
| Erfolg und Fehler | An echten Zustandswechsel gebunden | Verständlicher Text bleibt auch nach dem Übergang sichtbar. |

Für kontinuierlich sichtbare Bewegung kann Carbons produktive Standardkurve `cubic-bezier(0.2, 0, 0.38, 0.9)` als Ausgangspunkt dienen. Die Wahl der Anwendungsfälle ist unsere Entscheidung. Normale Controls brauchen keine zusätzliche Animationsbibliothek; CSS und vorhandene Browserfunktionen reichen für diese Spezifikation aus.

Bei `prefers-reduced-motion: reduce` entfallen Reveal-Verschiebungen, dekorative Schleifen und animiertes Scrollen. Auch eine etwaige automatische Kamerarotation muss die Präferenz berücksichtigen. Direkt vom Nutzer gesteuerte Kamerabedienung bleibt verfügbar. JavaScript-gesteuerte Animationen müssen die Präferenz ebenfalls auswerten; eine CSS-Regel allein deckt sie nicht ab.

## Abnahme für die Umsetzung

- Desktop und schmales Mobilformat zeigen denselben aktuellen Entwurf und vollständige Aktionen ohne horizontales Abschneiden.
- Leerer Zustand, laufender Build, Ergebnis und Fehler sind verständlich und spiegeln reale Daten wider.
- Tastaturbedienung, sichtbarer Fokus und vorhandene Shortcuts bleiben funktionsfähig; Eingabefelder lösen keine globalen Shortcuts aus.
- Reduzierte Bewegung wird im Browser geprüft, einschließlich JavaScript- und Kameraeffekten.
- Vorhandene Generierung, Speicherung und Exportformate funktionieren nach dem UI-Umbau weiterhin. Screenshots prüfen die Darstellung; Funktionstests prüfen Verhalten. Keine dieser Prüfungen belegt automatisch die Qualität einer veröffentlichten Roblox-Sitzung.

Diese Liste ist eine eigene Abnahmeempfehlung. Es wurden für diese Recherche keine Laufzeitdateien geändert, Plugins installiert oder Nutzer-/Roblox-Daten erzeugt.

---

## Ergänzung: Kreative Map- und Spielrichtungen

Zusatzrecherche vom 26.10.2026 auf Nutzerwunsch nach mehr Kreativität und Vielfalt. Die sechs UI-Referenzen oben bleiben bestehen. Die folgenden sieben zusätzlichen Primärquellen behandeln Raumgestaltung, Prototyping und verständliche Spielziele. Sie belegen Designmethoden, keine Wirksamkeit unserer konkreten Entwürfe und keinen erwarteten Markterfolg.

### Sieben weitere Primärquellen

| Quelle und verifizierter Befund | Verantwortbare MapForge-Ableitung | Grenze |
| --- | --- | --- |
| [Roblox: Greybox your environment](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment). Einfache Körper dienen zur Prüfung von Maßstab, Durchquerbarkeit und Orientierung. Das Beispiel unterscheidet Ebenen sowie Haupt- und Querwege; Playtests gehen der Ausarbeitung voraus. | Für jedes Experiment zuerst Spawn, Verlauf, freigehaltene Wege und Ziel in einfachen Massen beurteilen. Höhenwechsel müssen räumlich erkennbar sein. | Das Beispiel ist eine Laser-Tag-Karte. Drei Kampfspuren und dort genannte Abmessungen sind keine allgemeine Vorgabe für Obbys oder Tycoons. |
| [Epic: Level Design Best Practices](https://dev.epicgames.com/documentation/fortnite/level-design-best-practices-in-fortnite-creative?lang=en-US). Die Anleitung behandelt klare Verbindungen, erkennbare Fernlandmarken, Dichte, Sichtlinien und unterscheidbare Orte. Offene Flächen sollen nicht mit Requisiten überfüllt werden. | Ein Entwurf bekommt eine lesbare räumliche Hauptidee: offene Spirale, Stadtlinie oder gestaffelte Werkbereiche. Umgebung darf die Orientierung unterstützen, ohne die Laufwege mit Details zu besetzen. | Die Anleitung ist stark von Fortnite-Kampfspielen geprägt. Gegner, Deckung und taktische Balance werden nicht als vorhandene MapForge-Funktionen übernommen. |
| [Epic: Geometry Brush Actors](https://dev.epicgames.com/documentation/unreal-engine/geometry-brush-actors-in-unreal-engine). Der dokumentierte Ablauf geht von Blockout und Wegen über wiederholte Spieltests zu Ausarbeitung, Beleuchtung sowie Kollisions- und Leistungsprüfung. | Für Varianten zuerst die große Form und Wegfolge ändern bzw. auswählen; Material und Kleinteile folgen. Entwürfe dürfen nach einem Laufwegtest verworfen werden. | Unreal-BSP ist kein Roblox-Exportformat. Die Quelle rechtfertigt weder bestimmte Roblox-FPS noch den Einsatz ungetesteter Kollisionskörper. |
| [Unity: About ProBuilder 6.0](https://docs.unity3d.com/Packages/com.unity.probuilder@6.0/manual/index.html). Unity beschreibt Geometrieerstellung, parametrisierte Formen, Level-Prototyping, Kollisions-Meshes und Playtests als Anwendungsfälle. | Vorhandene parametrisierte Geometrie wird als Experimentiermaterial genutzt. Derselbe Seed erlaubt einen nachvollziehbaren Vergleich einzelner Stellgrößen. | ProBuilder ist nicht Bestandteil von MapForge. Daraus folgen keine freie Modellierung, Meshbearbeitung oder neuen Formparameter in unserer App. |
| [Epic: How to Design a Game](https://dev.epicgames.com/documentation/en-us/fortnite/how-to-design-a-game-in-fortnite-creative). Die Anleitung unterscheidet Ziel, Herausforderung, Belohnung, Mechanik und Gameplay-Schleife; die Umgebung soll zum tatsächlichen Handeln passen. | Jede Experimentkarte benennt zuerst den vorhandenen Modus und beschreibt danach die räumliche Variante. Bei einem Obby bleibt Springen mit Checkpoints das Spiel; bei einem Tycoon bleibt es der Produktions-/Ausbauablauf. | Eine neue Kulisse oder Bezeichnung erzeugt kein Rätsel-, Liefer-, Rhythmus- oder Schwerkraftsystem. Solche Funktionen benötigen eigene Implementierung und Prüfung. |
| [Microsoft: XAG 103 — Additional channels](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103). Spielwichtige Farbe benötigt zusätzliche Kennzeichen, etwa Form, Muster oder Text; kritische visuelle und akustische Hinweise sollen durch weitere Wahrnehmungskanäle ergänzt werden. | Ziel, Checkpoint und Gefahren müssen trotz einer ungewöhnlichen Palette verständlich bleiben. Vorhandene Schilder, Formen und HUD-Texte werden bei der Sichtprüfung zusammen betrachtet. | Mehrere visuelle Kennzeichen allein machen ein Spiel nicht für blinde Spieler zugänglich. Audio, Haptik und Narration werden hier weder neu implementiert noch als vorhanden behauptet. |
| [Microsoft: XAG 109 — Objective clarity](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109). Ziele und Fortschritt sollen jederzeit verständlich nachlesbar sein; konkrete nächste Schritte und verfügbare Hinweise unterstützen Orientierung. | Neue Szenennamen dürfen das reale Spielziel nicht verdecken. Experimentkarten zeigen Modus, verfügbaren Ablauf und Unterschiede; vorhandene Spielhinweise bleiben erreichbar. | Die Richtlinie ist keine Garantie für Verständlichkeit oder vollständige Barrierefreiheit. Ob Spieler die Kopplung zwischen Raum und Ziel verstehen, muss mit ihnen geprüft werden. |

### Vielfalt über tatsächlich vorhandene räumliche Stellgrößen

Eigene Schlussfolgerung aus den Quellen und dem gelesenen Generator: Eine kuratierte Auswahl sollte mehrere unabhängige Eigenschaften zeigen, statt nur die Farbpalette zu wechseln:

- **Wegform:** Die vorhandenen Obby-Themen verwenden Spirale, Zickzack oder Canyon-Verlauf. Abstand, Anstieg, Anzahl der Abschnitte und Checkpoints verändern die Route zusätzlich. `layout` beeinflusst diesen Modus nicht.
- **Gebäudemassen:** Beim Tycoon unterscheiden `flow`, `campus` und `skyline` tatsächlich die Maschinenanordnung. Zwei bis sechs Grundstücke und Detail-/Polish-Stufen verändern Umfang und Silhouette.
- **Material und Umgebung:** Himmel, Neon, Lava und Dschungel bringen bestehende Materialien und unterschiedliche Begleitgeometrie mit. Die Lesbarkeit des Wegs ist wichtiger als maximale Dekorationsdichte.
- **Aufgabe und Tempo:** Obby und Tycoon bleiben zwei unterschiedliche vorhandene Abläufe. Tycoon-`brisk` senkt Baukosten; `relaxed` bedeutet im bestehenden Generator höhere Kosten und darf deshalb nicht als einfacherer Einstieg bezeichnet werden.

Das sind Fähigkeiten der vorhandenen Quellen `web/engine.js`, `web/tycoon.js` und `web/tycoon-style.js`, keine neu gebauten Mechaniken. Ein benanntes Experiment ist außerdem noch keine neue Generatorfamilie.

### Sechs konkrete Experimente auf vorhandener Geometrie

Die Namen und gestalterischen Lesarten unten sind eigene Arbeitsideen. „Schichtung“, „Kolonnade“ oder „Silhouette“ beschreiben einen Blick auf die Geometrie; sie versprechen keine bewegten Strukturen oder speziellen Interaktionen.

| Experiment | Vorhandene Konfiguration | Räumliche Untersuchung | Explizite Grenze |
| --- | --- | --- | --- |
| **Wolken-Skizzenpfad** | Obby, `sky`, 20 Abschnitte, `easy`, Abstand 2,5, Anstieg 0,8, Checkpoint alle 4, Detail 2; Seed `LAB-WOLKEN-01`. | Eine kurze, offen lesbare Spirale mit kleinen Höhenwechseln und vorhandenen Wolkenkörpern. | Kein Flug- oder Zeichenmodus; `easy` ist nicht gefahrenfrei. |
| **Neon-Nachtlinie** | Obby, `neon`, 28 Abschnitte, `normal`, Abstand 3, Anstieg 1, Checkpoint alle 4, Detail 2; Seed `LAB-NACHT-01`. | Wiederholte Richtungswechsel und vorhandene Gebäude bilden eine Stadtlinie. | Keine Kuriermission, Fahrzeuge oder zusätzliche Nachtlogik. |
| **Basalt-Schichtung** | Obby, `lava`, 24 Abschnitte, `normal`, Abstand 3, Anstieg 0,7, Checkpoint alle 3, Detail 2; Seed `LAB-BASALT-01`. | Niedrige, gestaffelte Canyon-Route mit Felsmassen und häufigeren Rücksetzpunkten. | Kein sich faltender Boden, Erdrutsch oder frei verformbares Gelände. |
| **Botanische Manufaktur** | Tycoon, `jungle`, `campus`, 2 Grundstücke, `brisk`, Detail 2, Polish 2; Seed `LAB-BOTANIK-01`. | Gruppierte Werkbereiche mit vorhandenen Gewächshaus-/Pflanzenformen statt einer einzigen langen Baufolge. | Bestehende Produktionslogik; kein neues Pflanzenwachstums- oder Ökosystemmodell. |
| **Kristall-Kolonnade** | Tycoon, `sky`, `flow`, 2 Grundstücke, `brisk`, Detail 2, Polish 2; Seed `LAB-KRISTALL-01`. | Die vorhandene Produktionsstraße wird als klare Folge niedriger und höherer Baukörper betrachtet. | Keine Bibliotheks-, Ausstellungs- oder Resonanzrätselmechanik. |
| **Photonensilhouette** | Tycoon, `neon`, `skyline`, 2 Grundstücke, `balanced`, Detail 2, Polish 2; Seed `LAB-PHOTON-01`. | Gestaffelte Türme am hinteren Zentrum und Produktion davor untersuchen eine markante Fernansicht. | Kein Lichtstrahl-Puzzle oder optisches Simulationssystem. |

### Was für diese Kandidaten tatsächlich geprüft wurde

Am 26.10. wurden die sechs angegebenen Konfigurationen im lokalen Arbeitsstand mit `VERSION = 3.16.0` **nur im Speicher** durch den vorhandenen Generator und RBXLX-Serializer ausgeführt. Die Tests verwendeten die vorhandenen Lua-Quellen. Es wurden weder Map-Dateien geschrieben noch Pakete gebaut oder Studio-Sitzungen gestartet.

Für den isolierten Vergleich waren `shop`, `persistence` und `analytics` ausgeschaltet sowie `concept: null` und `autoName: false` gesetzt. Das änderte keine App-Einstellungen oder gespeicherten Nutzerentwürfe. Eine spätere Auswahl in der App darf diese Nebeneinstellungen nicht stillschweigend überschreiben.

| Kandidat | Teile | Ergebnis dieser begrenzten Prüfung |
| --- | ---: | --- |
| Wolken-Skizzenpfad | 176 | Gleicher Seed erzeugt identische Teile; keine Validatorfehler; exportiertes XML geparst und Teilezahl abgeglichen. |
| Neon-Nachtlinie | 256 | Gleiche Prüfungen bestanden. |
| Basalt-Schichtung | 195 | Gleiche Prüfungen bestanden. |
| Botanische Manufaktur | 1.669 | Gleiche Prüfungen bestanden. |
| Kristall-Kolonnade | 1.577 | Gleiche Prüfungen bestanden. |
| Photonensilhouette | 1.569 | Gleiche Prüfungen bestanden. |

„Keine Validatorfehler“ heißt nicht, dass alle Hinweise und manuellen Prüfpunkte erledigt sind. Die Zahlen sind keine FPS-, Spaß-, Schwierigkeits- oder Erfolgsprognose. Insbesondere wurden diese sechs Varianten nicht in Roblox durchlaufen, mit mehreren Spielern getestet oder als gerenderte Bilder geprüft. Die UI-Version des Arbeitsstands ist hier keine Veröffentlichungsbestätigung.

### Auswahl und nächste Prüfung

Eigene Empfehlung für die lokale Experimentier-Auswahl: je Kandidat eine echte, aus seiner Konfiguration erzeugte Vorschau, den Modus, zwei wesentliche Unterschiede und eine knappe Grenze anzeigen. Nur vorhandene Generatorwerte übernehmen; den gespeicherten Entwurf und eine Möglichkeit zum Zurücknehmen erhalten. Aufwendigere Zukunftsideen wie eine wandernde Stadt, Schwerkraftwechsel oder Klangrätsel gehören in einen separat gekennzeichneten Prototypauftrag und nicht als scheinbar fertige Presets in diese Auswahl.

Vor einer weitergehenden Qualitätsbehauptung dieselbe Kamera für den Variantenvergleich verwenden und anschließend natürliche Laufwege, Sichtlinien am Spawn, Erkennbarkeit von Ziel/Checkpoint, Gegenverkehr und Geräteperformance im tatsächlichen Roblox-Spiel prüfen. Die Fragen und Ergebnisse dokumentieren; bei neuen Problemen die Raumfolge überarbeiten. Die Quellen liefern dafür Anhaltspunkte, keine Abkürzung um diese Prüfungen.


## Weitere Perspektive: Überraschung durch Prototypen

[Nintendo: Ask the Developer – Super Mario Bros. Wonder, Kapitel 1](https://www.nintendo.com/en-gb/News/2023/October/Ask-the-Developer-Vol-11-Super-Mario-Bros-Wonder-Chapter-1-2460393.html), direkt gelesen am 26.10.2026. Die Entwickler beschreiben gemeinsame Ideensammlungen, schnelle Prototypen und den Versuch, gewohnte Situationen überraschend zu verändern. Unsere Ableitung: früh mehrere räumlich verschiedene Entwürfe nebeneinander anbieten und eine nachvollziehbare Auswahl ermöglichen. Das rechtfertigt weder das Kopieren von Nintendo-Inhalten noch die Behauptung, unsere bestehenden Vorlagen hätten vergleichbare neue Mechaniken.

Die GDC-Seite zu *Level Design Fundamentals & Techniques* wurde ebenfalls gesucht und geöffnet; sie leitete am Prüfdatum auf eine Wartungsseite um. Der auffindbare Vortragsabstract ist keine hier gelesene vollständige Vortragsquelle und wird nicht als Nachweis einzelner Gestaltungsregeln verwendet.

## Tatsächlich umgesetzte Auswahl in 3.16.0

Das neue Design-Labor nutzt sechs andere, separat getestete Konfigurationen aus `web/creative-directions.js`: **Prismahafen**, **Blattwerk Campus**, **Glutachse**, **Wolkensaum**, **Signalsteg**, **Aschepfad**. Die vorstehenden sechs Recherchekandidaten bleiben als Forschungsnotizen erhalten und werden nicht mit dieser Produkt-Auswahl verwechselt. Die drei Fabriken verwenden Skyline, Campus und Produktionsstraße. Die Obbys unterscheiden sich in Thema, Verlauf, Abschnittszahl (18/36/54), Anstieg, Abstand, Schwierigkeit und Checkpoints.

Die Produkt-Auswahl enthält direkte Quellen zu Roblox-Greyboxing, modularen Umgebungen und ausgearbeiteten Plattformwelten. Sie erzeugt echte Geometrie und zeigt jeweils einen Entwurf. Bloßes Vergleichen verändert oder sichert keine aktuelle Map und startet keinen Download. Die Übernahme läuft über die vorhandene Rücknahme-Funktion. Eigener Name, automatische Namenspräferenz, Grundstückszahl, Shop-IDs und Speicher-/Analytics-Einstellungen bleiben erhalten; ein überholtes Konzept wird entfernt. Dies sind kuratierte Ausprägungen vorhandener Generatorfamilien.


Zwei ergänzende, direkt geöffnete Roblox-Quellen (26.10.2026):

- [Assemble modular environments](https://create.roblox.com/docs/tutorials/use-case-tutorials/modeling/assemble-modular-environments): Wiederverwendbare Bauteile lassen sich in verschiedenen Konfigurationen zu zusammenhängenden Umgebungen kombinieren. Unsere Ableitung ist eine erkennbare unterschiedliche Maschinenanordnung; fremde Modellbibliotheken werden hierfür nicht importiert.
- [Apply polished assets](https://create.roblox.com/docs/tutorials/curriculums/core/building/apply-polished-assets): Die Ausarbeitung folgt dem Greybox-Entwurf und dessen gestalterischen Anforderungen. Unsere Karten sollen die tatsächliche Form zeigen; die dortigen PBR-Meshes und Partikeleffekte sind nicht automatisch Bestandteil von MapForge.

Damit wurden 16 verschiedene Primärquellen tatsächlich gelesen; die nur als Wartungsseite erreichbare GDC-Quelle ist nicht eingerechnet.


## Ergänzung 3.18 — nachvollziehbare Varianten und Vergleich

Am 26.10.2026 gezielt geprüfte Primärquellen:

- [Epic: Variant Manager Template Overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/variant-manager-template-overview): Varianten halten ausgewählte Eigenschaften fest und wenden sie beim Aktivieren an. Der Hinweis auf Auto-Capture verdeutlicht, dass unbeabsichtigtes Erfassen bestehende Werte verändern kann. Unsere Ableitung: feste Variantenidentität und eine eigene Aktion zum Setzen des Merkpunktes; Blättern überschreibt ihn nicht.
- [Adobe Lightroom Classic: Image History and Snapshots](https://helpx.adobe.com/lightroom-classic/desktop/process-and-develop-photos/develop-module-options.html#manage-image-history-and-snapshots): Snapshots bewahren einen Bearbeitungszustand zur späteren Wiederverwendung. Unsere Ableitung: der eine explizite Vergleichsmerkpunkt bleibt vom aktuellen Kandidaten getrennt.
- [Adobe Lightroom Classic: Before and After](https://helpx.adobe.com/lightroom-classic/desktop/process-and-develop-photos/develop-module-tools.html#view-before-and-after-photos): Vorher/Nachher-Ansichten synchronisieren Zoom und Verschiebung. Unsere Übertragung auf 3D: gleicher Drehwinkel, Zoom, Baufortschritt und eine gemeinsame projizierte Begrenzung beider Entwürfe. Dies ist eine eigene Implementierungsentscheidung, keine wörtliche 3D-Vorgabe von Adobe.

Umsetzung: drei feste Seeds pro Richtung, insgesamt 18 Formstudien. Variante 01 erhält den bisherigen Seed. Varianten ändern tatsächlich erzeugte Formen, Dekoration oder Hindernisse, nicht pauschal die Hauptroute. Beide Vergleichsstände verwenden dieselben aktuellen Map-Einstellungen. Werden diese geändert, verfällt der Merkpunkt ausdrücklich. Maximal zwei Geometrien bleiben im Labor gehalten, nur eine wird gezeichnet. Es gibt keine neue Datenbank oder automatisch aufgezeichnete Benutzerhistorie.

Die Browserbilder stellen Generator-Geometrie dar. Sie ersetzen keine Roblox-Licht-, Physik-, Geräte- oder Mehrspielerprüfung.
