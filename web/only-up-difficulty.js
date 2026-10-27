/** Cheap route analysis for the UI: O(stages + 8 sections), no engine dependency.
 * Measurements describe axis-aligned rectangular stage surfaces, not character
 * motion, collision clearance, player success rates or measured difficulty.
 */
export const ONLY_UP_DIFFICULTY_FORMULA = '100 × clamp(0.5 × maxGap / 5.25 + 0.3 × maxRise / 3 + 0.2 × clamp((14 − minWidth) / 7.5, 0, 1), 0, 1)';
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const round=n=>Math.abs(n)>Number.MAX_SAFE_INTEGER/1000?n:Math.round(n*1000)/1000;
const top=stage=>stage.pos[1]+stage.size[1]/2;
const gap=(a,b)=>Math.hypot(...[0,2].map(axis=>Math.max(0,Math.abs(a.pos[axis]-b.pos[axis])-(a.size[axis]+b.size[axis])/2)));
const score=section=>Math.round(100*clamp(.5*section.maxGap/5.25+.3*section.maxRise/3+.2*clamp((14-section.minWidth)/7.5,0,1),0,1));
const vector=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const text=(value,fallback)=>typeof value==='string'&&value.trim()?value.trim():fallback;

/** checkpointSpan and maxCheckpointSpan count jumps, including arrival at the
 * next checkpoint. largestDropToCheckpoint is the vertical surface-top loss
 * from an unsecured stage to its last reached checkpoint. Reached checkpoint
 * surfaces have zero loss because they have already secured the arrival.
 * length sums 3D stage-centre distances; height uses final minus initial top.
 * Each section includes the incoming jump from start-1 to start. minWidth is
 * min(size.x,size.z), independent of travel direction. index is the bounded
 * heuristic score 0–100; sectionIndex identifies the original section 0–7.
 * Cached map.onlyUp.length/height are never used as measurement inputs.
 */
