import {reviewRequest,reviewPrompt,improvementMarkdown} from './improve.js';
import {handoffUpdate} from './handoff.js';
import {creativeStoryMarkdown} from './creative-story.js';
const signature=[137,80,78,71,13,10,26,10];
export function reviewFiles(map,{feedback='',manualTests=[],playtests=[],improvements=[],previewBytes,startPreviewBytes}={}){
 for(const bytes of [previewBytes,startPreviewBytes])if(!(bytes instanceof Uint8Array)||bytes.length<24||!signature.every((v,i)=>bytes[i]===v))throw Error('Zwei gültige PNG-Vorschauen sind für das KI-Prüfpaket erforderlich.');
 return {'Map-Daten.json':JSON.stringify(reviewRequest(map,feedback),null,2),'Geometrie.json':JSON.stringify({parts:map.parts,paths:map.paths||[],stages:map.stages},null,2),'KI-Pruefanfrage.md':reviewPrompt(map,feedback),'KI-Uebergabe.md':handoffUpdate(map,manualTests,playtests,improvements),'Weltgeschichte.md':creativeStoryMarkdown(map.config),'Verbesserungsverlauf.md':improvementMarkdown(improvements),'Map-Vorschau.png':previewBytes,'Einstieg-Vorschau.png':startPreviewBytes};
}
