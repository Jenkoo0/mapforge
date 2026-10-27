# Individuelle Maps: andere Wege, andere Räume

Recherche vom 26. Oktober 2026. Fünf Primärquellen wurden online gelesen. Diese Notiz beschreibt die Entwurfsgrundlage für zusätzliche Only-Up-Routenformen. Sie ist kein Roblox-Spieltest und bestätigt keine fertige Engine-Abnahme. `docs/` und `web/` enthalten denselben Text.

## Konkreter Entwurf für MapForge

Eine neue Farbe oder ein anderer Name machen noch keine eigenständige Map. Die Routenform soll deshalb unabhängig vom Thema gewählt werden: dieselbe Materialfamilie kann einen kompakten Turm, einen lang gestreckten Höhenweg oder eine gefaltete Folge von Höfen bilden. Die bestehenden vier Themen liefern weiterhin den jeweiligen Baukasten.

| Routenform | Räumliche Idee | Unterschied, der im Spiel erkennbar sein soll |
| --- | --- | --- |
| Turmspirale | Bestehender kompakter Aufstieg um ein Zentrum. | Wiederkehrender Blick auf eine zentrale Silhouette; die Route kreist und gewinnt Höhe. |
| Klippenweg | Eine lange gewundene Außenroute mit deutlich voranschreitender Hauptachse. | Seitliche Ausblicke und wechselnde Blickrichtung statt dauernder Umlaufbahn. Einzelne Stützen oder Landmarken begleiten die Route. |
| Faltenhöfe | Zwölf Sprünge längs, drei quer, dann die nächste Längsfolge in Gegenrichtung. | Wiederholbare räumliche Faltung: lange Sichtachse, erkennbare Querpassage, neuer Rückblick. Höhengewinn bleibt kontinuierlich. |

**Eigene Festlegung:** Die Zahlen zwölf und drei sind ein deterministischer Gestaltungsrhythmus für diesen Generator. Keine Quelle nennt diese Folge als optimale Schwierigkeit oder ideale Spielzeit. Auch die Namen und die Kombination mit Only-Up sind eigene Entwurfsentscheidungen.

Die Form verändert den tatsächlichen Weg und dessen Grundriss. Kapitel, Schwierigkeit, Bewegungsprofil und Checkpoints bleiben separate Entscheidungen. Dekoration steht seitlich oder unterhalb der Pflichtlandungen; sie erzeugt keine versteckten Sprunghindernisse. Eine stimmige Materialfamilie und wiederkehrende Bauteile verbinden die Abschnitte.

## 1. Roblox: erst räumlich prüfen, dann ausarbeiten

[Roblox Creator Hub: Greybox your environment](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/greybox-your-environment)

**Befund:** Roblox empfiehlt einfache Formen, um Maßstab, Durchquerbarkeit und Layout früh zu prüfen. Unterschiedliche Materialien unterstützen die Orientierung. Die Beispielkarte gehört zu einem Team-Shooter; deren Drei-Lane-Aufbau ist keine Vorgabe für ein Obby.

**Abgeleitete Entscheidung:** Neue Routen müssen bereits ohne Details im Grundriss unterscheidbar sein. Für jede Folge werden tatsächliche Landeflächen, Kantenabstand und Höhenversatz geprüft. Farbe ergänzt die Richtung; sie darf nicht das einzige Orientierungsmittel sein. Weite Kurven dürfen die nächste Pflichtlandung nicht hinter einer Kulisse verstecken.

## 2. Roblox: zusammenhängender Baukasten und sichtbare Ziele