export function onlyUpDifficulty(map){
 const result={available:!!map?.onlyUp,valid:false,validLongRoute:false,errors:[],warnings:[],sections:[],length:null,height:null,maxGap:null,maxRise:null,minWidth:null,checkpoints:0,maxCheckpointSpan:0,largestDropToCheckpoint:0,startsAtCheckpoint:false,finishesAtCheckpoint:false,hasFinish:false,formula:ONLY_UP_DIFFICULTY_FORMULA};
 if(!result.available){result.errors.push('Keine Only-Up-Route vorhanden.');return result;}
 const stages=map.stages,sections=map.onlyUp.sections;
 const checkpointEvery=map.config?.checkpointEvery;
 const hasCheckpointInterval=Number.isInteger(checkpointEvery)&&checkpointEvery>=2&&checkpointEvery<=10;
 if(!Array.isArray(stages)||stages.length<2){result.errors.push('Die Route benötigt mindestens Start und Ziel.');return result;}
 for(let i=0;i<stages.length;i++){
  const stage=stages[i];
  if(!stage||stage.index!==i||!vector(stage.pos)||!vector(stage.size)||stage.size.some(n=>n<=0)||(stage.rotation!==undefined&&(!vector(stage.rotation)||stage.rotation.some(n=>n!==0)))){
   result.errors.push('Etappe '+i+' benötigt ihren fortlaufenden Index und endliche, positive, achsenparallele Geometrie.');
   return result;
  }
  if(hasCheckpointInterval&&stage.checkpoint!==(i===0||i===stages.length-1||i%checkpointEvery===0))result.errors.push('Das Checkpointflag der Etappe '+i+' weicht vom Serverintervall '+checkpointEvery+' ab.');
 }
 const last=stages.length-1;
 if(!Array.isArray(sections)||sections.length!==8){result.errors.push('Die Only-Up-Route benötigt genau acht Abschnitte.');return result;}
 let next=1;
 for(let i=0;i<8;i++){
  const section=sections[i];
  if(!section||!Number.isInteger(section.start)||!Number.isInteger(section.end)||section.start!==next||section.end<section.start||section.end>last){
   result.errors.push('Abschnitt '+(i+1)+' deckt die Etappen nicht lückenlos und eindeutig ab.');result.sections=[];return result;
  }
  result.sections.push({sectionIndex:i,title:text(section.title,'Abschnitt '+(i+1)),skill:text(section.skill,'Nicht benannter Schwerpunkt'),start:section.start,end:section.end,maxGap:0,maxRise:0,minWidth:Infinity,checkpointSpan:0,index:0});
  next=section.end+1;
 }
 if(next!==last+1){result.errors.push('Die acht Abschnitte reichen nicht bis zum Ziel.');result.sections=[];return result;}
 result.startsAtCheckpoint=stages[0].checkpoint===true;
 result.finishesAtCheckpoint=stages[last].checkpoint===true;
 result.hasFinish=stages[last].finish===true&&!stages.slice(0,last).some(stage=>stage.finish===true);
 if(!result.startsAtCheckpoint)result.errors.push('Der Start ist kein Checkpoint.');
 if(!result.finishesAtCheckpoint)result.errors.push('Das Ziel ist kein Checkpoint.');
 if(!result.hasFinish)result.errors.push('Nur die letzte Etappe muss als Ziel markiert sein.');
 if(Number.isFinite(map.config?.stages)&&map.config.stages!==last)result.errors.push('Die konfigurierte Etappenzahl passt nicht zur realen Route.');
 let length=0,maxGap=0,maxRise=0,minWidth=Infinity,checkpointIndex=0,checkpointTop=top(stages[0]),sectionIndex=0;
 for(let i=0;i<stages.length;i++){
  const stage=stages[i],width=Math.min(stage.size[0],stage.size[2]);
  minWidth=Math.min(minWidth,width);
  if(i){
   while(i>result.sections[sectionIndex].end)sectionIndex++;
   const section=result.sections[sectionIndex],previous=stages[i-1],edgeGap=gap(previous,stage),rise=top(stage)-top(previous),span=i-checkpointIndex;
   length+=Math.hypot(...stage.pos.map((value,axis)=>value-previous.pos[axis]));
   maxGap=Math.max(maxGap,edgeGap);maxRise=Math.max(maxRise,rise);
   section.maxGap=Math.max(section.maxGap,edgeGap);section.maxRise=Math.max(section.maxRise,rise);section.minWidth=Math.min(section.minWidth,width);section.checkpointSpan=Math.max(section.checkpointSpan,span);
   result.maxCheckpointSpan=Math.max(result.maxCheckpointSpan,span);
   if(stage.checkpoint!==true)result.largestDropToCheckpoint=Math.max(result.largestDropToCheckpoint,top(stage)-checkpointTop);
   if(rise<0)result.warnings.push('Etappe '+i+' liegt unter der vorherigen Oberfläche.');
  }
  if(stage.checkpoint===true){result.checkpoints++;checkpointIndex=i;checkpointTop=top(stage);}
 }
 const height=top(stages[last])-top(stages[0]);
 if(![length,height,maxGap,maxRise,minWidth,result.largestDropToCheckpoint].every(Number.isFinite)){
  result.errors.push('Die Geometriewerte überschreiten den endlichen Messbereich.');result.sections=[];result.largestDropToCheckpoint=0;return result;
 }
 Object.assign(result,{length:round(length),height:round(height),maxGap:round(maxGap),maxRise:round(maxRise),minWidth:round(minWidth),largestDropToCheckpoint:round(result.largestDropToCheckpoint)});
 for(const section of result.sections){section.index=score(section);for(const key of ['maxGap','maxRise','minWidth'])section[key]=round(section[key]);}
 if(maxGap>5.25+1e-9)result.errors.push('Eine Kantenlücke überschreitet 5,25 Studs.');
 if(maxRise>3+1e-9)result.errors.push('Ein Oberflächenanstieg überschreitet 3 Studs.');
 if(hasCheckpointInterval&&result.maxCheckpointSpan>checkpointEvery)result.errors.push('Die tatsächliche Checkpointspanne überschreitet das Serverintervall '+checkpointEvery+'.');
 for(const key of ['length','height'])if(map.onlyUp[key]!==undefined&&(!Number.isFinite(map.onlyUp[key])||Math.abs(map.onlyUp[key]-result[key])>.01))result.warnings.push('Veralteter Only-Up-Metawert '+key+'; aus realen Etappen neu berechnet.');
 result.valid=result.errors.length===0;
 result.validLongRoute=result.valid&&last>=96&&last<=240&&result.height>0;
 return result;
}

