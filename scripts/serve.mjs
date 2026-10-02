/* Local development server: loopback only, no dependencies. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT||8770);
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'text/plain; charset=utf-8','Cache-Control':'no-store','Connection':'close'});
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(port,'127.0.0.1',128,()=>console.log(`Game preview: http://127.0.0.1:${port}/`));
