/* v2: one authoritative state transition for each action, reward and decision. */
const INITIAL_HERO=JSON.parse(JSON.stringify(hero));
const STABLE_PHASES=['MAP','BATTLE','EVENT','RESULT','LOOT_DECISION','DEFEAT','CREDITS'];
const MOVE_NAMES={'⚔️':'砍擊','🌠':'魔法','🛡️':'盾擊'};
const RARITY_NAMES={Normal:'普通',Magic:'魔法',Rare:'稀有',Epic:'史詩',Legendary:'傳說',Mythic:'神話'};
let sessionEpoch=0, overflowActive=false, toastTimer=null, actionDelay=300;
let adventure=freshAdventure();
function freshAdventure(){return {runId:globalThis.crypto?.randomUUID?.()||`run-${Date.now()}-${Math.random().toString(36).slice(2)}`,seq:0,steps:0,gold:25,scoutTurns:0,battle:null,eventId:null,eventResolved:false,eventDeck:[],eventVisits:{},lastEvent:null,nextEventAt:2,flags:{},result:null,pendingEnding:false,clearRecorded:false,stats:{wins:0,deaths:0,events:0,loot:0,bosses:0,rests:0},logs:[]};}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function restoreRingAbility(ring){ring.ability=RING_ABILITIES.find(a=>a.id===(ring.ability?.id||ring.abilityId))||RING_ABILITIES.find(a=>a.id==='NONE');return ring;}
function log(message){const text=String(message).replace(/<[^>]*>/g,'');adventure.logs.unshift(text);adventure.logs=adventure.logs.slice(0,80);const div=document.createElement('div');div.className='log-msg';div.textContent=text;messageLog.prepend(div);while(messageLog.children.length>80)messageLog.lastChild.remove();}
function redrawLog(){messageLog.replaceChildren();for(const text of adventure.logs){const d=document.createElement('div');d.className='log-msg';d.textContent=text;messageLog.append(d);}}
function toast(text,error=false){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.toggle('error',error);$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function story(tag,title,text,hint=''){mainView.innerHTML=`<span class="story-tag">${escapeHtml(tag)}</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>${hint?`<p class="hint-line">${escapeHtml(hint)}</p>`:''}`;}
function countTurn(){totalTurnCount++;turnCount=totalTurnCount;}
function setCommands(c1,c2,c3,handler,state){
 commandMenu.hidden=false;commandMenu.style.display='flex';decisionMenu.hidden=true;decisionMenu.style.display='none';
 [c1,c2,c3].forEach((c,i)=>{const b=[btn1,btn2,btn3][i];b.hidden=!c;if(!c)return;b.innerHTML=`<em>${i+1}</em><strong>${escapeHtml(c.text)}</strong><small>${escapeHtml(c.hint||'')}</small>`;b.disabled=!!c.disabled;b.onclick=event=>{if(event.detail>1||gameState!==state)return;const before=gameState;handler(c.value);if(before!=='BATTLE'||!['BATTLE','BATTLE_ACTION'].includes(gameState))revealCurrentContent();};});
 syncActionDock();
}
function disableCommands(disabled){[btn1,btn2,btn3,btnDecYes,btnDecNo].forEach(b=>b.disabled=disabled);syncActionDock();}
function getHeroCritChance(){let chance=getHeroBaseCritChance(),r=hero.equipment.RING;if(getAllWeaponAffixSet().has('W_BRAVE')&&hero.hp>0&&hero.hp<=hero.maxHp*.3)chance+=.1;if(r.ability.id==='CRIT')chance+=.05+r.tier*.1;if(r.ability.id==='BERSERKER')chance+=[0,.05,.06,.08,.1][r.tier]||0;return Math.max(0,Math.min(.9,chance));}
function updateStatus(){
 calculateHeroStats();turnCount=totalTurnCount;turnCountSpan.textContent=turnCount;
 const fields={'hero-title':hero.title||hero.name,'hero-level':hero.level,'hero-paragon':hero.paragonLevel||0,'hero-hp':Math.max(0,hero.hp),'hero-max-hp':hero.maxHp,'hero-exp':hero.exp,'hero-exp-max':hero.expToNextLevel,'hero-atk-val':hero.currentAttack,'hero-def-val':hero.currentDefense,'hero-matk-val':getMagicAttackValue(),'hero-dodge-val':hero.currentDodge.toFixed(1),'hero-tie-win-rate-val':hero.currentTieWinRate.toFixed(1),'hero-crit-val':getHeroCritRate().toFixed(1),'weapon-refine-level':hero.weaponRefineLevel,'shield-refine-level':getShieldRefineLevel(),'weapon-materials':weaponMaterials,'shield-materials':shieldMaterials,'hero-gold':adventure.gold};
 for(const [id,value]of Object.entries(fields))$(id).textContent=value;
 const hpPct=Math.max(0,Math.min(100,hero.hp/hero.maxHp*100));$('hp-fill').style.width=`${hpPct}%`;$('mobile-hp-fill').style.width=`${hpPct}%`;$('mobile-hp').textContent=`Lv.${hero.level} · 生命 ${Math.max(0,hero.hp)} / ${hero.maxHp}`;$('hp-meter').classList.toggle('low',hpPct<30);$('hp-meter').setAttribute('aria-valuenow',Math.max(0,hero.hp));$('hp-meter').setAttribute('aria-valuemax',hero.maxHp);$('exp-fill').style.width=`${Math.min(100,hero.exp/hero.expToNextLevel*100)}%`;
 for(const [type,id]of [['WEAPON','eq-weapon'],['SHIELD','eq-shield'],['RING','eq-ring']]){const eq=hero.equipment[type];$(id).textContent=eq.name+(type==='RING'&&eq.tier?` Lv.${eq.tier}`:type==='SHIELD'&&eq.refine?` +${eq.refine}`:'');$(id).className=`Rarity-${eq.rarity}`;}
 eqDetailWeapon.textContent=`攻擊 +${getEffectivePower(hero.equipment.WEAPON,'WEAPON')} · 總魔攻 ${getMagicAttackValue()}`;
 eqDetailShield.textContent=`防禦 +${getEffectivePower(hero.equipment.SHIELD,'SHIELD')}`;
 const r=hero.equipment.RING;eqDetailRing.textContent=r.ability.id==='NONE'?'下一個寶箱，或許就有驚喜。':r.ability.desc;eqDetailRing.title=r.ability.desc;
 eqWeaponAffix.innerHTML=affixLines([...getAllWeaponAffixSet()],'WEAPON');eqShieldAffix.innerHTML=affixLines(hero.equipment.SHIELD.affixes,'SHIELD');
 const buffs=[];if(hero.buffDamageUpTurns)buffs.push(['加持',hero.buffDamageUpTurns]);if(hero.regenTurns)buffs.push(['回復',hero.regenTurns]);if(hero.magicGuardTurns)buffs.push(['魔盾',hero.magicGuardTurns]);if(adventure.scoutTurns)buffs.push(['洞察',adventure.scoutTurns]);if(hero.burnTurns)buffs.push(['灼燒',hero.burnTurns,true]);if(hero.defDownTurns)buffs.push(['破甲',hero.defDownTurns,true]);
 $('buff-list').innerHTML=buffs.map(([n,t,bad])=>`<span class="buff ${bad?'debuff':''}">${n} ${t}</span>`).join('');
 $('quest-text').textContent=adventure.flags.parcel?'幫骷髏郵差送出遲到八十年的信。再往前走幾段，尋找路邊的小屋。':bossLevel>3?'三位首領都已落敗。世界和平了，但你的故事還可以繼續。':`下一個目標：${SCENES[bossLevel-1].boss}。建議 Lv.${SCENES[bossLevel-1].level}，先探索、強化裝備，再去挑戰。`;
 updateCompanionPanel();
 $('journey-track').innerHTML=SCENES.map((s,i)=>`<div class="journey-node ${bossLevel>i+1?'done':bossLevel===i+1?'active':''}" ${bossLevel===i+1?'aria-current="step"':''}><span class="node-number">${bossLevel>i+1?'✓':['I','II','III'][i]}</span><div><strong>${s.name}</strong><small>${bossLevel>i+1?'已完成':s.boss}</small></div></div>`).join('');
 $('time-label').textContent=['晨光','午後','暮色','星夜'][Math.floor(adventure.steps/8)%4];
 updateIdentityDisplay();syncActionDock();
}
function healFraction(rate){const n=Math.min(hero.maxHp-hero.hp,Math.max(1,Math.floor(hero.maxHp*rate)));hero.hp+=n;flashBattleView('heal');return n;}
function healFully(){hero.hp=hero.maxHp;hero.burnTurns=hero.burnDamage=hero.defDownTurns=hero.defDownRate=0;flashBattleView('heal');}
function addMaterials(type,amount){if(type==='WEAPON')weaponMaterials+=amount;else shieldMaterials+=amount;processMaterials();updateStatus();}
function processMaterials(){
 if(hero.equipment.WEAPON.name!=='徒手')while(weaponMaterials>=5){weaponMaterials-=5;attemptWeaponRefine();}
 if(hero.equipment.SHIELD.name!=='無')while(shieldMaterials>=5){shieldMaterials-=5;attemptShieldRefine();}
}
function enterMap(){gameState='MAP';currentEnemy=null;adventure.battle=null;adventure.eventId=null;adventure.result=null;updateStatus();renderMap();saveAuto();}
function renderMap(){setScene('map',88);story('THE ROAD AHEAD',bossLevel>3?'世界和平了，今天還是好天氣。':'下一段小冒險，正在等你。',bossLevel>3?'你可以繼續探索、完成小委託，或翻開旅程紀錄看看自己走了多遠。':'往林間小徑走走，碰碰運氣。累了就回到營火，等準備好了再敲首領的門。');setCommands({text:'✦ 出發探索',hint:'戰鬥、寶物與路邊的故事',value:'Small'},{text:bossLevel>3?'✓ 主線已完成':`⚑ 挑戰${SCENES[bossLevel-1].boss}`,hint:bossLevel>3?'仍可自由探索':`建議 Lv.${SCENES[bossLevel-1].level} · 裝備必掉`,value:'Boss',disabled:bossLevel>3},{text:'♨ 營火休息',hint:'HP 全滿 · 清除灼燒與破甲',value:'Heal'},handleMapAction,'MAP');checkHealCooldown();$('action-tip').textContent='戰敗不掉等、不掉裝備。準備好再挑戰，不必硬撐。';}
function checkHealCooldown(){clearTimeout(healCooldownTimer);if(gameState!=='MAP')return;const left=lastHealTime+4000-Date.now();btn3.disabled=left>0;if(left>0){btn3.querySelector('small').textContent=`整理營地中 · ${Math.ceil(left/1000)} 秒`;const epoch=sessionEpoch;healCooldownTimer=setTimeout(()=>{if(epoch===sessionEpoch&&gameState==='MAP')checkHealCooldown();},Math.min(1000,left));}else btn3.querySelector('small').textContent='HP 全滿 · 清除灼燒與破甲';}
function handleMapAction(action){
 if(gameState!=='MAP'||!['Small','Boss','Heal'].includes(action))return;
 if(action==='Boss'&&bossLevel>3)return;
 if(action==='Heal'&&Date.now()-lastHealTime<4000)return;
 if(action==='Boss'&&hero.level<SCENES[bossLevel-1].level&&!confirm(`建議等級為 Lv.${SCENES[bossLevel-1].level}，你目前 Lv.${hero.level}。確定要挑戰？戰敗不會掉等或掉裝備。`))return;
 if(action==='Boss')saveCheckpoint();
 gameState='MAP_ACTION';disableCommands(true);countTurn();
 if(action==='Heal'){lastHealTime=Date.now();healFully();adventure.stats.rests++;log('♨ 你在營火旁休息，HP 全滿，灼燒與破甲解除。');playTone('heal');enterMap();saveCheckpoint();return;}
 if(action==='Boss'){startBossBattle();return;}
 adventure.steps++;
 if(adventure.steps>=adventure.nextEventAt||Math.random()<.28){adventure.nextEventAt=adventure.steps+randInt(2,3);enterEvent(pickEvent());}else startSmallBattle();
}
function confirmTitle(){
 sessionEpoch++;clearTimeout(healCooldownTimer);hero=JSON.parse(JSON.stringify(INITIAL_HERO));restoreRingAbility(hero.equipment.RING);adventure=freshAdventure();bossLevel=1;currentEnemy=newLoot=null;weaponMaterials=shieldMaterials=totalTurnCount=turnCount=lastHealTime=0;overflowActive=false;
 const parts=resolveTitleParts();hero.name=hero.title=`${parts[0]}的${parts[1]}${parts[2]}`;applyStartingIdentity(parts,$('hero-look-select')?.value||'auto');
 $('titleSelectBox').hidden=true;$('app-shell').inert=false;redrawLog();log(`🧾 ${hero.title}，歡迎踏上旅程。這次，進度會替你記住。`);enterMap();saveCheckpoint();
}
function renderResult(){updateStatus();const r=adventure.result;setScene('event',r?.object??89);story(r?.tag||'休息一下',r?.title||'這一段路，走完了。',r?.text||'先整理一下行囊，再繼續走吧。');setCommands({text:'繼續旅程 →',hint:'回到小徑，決定下一步',value:'continue'},null,null,()=>{if(adventure.pendingEnding)showCredits();else enterMap();},gameState);$('action-tip').textContent='這一頁不會自動消失。看完了，再往前走。';}
function renderCurrent(){updateStatus();redrawLog();if(gameState==='MAP')renderMap();else if(gameState==='BATTLE')renderBattle();else if(gameState==='EVENT')renderEvent();else if(gameState==='LOOT_DECISION')renderLootDecision();else if(gameState==='CREDITS')renderCredits();else renderResult();}

function createBattle(enemy,isBoss=false){
 currentEnemy={...enemy,hp:Math.round(enemy.hp),originalHp:Math.round(enemy.hp),atk:Math.round(enemy.atk),def:Math.round(enemy.def||0),mDef:Math.round(enemy.mDef??enemy.def??0)};
 adventure.battle={id:++adventure.seq,settled:false,round:1,nextMove:rollEnemyMove(currentEnemy.bias),isBoss};adventure.eventId=null;adventure.result=null;
 gameState='BATTLE';if(ENEMY_INTRO_LINES[currentEnemy.name])log(`💬 ${ENEMY_INTRO_LINES[currentEnemy.name]}`);log(`⚔ 遭遇 ${currentEnemy.name}。`);
 if(hero.equipment.SHIELD.affixes.includes('S_REGEN')){hero.regenTurns=Math.max(hero.regenTurns,3);hero.regenAmount=Math.max(hero.regenAmount,Math.max(2,Math.floor(hero.maxHp*.03)));}
 renderBattle();saveAuto();
}
function startSmallBattle(index){const e=ENEMIES.SMALL[Number.isInteger(index)?index:randInt(0,ENEMIES.SMALL.length-1)],n=hero.level-1;createBattle({...e,hp:Math.floor(e.hp*(1+n*.12)),atk:Math.floor(e.atk*(1+n*.09)),def:Math.floor(e.def*(1+n*.07)),mDef:Math.floor(e.mDef*(1+n*.07)),exp:Math.round(e.exp*(1+n*.07))});}
function startEliteBattle(){const index=Math.min(2,bossLevel-1),e=ENEMIES.BOSS[index];createBattle({...e,name:['迷路的牛頭人菁英','度假中的迷你九頭蛇','被縮小的遠古小魔神'][index],hp:Math.floor(e.hp*.65),atk:Math.floor(e.atk*.8),def:Math.floor(e.def*.8),mDef:Math.floor(e.mDef*.8),exp:Math.floor(e.exp*.5),lootChance:1,elite:true});}
function startBossBattle(){if(bossLevel>3)return;createBattle({...ENEMIES.BOSS[bossLevel-1]},true);}
function rollEnemyMove(bias){const r=Math.random(),b=bias||{'⚔️':.34,'🌠':.33,'🛡️':.33};return r<b['⚔️']?'⚔️':r<b['⚔️']+b['🌠']?'🌠':'🛡️';}
function hasExactIntent(){return adventure.scoutTurns>0||adventure.battle.round%3===0;}
function updateBattleView(){
 updateStatus();if(!currentEnemy||!adventure.battle)return;
 $('enemy-hud-name').textContent=currentEnemy.name;$('enemy-hp-label').textContent=`${Math.max(0,currentEnemy.hp)} / ${currentEnemy.originalHp}`;$('enemy-hp-fill').style.width=`${Math.max(0,Math.min(100,currentEnemy.hp/currentEnemy.originalHp*100))}%`;
 const most=Object.entries(currentEnemy.bias).sort((a,b)=>b[1]-a[1])[0];
 $('enemy-intent').innerHTML=(hasExactIntent()?`✦ 已看穿：下一招 <strong>${adventure.battle.nextMove} ${MOVE_NAMES[adventure.battle.nextMove]}</strong>`:`出招偏好：${most[0]} ${MOVE_NAMES[most[0]]} ${Math.round(most[1]*100)}% · 並非必出`)+(currentEnemy.ancientChargeState==='CHARGING'?'<br>⚡ 重擊蓄力中：盡量克制他的下一招！':'');
}
function renderBattle(){
 setScene('battle');updateBattleView();const e=currentEnemy;
 story(adventure.battle.isBoss?'CHAPTER BOSS':'A CHANCE ENCOUNTER',`${e.name} 擋住了去路。`,`物防 ${e.def} · 魔防 ${e.mDef} · 閃避 ${e.dodge}%`,hasExactIntent()?'對手的破綻已經露出。用克制招式把握這一回合。':'砍擊克魔法，魔法克盾擊，盾擊克砍擊。每第 3 回合可看穿下一招。');
 setCommands({text:'⚔️ 砍擊',hint:`物理 ${Math.max(1,hero.currentAttack-e.def)} 起 · 可爆擊`,value:'⚔️'},{text:'🌠 魔法',hint:`魔法 ${Math.max(1,getMagicAttackValue()-e.mDef)} 起 · 不會被閃避`,value:'🌠'},{text:'🛡️ 盾擊',hint:`防禦 ${hero.currentDefense} · 無視防禦`,value:'🛡️'},handleBattleAction,'BATTLE');
 $('action-tip').textContent=`戰鬥第 ${adventure.battle.round} 回合 · 平手時，我方勝率 ${hero.currentTieWinRate.toFixed(0)}%`;
}
function enemyDodged(playerMove){return playerMove!=='🌠'&&Math.random()*100<(currentEnemy?.dodge||0);}
function maybeExtraOverflowAttack(label){
 if(overflowActive||hero.equipment.RING.ability.id!=='DODGE'||!currentEnemy||currentEnemy.hp<=0||hero.hp<=0)return;
 if(Math.random()>=Math.min(.75,hero.dodgeOverflow/100))return;
 overflowActive=true;try{log('💨 閃避溢出：追加一次砍擊！');doSwordStrikeFollowUp(label||'溢出追擊');}finally{overflowActive=false;}
}
function heroDodgeCounterAttack(){if(!currentEnemy||currentEnemy.hp<=0||hero.hp<=0)return;log('💨 敏捷反擊：閃身之後，補上一刀！');doSwordStrikeFollowUp('閃避反擊');/* Only the round controller settles the battle. */}
function applyDamageToHero(rawDamage,isBoss=false){
 if(rawDamage<=0||hero.hp<=0)return 0;let dmg=rawDamage,blocked=false;const aff=hero.equipment.SHIELD.affixes;
 if(hero.magicGuardTurns>0){dmg*=.5;hero.magicGuardTurns--;log('✦ 魔法護盾擋下了一半傷害。');}
 if(aff.includes('S_BLOCK')&&Math.random()<.2){dmg*=.5;blocked=true;log('🛡「我擋~」格擋成功。');}
 if(aff.includes(isBoss?'S_BOSS_GUARD':'S_SMALL_GUARD'))dmg*=.9;
 const actual=Math.min(hero.hp,Math.max(1,Math.floor(dmg)));hero.hp-=actual;
 if(aff.includes('S_REFLECT')&&currentEnemy&&currentEnemy.hp>0){const n=Math.max(1,Math.floor(actual*.2));currentEnemy.hp=Math.max(0,currentEnemy.hp-n);log(`🔁 反彈 ${n} 傷害。`);}
 if(blocked&&hero.hp>0){healFromLifeRing('BLOCK');triggerBlockFollowUps();}
 return actual;
}
function monsterAttack(monsterMove){
 if(!currentEnemy||currentEnemy.hp<=0||hero.hp<=0)return;
 if(Math.random()*100<hero.currentDodge){log(`💨 你閃過了 ${currentEnemy.name} 的攻擊！`);floatingNumber('閃避','hero');if(hero.equipment.RING.ability.id==='DODGE')heroDodgeCounterAttack();return;}
 const hit=calcBossAttackDamage(Math.max(1,currentEnemy.atk-hero.currentDefense));if(hit.skip)return;
 const n=applyDamageToHero(hit.damage,adventure.battle.isBoss);log(`💥 ${currentEnemy.name} 造成 ${n} 傷害。`);flashBattleView('monster-hit');floatingNumber(`−${n}`,'hero');
 if(hero.hp>0&&currentEnemy.hp>0)applyBossPostHitEffects(n);
}
function applyHeroOngoingStatusAtTurnStart(){
 if(hero.burnTurns>0){const n=Math.min(hero.hp,hero.burnDamage);hero.hp-=n;hero.burnTurns--;if(!hero.burnTurns)hero.burnDamage=0;log(`🔥 灼燒造成 ${n} 傷害。`);if(hero.hp<=0){hero.hp=0;return true;}}
 if(hero.regenTurns>0){const n=Math.min(hero.maxHp-hero.hp,hero.regenAmount);hero.hp+=n;hero.regenTurns--;if(!hero.regenTurns)hero.regenAmount=0;if(n)log(`🍀 持續回復 ${n} HP。`);}
 updateStatus();return false;
}
function heroStrike(move){
 const w=getAllWeaponAffixSet();let atk=hero.currentAttack,magic=getMagicAttackValue();if(hero.buffDamageUpTurns){atk=Math.floor(atk*(1+hero.buffDamageUpRate));magic=Math.floor(magic*(1+hero.buffDamageUpRate));}
 const def=w.has('W_ARMOR_PEN')?Math.floor(currentEnemy.def*.7):currentEnemy.def;
 let damage=move==='⚔️'?Math.max(1,atk-def):move==='🌠'?Math.max(1,magic-currentEnemy.mDef):Math.max(1,hero.currentDefense);
 if(enemyDodged(move)){log(`😈 ${currentEnemy.name} 閃過了這一擊。`);floatingNumber('閃過');return;}
 if(move==='🛡️'&&currentEnemy.name==='石頭人'){damage*=2;log('💥 石頭人的弱點：盾擊傷害加倍！');}
 if(move!=='🌠')damage=applyHeroAttackEffects(damage,true,move==='⚔️'?'SWORD':'SHIELD','勇者攻擊');
 else if(currentEnemy.name==='遠古魔神'){damage+=Math.max(1,Math.floor(magic*.1));log('✦ 魔神遭受魔法反噬！');}
 currentEnemy.hp=Math.max(0,currentEnemy.hp-damage);log(`✅ 你造成 ${damage} 傷害。`);animateClass($('hero-actor'),'strike');flashBattleView('hero-hit');floatingNumber(`−${damage}`);playTone('hit');
 if(move!=='⚔️')tryTriggerMagicGuard();if(move==='🛡️')healFromLifeRing('SHIELD');maybeExtraOverflowAttack('主動追擊');
}
function handleBattleAction(playerMove){
 if(gameState!=='BATTLE'||!MOVE_NAMES[playerMove]||!adventure.battle||adventure.battle.settled)return;
 const epoch=sessionEpoch,id=adventure.battle.id;gameState='BATTLE_ACTION';disableCommands(true);countTurn();
 const previousBuff=hero.buffDamageUpTurns,previousDef=hero.defDownTurns;
 if(applyHeroOngoingStatusAtTurnStart()){endBattle('lose');return;}
 const monsterMove=adventure.battle.nextMove;log(`第 ${adventure.battle.round} 回合：你 ${playerMove} ／ 對手 ${monsterMove}`);
 const tie=monsterMove===playerMove;const win=CLASH_RULES[playerMove]===monsterMove||(tie&&Math.random()<hero.currentTieWinRate/100);
 if(tie)log(win?'🤝 平手判定：你取得先機。':'🤝 平手判定：對手取得先機。');
 if(win)heroStrike(playerMove);else monsterAttack(monsterMove);
 petAssist();
 if(previousBuff>0&&hero.buffDamageUpTurns===previousBuff){hero.buffDamageUpTurns--;if(!hero.buffDamageUpTurns)hero.buffDamageUpRate=0;}
 if(previousDef>0&&hero.defDownTurns===previousDef){hero.defDownTurns--;if(!hero.defDownTurns)hero.defDownRate=0;}
 if(adventure.scoutTurns>0)adventure.scoutTurns--;
 updateBattleView();
 if(hero.hp<=0){endBattle('lose');return;}if(currentEnemy.hp<=0){endBattle('win');return;}
 adventure.battle.round++;adventure.battle.nextMove=rollEnemyMove(currentEnemy.bias);
 saveAuto();
 setTimeout(()=>{if(epoch!==sessionEpoch||gameState!=='BATTLE_ACTION'||adventure.battle?.id!==id)return;gameState='BATTLE';renderBattle();saveAuto();},actionDelay);
}
function endBattle(result){
 const b=adventure.battle;if(!b||b.settled||!currentEnemy||!['BATTLE','BATTLE_ACTION'].includes(gameState))return;
 if(result==='win'&&(currentEnemy.hp>0||hero.hp<=0))return;if(result==='lose'&&hero.hp>0)return;
 b.settled=true;gameState='SETTLING';disableCommands(true);currentEnemy.hp=Math.max(0,currentEnemy.hp);
 if(result==='lose'){applyDeathPenalty();return;}
 const defeated={...currentEnemy};adventure.stats.wins++;const gold=(b.isBoss?20*bossLevel:randInt(4,8))+(adventure.flags.fox?2:0);adventure.gold+=gold;
 log(`🏆 擊敗 ${defeated.name}！金幣 +${gold}${adventure.flags.fox?'（含狐狸尋寶 +2）':''}。`);gainExp(defeated.exp);
 if(b.isBoss){adventure.stats.bosses++;bossLevel++;unlockNewRarity();adventure.pendingEnding=bossLevel>3;}
 adventure.result={tag:'戰鬥勝利',title:`${defeated.name}，暫時下班。`,text:`你獲得 ${defeated.exp} 經驗值與 ${gold} 金幣。${b.isBoss?'新的旅途已經開啟。':'整理好行囊，再繼續下一段路。'}`,object:91};
 handleLootDrop(defeated,b.isBoss);saveAuto();
}
function applyDeathPenalty(){
 adventure.stats.deaths++;const loss=Math.floor(hero.exp*.1);hero.exp-=loss;healFully();hero.magicGuardTurns=0;
 log(`♨ 你被路過的旅人送回營地。損失 ${loss} 經驗值，等級與裝備全部保留。`);
 adventure.result={tag:'營火還在',title:'冒險只是暫停，不是結束。',text:`旅人把你送回營地。你損失了 ${loss} 經驗值，但沒有掉等，也沒有掉裝備。HP 已恢復；可以重新準備再挑戰。`,object:88};gameState='DEFEAT';renderResult();saveAuto();
}
