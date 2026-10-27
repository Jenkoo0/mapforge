# Werkmarken, Verbesserungen und kurze Minispiele

Stand: 26.10.2026. Recherche und Entwurfsentscheidungen für MapForge 3.24. Die folgenden Spielideen sind eigene Hypothesen. Die Quellen belegen die beschriebenen Gestaltungsprinzipien, aber keinen zu erwartenden Erfolg unserer Maps. Es wurden keine Spielerzahlen oder Umsatzerwartungen zur Bewertung verwendet.

## Was die Referenzen beitragen

| Geprüfte Primärquelle | Beobachtung | Eigene Ableitung für MapForge |
| --- | --- | --- |
| [Epic Minigames von Typical Games](https://www.roblox.com/games/277751860/Epic-Minigames) | Die offizielle Beschreibung kombiniert unterschiedliche kurze Minispiele mit Leveln, verdienten Münzen und kaufbaren Charaktergegenständen. | Eine kleine Auswahl klar unterscheidbarer Regeln zuerst vollständig bauen. Eine dauerhafte Verbesserung gibt gewonnenen Runden einen Zweck. Keine Namen, Assets oder konkreten Minispiele kopieren. |
| [Super Bomb Survival von Polyhex Games](https://www.roblox.com/games/164051105/Super-Bomb-Survival) | Die Beschreibung verbindet Überleben, zufällige Ereignisse und auswählbare Skills beziehungsweise Perks. | Zufall verändert die aktuelle Aufgabe; dauerhafte Auswahl macht Fortschritt sichtbar. Für MapForge wirtschaftliche Verbesserungen verwenden, damit sich Zeitrennen weiterhin unter denselben Bewegungsbedingungen vergleichen lassen. |
| [Roblox Creator Hub: Core loops](https://create.roblox.com/docs/production/game-design/core-loops) | Die Dokumentation unterscheidet laufende Interaktion, wiederholte Hauptaktionen und den Fortschrittsantrieb. | Hauptspiel oder Minispiel spielen → Werkmarken verdienen → eine konkrete Verbesserung wählen → deren Wirkung im Hauptspiel erleben. Das Minispiel muss bereits ohne Belohnung verständlich und spielbar sein. |
| [Roblox Creator Hub: Onboarding](https://create.roblox.com/docs/production/game-design/onboarding) | Die Einführung soll wesentliche Steuerung und Spielschleife vermitteln, rasch zum Spiel führen und spätere Ziele zeigen. Frühe Fortschrittsschwellen sollen erreichbar sein. | Jede Regel in einem Satz erklären, aktuelles Ziel direkt anzeigen und vor einem Kauf Wirkung, Preis und maximale Stufe nennen. Den ersten sinnvollen Kauf im Playtest zeitlich messen. |
| [Roblox Creator Hub: Balance virtual economies](https://create.roblox.com/docs/production/game-design/balance-virtual-economies) | Zuflüsse, Ausgaben und die Auswirkungen zusätzlicher Eventbelohnungen müssen gemeinsam betrachtet werden. | Werkmarken als eigene verdiente Fortschrittswährung führen. Drei begrenzte Verbesserungspfade schaffen überprüfbare Ausgaben. Preise und Belohnungen erst anhand beobachteter Rundendauer und Kaufzeiten abstimmen. |
| [Roblox Creator Hub: Client-server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary) | Der Server muss Kontext, Eingaben, Entfernung und Ausführungsrate prüfen; auch ProximityPrompts sind angreifbar. | Client meldet Kaufabsicht statt Preis, Kontostand, Abschlusszeit oder Belohnung. Der Server prüft Stufe, Kosten, Lebenszustand, Stationsabstand, Spielphase, Reihenfolge und Mindestlaufzeit. |
| [Roblox Creator Hub: Data stores](https://create.roblox.com/docs/cloud-services/data-stores) | DataStoreService speichert sitzungsübergreifende Daten serverseitig. Netzaufrufe können scheitern; UpdateAsync behandelt gleichzeitige Änderungen anders als SetAsync. | Werkmarken und Stufen in den bestehenden geschützten Spielstand integrieren. Temporäre Rangzeiten bleiben separat. Speichertests in einer eigenen Test-Experience durchführen; bestehende Live-Daten schützen. |

## Drei eigene Minispielregeln

Die Arena verwendet vier gut lesbare, nummerierte Stationen. Eine sichtbare Nummer bleibt auch ohne Farberkennung verständlich. Die folgende Auswahl ist ein bewusst kleiner, testbarer Anfang und keine Prognose über den späteren Markterfolg.

| Regel | Konkrete Aufgabe | Gemessene Fähigkeit | Warum sie als eigener Versuch interessant ist |
| --- | --- | --- | --- |
| Signalrallye | Acht Stationseinträge in vorgegebener Reihenfolge ablaufen. Die aktuelle Zielstation wird angezeigt. | Präzise Navigation und schnelle Richtungswechsel. | Der Einstieg ist kurz erklärbar; ein zweiter Versuch kann unmittelbar eine bessere Route ergeben. |
| Merkfolge | Sechs Einträge werden sechs Sekunden lang vor dem Lauf gezeigt. Danach die Folge ohne vollständige laufende Vorschau nachgehen. | Merkfähigkeit und Navigation. | Die Aufgabe variiert die geistige Anforderung auf derselben räumlichen Grundlage. Ein Fehler braucht sofort verständliches Feedback. |
| Funkenjagd | Zwei Durchgänge mit jeweils vier Stationen. In jedem Durchgang jede Station genau einmal in freier Reihenfolge besuchen. Auch zwischen den Durchgängen darf dieselbe Station nicht unmittelbar zweimal folgen. | Eigene Routenplanung und Rhythmus. | Spieler wählen pro Durchgang ihren Weg. Die eigene Designhypothese: Jede Station einmal zu verlangen verhindert triviales Hin-und-her zwischen nur zwei Stationen und erhält die Routenwahl. Insgesamt zählen acht Aktivierungen an vier Stationen. |

Für einen fairen Vergleich gilt dieselbe Regel und serverseitig erzeugte Folge innerhalb einer Serverrunde. Bestzeiten verschiedener Regeln oder Folgen werden nicht in eine gemeinsame Rangliste gemischt. Fortschrittsverbesserungen verändern weder Laufgeschwindigkeit, Sprunghöhe, Stationsreichweite, Vorschauzeit noch Zeitmessung. Bestehende Bewegungsprofile müssen für einen Rangvergleich gleich eingestellt sein.

## Begrenzter Grind mit sichtbarer Wirkung

Werkmarken verbinden wiederholbare Aufgaben mit einer bewussten Wahl. Bestehende Maschinenkäufe bleiben bestehen; die zusätzliche Werkstatt verbessert drei klar benannte Werte. Die Zahlen sind Startwerte für Tests.

| Verbesserung | Wirkung je Stufe | Stufen | Maximale zusätzliche Wirkung |
| --- | --- | --- | --- |
| Maschinenproduktion | +4 Prozent des Ausgangsertrags pro Stufe; additiv auf den Ausgangswert | 0 bis 5 | +20 Prozent; kein fünfmaliges Verzinsen |
| Obby-Münzertrag | +1 Münze je dafür vorgesehenem Münzfund und Stufe | 0 bis 5 | +5 je Münzfund |
| Zielprämie | +5 Münzen je dafür vorgesehenem Zielabschluss und Stufe | 0 bis 5 | +25 je Zielabschluss |

Die Kaufanzeige muss zwischen aktueller Gesamtwirkung, nächstem Schritt und Höchststufe unterscheiden. Käufe dürfen den Kontostand nicht negativ machen. Vorhandene Stufen und Werkmarken müssen nach erneutem Beitritt erhalten bleiben. Ein bereits belohnter Abschluss darf durch doppelte Prompts oder verspätete Nachrichten keine zweite Belohnung geben. Kosten und Auszahlungen bestimmt der Server.

Die Werkstatt kauft wirtschaftliche Vorteile im jeweiligen Hauptspiel. Rangzeit und Rundenziel bleiben davon unberührt. Eine kleine Höchststufe macht den Anfang überschaubar; sie ist noch kein langfristiger Inhaltsplan. Ob später zusätzliche Maschinen, sichtbare Ausbaustufen oder kosmetische Spezialisierungen sinnvoll sind, hängt vom Testverhalten ab.

## Kreative Maprichtungen als überprüfbare Hypothesen

- **Signalwerft:** markante Versandstationen, farbige Leitungen und offene Blickachsen für die Rallye. Hypothese: Landmarken helfen Spielern, eine Route nach wenigen Versuchen ohne UI-Suche zu lesen.
- **Echohaus:** vier klar unterscheidbare Pavillons einer stillgelegten Klangwerkstatt für die Merkfolge. Hypothese: Form und Nummer erleichtern das Erinnern stärker als Farbe allein. Keine zusätzliche Audioabhängigkeit voraussetzen.
- **Taupost-Garten:** ein übersichtlicher botanischer Kurierhof für freie Sammelrouten. Hypothese: zwei ähnlich lange Wege ermöglichen bewusste Entscheidungen; kollidierende Dekoration darf den kürzesten Weg nicht verdeckt blockieren.

Diese Themen sind eigene gestalterische Richtungen, keine aus den Referenzen übernommenen Maps. Ihr tatsächlicher Ausbaustand muss an den erzeugten Projektdateien geprüft werden.

## Playtestplan und Entscheidungskriterien

Die folgenden Zahlen sind interne Abnahmekriterien für einen kleinen ersten Versuch, keine statistischen Marktbenchmarks. Automatische Lua-Tests ersetzen diese Roblox-Tests nicht.

1. **Erstes Verständnis:** Fünf neue Tester erklären nach einer kurzen Regelanzeige das Ziel. Mindestens vier sollen ohne mündliche Hilfe einen gültigen Start und die erste Station schaffen. Missverständnisse zu Reihenfolge, Vorschauende und Wiederholung dokumentieren.
2. **Fairness:** Dieselbe Figur läuft jede Regel mit Stufe 0 und Stufe 5. Geschwindigkeit, Sprunghöhe, Reichweite und Zeitmessung müssen unverändert sein. Münzbelohnungen dürfen sich nur an den ausgewiesenen Stellen unterscheiden.
3. **Fortschrittstempo:** Zeit bis zum ersten Kauf, vollständige Rundenzahl je Kauf und Gründe für die Wahl messen. Als erste Hypothese sollte eine sinnvolle Verbesserung nach zwei bis vier erfolgreich gespielten Runden erreichbar sein. Wenn das normale Hauptspiel mehr Marken liefert, dieses Tempo ebenfalls erfassen.
4. **Wiederholungsreiz:** Nach drei Versuchen fragen, ob und warum ein freiwilliger vierter Versuch gewünscht ist. Entscheidungen durch Regel, Route, bessere eigene Leistung und Belohnung getrennt notieren. Ein Kauf allein beweist noch keinen Spielspaß.
5. **Fehler und Ausstieg:** Tod, Timeout, falsche Station, Ende der Vorschau, Verlassen der Arena und Rundenwechsel mit zwei Clients prüfen. Bei Funkenjagd zusätzlich prüfen: Eine Station zählt im selben Durchgang nur einmal; der zweite Durchgang beginnt erst nach allen vier Stationen; die letzte Station des ersten Durchgangs darf nicht direkt die erste des zweiten sein. Der Abschluss muss entweder genau einmal gültig sein oder sichtbar abbrechen.
6. **Speichern:** Verdienen, kaufen, verlassen und erneut beitreten in einer eigenen Test-Experience. Kontostand und Stufen exakt vergleichen; Ladefehler und gleichzeitige Sitzungen dürfen keine alten Daten überschreiben oder Währung vervielfachen.
7. **Bedienung und Darstellung:** Touch, Tastatur und Gamepad prüfen. Jede Station muss von der Mitte erkennbar sein, die Regelanzeige auf kleinen Ansichten lesbar bleiben und reduzierte Bewegung ohne fehlende Spielinformation funktionieren.
8. **Leistung:** Auf einem schwächeren Testgerät während zwei gleichzeitig laufenden Versuchen Bildrate, Speicher, Netzwerkverkehr und Fehlermeldungen beobachten. Keine zusätzliche pro Frame replizierte Serveranimation für bloße Dekoration einführen.

## Stand und Grenzen

Die sieben verlinkten Primärquellen wurden für diese Recherche gelesen. Die offiziellen Spielbeschreibungen liefern Gestaltungsreferenzen; sie sind kein Beleg für die Nachfrage nach unseren konkreten Regeln. Es wurde für dieses Dokument kein Roblox-Engine- oder Mehrspieler-Playtest durchgeführt. Aktuelle Test- und Veröffentlichungsnachweise gehören in die KI-Übergabe des jeweiligen Releases.
