// Supervised Sites QA entrypoint. Production continues to use the embedded Worker.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import worker from './worker/index.js';
const root=path.resolve('web'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.md':'text/markdown','.lua':'text/plain'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/trends'){const result=await worker.fetch(new Request(url),{},{});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;}
  const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(root+path.sep))throw Error('path');
  const body=await readFile(file);res.writeHead(200,{'content-type':(types[path.extname(file)]||'application/octet-stream')+'; charset=utf-8','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT||4173),'0.0.0.0');
