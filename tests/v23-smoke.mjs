import {chromium} from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',d=>d.accept());
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8770/',{waitUntil:'networkidle'});
 console.log('BOOT',errors);if(errors.length)throw Error('Boot failed');
 await page.locator('#btn-new-game').click();console.log('START',await page.evaluate(()=>({state:gameState,hp:hero.hp,save:readSlot(SAVE_KEY),bosses:ENEMIES.BOSS.length})));
 await page.evaluate(()=>{enterMap();handleMapAction('Small');});
 console.log('ROUTE',await page.evaluate(()=>({state:gameState,choices:adventure.expedition.choices,save:readSlot(SAVE_KEY).kind})));
 await page.evaluate(()=>{chooseRoute(0);});
 console.log('CHOICE',await page.evaluate(()=>({state:gameState,save:readSlot(SAVE_KEY).kind,why:readSlot(SAVE_KEY).error})));
 await page.screenshot({path:'v23-smoke.png',fullPage:true});
 console.log('ERRORS',errors);if(errors.length)throw Error('Page failed');
}catch(e){console.error(e);console.log('ERRORS',errors);process.exitCode=1;}finally{await browser.close();}
