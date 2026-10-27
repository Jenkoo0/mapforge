# MapForge 3.19: Sammlung, Vorschaubilder und Erzählrahmen

**Recherche: 26.10.2026, Europe/Berlin.** Ziel der geplanten Erweiterung sind zwölf Designrichtungen mit je drei reproduzierbaren Varianten, also 36 auswählbare Entwürfe. Diese Anzahl beschreibt einen Produktumfang; sie ist keine Roblox-Empfehlung und kein Nachweis für 36 eigenständige veröffentlichte Spiele.

Dieses Dokument trennt offizielle Befunde von unseren Gestaltungsentscheidungen. Die Recherche bestätigt keine neu implementierte Spielmechanik, keinen Studio-Test, keinen Upload und keine Verbesserung von Klickrate oder Spielerbindung.

## 1. Offizielle Bildformate

| Verwendung | Aktueller offizieller Befund | Unser Ziel für MapForge |
| --- | --- | --- |
| Experience-Thumbnail | 16:9; ideal 1920 × 1080 Pixel. Andere Seitenverhältnisse werden auf 16:9 gestreckt. | Eigener Render mit 1920 × 1080 Pixeln; kein verzerrtes Hochskalieren einer kleinen Karte. |
| Home-Thumbnail-Upload | Der dokumentierte Personalisierungsablauf nennt unter 3 MB und 1920 × 1080 Pixel. | Eine passende PNG-/JPEG-Datei unter 3 MB anstreben und die tatsächliche Dateigröße prüfen. |
| Experience-Icon | Quadratisch, mindestens 512 × 512 Pixel; empfohlen ist auch die Kontrolle bei etwa 150 × 150 Pixeln. | Separater quadratischer Bildausschnitt mit einer gut erkennbaren Landmarke. |

