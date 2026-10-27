import {TYCOON_THEMES,UPGRADES,RESEARCH,SKINS,QUESTS,CONTRACTS,TYCOON_PRODUCTS,TYCOON_PASSES} from './tycoon.js';
import {MINIGAMES,normalizeMinigame} from './minigames.js';
const OBBY_NAMES=['Cloud Kingdom','Neon District','Molten Canyon','Lost Islands'];
const TITLES={
 tycoon:{sky:'Crystal Tycoon 💎 Baue deine Kristallfabrik',neon:'Neon Tycoon ⚡ Baue dein Zukunftslabor',lava:'Vulkan Tycoon 🌋 Dein Werk wächst',jungle:'Bloom Tycoon 🌿 Deine Biofabrik'},
 obby:{sky:'Cloud Obby ☁️ Dein Weg über den Wolken',neon:'Neon Obby ⚡ Spring durch die Neonwelt',lava:'Lava Obby 🌋 Schaffst du den Parcours?',jungle:'Jungle Obby 🌿 Dein Weg über die Inseln'}
};
const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const shorten=(s,n)=>{const a=[...s];if(a.length<=n)return s;return a.slice(0,n).join('').replace(/\s+\S*$/,'').trim()||a.slice(0,n).join('');};
export function gameListing(c){
 const mode=c.mode==='tycoon'?'tycoon':'obby',theme=Object.hasOwn(TITLES[mode],c.theme)?c.theme:'sky';
 const project=clean(c.name),known=[...OBBY_NAMES,...Object.values(TYCOON_THEMES).map(t=>t.name),'Meine Map'];
 const onlyUp=mode==='obby'&&c.obbyStyle==='onlyup';
 const suffix=mode==='tycoon'?' | Tycoon':onlyUp?' | Only Up':' | Obby';
 const genericTitle=onlyUp?({sky:'Only Up · Aufstieg zur Sternwarte',neon:'Only Up · Die Signalspitze',lava:'Only Up · Die Sonnenkrone',jungle:'Only Up · Die Gartenkrone'})[theme]:TITLES[mode][theme];
 const namedMode=new RegExp(onlyUp?'only\\s*up':mode,'i').test(project);
 const title=!project||known.includes(project)?genericTitle:shorten(project,namedMode?50:50-suffix.length)+(namedMode?'':suffix);
 const names={sky:'deine eigene Kristallfabrik',neon:'dein eigenes Zukunftslabor',lava:'dein eigenes Vulkanwerk',jungle:'deine eigene Biofabrik im Grünen'};
 let description;
 if(mode==='tycoon'){
  const research=RESEARCH.reduce((n,r)=>n+r.max,0);
  description=`Starte klein und baue ${names[theme]} auf! Jede neue Maschine bringt dich dem nächsten Ausbau näher.\n\n🏗️ SO SPIELST DU\nGratis-Starter bauen → Cash produzieren → am Tresor abholen → weiterbauen.\n\nDEIN BETRIEB WÄCHST MIT DIR\n• ${UPGRADES.length} Ausbauten vom Starter bis zum fertigen Betrieb\n• ${research} Forschungsstufen für mehr Fortschritt\n• ${CONTRACTS.length} wählbare Auftragstypen und ${QUESTS.length} Tagesaufträge\n• Gratis-Kalibrierungsrunde: drei Stationen für einen Produktionsbonus\n• ${SKINS.length} Designs: Kristalle erspielen und deinen Stil wählen\n• Rebirth: neu aufbauen und mit einem Bonus weitermachen`;
  if(c.persistence!==false)description+='\n• Gespeicherter Fortschritt und begrenzter Offline-Ertrag';
  description+='\n\nDein erstes Ziel: den Starter bauen und dein erstes Cash abholen. Alle normalen Spielziele sind ohne Robux erreichbar.';
 }else{
  const stages=Math.max(onlyUp?96:12,Math.min(onlyUp?240:80,Math.round(Number(c.stages)||(onlyUp?144:36)))),every=Math.max(2,Math.min(10,Math.round(Number(c.checkpointEvery)||5)));
  const settings={sky:'über schwebende Wolkeninseln',neon:'durch eine leuchtende Neonwelt',lava:'über Plattformen im Vulkan-Design',jungle:'über grüne Dschungelinseln'};
  description=`${onlyUp?'Steige durch vier Themenkapitel: Präzision, versetzte Landungen und schmale Stege. ':''}Springe ${settings[theme]} und erreiche das Ziel nach ${stages} Abschnitten!\n\n🏁 DEINE HERAUSFORDERUNG\n• ${stages} Parcours-Abschnitte bis zur letzten Plattform\n• Checkpoints alle ${every} Abschnitte sichern deinen Weg\n• Münzen unterwegs sammeln und eine Leuchtspur erspielen\n• Nach einem Sturz am letzten Checkpoint weiterprobieren\n\nStarte mit dem ersten Sprung. Münzen sind optional; alle Sprünge sind ohne Robux spielbar.`;
 }
 if(c.events==='rally'){const game=MINIGAMES[normalizeMinigame(c.minigame)];description+='\n\n'+game.label.toUpperCase()+'\n'+game.description+' Persönliche Bestzeit und Top 5 gelten nur für die aktuelle Serverrunde.';}
 if(c.grind!==false)description+='\n\nDEINE WERKSTATT\nWerkmarken erspielen und passende Attribute über fünf Level ausbauen. '+(mode==='tycoon'?'Neue Maschinen geben einmalig Marken. Maschinenkraft steigert die Produktion um bis zu 20 %.':'Obby-Ziele geben Marken. Sammelgeschick erhöht Streckenmünzen, Zielfokus die Zielprämie.')+(c.events==='rally'?' Der erste gültige Minispiel-Abschluss je Serverrunde gibt zusätzliche Werkmarken.':'')+' Upgrades verändern keine Minispielzeiten, Laufgeschwindigkeit oder Sprungkraft.';
 const configured=mode==='tycoon'?[...TYCOON_PRODUCTS,...TYCOON_PASSES].some(p=>Number(c[p.field])>0):Number(c.boostId)>0||Number(c.coinsId)>0;
 if(c.shop!==false&&c.persistence!==false&&configured)description+='\nOptionale Extras findest du im Spiel-Shop.';
 return {title,description,language:'de',automatic:true,projectName:project,mode,theme};
}
export function listingMarkdown(c){const l=gameListing(c);return `# Automatisch erstellte Roblox-Spieltexte\n\n## Titel\n${l.title}\n\n## Beschreibung\n${l.description}\n\n## Übernehmen\nTitel und Beschreibung im Veröffentlichungsfenster von Roblox Studio bzw. im Creator Hub einfügen. MapForge erzeugt die Texte automatisch für die aktuelle Konfiguration. Es ist kein Roblox-Konto verbunden; Metadaten werden nicht von selbst zu Roblox übertragen. Der Projektname und vorhandene Spiel-/Produktzuordnungen bleiben erhalten. Titel nicht bei jedem Update umbenennen.\n\nReferenzen (20.10.2026):\n- https://create.roblox.com/docs/production/publishing/publish-games-and-places\n- https://create.roblox.com/docs/discovery\n`;}
