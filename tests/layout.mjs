/* Local-only UI checks in fresh, isolated browser contexts. No personal browser profile. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const report=[],errors=[];
for(const width of [320,390,768,1440]){
 const page=await browser.newPage({viewport:{width,height:width<700?844:1040}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8770/'),{waitUntil:'networkidle'});
 const check=async phase=>{const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));report.push({width,phase,...dims,pass:dims.width===dims.scroll});};
 await check('TITLE');await page.locator('#btn-title-slots').click();await check('TITLE_SAVE_DIALOG');await page.locator('[data-close="save-dialog"]').click();
 await page.locator('#btn-new-game').click();await check('MAP');
 await page.evaluate(()=>{bossLevel=2;createBattle({...ENEMIES.BOSS[1]},true);});await check('BOSS_BATTLE');
 if([390,1440].includes(width))await page.screenshot({path:`final-battle-${width}.png`,fullPage:true});
 await page.locator('#btn-guide').click();await check('GUIDE');await page.locator('[data-close="guide-dialog"]').click();
 await page.evaluate(()=>{confirmTitle();offerLoot({...generateLoot('RING',true)});});await check('RING_DECISION');
 if(width===390)await page.screenshot({path:'final-loot-mobile.png',fullPage:true});
 await page.locator('#btn-save').click();await check('SAVE_DIALOG');await page.locator('[data-close="save-dialog"]').click();
 await page.evaluate(()=>{confirmTitle();enterEvent('fox');});await check('EVENT');await page.close();
}
console.log(JSON.stringify({checks:report.length,failed:report.filter(r=>!r.pass),errors},null,2));fs.writeFileSync('layout-report.json',JSON.stringify({report,errors},null,2));await browser.close();if(report.some(r=>!r.pass)||errors.length)process.exitCode=1;
