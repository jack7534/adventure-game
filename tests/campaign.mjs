import {chromium} from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1040}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.goto((process.env.GAME_URL||'http://127.0.0.1:8770/'),{waitUntil:'networkidle'});
const runs=await page.evaluate(async()=>{
 const runs=[],realRandom=Math.random,realNow=Date.now;let virtual=realNow();Date.now=()=>virtual;
 const attackValue=m=>{let dmg=m==='⚔️'?Math.max(1,hero.currentAttack-currentEnemy.def)*(1+getHeroCritChance()):m==='🌠'?Math.max(1,getMagicAttackValue()-currentEnemy.mDef):Math.max(1,hero.currentDefense)*(currentEnemy.name==='石頭人'?2:1);return dmg*(m==='🌠'?1:1-currentEnemy.dodge/100)*bossDamageMultiplier(m);};
 function pickCombat(){const b=adventure.battle,e=ensureExpedition(),p=b.boss?.plan;
  if(p&&['siphon','venom'].includes(p.kind))return p.counter;
  if(p&&['inferno','stamp'].includes(p.kind))return 'GUARD';
  if(p?.kind==='seal')return b.boss.sealMoves.includes('⚔️')?'🌠':'⚔️';
  if(p?.kind==='judgment'&&b.boss.sealMoves.length<2)return 'GUARD';
  if(hero.poisonStacks>=2&&e.antidotes>0)return 'CLEANSE';
  if(hero.hp<hero.maxHp*.48&&e.potions>0)return 'POTION';
  if(p&&['charge','armor'].includes(p.kind))return '🌠';
  const bias=hasExactIntent()?Object.fromEntries(Object.keys(MOVE_NAMES).map(m=>[m,m===b.nextMove?1:0])):currentEnemy.bias;let best='⚔️',score=-Infinity;
  for(const m of Object.keys(MOVE_NAMES)){const win=p&&p.kind!=='normal'?1:bias[CLASH_RULES[m]]+bias[m]*hero.currentTieWinRate/100;const v=win*attackValue(m)-(1-win)*Math.max(1,currentEnemy.atk-hero.currentDefense)*1.1+(m==='🛡️'&&hero.equipment.RING.ability.id==='HEAL'?win*hero.currentDefense*.18:0);if(v>score){score=v;best=m;}}return best;
 }
 for(const seed0 of [1,7,42,31415,8675309]){
  let seed=seed0;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  ['titleA','titleB','titleC'].forEach((id,i)=>$(id).value=['沉穩','認真的','大劍客'][i]);confirmTitle();actionDelay=0;adventure.runId=`qa-seed-${seed0}`;adventure.expedition.seed=adventure.expedition.rng=seed0;
  let actions=0;const started=virtual,defeats=[],bossAttempts=[],lastFailed={};
  for(;actions<4200&&gameState!=='CREDITS';actions++){
   virtual+=1100;
   if(gameState==='MAP'){
    if(hero.hp<hero.maxHp*.9||hero.poisonStacks>0){virtual+=4000;btn3.click();}
    else if(bossLevel<=5&&hero.level>=Math.max(SCENES[bossLevel-1].level,lastFailed[bossLevel]||0)&&ensureExpedition().clues>=requiredClues()){
     if(adventure.gold>=10){openCamp();for(const item of ['potion','potion','potion','antidote','antidote']){virtual+=600;renderCamp();buyCampItem(item,campToken);}$('camp-dialog').close();}
     bossAttempts.push({boss:bossLevel,level:hero.level,atk:hero.currentAttack,def:hero.currentDefense,matk:getMagicAttackValue()});btn2.click();
    }else btn1.click();
   }else if(gameState==='ROUTE'){
    const e=ensureExpedition();const order=e.relics.length<4?['relic','battle','event','treasure','rest','elite']:['battle','event','treasure','rest','elite','relic'];let i=e.choices.map(c=>order.indexOf(c.kind)).reduce((best,x,i,a)=>x<a[best]?i:best,0);[btn1,btn2,btn3][i].click();
   }else if(gameState==='BATTLE'){
    const move=pickCombat();const index=Object.keys(MOVE_NAMES).indexOf(move);if(index>=0)[btn1,btn2,btn3][index].click();else $({GUARD:'tactic-guard',POTION:'tactic-potion',CLEANSE:'tactic-cleanse'}[move]).click();await new Promise(r=>setTimeout(r,0));
   }else if(gameState==='EVENT'){
    const opts=EVENTS[adventure.eventId].choices();let index=0;
    if(adventure.eventId==='elite')index=hero.hp<hero.maxHp*.7?2:0;
    if(adventure.eventId==='forge')index=hero.equipment.WEAPON.name==='徒手'?2:0;
    if(adventure.eventId==='chicken_return')index=1;
    if(!opts[index]?.enabled())index=opts.findIndex(c=>c.enabled());if(index<0)throw Error('No usable event choice');[btn1,btn2,btn3][index].click();
   }else if(gameState==='LOOT_DECISION'){
    const n=newLoot,c=hero.equipment[n.type];let take;
    if(n.type==='RING')take=c.ability.id==='NONE'||c.ability.id===n.ability.id||(n.ability.id==='HEAL'&&c.ability.id!=='HEAL')||(n.tier>c.tier&&c.ability.id!=='HEAL');
    else{const delta=equipmentComparison(n);take=n.type==='WEAPON'?delta.after.atk>=delta.before.atk&&delta.after.matk>=delta.before.matk:delta.after.def>delta.before.def;}
    (take?btnDecYes:btnDecNo).click();
   }else if(['RESULT','DEFEAT'].includes(gameState)){
    if(gameState==='DEFEAT'){defeats.push({boss:bossLevel,level:hero.level,isBoss:!!adventure.battle?.isBoss});if(adventure.battle?.isBoss)lastFailed[bossLevel]=Math.min(40,hero.level+1);}
    btn1.click();
   }else throw Error(`Unplayable state ${gameState}`);
   const saved=captureSave();if(!saved)throw Error('Missing save at '+gameState);parseSave(JSON.stringify(saved));
   for(const v of Object.values(hero))if(typeof v==='number'&&!Number.isFinite(v))throw Error('Nonfinite stat');
  }
  runs.push({seed:seed0,cleared:gameState==='CREDITS',actions,turns:totalTurnCount,level:hero.level,bosses:adventure.stats.bosses,deaths:adventure.stats.deaths,events:adventure.stats.events,loot:adventure.stats.loot,relics:adventure.expedition.relics,routeHistory:adventure.expedition.history,bossAttempts,defeats});
 }
 Math.random=realRandom;Date.now=realNow;return runs;
});
await page.screenshot({path:'campaign-ending.png',fullPage:true});
fs.writeFileSync('campaign-report.json',JSON.stringify({note:'Five deterministic seeds. Actions use visible buttons and displayed enemy information. No stat boosts; only elapsed clock and animation delay accelerated.',runs,errors},null,2));
console.log(JSON.stringify({runs:runs.map(({routeHistory,...r})=>r),errors},null,2));await browser.close();if(runs.some(r=>!r.cleared)||errors.length)process.exitCode=1;
