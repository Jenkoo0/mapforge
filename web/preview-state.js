import {UPGRADES,buildCost,upgradeName} from './tycoon.js';
export function previewStage(config,level=48){
 const count=Math.max(0,Math.min(UPGRADES.length,Math.floor(Number(level)||0)));
 const next=UPGRADES[count],income=UPGRADES.slice(0,count).reduce((n,u)=>n+u.income,0);
 return {count,income,next:next?{id:next.id,name:upgradeName(next,config.theme),cost:buildCost(next,config.pacing)}:null,
  title:count===0?'So beginnt dein Spiel':count===48?'Deine vollständig ausgebaute Fabrik':`${count} von 48 Ausbauten`,
  detail:count===0?`Das Grundstück startet leer. Das markierte Gratis-Feld baut „${upgradeName(UPGRADES[0],config.theme)}“. Danach produziert die erste Maschine Cash für den Tresor.`:count===48?'Alle Gebäude stehen. Forschung, Designs, Aufträge und ein optionaler Rebirth bieten weitere Ziele.':`${income.toLocaleString('de-DE')} Cash/Sek. Basisproduktion. Nächster Kauf: ${upgradeName(next,config.theme)} für ${buildCost(next,config.pacing).toLocaleString('de-DE')} Cash. Geld am Tresor abholen und zum markierten Feld gehen.`};
}
export function visiblePreviewParts(map,view={}){
 if(view.events)return map.parts.filter(p=>p.kind==='event'&&p.name!=='RallyPortal');
 const parts=map.parts.filter(p=>p.kind!=='event'||p.name==='RallyPortal');
 if(map.config.mode!=='tycoon')return parts;
 const stage=previewStage(map.config,view.level??48);
 return parts.filter(p=>(!view.focusPlot||p.plot===view.focusPlot)&&(!p.unlock||Number(p.unlock.slice(1))<=stage.count)&&(p.role!=='Button'||p.upgrade===stage.next?.id));
}
