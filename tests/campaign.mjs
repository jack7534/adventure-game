import {chromium} from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.goto((process.env.GAME_URL||'http://127.0.0.1:8770/'),{waitUntil:'networkidle'});
const runs=await page.evaluate(async()=>{
 const runs=[],realRandom=Math.random,realNow=Date.now;let virtual=realNow();Date.now=()=>virtual;
 const attackValue=(move)=>{const d=move==='⚔️'?Math.max(1,hero.currentAttack-currentEnemy.def)*(1+getHeroCritChance()):move==='🌠'?Math.max(1,getMagicAttackValue()-currentEnemy.mDef):Math.max(1,hero.currentDefense)*(currentEnemy.name==='石頭人'?2:1);return d*(move==='🌠'?1:1-currentEnemy.dodge/100);};
 for(const seed0 of [1,7,42,31415,8675309]){
  let seed=seed0;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};confirmTitle();actionDelay=0;
  let actions=0;const started=virtual;
  for(;actions<3500&&gameState!=='CREDITS';actions++){
   virtual+=1100;
   if(gameState==='MAP'){
    if(hero.hp<hero.maxHp*.72){virtual+=4000;btn3.click();}
    else if(bossLevel<=3&&hero.level>=SCENES[bossLevel-1].level)btn2.click();
    else btn1.click();
   }else if(gameState==='BATTLE'){
    const bias=hasExactIntent()?Object.fromEntries(Object.keys(MOVE_NAMES).map(m=>[m,m===adventure.battle.nextMove?1:0])):currentEnemy.bias;
    let best=0,bestScore=-Infinity;
    Object.keys(MOVE_NAMES).forEach((move,i)=>{const pWin=bias[CLASH_RULES[move]]+bias[move]*hero.currentTieWinRate/100;const score=pWin*attackValue(move)-(1-pWin)*Math.max(1,currentEnemy.atk-hero.currentDefense)*1.1;if(score>bestScore){bestScore=score;best=i;}});
    [btn1,btn2,btn3][best].click();await new Promise(r=>setTimeout(r,0));
   }else if(gameState==='EVENT'){
    const opts=EVENTS[adventure.eventId].choices();let index=0;
    if(['shrine','spring'].includes(adventure.eventId)&&hero.hp>hero.maxHp*.75)index=1;
    if(adventure.eventId==='elite')index=hero.hp<hero.maxHp*.7?2:0;
    if(adventure.eventId==='forge')index=hero.equipment.WEAPON.name==='徒手'?2:0;
    if(!opts[index].enabled())index=opts.findIndex(c=>c.enabled());[btn1,btn2,btn3][index].click();
   }else if(gameState==='LOOT_DECISION'){
    const n=newLoot,c=hero.equipment[n.type];let take;
    if(n.type==='RING')take=c.ability.id==='NONE'||c.ability.id===n.ability.id||(n.ability.id==='HEAL'&&c.ability.id!=='HEAL')||(n.tier>c.tier&&c.ability.id!=='HEAL');
    else take=getEffectivePower(n,n.type)>getEffectivePower(c,n.type)||(n.type==='WEAPON'&&RARITY_ORDER.indexOf(n.rarity)>RARITY_ORDER.indexOf(c.rarity));
    (take?btnDecYes:btnDecNo).click();
   }else if(['RESULT','DEFEAT'].includes(gameState))btn1.click();
   else throw new Error(`Unplayable state ${gameState}`);
   parseSave(JSON.stringify(captureSave()));
   for(const v of Object.values(hero))if(typeof v==='number'&&!Number.isFinite(v))throw new Error('Nonfinite hero stat');
  }
  runs.push({seed:seed0,cleared:gameState==='CREDITS',actions,turns:totalTurnCount,level:hero.level,paragon:hero.paragonLevel,bosses:adventure.stats.bosses,deaths:adventure.stats.deaths,events:adventure.stats.events,loot:adventure.stats.loot,simulatedMinutes:Math.round((virtual-started)/60000)});
 }
 Math.random=realRandom;Date.now=realNow;return runs;
});
await page.screenshot({path:'campaign-ending.png',fullPage:true});
fs.writeFileSync('campaign-report.json',JSON.stringify({note:'Five deterministic seeds. Actions use visible buttons and displayed enemy information. No stat boosts; only elapsed clock and animation delay accelerated.',runs,errors},null,2));
console.log(JSON.stringify({runs,errors},null,2));await browser.close();if(runs.some(r=>!r.cleared)||errors.length)process.exitCode=1;
