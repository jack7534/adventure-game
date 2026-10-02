import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const build=spawnSync(process.execPath,[path.join(root,'scripts/build.mjs')],{stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
let server=null;
const url=process.env.GAME_URL||'http://127.0.0.1:8770/';
try{
 if(!process.env.GAME_URL){
  server=spawn(process.execPath,[path.join(root,'scripts/serve.mjs')],{stdio:'ignore',env:{...process.env,PORT:'8770'}});
  let ready=false;for(let i=0;i<50;i++){try{const response=await fetch(url);if(response.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  if(!ready)throw new Error('The local preview server did not start.');
 }
 for(const name of ['regression','campaign','layout','save-ui']){
  console.log(`\n=== ${name} ===`);
  const child=spawn(process.execPath,[path.join(root,'tests',name+'.mjs')],{cwd:out,stdio:'inherit',env:{...process.env,GAME_URL:url}});
  const status=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
  if(status!==0)throw new Error(`${name} failed (${status}).`);
 }
 console.log('\nAll tests passed. Reports and screenshots: test-results/');
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(server)server.kill();}
