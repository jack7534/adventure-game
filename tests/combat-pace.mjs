/* Isolated Playwright checks for route frequency, direct encounters and saved reward safety. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8770/',{waitUntil:'networkidle'});
 const report=await page.evaluate(async()=>{
  const results=[],nativeRandom=Math.random;
  const must=(ok,msg)=>{if(!ok)throw Error(msg);};
  const reset=()=>{confirmTitle();enterMap();Math.random=()=>.99;actionDelay=0;};
  const check=async(name,fn)=>{reset();try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
  const save=()=>parseSave(JSON.stringify(captureSave()));
  const victory=()=>{createBattle({...ENEMIES.SMALL[0],hp:1,exp:0,lootChance:0,dodge:0});currentEnemy.hp=0;endBattle('win');};
  await check('Every newly generated route set contains two direct combat choices and one support choice',()=>{for(let seed=1;seed<=400;seed++){const e=ensureExpedition();e.choices=[];e.rng=seed*7919;hero.level=12;generateRoutes();must(e.choices.filter(c=>['battle','elite'].includes(c.kind)).length===2,'combat missing');must(!['battle','elite'].includes(e.choices[2].kind),'support missing');must(e.choices[0].kind==='battle','ordinary fight missing');}});
  await check('Levels 1 to 3 offer ordinary fights, not mandatory elite enemies',()=>{for(const level of [1,2,3])for(let i=0;i<60;i++){hero.level=level;ensureExpedition().choices=[];generateRoutes();must(ensureExpedition().choices.slice(0,2).every(c=>c.kind==='battle'),'early elite');}});
  await check('Ordinary combat cards have different terrain names',()=>{for(let i=0;i<80;i++){ensureExpedition().choices=[];generateRoutes();const c=ensureExpedition().choices;must(c[0].flavor!==c[1].flavor,'same terrain');must(routeCard(c[0],0).text!==routeCard(c[1],1).text,'duplicate card');}});
  await check('Level 4 onward can generate both elite and ordinary second routes',()=>{hero.level=8;let elite=0;for(let i=0;i<300;i++){ensureExpedition().choices=[];generateRoutes();if(ensureExpedition().choices[1].kind==='elite')elite++;}must(elite>30&&elite<190,'no useful variety');});
  await check('All peaceful categories remain discoverable',()=>{const seen=new Set();for(let i=0;i<300;i++){ensureExpedition().choices=[];generateRoutes();seen.add(ensureExpedition().choices[2].kind);}must(['event','treasure','rest','relic'].every(k=>seen.has(k)),'category removed');});
  await check('Ordinary card starts combat immediately',()=>{enterRoutes();chooseRoute(0);must(gameState==='BATTLE'&&!adventure.battle.isBoss,'not in combat');must(adventure.steps===1&&totalTurnCount===1,'wrong travel cost');save();});
  await check('Elite card starts a stronger fight, not a dialogue detour',()=>{hero.level=hero.highestLevel=8;const e=ensureExpedition();e.choices=[{kind:'elite',flavor:0,id:'1-1-0'},{kind:'battle',flavor:1,id:'1-1-1'},{kind:'rest',flavor:2,id:'1-1-2'}];gameState='ROUTE';chooseRoute(0);must(gameState==='BATTLE'&&currentEnemy.elite,'elite became dialogue');must(currentEnemy.lootChance===1,'elite reward missing');save();});
  await check('An already offered old peaceful route is not replaced on load',()=>{const e=ensureExpedition();e.choices=['event','rest','relic'].map((kind,i)=>({kind,id:`legacy-${i}`,flavor:i}));gameState='ROUTE';const before=JSON.stringify(e.choices);applySave(save());generateRoutes();must(JSON.stringify(ensureExpedition().choices)===before,'legacy offers rerolled');});
  await check('New route save/reload keeps terrain, choices and RNG',()=>{enterRoutes();const e=ensureExpedition(),before=JSON.stringify(e.choices),rng=e.rng;applySave(save());must(JSON.stringify(ensureExpedition().choices)===before&&ensureExpedition().rng===rng,'rerolled after load');});
  await check('Ordinary victory exposes hunt, alternative route and camp controls',()=>{victory();must(canContinueHunt(),'no continuation');must(btn1.textContent.includes('繼續獵怪')&&btn2.textContent.includes('換條路')&&btn3.textContent.includes('回營地'),'missing choices');});
  await check('Continue hunting starts once and carries HP, poison and consumables forward',()=>{victory();hero.hp=Math.max(1,hero.maxHp-5);hero.poisonStacks=2;const hp=hero.hp,e=ensureExpedition(),doses=e.potions,steps=adventure.steps,turns=totalTurnCount;continueHunt();continueHunt();must(gameState==='BATTLE','no next enemy');must(hero.hp===hp&&hero.poisonStacks===2&&e.potions===doses,'free heal or supply reset');must(adventure.steps===steps+1&&totalTurnCount===turns+1,'duplicate travel');must(adventure.stats.wins===1,'reward granted twice');save();});
  await check('Pending loot blocks fast continuation until the decision is resolved',()=>{createBattle({...ENEMIES.SMALL[0],hp:1,exp:0,lootChance:1});currentEnemy.hp=0;endBattle('win');must(gameState==='LOOT_DECISION','missing pending loot');const id=newLoot.uid;continueHunt();must(newLoot.uid===id&&gameState==='LOOT_DECISION','skipped loot');handleLootDecision('NO',id);must(canContinueHunt(),'no continuation after salvage');});
  await check('Saved victory resumes the same continuation choices without another reward',()=>{victory();const n=adventure.stats.wins,gold=adventure.gold;applySave(save());must(canContinueHunt()&&adventure.gold===gold&&adventure.stats.wins===n,'load replayed victory');continueHunt();must(gameState==='BATTLE'&&adventure.stats.wins===n,'load blocked hunting');});
  await check('Return to camp remains available and does not force a second fight',()=>{victory();afterHuntChoice('camp');must(gameState==='MAP'&&currentEnemy===null,'camp unavailable');});
  await check('Alternative route selection remains available after victory',()=>{victory();afterHuntChoice('routes');must(gameState==='ROUTE'&&ensureExpedition().choices.length===3,'routes unavailable');});
  await check('Boss victory never offers unannounced ordinary continuation',()=>{startBossBattle();currentEnemy.hp=0;endBattle('win');if(newLoot)handleLootDecision('NO');must(!canContinueHunt(),'boss accidentally continued');});
  await check('Defeat, escape and peaceful story results do not become forced fights',()=>{createBattle({...ENEMIES.SMALL[0],hp:20,exp:0});hero.hp=0;endBattle('lose');must(!canContinueHunt(),'death continuation');enterMap();resultEvent('平靜的一天','沒有怪物');must(!canContinueHunt(),'story continuation');});
  const distribution={offers:3000,combat:0,peaceful:0,elite:0};hero.level=hero.highestLevel=18;
  for(let i=0;i<1000;i++){ensureExpedition().choices=[];generateRoutes();for(const c of ensureExpedition().choices){if(['battle','elite'].includes(c.kind))distribution.combat++;else distribution.peaceful++;if(c.kind==='elite')distribution.elite++;}}
  Math.random=nativeRandom;return {results,distribution};
 });
 const views=[];
 for(const [width,height]of [[1280,900],[390,844],[320,568],[844,390]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>{confirmTitle();enterMap();Math.random=()=>.99;createBattle({...ENEMIES.SMALL[0],hp:1,exp:0,lootChance:0});currentEnemy.hp=0;endBattle('win');});
  for(const scroll of [0,100000]){await page.evaluate(y=>scrollTo(0,y),scroll);await page.waitForTimeout(70);const ok=await page.evaluate(()=>[btn1,btn2,btn3].every(b=>{const r=b.getBoundingClientRect(),el=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.top>=0&&r.bottom<=innerHeight+1&&b.contains(el);})&&document.documentElement.scrollWidth<=innerWidth);views.push({width,height,scroll,ok});}
  if(width===390)await page.screenshot({path:'combat-pace-mobile.png'});
  await page.locator('#btn-action-1').click();assert.equal(await page.evaluate(()=>gameState),'BATTLE');
 }
 fs.writeFileSync('combat-pace-report.json',JSON.stringify({...report,views,errors},null,2));
 console.log(JSON.stringify({passed:report.results.filter(r=>r.pass).length,failed:report.results.filter(r=>!r.pass),distribution:report.distribution,viewFailures:views.filter(v=>!v.ok),errors},null,2));
 assert.ok(report.results.every(r=>r.pass)&&views.every(v=>v.ok)&&errors.length===0);
}finally{await browser.close();}
