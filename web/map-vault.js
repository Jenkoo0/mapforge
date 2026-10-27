import {COSMETIC_ID_FIELDS} from './cosmetics.js';
import {normalize,VERSION,hash} from './engine.js';
import {TYCOON_PRODUCTS,TYCOON_PASSES} from './tycoon.js';
export const MAPS_KEY='mapforge.maps.v1';
export const MAPS_LIMIT=8;
export const SHOP_ID_FIELDS=['boostId','coinsId',...TYCOON_PRODUCTS.map(p=>p.field),...TYCOON_PASSES.map(p=>p.field),...COSMETIC_ID_FIELDS];
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const copy=value=>JSON.parse(JSON.stringify(value));
const signature=config=>JSON.stringify(normalize(config));
export function savedProject(value){return plain(value)&&typeof value.name==='string'&&typeof value.seed==='string'?normalize(value):null;}
export function openMapConfig(record,current){
 const active=normalize(current);return normalize({...record.config,...Object.fromEntries(SHOP_ID_FIELDS.map(field=>[field,active[field]]))});
}
function readRecord(value){
 if(!plain(value)||!savedProject(value.config)||!['generated','saved','imported','recovered'].includes(value.source))throw Error('Ungültiger Map-Eintrag.');
 if(typeof value.id!=='string'||!/^[\w-]{1,80}$/.test(value.id)||!Number.isSafeInteger(value.createdAt)||value.createdAt<=0||!Number.isSafeInteger(value.updatedAt)||value.updatedAt<value.createdAt||!Number.isFinite(new Date(value.updatedAt).getTime())||!Number.isInteger(value.parts)||value.parts<1||value.parts>100000)throw Error('Ungültige Map-Metadaten.');
 if(value.generatedAt!==null&&(!Number.isSafeInteger(value.generatedAt)||value.generatedAt<value.createdAt||value.generatedAt>value.updatedAt))throw Error('Ungültiger Erstellungszeitpunkt.');
 return {id:value.id,config:normalize(value.config),parts:value.parts,source:value.source,createdAt:value.createdAt,updatedAt:value.updatedAt,generatedAt:value.generatedAt,generatorVersion:String(value.generatorVersion||'unbekannt').slice(0,30)};
}
export class MapVault{
 constructor(storage,{now=Date.now,newId,onChange=()=>{}}={}){
  Object.assign(this,{storage,now,newId,onChange});this.sequence=0;this.persisted=true;this.records=[];this.ignored=0;
  const saved=storage.get(MAPS_KEY,null);
  if(saved?.app==='MapForgeMaps'&&saved.schemaVersion===1&&Array.isArray(saved.records)){
   const signatures=new Set(),ids=new Set();
   for(const raw of saved.records.slice(0,MAPS_LIMIT*2)){try{const row=readRecord(raw),key=signature(row.config);if(ids.has(row.id)||signatures.has(key)||this.records.length===MAPS_LIMIT){this.ignored++;continue;}ids.add(row.id);signatures.add(key);this.records.push(row);}catch{this.ignored++;}}
  }else if(saved!==null)this.ignored++;
 }
 get revision(){return JSON.stringify(this.records);}
 get(id){const row=this.records.find(r=>r.id===id);return row?copy(row):null;}
 find(config){const key=signature(config),row=this.records.find(r=>signature(r.config)===key);return row?copy(row):null;}
 id(){let id;do{id=this.newId?this.newId():`map-${this.now().toString(36)}-${(++this.sequence).toString(36)}-${hash(String(Math.random())).toString(36)}`;}while(this.records.some(r=>r.id===id));return id;}
 commit(records){this.records=records.slice(0,MAPS_LIMIT);try{this.persisted=this.storage.set(MAPS_KEY,{app:'MapForgeMaps',schemaVersion:1,records:this.records})===true;}catch{this.persisted=false;}this.onChange();return this.persisted;}
 remember(map,{source='saved'}={}){
  if(!['generated','saved','imported','recovered'].includes(source))throw Error('Unbekannte Map-Quelle.');
  const config=normalize(map.config),old=this.find(config),time=Math.max(this.now(),old?.updatedAt||0);
  const row={id:old?.id||this.id(),config,parts:map.parts.length,source,createdAt:old?.createdAt||time,updatedAt:time,generatedAt:source==='generated'?time:old?.generatedAt??null,generatorVersion:VERSION};
  this.commit([row,...this.records.filter(r=>r.id!==row.id)]);return {record:copy(row),persisted:this.persisted};
 }
 remove(id){const index=this.records.findIndex(r=>r.id===id);if(index<0)return null;const record=copy(this.records[index]);this.commit(this.records.filter(r=>r.id!==id));return {record,index};}
 undoRemove(token){if(!token?.record||this.get(token.record.id))return false;const rows=[...this.records];rows.splice(Math.min(token.index,rows.length),0,readRecord(token.record));this.commit(rows);return true;}
 backup(){return JSON.stringify({app:'MapForgeMaps',schemaVersion:1,exportedAt:new Date(this.now()).toISOString(),records:this.records},null,2);}
 prepareImport(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>512000)throw Error('Die Sammlung ist zu groß (maximal 500 KB).');
  let data;try{data=JSON.parse(text);}catch{throw Error('Keine lesbare JSON-Sammlung.');}
  if(data?.app!=='MapForgeMaps'||data.schemaVersion!==1||!Array.isArray(data.records)||data.records.length>MAPS_LIMIT)throw Error('Keine gültige MapForge-Map-Sammlung.');
  const rows=data.records.map(readRecord),seen=new Set(this.records.map(r=>signature(r.config))),fresh=[];let duplicates=0;
  for(const row of rows){const key=signature(row.config);if(seen.has(key)){duplicates++;continue;}seen.add(key);fresh.push(row);}
  const free=MAPS_LIMIT-this.records.length;
  return {baseRevision:this.revision,records:fresh.slice(0,free),duplicates,skipped:Math.max(0,fresh.length-free),total:rows.length};
 }
 applyImport(plan){
  if(plan.baseRevision!==this.revision)throw Error('Deine Sammlung wurde inzwischen geändert. Sicherung bitte erneut auswählen.');
  const rows=plan.records.map(readRecord).map(row=>({...row,id:this.id()}));
  if(rows.length)this.commit([...this.records,...rows]);
  return {added:rows.length,duplicates:plan.duplicates,skipped:plan.skipped,persisted:this.persisted};
 }
}
