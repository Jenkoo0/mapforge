import {COSMETICS,cosmeticsGuide} from './cosmetics.js';
import {grindMarkdown} from './minigames.js';
import {onlyUpDifficulty,difficultyMarkdown} from './only-up-difficulty.js';
import {onlyUpGuide} from './only-up-guide.js';
import {eventsMarkdown} from './events.js';
import {movementMarkdown} from './movement.js';
import {conceptMarkdown} from './idea-data.js';
import {creativeStoryMarkdown} from './creative-story.js';
import {qualityDossier,mapMetrics,studioMapAudit} from './quality-report.js';
import {shopGuide,studioShopScanner} from './shop-setup.js';
import {gameListing,listingMarkdown} from './listing.js';
import {growthMarkdown} from './growth.js';
import {visualChecklist} from './visual-checks.js';
import {playerPlanMarkdown} from './player-plan.js';
import {guideMarkdown} from './walkthrough-core.js';
import {handoffUpdate} from './handoff.js';
import {playtestMarkdown,purchaseMarkdown,restorePlaytests} from './playability.js';
import {pacingMarkdown} from './gameplay.js';
import {improvementMarkdown} from './improve.js';
import {VERSION,toRBXLX,safeFilename,validate} from './engine.js';
import {UPGRADES,TYCOON_PRODUCTS,TYCOON_PASSES} from './tycoon.js';
export function launchFiles(map,scripts,manualTests=[],playtests=[],improvements=[]){
 const c=map.config,stem=safeFilename(c.name),tycoon=c.mode==='tycoon',checks=validate(map);
 const products=tycoon?[...TYCOON_PRODUCTS.map(p=>({...p,type:'Developer Product'})),...TYCOON_PASSES.map(p=>({...p,type:'Game Pass'}))]:[{key:'Boost15',field:'boostId',name:'Münzboost · 15 Min.',type:'Developer Product'},{key:'Coins500',field:'coinsId',name:'500 Münzen',type:'Developer Product'}];
 products.push(...COSMETICS.map(p=>({...p,type:'Game Pass'})));
 const csv=value=>'"'+String(value).replaceAll('"','""')+'"';
 const listing=gameListing(c),description=listing.description;
 const report=checks.map(t=>`[${t.status.toUpperCase()}] ${t.title}\n${t.detail}`).join('\n\n');
 const incomplete=products.filter(p=>!c[p.field]);
 return {
  [`${stem}.rbxlx`]:toRBXLX(map,scripts),
  [`${stem}.mapforge.json`]:JSON.stringify({app:'MapForge',version:VERSION,config:c,playtests:restorePlaytests(playtests),improvements},null,2),
  'Map-Idee-und-Referenzen.md':conceptMarkdown(c),
  'Weltgeschichte.md':creativeStoryMarkdown(c),
  'Spielerbewegung.md':movementMarkdown(c),
  'Events-und-Signal-Rallye.md':eventsMarkdown(c),
  'Werkstatt-und-Minispiele.md':grindMarkdown(c),
  'Kosmetik-Shop-Einrichtung.md':cosmeticsGuide(c),
  ...(map.onlyUp?{'OnlyUp-Aufstieg.md':onlyUpGuide(map),'Skillkurve.md':difficultyMarkdown(map),'Skillkurve.json':JSON.stringify(onlyUpDifficulty(map),null,2)}:{}),
  'KI-Uebergabe.md':handoffUpdate(map,manualTests,playtests,improvements),
  'Spieltempo-und-Auftraege.md':pacingMarkdown(c),
  'Verbesserungsverlauf.md':improvementMarkdown(improvements),
  'Kaufplan-und-Referenzen.md':purchaseMarkdown(c),
  'Spieltest-Auswertung.md':playtestMarkdown(playtests),
  'Spieltests.json':JSON.stringify({app:'MapForgePlaytests',version:VERSION,records:restorePlaytests(playtests)},null,2),
  'Schritt-fuer-Schritt.md':guideMarkdown({map,checks,manualTests}),
  'Roblox-Titel.txt':listing.title,
  'Roblox-Beschreibung.txt':description,
  'Roblox-Metadaten.json':JSON.stringify({app:'MapForgeListing',version:VERSION,...listing},null,2),
  'Spieltexte.md':listingMarkdown(c),
  'Erste-Spieler-und-Werbung.md':growthMarkdown(c,manualTests,restorePlaytests(playtests)),
  'Studio-Optik-Test.md':visualChecklist(map),
  'Map-Dossier.md':qualityDossier(map),
  'Map-Messwerte.json':JSON.stringify({generatorVersion:VERSION,...mapMetrics(map),studioPlaytestRunByGenerator:false},null,2),
  'Studio-Map-Audit.lua':studioMapAudit(map),
  'Spielziel-und-Referenzen.md':playerPlanMarkdown(c),
  'START-HIER.md':`# ${c.name} — Startpaket\n\n1. ${stem}.rbxlx in Roblox Studio öffnen. Map, HUD, Serverlogik und Konfiguration sind enthalten.\n2. Oben links auf das blaue ▶ neben Test klicken; mit rotem ■ beenden. Dein Spielziel steht in Spielziel-und-Referenzen.md. Grundstück, Produktion und Käufe mit Spielgeld testen. ${tycoon?'Unter Fabrikmenü → Ausbau findest du Studio-Testhelfer für Test-Cash und alle 48 Ausbauten. Diese sind ausschließlich in Studio mit getrennten Testdaten verfügbar.':''}\n3. Mit mehreren Testspielern, Touch-Steuerung, Rejoin und Speicher testen. Die Prüfliste steht im Bericht.\n4. Über Datei → Auf Roblox veröffentlichen in deinem Konto speichern. Die automatisch erstellten Texte aus Roblox-Titel.txt und Roblox-Beschreibung.txt einsetzen; Zielgruppe im Creator Hub festlegen${tycoon?` und die maximale Spielerzahl auf ${c.plots} begrenzen`:''}.\n5. Für Robux-Angebote die Einträge aus Shop-Angebote.csv im eigenen Spiel anlegen, Preise festlegen und echte IDs in MapForge übernehmen. Dann neu exportieren.\n\n## Bereits vorbereitet\n${tycoon?'48 Ausbaustufen, 28 Forschungsstufen, 12 Skins, sechs Tagesaufträge, Tresor, Rebirth und Offline-Produktion.':'Parcours, Münzen, Checkpoints und Respawn.'} Beleuchtung, Materialien, Spawn, Spielerbewegung, Streaming und Health-Check sind eingebaut.\n\n## Speicher und Tests\nStudio verwendet standardmäßig MapForge_Studio_v1; veröffentlichte Server verwenden MapForge_v1. Test-Cash und Freischaltungen aus Studio verändern dadurch keinen Live-Spielstand. Für persistente Studio-Tests zuerst einen separaten Testplatz veröffentlichen und dort API-Dienste freigeben. Ohne Zugriff läuft Studio als Demo.\n\n## Noch von dir zu erledigen\nRoblox-Login, echte Produkt-IDs und Preise, maximale Spielerzahl, Zielgruppenangaben und tatsächlicher Studio-Spieltest. ${incomplete.length} Shop-Einträge haben noch keine ID und bleiben deaktiviert. Die ZIP ist keine Bestätigung eines Roblox-Spieltests.\n`,
  'Creator-Hub-Vorlage.md':`# Veröffentlichung vorbereiten\n\nTitel: ${listing.title}\n${tycoon?`Empfohlene maximale Spielerzahl: ${c.plots} (eine Fabrik je Spieler)\n`:''}\n## Beschreibung zum Übernehmen\n\n${description}\n\n## Shop\n\nShop-Angebote.csv enthält die passenden Skript-Schlüssel und IDs. Preise gehören in den Creator Hub. Verwende Produkte und Pässe desselben Spiels; 0 bedeutet nicht eingerichtet.\n\nNach dem Spieltest die aktuellen Freigabeanforderungen in Roblox Studio und Creator Hub abschließen. MapForge ist nicht mit deinem Roblox-Konto verbunden.\n`,
  ...(tycoon?{'Robux-Shop-Einrichtung.md':shopGuide(c),'Shop-IDs-aus-Studio.lua':studioShopScanner()}:{}),
  'Shop-Angebote.csv':[['Typ','Schlüssel','Name','ID','Preis'].join(','),...products.map(p=>[p.type,p.key,p.name,c[p.field]||0,'Im Creator Hub festlegen'].map(csv).join(','))].join('\r\n'),
  'Pruefbericht.txt':`MAPFORGE ${VERSION}\nProjekt: ${c.name}\nSeed: ${c.seed}\n\n${report}\n\nVON DIR BESTÄTIGTE TESTS\n${manualTests.map(t=>`[${t.done?'x':' '}] ${t.label}`).join('\n')}\n\nAutomatische Datenprüfung: ${checks.filter(t=>t.status==='pass').length} bestanden, ${checks.filter(t=>t.status==='error').length} Fehler.\nRoblox Studio wurde vom Generator nicht ausgeführt.\n`,
  'Launch-Konfiguration.json':JSON.stringify({generatorVersion:VERSION,name:c.name,mode:c.mode,parts:map.parts.length,upgrades:tycoon?UPGRADES.length:0,recommendedMaxPlayers:tycoon?c.plots:null,persistence:c.persistence,studioDataStore:'MapForge_Studio_v1',liveDataStore:'MapForge_v1',streaming:{enabled:true,minRadius:64,targetRadius:256},missingShopIds:incomplete.map(p=>p.field),automaticErrors:checks.filter(t=>t.status==='error').map(t=>t.id),layout:c.layout,studioPlaytestRunByGenerator:false},null,2)
 };
}
