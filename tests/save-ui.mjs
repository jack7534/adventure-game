/* Isolated-browser export, import, and reload integration test. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage(),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));page.on('dialog',d=>d.accept());
try{
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8770/'),{waitUntil:'networkidle'});await page.locator('#btn-new-game').click();
 await page.evaluate(()=>{offerLoot({type:'RING',name:'魔導指環',ability:RING_ABILITIES.find(r=>r.id==='MAGIC'),tier:3,rarity:'Rare'});});
 const expected=await page.evaluate(()=>({state:gameState,uid:newLoot.uid,tier:newLoot.tier,gold:adventure.gold}));
 await page.locator('#btn-save').click();const downloaded=page.waitForEvent('download');await page.locator('#btn-export').click();const download=await downloaded;await download.saveAs('roundtrip-save.json');
 const data=JSON.parse(fs.readFileSync('roundtrip-save.json','utf8'));assert.equal(data.payload.gameState,'LOOT_DECISION');checks.push('Export button produces a complete pending-loot save');
 await page.locator('[data-close="save-dialog"]').click();await page.locator('#btn-decision-no').click();
 await page.locator('#btn-save').click();await page.locator('#import-file').setInputFiles('roundtrip-save.json');await page.waitForFunction(()=>gameState==='LOOT_DECISION');
 assert.deepEqual(await page.evaluate(()=>({state:gameState,uid:newLoot.uid,tier:newLoot.tier,gold:adventure.gold})),expected);checks.push('Import restores the same unconsumed item without changing gold');
 await page.reload({waitUntil:'networkidle'});await page.locator('#btn-continue').click();assert.equal(await page.evaluate(()=>gameState),'LOOT_DECISION');await page.locator('#btn-decision-yes').click();assert.equal(await page.evaluate(()=>hero.equipment.RING.tier),3);checks.push('Refresh, Continue, and Equip consume the pending item exactly once');
 await page.evaluate(()=>{enterMap();startSmallBattle(0);});const enemyBefore=await page.evaluate(()=>({name:currentEnemy.name,hp:currentEnemy.hp,next:adventure.battle.nextMove,round:adventure.battle.round}));
 await page.reload({waitUntil:'networkidle'});await page.locator('#btn-continue').click();assert.deepEqual(await page.evaluate(()=>({name:currentEnemy.name,hp:currentEnemy.hp,next:adventure.battle.nextMove,round:adventure.battle.round})),enemyBefore);checks.push('Battle reload preserves enemy HP, round, and the already rolled next move');
 fs.writeFileSync('invalid-save.json','{"format":"jack-adventure","version":2}');const before=await page.evaluate(()=>JSON.stringify(captureSave().payload));await page.locator('#btn-save').click();await page.locator('#import-file').setInputFiles('invalid-save.json');await page.waitForFunction(()=>document.getElementById('toast').textContent.startsWith('匯入失敗'));assert.equal(await page.evaluate(()=>JSON.stringify(captureSave().payload)),before);checks.push('Invalid imported file leaves the ongoing battle untouched');
 assert.deepEqual(errors,[]);fs.writeFileSync('save-ui-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
}catch(e){console.error(e);console.log('BROWSER_ERRORS',errors);process.exitCode=1;}finally{await browser.close();}
