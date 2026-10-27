# Zufalls-Events und messbarer Skill

Stand: 26.10.2026. Umsetzung in MapForge 3.22.0.

Drei atmosphärische Ereignisse werden in einem gemischten Deck gezogen. Ein Ereignis wiederholt sich auch an Deckgrenzen nicht direkt. Eine Runde besteht aus 20 Sekunden Ankündigung, 160 Sekunden aktivem Event und 60 Sekunden Pause. Licht und Partikel verändern keine Wirtschaft, Sprünge oder Laufgeschwindigkeit.

Die Signal-Rallye nutzt eine eigene Arena, vier nummerierte Signale und eine zufällige, zweimal durchlaufene Viererreihenfolge. Alle Spieler erhalten in einer Serverrunde dieselbe Strecke. Starts sind bei mindestens 75 Sekunden Restzeit erlaubt; Läufe dauern höchstens 75 Sekunden. Zeit, Reihenfolge, Entfernung, Lebenszustand und eine konservative Mindestlaufzeit je Teilstrecke werden serverseitig geprüft. Der Client übermittelt keine Punktzahl und keinen Zeitstempel. Diese Plausibilitätsprüfungen ersetzen keinen vollständigen Anti-Cheat.

Die persönliche Bestzeit und Top 5 gelten nur für den aktuellen Server und die aktuelle Route. Beim Rundenwechsel werden sie zurückgesetzt. Kein Kauf verändert Strecke, Zeit oder Rang; es gibt keine zufällig bezahlten Belohnungen. Der Tod und das Verlassen der Arena beenden den Lauf.

## Geprüfte Primärquellen und konkrete Entscheidungen

- [Roblox: Client-server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary): Prompts müssen wie Remoteeingaben serverseitig auf Kontext, Entfernung und Wiederholrate geprüft werden. Daraus folgen eigene Lebens-/Entfernungsprüfung und Begrenzung der Interaktionen.
- [Roblox: Improve performance](https://create.roblox.com/docs/performance-optimization/improve): dekorative Effekte lokal erzeugen und keine pro Frame animierte Servergeometrie replizieren. MapForge sendet Eventzustand etwa einmal je Sekunde; sanfte Farbtweens und maximal ungefähr 24 kurzlebige Lichtpartikel laufen lokal.
- [Roblox: Streaming techniques](https://create.roblox.com/docs/workspace/streaming/techniques): Reiseziele vor einem serverseitigen Teleport anfordern. MapForge begrenzt das Warten auf drei Sekunden, verwirft veraltete Charakterantworten und blockiert neue Läufe während des Transports.
- [Roblox: Accessibility](https://create.roblox.com/docs/production/publishing/accessibility): reduzierte Bewegung respektieren. Die Eventgrafik lässt sich abschalten; bei ReducedMotionEnabled gibt es keine schwebenden Partikel und keine Farbtweens. Signale tragen sichtbare Nummern und eine Zielmarkierung.

## Tatsächliche Prüfung und Grenzen

Automatische Verhaltenstests führen echte exportierte Lua-Dateien mit Service-Doubles aus. Zufallsdeck, Phasen, Reihenfolge, Doppelabschluss, Ranggleichstand, Timeout, Entfernung, Tod, Respawn, Streaming-Zwischenzustand, kurze Ansichten, Effektschalter und Aufräumen sind abgedeckt. Roblox-Physik, echte Latenz, Avatar-Kollisionen, Touch/Gamepad und Rendering bleiben in Studio zu prüfen. Kein globaler oder dauerhaft gespeicherter Wettbewerb wurde eingerichtet.