Quellen: [Roblox Thumbnails](https://create.roblox.com/docs/production/publishing/thumbnails), [Roblox Icons](https://create.roblox.com/docs/production/publishing/experience-icons), beide abgerufen am 26.10.2026. Die Dateigröße oben stammt aus dem Home-Personalisierungsablauf und ist keine hier belegte allgemeine Icon-Grenze.

Die Thumbnail-Dokumentation empfiehlt zudem, wichtige Inhalte vom unteren Bildrand fernzuhalten, weil Plattform-Metadaten sie überdecken können. Die Icon-Anleitung betont relevante Motive, Klarheit in kleinen Größen sowie passende Farbe und Kontrast.

## 2. Inhalt muss zur tatsächlichen Map passen

**Befund:** Die Discovery-Dokumentation verlangt zutreffende Metadaten und Vorschaubilder. Sie nennt stark abweichende Bild-/Spielinhalte sowie eng kopierte Namen, Bilder und Plätze als mögliche Gründe für geringere Sichtbarkeit. Daraus entsteht keine garantierte Reichweite für ein bestimmtes Motiv. [Roblox Discovery](https://create.roblox.com/docs/discovery), abgerufen am 26.10.2026.

**Unsere Ableitung:** Jedes Bild entsteht aus der Geometrie seiner konkreten Variante. Ein Variantenwechsel muss das Bild dieser Variante zeigen. Neue Figuren, Fahrzeuge, Kämpfe oder Gegenstände dürfen nicht als vorhandenes Gameplay ins Bild ergänzt werden. Ein Screenshot aus Roblox und eine Browserprojektion bleiben als unterschiedliche Bildarten erkennbar.

Für die lokale Sammlung ist die Bezeichnung **„Generator-Vorschau“** passend: Sie zeigt die tatsächlichen Bauteildaten mit der vereinfachten Darstellung des Viewers. Sie bestätigt weder die Lichtwirkung in Roblox noch die Erreichbarkeit aus Spielerhöhe. Für eine öffentliche Roblox-Präsentation ist später eine Aufnahme des tatsächlich geprüften Spielstands die stärkere Grundlage.

## 3. Konkrete Bildregeln für die Sammlung

Die folgenden Regeln sind unsere gestalterische Übertragung, keine vorgegebene Roblox-Schablone:

1. **Ein Hauptmotiv:** Die besondere Landmarke oder Silhouette wird groß genug gezeigt, um auch auf einer kleinen Karte erkennbar zu bleiben. Eine winzige Gesamtmap mit viel leerem Rand vermittelt wenig Charakter.
2. **Erkennbare Raumtiefe:** Ein begrenztes Vordergrundelement, der spielbare Hauptbereich und die Landmarke geben dem Bild eine lesbare Staffelung. Der Einstieg darf dabei nicht hinter Dekoration verschwinden.
3. **Ruhige Umgebung:** Eine zum Material- und Lichtprofil passende Hintergrundfarbe lässt Form und Spielwege wirken. Die Signalfarbe markiert das Wesentliche.
4. **Wenig Text im Bild:** Name, Variantenkennung und Storysatz stehen bevorzugt als zugänglicher HTML-Text unter dem Bild. Das Thumbnail kann sich auf die Map konzentrieren.
5. **Eigenes Icon-Framing:** Ein 16:9-Bild wird nicht einfach zusammengequetscht. Das Quadrat zeigt einen engeren Ausschnitt desselben tatsächlich vorhandenen Motivs.
6. **Vergleich und Präsentation unterscheiden:** Für A/B bleibt die Kamera exakt gemeinsam. Für eine einzelne Präsentationsaufnahme kann ein bewusster Bildausschnitt sinnvoll sein; Änderungen der Ansicht dürfen keine neue Geometrie vortäuschen.

## 4. Drei offizielle Referenzen für Story und Orientierung

### Welt statt dauerndem Erklärungstext

**Befund:** Die offizielle Demo The Mystery of Duvall Drive vermittelt Geschichte unter anderem über Anordnung von Gegenständen und visuelle Hinweise. Das Team berichtet, dass zu viel Lore und zu viele Hervorhebungen Wichtiges schwerer erkennbar machten und deshalb reduziert wurden. [Immersive narrative](https://create.roblox.com/docs/resources/the-mystery-of-duvall-drive/immersive-narrative), abgerufen am 26.10.2026.

**Unsere Ableitung:** Eine Designrichtung erhält ein klares Motiv, das in Form, Material und Landmarke sichtbar wird. Ein kleines Archiv kann Aufbewahrung und Erinnerung andeuten; eine gestaffelte Werkhalle kann Wiederaufbau und Wachstum erzählen. Ein langer Textblock auf jeder Karte ist dafür nicht erforderlich.

### Hinweise zum passenden Zeitpunkt

**Befund:** Roblox beschreibt visuelle Orientierung, kontextbezogene Tutorials und zeitlich passende Hilfen. Die Hinweise sollen verständliche Aktionen und Rückmeldung unterstützen; nicht benötigte Informationen können später folgen. [Onboarding techniques](https://create.roblox.com/docs/production/game-design/onboarding-techniques), abgerufen am 26.10.2026.

**Unsere Ableitung:** Der Kartenüberblick zeigt Bild, Name, Stimmung und einen Satz. Die ausgewählte Map erhält anschließend ausführlichere Story und Bauinformationen. Im Spiel bleibt die erste vorhandene Aktion eindeutig: Gratis-Starter, Produktion, erste Abholung und nächster Ausbau. Die ruhige Galerie ist unsere analoge Übertragung auf die Web-App, kein durch diese Quelle getestetes App-Layout.

### Ziele brauchen einen überprüfbaren Inhalt

**Befund:** Die offizielle Quest-Einführung beschreibt Ziel, Menge und Belohnung als Grundelemente; Aufgaben können Features erklären, Fortschritt vermitteln und Erzählung tragen. [Introduction to quest design](https://create.roblox.com/docs/production/game-design/introduction-to-quest-design), abgerufen am 26.10.2026.

**Unsere Ableitung:** Storytexte sollten an vorhandene Handlungen und Ausbaustände anschließen. Eine Weltbeschreibung oder ein Kapitelname implementiert keine neue Quest. Neue Bewohner, Rettungsaktionen, Lieferfahrzeuge oder Raumfreischaltungen benötigen jeweils eigene Geometrie, Serverlogik und Tests, bevor sie als spielbare Funktion erscheinen.

## 5. Kleine Storystruktur je Designrichtung

Unser Entwurf für jede der zwölf Richtungen:

| Feld | Zweck |
| --- | --- |
| Prämisse | Ein Satz dazu, welchen Ort man übernimmt und warum der Aufbau zur Welt passt. |
| Sichtbares Motiv | Eine tatsächlich erzeugte Landmarke, Materialfamilie oder räumliche Anordnung, die diese Idee trägt. |
| Einstieg | Der kostenlose Starter als erste konkrete Handlung. |
| Aufbau | Vorhandene Produktion, Abholungen und Ausbauten erhalten einen passenden Erzählrahmen. |
| Ausblick | Das ausgebaute Werk, vorhandene Forschung, Designs oder Rebirth beschreiben das nächste reale Ziel. |

Drei kurze Kapitel können sich an bestehende Fortschrittsstände wie 12, 24 und 48 Ausbauten anlehnen. Diese Zahlen sind eine Produktentscheidung. Solange keine Kapitelereignisse in der Runtime implementiert sind, heißt das Ergebnis **„Erzählrahmen“** bzw. **„Storykonzept“**; es ist kein automatisch gestarteter Missionsablauf.

Beispiel für eine eigene Prämisse: „Aus einer stillen Werkstatt wächst ein Ort, an dem die Materialien des alten Archivs wieder sichtbar werden.“ Die konkreten Handlungen bleiben wahrheitsgemäß beim vorhandenen Spiel: Starter bauen, Cash abholen, weiterbauen. Eine tatsächlich notwendige Suche nach Archivstücken wäre ein separates Feature.

Die drei Varianten einer Richtung sollen denselben Weltgedanken behalten und ihn sichtbar unterschiedlich ausprägen. Nur Namen und Farbton zu tauschen genügt für unsere Definition einer überzeugenden Entwurfssammlung nicht. Wie stark sich die Geometrien unterscheiden, muss am erzeugten Ergebnis geprüft werden.

## 6. Ruhiger Arbeitsablauf für 36 Entwürfe

Dies sind unsere UX-Entscheidungen für den gewünschten entspannten Arbeitsstil:

- Ein übersichtliches Raster mit wenigen Informationen pro Karte; Richtung und Variante klar benennen.
- Bilder nur bei Bedarf berechnen; der Wechsel zu Storydetails oder einer Vorschau soll die Seite bedienbar lassen.
- Auswahl, Betrachten, als A merken, Übernehmen und Exportieren als unterscheidbare Aktionen erhalten.
- Die aktuelle Auswahl und einen A-Merkpunkt beim Blättern erhalten. Ein Entwurf wird erst durch die ausdrücklich gewählte Übernahme zum aktuellen Projekt.
- Echte Konfiguration, Seed und Generatorversion verwenden. Eine angezeigte Kennung muss denselben Entwurf wieder aufrufen können.
- Animationen zurückhaltend einsetzen; Bild, Text und Fokus sollen nach Navigation stabil bleiben.

Diese Empfehlungen sind keine bereits nachgewiesene Verbesserung von Bedienzeit oder Zufriedenheit.

## 7. Prüfliste vor Auslieferung

- [ ] Zwölf Richtungen × drei Varianten ergeben genau 36 eindeutige aufrufbare Konfigurationen.
- [ ] Jede Karte zeigt die Geometrie ihrer eigenen Konfiguration und keinen unbemerkten Platzhalter.
- [ ] Wiederaufruf liefert bei gleicher Generatorversion dieselben Daten; Name, eigene Shop-IDs und bestehendes Projekt bleiben bei bloßer Vorschau geschützt.
- [ ] Exportierte Bilder haben das tatsächlich angegebene Seitenverhältnis, die richtigen Pixelmaße und eine überprüfte Dateigröße.
- [ ] Die Hauptmotive sind als kleine Karten und Icons erkennbar; wichtige Elemente bleiben vom unteren Thumbnail-Rand frei.
- [ ] Storyversprechen sind im Bild und im vorhandenen Spiel nachvollziehbar; nur geplante Mechaniken sind ausdrücklich als Idee markiert.
- [ ] Tastaturbedienung, Fokus, schmale Ansicht und das Laden vieler Vorschauen sind im echten Browser geprüft.
- [ ] Generatorbild, Studioaufnahme, manuelle Spielprüfung und veröffentlichter Stand sind im Ergebnisbericht getrennt ausgewiesen.

Diese Liste ist ein Prüfplan. Häkchen werden nur nach tatsächlich durchgeführten Prüfungen gesetzt. Neue Engine-, Account- oder Veröffentlichungsaktionen werden durch dieses Recherchepapier nicht ausgeführt.

## 8. Ergänzung 3.20 — Fortschritt, Bildausschnitt und ruhige Bedienung

Am 26.10.2026 erneut gegen Primärquellen geprüft:

- [Roblox Thumbnails](https://create.roblox.com/docs/production/publishing/thumbnails): Landschaftbilder sollen 16:9 und idealerweise 1920×1080 sein. Das Motiv soll dem Spiel entsprechen; wesentliche Texte gehören nicht an den unteren Rand. Eigene Ableitung: drei Kompositionen aus tatsächlicher Generatorgeometrie, ein Zoomregler und derselbe relative Bildausschnitt bei Vorschau und Export. Keine Aussage, dass eine Komposition bereits höhere Klickraten erreicht.
- [Roblox UI animation/tweens](https://create.roblox.com/docs/ui/animation): kurze Übergänge können Auswahl und Zustandswechsel darstellen. [Accessibility guidelines](https://create.roblox.com/docs/production/publishing/accessibility): Reduce Motion ist über GuiService.ReducedMotionEnabled zugänglich. Bestehende reduzierte Bewegung bleibt erhalten; das neue Journal setzt keine unaufgeforderten Kapitelanimationen voraus.
- [Roblox Discovery](https://create.roblox.com/docs/discovery): Metadaten und Bilder sollen eigenständig sein und den tatsächlichen Spielinhalt abbilden. Eigene Ableitung: Geschichten folgen vorhandenen Ausbau-/Abschnittswerten und versprechen keine zusätzlichen Brief-, Transport- oder NPC-Systeme.

Umgesetzt: optionale Kapitelansicht nach realem Fortschritt, stabile Geschichtenauswahl, drei Coverkompositionen und einklappbare Ergebnisdetails. Verifikation umfasst Quelltests, Lua-5.4-Service-Doubles und Browserprüfungen. Lesbarkeit, Eingabe, Leistung und Mehrspieler in einer echten neuen Roblox-Sitzung bleiben gesonderte Prüfungen; diese Recherche belegt sie nicht.
