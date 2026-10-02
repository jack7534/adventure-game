import {chromium} from 'playwright-core';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());page.on('console',m=>console.log(m.text()));
try{await page.goto(process.env.GAME_URL||'http://127.0.0.1:8770/',{waitUntil:'networkidle'});
const rows=await page.evaluate(()=>{
 const native={setTimeout,random:Math.random,updateStatus,renderBattle,updateBattleView,saveAuto,renderLootDecision,renderResult};
 window.setTimeout=()=>0;log=()=>{};animateClass=()=>{};floatingNumber=()=>{};flashBattleView=()=>{};updateStatus=()=>calculateHeroStats();renderBattle=()=>calculateHeroStats();updateBattleView=()=>calculateHeroStats();saveAuto=()=>true;renderLootDecision=renderResult=()=>{};
 const rows=[];
 const specs=[{w:38,s:18,r:'Rare',ref:2,tier:2},{w:60,s:26,r:'Epic',ref:4,tier:3},{w:78,s:35,r:'Legendary',ref:6,tier:3},{w:94,s:45,r:'Mythic',ref:9,tier:4},{w:105,s:55,r:'Mythic',ref:12,tier:4}];
 function smart(){const d=activeBoss(),b=adventure.battle,p=b.boss.plan,e=ensureExpedition();
  if(['siphon','venom'].includes(p.kind))return p.counter;
  if(['inferno','stamp'].includes(p.kind))return 'GUARD';
  if(p.kind==='seal')return b.boss.sealMoves.includes('⚔️')?'🌠':'⚔️';
  if(p.kind==='judgment'&&b.boss.sealMoves.length<2)return 'GUARD';
  if(hero.poisonStacks>=2&&e.antidotes>0)return 'CLEANSE';
  if(hero.hp<hero.maxHp*.5&&e.potions>0)return 'POTION';
  if(p.kind==='charge'||p.kind==='armor')return '🌠';
  const bias=hasExactIntent()?Object.fromEntries(Object.keys(MOVE_NAMES).map(m=>[m,m===b.nextMove?1:0])):currentEnemy.bias;
  let move='⚔️',best=-Infinity;for(const m of Object.keys(MOVE_NAMES)){let dmg=m==='⚔️'?Math.max(1,hero.currentAttack-currentEnemy.def)*(1+getHeroCritChance()):m==='🌠'?Math.max(1,getMagicAttackValue()-currentEnemy.mDef):hero.currentDefense;
   dmg*=bossDamageMultiplier(m)*(m==='🌠'?1:1-currentEnemy.dodge/100);const pw=p.kind==='normal'?bias[CLASH_RULES[m]]+bias[m]*hero.currentTieWinRate/100:1;const value=pw*dmg-(1-pw)*Math.max(5,currentEnemy.atk-hero.currentDefense*.9)*1.3+(m==='🛡️'&&hero.equipment.RING.ability.id==='HEAL'?pw*hero.currentDefense*.18:0);
   if(value>best){best=value;move=m;}}
  return move;
 }
 for(let chapter=1;chapter<=5;chapter++)for(const offset of [-3,0,3])for(const tactic of ['smart','spam']){let wins=0,totalRounds=0,totalHP=0;const lv=Math.max(1,BOSS_DESIGNS[chapter-1].target+offset);
  for(let seed0=1;seed0<=20;seed0++){let seed=seed0*9173+chapter;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};hero=JSON.parse(JSON.stringify(INITIAL_HERO));restoreRingAbility(hero.equipment.RING);adventure=freshAdventure();bossLevel=chapter;newLoot=null;currentEnemy=null;gameState='MAP';totalTurnCount=0;weaponMaterials=shieldMaterials=0;
   while(hero.level<lv)levelUp();const g=specs[chapter-1];hero.equipment.WEAPON={type:'WEAPON',name:'校準武器',power:g.w,rarity:g.r,refine:0,refineSlots:0,affixes:['W_ATK_UP']};hero.equipment.SHIELD={type:'SHIELD',name:'校準盾牌',power:g.s,rarity:g.r,refine:g.ref,refineSlots:0,affixes:['S_BLOCK']};hero.weaponRefineLevel=g.ref;hero.equipment.RING={type:'RING',name:'生命戒指',rarity:g.r,tier:g.tier,ability:RING_ABILITIES.find(r=>r.id==='HEAL')};adventure.expedition=makeExpedition();adventure.expedition.pendingIntro=false;adventure.expedition.potions=3;adventure.expedition.antidotes=3;calculateHeroStats();createBattle({...ENEMIES.BOSS[chapter-1]},true);
   let rounds=0;for(;rounds<70&&['BATTLE','BATTLE_ACTION'].includes(gameState);rounds++){gameState='BATTLE';handleBattleAction(tactic==='smart'?smart():'⚔️');}
   if(adventure.stats.wins)wins++;totalRounds+=rounds;totalHP+=adventure.stats.wins?hero.hp:0;
  }console.log('CAL',chapter,lv,tactic,wins);rows.push({chapter,level:lv,tactic,wins,trials:20,rounds:+(totalRounds/20).toFixed(1),hp:+(totalHP/20).toFixed(1)});
 }
 window.setTimeout=native.setTimeout;Math.random=native.random;updateStatus=native.updateStatus;renderBattle=native.renderBattle;updateBattleView=native.updateBattleView;saveAuto=native.saveAuto;renderLootDecision=native.renderLootDecision;renderResult=native.renderResult;return rows;
});const expected=[7,12,19,26,34];for(let i=1;i<=5;i++){const smart=rows.find(r=>r.chapter===i&&r.level===expected[i-1]&&r.tactic==='smart'),spam=rows.find(r=>r.chapter===i&&r.level===expected[i-1]&&r.tactic==='spam');if(!smart||!spam||smart.wins<8||smart.wins>19||smart.wins<=spam.wins)throw Error('Boss '+i+' balance guard failed');}if(errors.length)throw Error(errors.join(';'));fs.writeFileSync('v23-balance-report.json',JSON.stringify({method:'20 fixed seeds each. Natural level growth; documented mid-grade gear fixtures, 3 potions, 3 antidotes. No relics or fox. Compare telegraph-aware play against sword-only spam. Rendering/timers accelerated; damage formulas unmodified.',rows,errors},null,2));console.log(JSON.stringify({rows,errors},null,2));}finally{await browser.close();}
