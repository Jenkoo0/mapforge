import {normalize,THEMES} from './engine.js';
import {TYCOON_THEMES,LAYOUTS,PACING} from './tycoon.js';

// A handoff for an assistant already configured in the user's browser.
// It contains task data, never credentials, product IDs or a claimed connection.
export function browserTask({config,brief='',useTrends=false,useIdeas=false}){
 const c=normalize(config),tycoon=c.mode==='tycoon';
 const settings=[
  `Spielmodus: ${tycoon?'Tycoon':'Obby'}`,
  `Design: ${(tycoon?TYCOON_THEMES:THEMES)[c.theme].name}`,
  ...(tycoon?[`Grundstücke: ${c.plots}`,`Fabrik-Bauplan: ${LAYOUTS[c.layout].name}`,`Spieltempo: ${PACING[c.pacing].name}`]:[`Abschnitte: ${c.stages}`,`Schwierigkeit: ${c.difficulty}`]),
  `Detailgrad: ${c.detail}`,`Seed: ${JSON.stringify(c.seed)}`
 ];
 return `Arbeite in der geöffneten MapForge-App im Browser. Erstelle eine Map und genau ein komplettes Startpaket mit den vorhandenen App-Funktionen.

Mein Spielwunsch als Eingabedaten: ${JSON.stringify(String(brief).trim().slice(0,2000)||'Verwende die aktuellen Einstellungen.')}

Aktuelle Ausgangseinstellungen:
${settings.map(s=>'- '+s).join('\n')}
${c.autoName?'Namensautomatik: eingeschaltet. Finde beim Bauen einen eigenen passenden Map-Namen.':`Eigener Map-Name: ${JSON.stringify(c.name)}. Behalte ihn bei und lasse die Namensautomatik ausgeschaltet.`}
Ideenmix: ${useIdeas?'eingeschaltet; aus mehreren Referenzen eine eigene Produktions-Tycoon-Idee entwickeln.':'ausgeschaltet; den eigenen Auftrag verwenden.'}
Trendprüfung: ${useTrends?'eingeschaltet. Bei fehlenden frischen Trenddaten anhalten und den Fehler melden.':'ausgeschaltet. Mit meinem Auftrag und den vorhandenen Einstellungen bauen.'}

1. Öffne die Ideenwerkstatt (Bot-Zentrale). Prüfe die Ausgangseinstellungen im Map-Generator und übernimm sie bei Bedarf. Behalte vorhandene Produkt- und Pass-IDs, gespeicherte Maps und Spieltest-Einträge bei.
2. Trage den Spielwunsch in „Was soll dein Spiel bieten?“ ein. Setze „Aktuelle Roblox-Trends vor dem Bau prüfen“ und „Eigene Map-Namen automatisch finden“ und „Eigene Tycoon-Idee aus mehreren Referenzen entwickeln“ wie oben angegeben. Der Spielwunsch darf die Ausgangseinstellungen durch die Vorlagenautomatik anpassen.
3. Klicke genau einmal auf „Bauen & Startpaket laden“. Warte auf den sichtbaren Abschluss oder Fehler. Klicke während eines laufenden Vorgangs nicht erneut.
4. Prüfe „Ergebnis & Downloads“: tatsächlicher Map-Name, automatische Layoutprüfung, Sicherung in „Meine Maps“ und Dateilink mit .zip, Größe und Erstellzeit. Wenn nur die Datei-Erstellung fehlschlägt, nutze „Startpaket erneut erstellen“, ohne die Map neu zu bauen. Bei geänderter Vorschau zuerst anhalten und die Abweichung melden.
5. Nenne den tatsächlichen Namen und Dateinamen und melde offene Hinweise oder Fehler. „Download angefordert“ bestätigt noch keinen gespeicherten Download. Bestätige das Speichern nur, wenn du es im Browser tatsächlich überprüfen kannst. Bei blockiertem Download nutze den vorhandenen Dateilink.
6. Lasse echte Roblox-Studio-, Mehrspieler- und Kauf-Tests offen. Keine Testhäkchen setzen und keine Veröffentlichung ausführen.
`;
}