const cell=value=>String(value).replace(/[\r\n]+/g,' ').replace(/\|/g,'\\|').replace(/[<>]/g,'');
const fmt=value=>Number.isFinite(value)?String(value).replace('.',','):'–';

/** A self-contained export with eight actual geometry summaries and limits. */
export function difficultyMarkdown(map){
 const analysis=onlyUpDifficulty(map);
 const lines=['# Only-Up-Skillkurve','',analysis.valid?'Geometrischer Anspruch aus den tatsächlichen Etappenflächen.':'Die Routenauswertung meldet unvollständige oder ungültige Daten.',''];
 if(analysis.sections.length){
  lines.push('| Abschnitt | Etappen | Schwerpunkt | Kantenlücke max. | Anstieg max. | Breite min. | Checkpointspanne | Index / 100 |','| --- | --- | --- | --- | --- | --- | --- | --- |');
  for(const section of analysis.sections)lines.push('| '+[section.title,section.start+'–'+section.end,section.skill,fmt(section.maxGap),fmt(section.maxRise),fmt(section.minWidth),section.checkpointSpan,section.index].map(cell).join(' | ')+' |');
  lines.push('','Länge: '+fmt(analysis.length)+' Studs · Höhe: '+fmt(analysis.height)+' Studs · Checkpoints: '+analysis.checkpoints+' · größte Checkpointspanne: '+analysis.maxCheckpointSpan+' Sprünge · größte Höhendifferenz zum vorherigen Checkpoint: '+fmt(analysis.largestDropToCheckpoint)+' Studs.','');
 }
 if(analysis.errors.length)lines.push('Fehler: '+analysis.errors.map(cell).join(' '),'');
 if(analysis.warnings.length)lines.push('Hinweise: '+analysis.warnings.map(cell).join(' '),'');
 lines.push('Formel: '+analysis.formula+'.','',
  'maxGap ist der horizontale Abstand der Rechteckkanten; maxRise nutzt die Oberseiten. minWidth ist die kleinere horizontale Plattformkante. Abschnittswerte enthalten den ankommenden Sprung. Checkpointspannen zählen Sprünge einschließlich Ankunft am nächsten Checkpoint. Die Höhendifferenz zum letzten Checkpoint berücksichtigt ungesicherte Zwischenetappen; eine erreichte Checkpointplattform hat selbst keinen Rückfallverlust. Die Länge verbindet die Plattformmittelpunkte in 3D; die Höhe ist Zieloberseite minus Startoberseite. Alle Maße in Studs.',
  '', 'Der Index ist eine offengelegte Heuristik für geometrischen Anspruch, keine gemessene Spielerschwierigkeit. Er bildet keine Abbiegewinkel, Anlaufqualität, Sicht, Fallflugbahn, Netzwerklatenz oder Spielerleistung ab. Diese schnelle Analyse prüft keine anderen Bauteile auf Kollisionen oder freie Sprungkorridore. Kein Roblox-Spieltest: Steuerung, Touch/Controller, Streaming, tatsächliche Fallverluste und erreichbare Sprünge müssen in Studio geprüft werden.');
 return lines.join('\n')+'\n';
}
