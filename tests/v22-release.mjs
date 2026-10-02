import {chromium} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const checks=[],errors=[];
try{for(const [width,height] of [[1280,900],[1440,800],[768,900],[390,844],[320,568],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8770/',{waitUntil:'networkidle'});
 await page.locator('#hero-look-select').selectOption('violet');await page.locator('#titleA').selectOption('烈焰');await page.locator('#titleB').selectOption('高能');await page.locator('#titleC').selectOption('炸彈魔');
 await page.locator('#btn-new-game').click();
 assert.equal(await page.evaluate(()=>hero.baseMagicAtk),28);assert.equal(await page.evaluate(()=>currentIdentity().appearance),'violet');
 await page.locator('#btn-dock-look').click();await page.locator('[data-look="ranger"]').click();await page.locator('[data-close="identity-dialog"]').click();
 assert.equal(await page.locator('#hero-actor .actor-sprite').getAttribute('data-portrait'),'ranger');
 await page.reload({waitUntil:'networkidle'});await page.locator('#btn-continue').click();assert.equal(await page.evaluate(()=>currentIdentity().appearance),'ranger');assert.equal(await page.evaluate(()=>hero.baseMagicAtk),28);checks.push(`${width}: title bonus, change look and real reload`);
 await page.evaluate(()=>{enterEvent('courier');});assert.equal(await page.locator('#scene-object').getAttribute('data-portrait'),'postman');await page.evaluate(()=>{chooseEvent(0);});assert.equal(await page.locator('#scene-object').getAttribute('data-portrait'),'postman');checks.push(`${width}: postman never spider`);
 await page.evaluate(()=>{enterMap();hero.equipment.SHIELD={name:'好盾',type:'SHIELD',rarity:'Epic',power:30,refine:6,refineSlots:2,affixes:['S_BLOCK','S_BLOCK_STRIKE','S_REGEN']};offerLoot({name:'差盾',type:'SHIELD',rarity:'Normal',power:4,refine:0,refineSlots:0,affixes:[]});});
 for(const y of [0,500,100000]){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(40);const good=await page.evaluate(()=>[btnDecYes,btnDecNo].every(b=>{const r=b.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight+1&&hit&&b.contains(hit);})&&document.documentElement.scrollWidth<=innerWidth);assert.ok(good,`${width} buttons not visible/hittable at ${y}`);}
 const before=await page.evaluate(()=>JSON.stringify(captureSave().payload));await page.locator('#btn-decision-yes').click();assert.equal(await page.evaluate(()=>JSON.stringify(captureSave().payload)),before);checks.push(`${width}: fixed buttons top/middle/bottom and cancel safe`);
 if(width===390||width===1280)await page.screenshot({path:`v22-live-dock-${width}.png`});
 await page.locator('#btn-decision-no').click();assert.equal(await page.evaluate(()=>hero.equipment.SHIELD.name),'好盾');checks.push(`${width}: keep equipment is actionable`);
 await page.close();
}assert.deepEqual(errors,[]);fs.writeFileSync('v22-release-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,errors},null,2));}finally{await browser.close();}
