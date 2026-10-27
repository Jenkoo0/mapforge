// MapForge: shared event presentation and exported rally geometry.
import {MINIGAMES,normalizeMinigame} from './minigames.js';
export const EVENT_MODES=Object.freeze({rally:'Events + Minispiel-Arena',ambient:'Nur Licht-Events',off:'Aus'});
export const EVENT_LOOKS=Object.freeze([
 Object.freeze({id:'aurora',name:'Polarlicht',color:'#93eed4',second:'#ac9bff',detail:'Mintfarbene Lichtpunkte schweben sanft über deiner Welt.'}),
 Object.freeze({id:'ember',name:'Goldene Stunde',color:'#ffd38c',second:'#f3a6ad',detail:'Warme Funken und kupferne Akzente verwandeln die Arena.'}),
 Object.freeze({id:'lunar',name:'Mondblüte',color:'#bbb4ff',second:'#9dd8ff',detail:'Kühle Lichtblüten leuchten zwischen den Signalstelen.'}),
]);
export const normalizeEvents=value=>Object.hasOwn(EVENT_MODES,value)?value:'rally';
export function eventsMarkdown(c){const game=MINIGAMES[normalizeMinigame(c.minigame)];return `# Events und Minispiel-Arena\n\nAuswahl: ${EVENT_MODES[normalizeEvents(c.events)]}. Minispiel: ${game.label}.\n\nDrei Licht-Events wechseln in einem gemischten Deck; kein direktes Wiederholen. 20 Sekunden Ankündigung, 160 Sekunden Event, 60 Sekunden Pause. Licht-Events verändern weder Wirtschaft noch Bewegung.\n\n${game.description} Die optionale Arena liegt neben der Map: am Terminal im Startbereich mit E / X / Touch hinreisen, am mittleren Startfeld beginnen. Maximal 75 Sekunden Laufzeit; Echohöfe hat davor sechs Sekunden Vorschau und erlaubt dabei das Positionieren. Nach der Vorschau werden Folge und Zielmarkierungen verborgen. Eine falsche Antwort beendet den Merkversuch. Funkenjagd hat zwei Durchgänge mit je vier verschiedenen Stationen, Reihenfolge frei; direkte Wiederholungen zählen auch zwischen Durchgängen nicht. Zeitmessung, Reihenfolge, Lebenszustand, Entfernung, Mindestlaufzeit und Ablauf prüft der Server. Kein vollständiger Anti-Cheat.\n\nPersönliche Rundenbestzeit und Top 5 dieses Servers sind nicht dauerhaft gespeichert; sie werden am Rundenwechsel zurückgesetzt. Tod, Respawn, Arena-Verlassen und Eventende brechen den Lauf ab. Neue Starts benötigen 75 Sekunden Restzeit, bei Echohöfe 81. Keine Kaufvorteile oder Robux-Einsätze.\n\nWerkstatt: ${c.grind===false?'ausgeschaltet; keine Werkmarkenprämie.':'Erster gültiger Abschluss pro Spieler und Serverrunde: 5 Marken plus 1 unter 45 Sekunden und 1 unter 30 Sekunden, dazu 10 XP. Marken und XP werden über das vorhandene Profil gespeichert. Weitere Versuche geben keine zweite Prämie.'} Die ausgebauten Attribute verändern weder Bewegung noch Minispielzeit oder Rangliste. Details stehen in Werkstatt-und-Minispiele.md.\n\nGrafik: vier nummerierte Stationen mit eigener Anordnung, lokalen sanften Farbwechseln und kompakter Eventanzeige. Effekte abschaltbar; keine Änderung an Kamera, Schwerkraft oder Sichtweite.\n\nNoch in Roblox Studio prüfen: zwei Spieler gleichzeitig, Entfernung/Teleportversuche, Tod/Respawn, Rundenwechsel, Merkfolge und Abbruch, Speicherung/Wiederbeitritt, Touch/Gamepad, Streaming und Leistung. Service-Doubles ersetzen keinen Engine-Test.\n`;}
export function addEventArena(map){
 if(normalizeEvents(map.config.events)!=='rally')return map;
 const spawn=map.parts.find(p=>p.kind==='spawn');if(!spawn)return map;
 const game=normalizeMinigame(map.config.minigame),name=MINIGAMES[game].label;
 let id=Math.max(...map.parts.map(p=>p.id));
 // Outside the existing world bounds, at spawn height. Keep the saved route intact.
 const y=spawn.pos[1]-2.5;
 const origin=[Math.min(...map.parts.map(p=>p.pos[0]-p.size[0]/2))-80,y,spawn.pos[2]], [x,,z]=origin;
 const add=(name,pos,size,color,extra={})=>map.parts.push({id:++id,name,pos,size,color,kind:'event',material:'Metal',anchored:true,collide:false,castShadow:false,query:false,...extra});
 add('RallyDeck',[x,y,z],[74,2,74],map.theme.dark,{collide:true,query:true,castShadow:true,layer:0});
 add('RallyStart',[x,y+1.2,z],[8,.4,8],'#93eed4',{neon:true,label:name.toUpperCase()+'\nHier starten',sign:{width:180,height:52,distance:24}});
 add('RallyReturn',[x+(game==='memory'?30:0),y+2,z+32],[5,2,3],map.theme.side,{label:'ZURÜCK',sign:{width:140,height:36,distance:18}});
 const entry=map.config.mode==='tycoon'?[spawn.pos[0]+22,spawn.pos[1]+1,spawn.pos[2]-10]:[spawn.pos[0]-8,13.8,spawn.pos[2]-23];
 add('RallyPortal',entry,[3,3,3],'#93eed4',{neon:true,label:name.toUpperCase()+'\nArena betreten',sign:{width:180,height:52,distance:24}});
 const colors=['#93eed4','#bbb4ff','#ffd38c','#9dd8ff'];
 const positions=game==='memory'?[[0,-27],[27,0],[0,27],[-27,0]]:game==='collect'?[[-25,-18],[16,-25],[25,16],[-16,25]]:[[-24,-24],[24,-24],[24,24],[-24,24]];
 positions.forEach(([dx,dz],i)=>{
  add('RallySignal'+(i+1),[x+dx,y+2.5,z+dz],[4,3,4],colors[i],{neon:true,label:String(i+1),sign:{width:72,height:54,distance:24}});
  add('RallyHalo'+(i+1),[x+dx,y+1.08,z+dz],[9,.12,9],colors[i],{neon:true,transparency:.4,layer:1});
  for(let n=1;n<=4;n++)add(`RallyWay_${i}_${n}`,[x+dx*n/5,y+1.06,z+dz*n/5],[1.3,.1,1.3],colors[i],{neon:true,layer:1});
  add('RallyMast'+i,[x+dx,y+7,z+dz],[.4,8,.4],map.theme.side);
  add('RallyCrown'+i,[x+dx,y+11.2,z+dz],[6,.4,1],colors[i],{neon:true,rotation:[0,i*45,0]});
 });
 if(game==='memory')for(const side of [-1,1])for(const axis of [-1,1]){
  const px=x+side*29,pz=z+axis*29;
  add(`EchoColumn_${side}_${axis}`,[px,y+4,pz],[1.5,6,1.5],map.theme.side);
  add(`EchoLeaf_${side}_${axis}`,[px,y+8,pz],[8,2,7],map.theme.top,{shape:'ball'});
  add(`EchoStone_${side}_${axis}`,[px,y+1.1,pz],[9,.2,9],map.theme.side,{layer:1});
 }
 if(game==='collect')for(let i=0;i<8;i++){
  const angle=i*Math.PI/4,px=x+Math.cos(angle)*31,pz=z+Math.sin(angle)*31;
  add('SparkCoil_'+i,[px,y+4,pz],[2.5,6,2.5],map.theme.side);
  for(let ring=0;ring<3;ring++)add(`SparkRing_${i}_${ring}`,[px,y+2+ring*2,pz],[4,.35,4],'#ffd38c',{neon:true});
 }
 for(const side of [-1,1])for(const axis of [0,2]){
  const pos=[x,y+2.5,z],size=[74,3,1];pos[axis]+=side*37;if(axis===0){size[0]=1;size[2]=74;}
  add(`RallyRail_${axis}_${side}`,pos,size,map.theme.side,{collide:true,query:true});
 }
 return map;
}
