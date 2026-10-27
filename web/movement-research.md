# Bewegungsprofile für MapForge
Geprüft am 26. Oktober 2026. Eigene Umsetzung, keine Roblox-Vorgabe für ein perfektes Laufgefühl.

## Quellen und Entscheidung
- [Humanoid](https://create.roblox.com/docs/reference/engine/classes/Humanoid): WalkSpeed, JumpPower und UseJumpPower sind die verwendeten Charaktereigenschaften. Die normalen Roblox-Steuerungen bleiben erhalten.
- [StarterPlayer](https://create.roblox.com/docs/reference/engine/classes/StarterPlayer): CharacterWalkSpeed, CharacterJumpPower und CharacterUseJumpPower setzen passende Startwerte. EnableMouseLockOption trennt Shift-Lock von der Sprintbelegung.
- [ContextActionService](https://create.roblox.com/docs/reference/engine/classes/ContextActionService): BindAction verbindet dieselbe Aktion mit Tastatur, Controller und optionalem Touchbutton; SetTitle und SetPosition stellen den Button dar.
- [GuiService](https://create.roblox.com/docs/reference/engine/classes/GuiService): MenuOpened/MenuIsOpen verhindern weiterlaufenden Sprint beim geöffneten Roblox-Menü.

## Vier Ausgangsprofile
| Profil | Gehen | Sprungkraft | Sprint |
| --- | --- | --- | --- |
| Klassisch | 16 | 50 | aus |
| Präzise | 14 | 50 | aus |
| Erkunden | 16 | 50 | 24 |
| Parkour | 18 | 55 | 26 |

Diese Werte sind Ausgangspunkte für Spieltests. Sie beweisen keine bevorzugte Steuerung oder höhere Spielerbindung. Bestehende Projekte erhalten Klassisch; gewählte Profile bleiben in Projektdateien und beim Wechsel eines Designs erhalten. Geschichte, Shop-IDs, Geometrie und Routenkennung sind davon unabhängig.

## Laufzeit
Ein separates Serverskript setzt das Profil beim Erscheinen und beim Respawn. Es arbeitet unabhängig von Speicherladezeiten. Der Obby-Server überschreibt die Geschwindigkeit beim späteren Checkpoint-Teleport nicht erneut. Der Server nimmt nur einen booleschen Sprintwunsch an und wählt die Geschwindigkeit aus der exportierten Konfiguration; der Client überträgt keine Tempo- oder Sprungwerte. Das ist keine vollständige Anti-Cheat-Lösung.

PC: linke Umschalttaste halten. Controller: L3 schaltet um. Touch: Sprint/Gehen schaltet um. Chat, Menü, Fokusverlust und Charakterwechsel setzen die Eingabe zurück. Tod, Sitzen, Schwimmen, Klettern und PlatformStand beenden Sprint serverseitig. Bei einem serverseitigen Stopp wird die lokale Umschaltung zurückgesetzt. Startwünsche sind begrenzt; Stopp wird nicht durch die Startbegrenzung blockiert. Alte Charakterereignisse werden beim Respawn getrennt; verspätete Humanoids dürfen den neuen Charakter nicht verändern.

Kein kameraseitiges Wackeln, keine erzwungene Blickrichtung und keine neue Dash-/Wandlauf-/Slide-/Doppelsprungphysik. Schwerkraft bleibt im Export bei 196,2.

## Obby-Prüfung
Die vorhandene konservative Kantenlücke von 6 Studs wird für das normale Gehtempo unter 16 proportional verringert: Präzise verwendet 5,25 Studs. Der konservative Anstieg bleibt 3 Studs. Höheres Tempo, stärkere Sprünge oder Sprint vergrößern die automatisch als bestanden gewerteten Grenzen nicht. Die Reparatur berücksichtigt das gewählte Profil. Das ist eine Datenheuristik, keine Flugbahnsimulation.

## Verifikation und Grenzen
210 JavaScript-Tests, sieben Lua-5.4-Verhaltensharnesses sowie Syntaxprüfungen. Der neue Harness führt die tatsächlichen Movement-Skripte für beide Spielmodi und alle vier Profile mit Service-Doubles aus. Er prüft Eingaben, boolesche Werte, Respawn, verspätete Charakterdaten, Stopps und Aufräumen. Browserprüfungen verifizieren Auswahl, Speicherung, mobile Bedienung und die tatsächlich heruntergeladenen Quellen.

Ein echter Roblox-Engine-, Touch- oder Controller-Spieltest wurde für dieses neue Movement noch nicht durchgeführt. Das Laufgefühl, die Lage des Touchbuttons neben den nativen Bedienelementen, Abkürzungen, Netzwerklatenz und alle Sprünge müssen dort geprüft werden. Keine neue Version einer vorhandenen Roblox-Experience veröffentlicht.