[Roblox Creator Hub: Construct your world](https://create.roblox.com/docs/tutorials/curriculums/environmental-art/construct-your-world)

**Befund:** Die Anleitung baut auf einer Assetbibliothek auf, differenziert Bereiche durch Materialbehandlung und nutzt lokale Lichtquellen als Orientierung. Sie trennt die Ausarbeitung der Welt von der zuvor erprobten Greybox.

**Abgeleitete Entscheidung:** Ein Thema behält sein Motiv auch bei anderer Routenform: Stahlrahmen, Pflanzenfassungen oder Energieleitungen bilden gemeinsame Formfamilien. Landmarken folgen dem Weg, anstatt stets einen einzigen Turm vorauszusetzen. Ihre Wiederholung liefert Rhythmus; größere Kapitelmarken unterbrechen ihn. Die Quelle rechtfertigt keine automatisch optimale Beleuchtung und keinen behaupteten Import ihrer Assetbibliothek.

## 3. Felixstowe: ein Hang als Folge von Wegen und Ausblicken

[Historic England: Cliff Gardens and Town Hall Garden, Felixstowe](https://historicengland.org.uk/listing/the-list/list-entry/1001220)

**Befund:** Der offizielle Denkmalbericht beschreibt Terrassen, gewundene Wege, Treppen, kleinere Gartenräume und Aussichtspunkte entlang eines Küstenhangs.

**Abgeleitete Entscheidung für Klippenweg:** Eine ausgedehnte Hauptachse und seitlich versetzte Landungen erzeugen eine Landschaftsreise. Große Landmarken stehen in Abständen statt durchgehend neben jedem Sprung. Checkpointbereiche können einen Rückblick auf den bereits zurückgelegten Weg bieten. Übernommen wird das Prinzip einer räumlichen Abfolge; es wird kein realer Garten rekonstruiert. Der Name Klippenweg allein bedeutet noch keine modellierte Geländeoberfläche.

## 4. Kew: leichter Höhenweg zwischen größeren Strukturen

[Royal Botanic Gardens, Kew: Treetop Walkway](https://www.kew.org/kew-gardens/whats-in-the-gardens/treetop-walkway)

**Befund:** Kew beschreibt einen erhöhten Weg durch die Baumkronen. Die wetterfesten Stahlstützen sollen sich in die natürliche Umgebung einfügen; der Weg erschließt einen anderen Blick auf die Bäume.

**Abgeleitete Entscheidung:** Die begehbare Folge wirkt leicht, während größere vertikale Formen daneben die Höhe lesbar machen. Für botanische Varianten bleiben Pflanzen seitlich; für technische Varianten übernimmt ein schlanker Trägerbau diese Rolle. Die reale flexible Konstruktion wird nicht zu einer unangekündigt schwankenden Spielmechanik umgedeutet.

## 5. Sissinghurst: eigenständige Räume innerhalb einer gemeinsamen Welt

[National Trust: The garden at Sissinghurst Castle Garden](https://www.nationaltrust.org.uk/visit/kent/sissinghurst-castle-garden/the-garden-at-sissinghurst-castle-garden)

**Befund:** Der National Trust beschreibt Gartenräume mit unterschiedlichen Pflanzungen und Gestaltungen innerhalb einer formal geplanten Gesamtanlage.

**Abgeleitete Entscheidung für Faltenhöfe:** Wiederkehrende Längsfolgen erhalten eigene Kapitelakzente. Querpassagen machen den Wechsel der räumlichen Richtung verständlich. Gemeinsame Rahmenformen verbinden die Räume; einzelne Landmarken und Materialakzente unterscheiden sie. Hohe geschlossene Wände sind dafür nicht notwendig und würden Kamera und Landungslesbarkeit gefährden.

## Umsetzungs- und Prüfgrenze

Diese Recherche verwendet Beschreibungen der jeweiligen Betreiber beziehungsweise der offiziellen Roblox-Dokumentation. Sie übernimmt keine Fotos, Grundrisse, Meshes oder Texturen. Ein vorhandener Pluginzugang beweist keinen Assetimport. Neue Fremdassets oder kostenpflichtige Generierungen sind durch diese Notiz nicht erfolgt.

Abzunehmen sind reproduzierbare Konfigurationen, tatsächlich unterschiedliche Grundrisse, vollständige Checkpointfolgen, erreichbare Pflichtsprünge und kollisionsfreie Dekoration. Statische Geometrieprüfungen liefern dafür Hinweise. Anlauf, Richtungswechsel, Touch-Steuerung, Kamera, Respawn und Streaming müssen zusätzlich in Roblox Studio erprobt werden. Weder Spielzeit noch Schwierigkeit oder Geräteperformance gelten durch Quellenrecherche als gemessen.
