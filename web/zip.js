// Small, dependency-free ZIP writer (stored entries, UTF-8 names).
const enc=new TextEncoder(),table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
export function makeZip(files){
 const chunks=[],central=[];let offset=0,centralLength=0;
 for(const [name,content] of Object.entries(files)){
  const filename=enc.encode(name),data=typeof content==='string'?enc.encode(content):content;
  const header=new Uint8Array(30+filename.length),v=new DataView(header.buffer),crc=crc32(data);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,filename.length,true);header.set(filename,30);
  const entry=new Uint8Array(46+filename.length),e=new DataView(entry.buffer);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint16(14,33,true);e.setUint32(16,crc,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,filename.length,true);e.setUint32(42,offset,true);entry.set(filename,46);
  chunks.push(header,data);central.push(entry);offset+=header.length+data.length;centralLength+=entry.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,centralLength,true);v.setUint32(16,offset,true);
 const out=new Uint8Array(offset+centralLength+end.length);let cursor=0;for(const c of [...chunks,...central,end]){out.set(c,cursor);cursor+=c.length;}return out;
}
