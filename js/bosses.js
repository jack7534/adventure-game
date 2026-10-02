/* v2.3: fixed chapter budgets, visible telegraphs, tactical responses, no hidden level scaling. */
const BOSS_DESIGNS=[
 {id:'lich',level:1,target:7,name:'不死巫妖',hp:650,atk:56,def:16,mDef:58,dodge:6,exp:110,lootChance:1,bias:{'⚔️':.2,'🌠':.5,'🛡️':.3},trait:'魔防極高；砍擊與盾擊更適合拆骨。',skill:'靈魂催繳',counter:'⚔️',intro:'巫妖把你的靈魂列成分期付款。「利息不用錢，只要命。」',defeat:'巫妖嘆了口氣，開始填寫自己的離職證明。'},
 {id:'dragon',level:2,target:12,name:'火焰巨龍',hp:1300,atk:110,def:28,mDef:18,dodge:8,exp:300,lootChance:1,bias:{'⚔️':.5,'🌠':.2,'🛡️':.3},trait:'物理攻擊高；深吸氣後會噴火，別只顧著連打。',skill:'報復性加熱',counter:'GUARD',intro:'巨龍看著你：「微辣、中辣，還是勇者本人熟一點？」',defeat:'巨龍答應戒宵夜。牠補充：「至少戒到明天。」'},
 {id:'ancient',level:3,target:19,name:'遠古魔神',hp:2400,atk:143,def:44,mDef:32,dodge:10,exp:1000,lootChance:1,bias:{'⚔️':.25,'🌠':.35,'🛡️':.4},trait:'毒會逐層累積；魔法打斷毒霧，解毒要趁早。',skill:'祖傳秘製毒霧',counter:'🌠',intro:'魔神端出綠湯：「這不是毒，是尚未通過食安的祝福。」',defeat:'魔神承認祖傳秘方只有兩年，而且是網路買的。'},
 {id:'warden',level:4,target:26,name:'發條典獄長',hp:3600,atk:195,def:74,mDef:54,dodge:8,exp:2300,lootChance:1,bias:{'⚔️':.35,'🌠':.25,'🛡️':.4},trait:'裝甲減傷；魔法解除裝甲，同一招連打會被讀懂。',skill:'加班大印章',counter:'GUARD',intro:'「你的離場申請少一個章。」典獄長舉起比你還大的印章。',defeat:'印章斷成兩半。典獄長震驚的是：這要填兩張報修單。'},
 {id:'dice',level:5,target:34,name:'骰骨大公',hp:5000,atk:291,def:78,mDef:76,dodge:10,exp:5000,lootChance:1,bias:{'⚔️':.34,'🌠':.33,'🛡️':.33},trait:'每回合換抗性；兩回合蓄力要用不同招式破印，不能只賭運氣。',skill:'末日重新擲骰',counter:'SEQUENCE',intro:'大公翻開說明書：「公平？那是付費擴充包。」',defeat:'骰子終於停止。大公小聲問：這一局可不可以不算？'}
];
ENEMIES.BOSS.splice(0,ENEMIES.BOSS.length,...BOSS_DESIGNS.map(b=>({...b,bossId:b.id})));
[7,12,19].forEach((level,i)=>SCENES[i].level=level);
SCENES.push({name:'發條監獄',boss:'發條典獄長',level:26,sky:'#879792',light:'#dcebc0',far:'#667978',mid:'#46595c',ground:'#394749',grass:'#71886c'},{name:'倒轉賭城',boss:'骰骨大公',level:34,sky:'#6f6693',light:'#efce9f',far:'#5d537c',mid:'#453b64',ground:'#362e48',grass:'#7e6887'});
Object.assign(ENEMY_SPRITES,{'發條典獄長':128,'骰骨大公':97,'剛打卡的裝甲看守':125,'欠債的骰子騎士':38});
for(const b of BOSS_DESIGNS)ENEMY_INTRO_LINES[b.name]=`${b.name}：「${b.intro}」`;
function activeBoss(){return adventure.battle?.isBoss?BOSS_DESIGNS.find(b=>b.id===currentEnemy?.bossId||b.name===currentEnemy?.name):null;}
function initBossState(){const d=activeBoss();if(!d)return;const b=adventure.battle;b.boss??={id:d.id,ward:d.id==='warden'?3:0,exposed:0,lastMove:null,repeats:0,phase:1,charge:0,sealMoves:[],staggered:false};prepareBossTurn();}
function prepareBossTurn(){
 const d=activeBoss();if(!d)return;const b=adventure.battle,s=b.boss??{id:d.id,ward:d.id==='warden'?3:0,exposed:0,lastMove:null,repeats:0,phase:1,charge:0,sealMoves:[],staggered:false};b.boss=s;
 const phase=currentEnemy.hp<=currentEnemy.originalHp*.4?2:1;if(phase>s.phase)log(`⚠ ${d.name} 進入第二階段！招式更急迫，但預告仍然有效。`);s.phase=phase;
 let kind='normal',title='觀察對手',hint=d.trait,counter=null;
 if(d.id==='lich'&&b.round%4===3){kind='siphon';title='☠ 靈魂催繳';hint='本回合用「砍擊」斬斷法杖可阻止吸血；其他招式會吃到詛咒。';counter='⚔️';}
 if(d.id==='dragon'){
  if(b.round%5===3){kind='charge';title='🔥 深吸一口氣';hint='本回合魔法攻擊可冷卻龍焰；下回合仍會噴火，可用「堅守」防住。';counter='🌠';}
  if(b.round%5===4){kind='inferno';title=s.staggered?'🔥 被冷卻的龍焰':'🔥 龍焰即將爆發';hint='點「堅守」大幅減傷並免於灼燒；亂攻擊會吃完整噴火。';counter='GUARD';}
  if(b.round%5===0){kind='recover';title='💨 巨龍打嗝中';hint='這回合巨龍不攻擊，受到傷害增加 30%。';}
 }
 if(d.id==='ancient'&&b.round%4===2){kind='venom';title='☣ 正在調配祖傳毒湯';hint='本回合用「魔法」打斷毒霧並清掉 1 層毒。解毒藥可清除全部毒。';counter='🌠';}
 if(d.id==='warden'){
  if(b.round%5===2){kind='armor';title='⚙ 裝甲重新上鎖';hint='本回合「魔法」命中可立即解除裝甲、製造破綻。';counter='🌠';}
  if(b.round%5===4){kind='stamp';title='⚠ 巨型印章落下';hint='用「堅守」承受衝擊；之後露出兩回合破綻。不要連續使用同招。';counter='GUARD';}
 }
 if(d.id==='dice'){
  s.resist=['⚔️','🌠','🛡️'][(b.round+Math.floor(b.id%3))%3];s.weak=CLASH_RULES[s.resist];
  if(b.round%6===3||b.round%6===4){kind='seal';title='🎲 末日蓄力：雙重骰印';hint='這兩回合分別用不同的基本攻擊，湊齊兩種印記才能阻止末日。';if(b.round%6===3)s.sealMoves=[];counter='DIFFERENT';}
  if(b.round%6===5){kind='judgment';title=s.sealMoves.length>=2?'🎲 骰印已破壞':'⚠ 末日即將結算';hint=s.sealMoves.length>=2?'兩種印記已集齊：末日失敗，本回合放心進攻。':'未能破解時請堅守！不能完全避開，但可以保命。';counter='GUARD';}
 }
 s.plan={kind,title,hint,counter};
}
function bossDamageMultiplier(kind){
 const d=activeBoss();if(!d)return 1;const s=adventure.battle.boss;let m=1;
 if(d.id==='warden'&&s.ward>0)m*=.65;
 if(s.exposed>0||s.plan?.kind==='recover')m*=1.3;
 if(d.id==='warden'&&s.lastMove===kind&&s.repeats>=2)m*=.45;
 if(d.id==='dice'){if(kind===s.resist)m*=.55;else if(kind===s.weak)m*=1.3;}
 return m;
}
function dealToEnemy(amount,move){const n=Math.max(1,Math.floor(amount*bossDamageMultiplier(move)*expeditionDamageRate()));const actual=Math.min(currentEnemy.hp,n);currentEnemy.hp=Math.max(0,currentEnemy.hp-n);return actual;}
function bossHit(scale=1,guard=false,affliction=null){
 const d=activeBoss();if(!d||hero.hp<=0||currentEnemy.hp<=0)return 0;const phase=adventure.battle.boss.phase;
 const raw=Math.max(3+d.level,Math.floor((currentEnemy.atk*(phase===2?1.12:1)-hero.currentDefense*.9)*scale));
 const actual=applyDamageToHero(Math.floor(raw*(guard ? 0.28 : 1)),true);log(`💥 ${d.name} 特殊攻擊造成 ${actual} 傷害${guard?'（堅守減傷）':''}。`);floatingNumber(`−${actual}`,'hero');flashBattleView('monster-hit');
 if(hero.hp>0&&!guard){if(affliction==='burn'){hero.burnTurns=3;hero.burnDamage=Math.max(2,Math.floor(hero.maxHp*.05));}if(affliction==='poison')hero.poisonStacks=Math.min(5,hero.poisonStacks+2);}
 return actual;
}
function resolveBossSpecial(move){
 const d=activeBoss();if(!d)return false;const s=adventure.battle.boss,p=s.plan,guard=move==='GUARD',basic=!!MOVE_NAMES[move];
 if(p.kind==='normal')return false;
 if(p.kind==='siphon'){if(move==='⚔️'){heroStrike(move);s.exposed=1;log('⚔ 你砍斷催繳法杖！吸血被打斷。');}else{if(basic)heroStrike(move);const n=bossHit(.9,guard);currentEnemy.hp=Math.min(currentEnemy.originalHp,currentEnemy.hp+n*2);if(!guard){hero.defDownTurns=2;hero.defDownRate=.15;}}}
 if(p.kind==='charge'){s.staggered=move==='🌠';if(basic)heroStrike(move);log(s.staggered?'❄ 魔法冷卻了龍焰，下回合噴火威力下降。':'🔥 巨龍深吸氣，準備下回合噴火。');}
 if(p.kind==='inferno'){if(basic)heroStrike(move);bossHit(s.staggered?1.3:2.1,guard,'burn');s.staggered=false;}
 if(p.kind==='recover'){if(basic)heroStrike(move);log('💨 巨龍只打了一個長長的嗝。');}
 if(p.kind==='venom'){if(move==='🌠'){heroStrike(move);hero.poisonStacks=Math.max(0,hero.poisonStacks-1);log('🌠 毒湯鍋被掀翻！毒霧中斷，毒層 −1。');}else{if(basic)heroStrike(move);bossHit(.7,guard,'poison');}}
 if(p.kind==='armor'){if(move==='🌠'){s.ward=0;s.exposed=3;heroStrike(move);log('⚙ 魔法打開裝甲鎖！接下來露出破綻。');}else{s.ward=Math.min(3,s.ward+1);if(basic)heroStrike(move);bossHit(.7,guard);}}
 if(p.kind==='stamp'){if(basic)heroStrike(move);bossHit(1.9,guard);s.exposed=3;log('🛡 大印章卡進地板，典獄長露出兩回合破綻。');}
 if(p.kind==='seal'){if(basic){if(!s.sealMoves.includes(move))s.sealMoves.push(move);heroStrike(move);}log(`🎲 破印進度 ${s.sealMoves.length}/2：${s.sealMoves.join('、')||'尚未取得'}。`);if(s.phase===2)bossHit(.35,guard);}
 if(p.kind==='judgment'){if(s.sealMoves.length>=2){s.exposed=2;if(basic)heroStrike(move);log('💥 末日反噬大公！趁現在攻擊。');}else{if(basic)heroStrike(move);bossHit(2.8,guard);}s.sealMoves=[];}
 return true;
}
function bossAfterRound(move){
 const d=activeBoss();if(!d||hero.hp<=0||currentEnemy.hp<=0)return;const s=adventure.battle.boss;
 if(MOVE_NAMES[move]){if(s.lastMove===move)s.repeats++;else{s.lastMove=move;s.repeats=1;}if(d.id==='warden'&&move==='🌠'&&s.ward>0)s.ward--;}
 if(s.exposed>0)s.exposed--;
 if(hero.poisonStacks>0){const n=Math.min(hero.hp,Math.max(1,Math.floor(hero.maxHp*.018*(1-relicBonus('poison'))))*hero.poisonStacks);hero.hp-=n;log(`☣ ${hero.poisonStacks} 層毒造成 ${n} 傷害。`);}
 if(adventure.battle.round>=35){const n=Math.min(hero.hp,Math.max(2,Math.floor(hero.maxHp*.08)));hero.hp-=n;log(`⏳ 戰鬥拖得太久，首領威壓造成 ${n} 傷害。`);}
}
function bossTacticMarkup(){const d=activeBoss();if(!d)return '';const s=adventure.battle.boss,p=s?.plan;if(!p)return '';
 return `<section class="boss-plan"><strong>${escapeHtml(p.title)}${s.phase===2?' · 第二階段':''}</strong><p>${escapeHtml(p.hint)}</p>${d.id==='warden'?`<small>裝甲鎖 ${s.ward}/3 · 連用同招 ${s.repeats} 次</small>`:''}${d.id==='dice'?`<small>本回合抗性 ${s.resist} · 弱點 ${s.weak} · 骰印 ${s.sealMoves.length}/2</small>`:''}<small>建議 Lv.${d.target} · ${escapeHtml(d.trait)}</small></section>`;
}
