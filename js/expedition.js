/* A persistent run: route choices, weather, relics and story flags are saved before selection. */
const RUN_RELICS={
 red_quill:{name:'會催稿的紅筆',desc:'物理攻擊 ATK +8%。「別拖稿，拖刀可以。」',stat:'atk',value:.08},
 tin_bell:{name:'拒絕加班鈴',desc:'防禦 DEF +8%。響了也不一定有人准你走。',stat:'def',value:.08},
 blue_cup:{name:'不洗的法師茶杯',desc:'魔攻 MATK +8%。杯底沉澱的是智慧。',stat:'matk',value:.08},
 feather:{name:'狐狸的離職羽毛',desc:'閃避 +3 個百分點。狐狸沒有羽毛，別問。',stat:'dodge',value:3},
 receipt:{name:'永遠報不了帳的收據',desc:'每次戰鬥勝利額外 +3 金幣。',stat:'gold',value:3},
 lunchbox:{name:'自動續湯便當盒',desc:'戰鬥勝利回復最大 HP 的 8%。',stat:'heal',value:.08},
 filter:{name:'護肝符',desc:'毒傷害減少 35%。不能拿來泡酒。',stat:'poison',value:.35},
 glasses:{name:'只看得見破綻的眼鏡',desc:'平手勝率 +4 個百分點。',stat:'tie',value:4},
 lucky_coin:{name:'兩面都是正面的硬幣',desc:'砍擊爆擊率 +3 個百分點。',stat:'crit',value:3},
 map:{name:'把北畫在下面的地圖',desc:'戰鬥經驗值 +12%。至少迷路很有教育意義。',stat:'xp',value:.12}
};
const RUN_WEATHER=[
 {id:'clear',name:'好天氣，壞預感',desc:'沒有額外修正。別因此大意。'},
 {id:'fog',name:'濃霧',desc:'普通敵人閃避 +5%，勝利金幣 +2。'},
 {id:'rain',name:'下雨但沒帶傘',desc:'普通敵人物攻 −5%，魔防 +10%。'},
 {id:'wind',name:'亂吹的風',desc:'普通敵人物攻 +8%，經驗值 +10%。'},
 {id:'glow',name:'地脈打嗝',desc:'普通敵人 HP +10%，掉寶率 +8%。'}
];
const ROUTE_KINDS={battle:{icon:'⚔',name:'不太友善的小徑',hint:'普通戰鬥 · 經驗與裝備',weight:5},event:{icon:'?',name:'有人在喊你的名字',hint:'隨機劇情 · 選擇會有後續',weight:5},elite:{icon:'☠',name:'門口貼滿警告的巷子',hint:'菁英挑戰 · 高風險高報酬',weight:2},treasure:{icon:'✧',name:'閃閃發光的不明物',hint:'寶物、素材或小小惡作劇',weight:3},rest:{icon:'♨',name:'冒煙的流動食堂',hint:'恢復 35% HP · 補給',weight:2},relic:{icon:'◈',name:'神明的失物招領',hint:'選擇一件旅途奇物 · 最多 5 件',weight:2}};
const CHAPTER_STORIES=[
 ['世界末日，請先抽號碼牌','村長交給你一張「世界和平申請書」。第一關不是魔王，是管印章的巫妖。牠已經死了，卻還不肯下班。'],
 ['印章蓋好了，紙卻燒起來','巫妖的章總算到手。紙上多了一句：「請巨龍烘乾後再送件。」這個世界連行政流程都會噴火。'],
 ['巨龍認為，綠色就是健康','你帶著微焦的申請書抵達遺跡。有人請你試喝祖傳綠湯。狐狸聞了一下，直接把你的遺照先畫好了。'],
 ['和平只有三章試用期','魔神倒下後，天空跳出小字：「您的和平試用已到期。」發條監獄保存著正式合約，而典獄長從不准時放人。'],
 ['最後一關，骰子自己會作弊','典獄長交出合約，卻說簽名得由骰骨大公批准。你走進倒轉賭城，發現連地板都在擲你的命運。']
];
function makeExpedition(){const seed=stableIdentityHash(adventure.runId)||1;return {version:1,seed,rng:seed,chapter:Math.min(5,bossLevel),depth:0,clues:0,choices:[],weather:null,relics:[],relicOffers:[],potions:2,antidotes:2,flags:{},recent:[],pendingIntro:false,lastRoute:null,history:[],generation:0};}
function ensureExpedition(){if(!adventure.expedition){adventure.expedition=makeExpedition();adventure.expedition.clues=Math.min(requiredClues(),Math.floor(adventure.steps/2));}const e=adventure.expedition;if(e.chapter!==Math.min(5,bossLevel)){e.chapter=Math.min(5,bossLevel);e.depth=0;e.clues=0;e.choices=[];e.weather=null;e.pendingIntro=true;}return e;}
function runRandom(){const e=ensureExpedition();let x=e.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;e.rng=x>>>0||1;return e.rng/4294967296;}
function runPick(array){return array[Math.min(array.length-1,Math.floor(runRandom()*array.length))];}
function requiredClues(){return [4,5,6,7,8][Math.min(4,bossLevel-1)];}
function currentWeather(){const e=ensureExpedition();if(!e.weather)e.weather=RUN_WEATHER[Math.floor(runRandom()*RUN_WEATHER.length)].id;return RUN_WEATHER.find(w=>w.id===e.weather);}
function relicBonus(key){return (adventure.expedition?.relics||[]).reduce((sum,id)=>sum+(RUN_RELICS[id]?.stat===key?RUN_RELICS[id].value:0),0);}
function expeditionDamageRate(){return 1;}
function applyExpeditionStats(){if(!adventure?.expedition)return;hero.currentAttack=Math.floor(hero.currentAttack*(1+relicBonus('atk')));hero.currentDefense=Math.floor(hero.currentDefense*(1+relicBonus('def')));hero.currentMagicAtk=Math.floor(hero.currentMagicAtk*(1+relicBonus('matk')));hero.currentDodge=Math.min(75,hero.currentDodge+relicBonus('dodge'));hero.currentTieWinRate=Math.min(100,hero.currentTieWinRate+relicBonus('tie'));}
function generateRoutes(){const e=ensureExpedition();if(e.choices.length)return;const pool=Object.keys(ROUTE_KINDS);const picks=[];while(picks.length<3){const weighted=pool.filter(x=>!picks.includes(x)).flatMap(id=>Array(ROUTE_KINDS[id].weight).fill(id));picks.push(runPick(weighted));}e.generation++;e.choices=picks.map((kind,i)=>({kind,id:`${e.chapter}-${e.generation}-${i}`,flavor:Math.floor(runRandom()*4)}));saveAuto();}
function enterRoutes(){if(gameState!=='MAP')return;generateRoutes();gameState='ROUTE';renderRoutes();saveAuto();}
function renderRoutes(){const e=ensureExpedition(),weather=currentWeather();setScene('map',88);story('CHOOSE YOUR PATH',`第 ${e.chapter} 章 · 這次要往哪裡走？`,`${weather.name}：${weather.desc}`,`首領通行線索 ${e.clues}/${requiredClues()} · 路線一旦出現就會保存，重新整理不重抽。`);const id=e.generation;setCommands(...e.choices.map((c,i)=>({text:`${ROUTE_KINDS[c.kind].icon} ${ROUTE_KINDS[c.kind].name}`,hint:ROUTE_KINDS[c.kind].hint,value:i})),i=>chooseRoute(i,id),'ROUTE');mainView.insertAdjacentHTML('beforeend','<button id="route-back" class="text-button">先回營地準備</button>');$('route-back').onclick=()=>{gameState='MAP';renderMap();saveAuto();};syncActionDock();}
function chooseRoute(index,generation=ensureExpedition().generation){
 const e=ensureExpedition();if(gameState!=='ROUTE'||generation!==e.generation||!Number.isInteger(index)||!e.choices[index])return;
 const c=e.choices[index];gameState='MAP_ACTION';disableCommands(true);e.choices=[];e.depth++;e.clues=Math.min(requiredClues(),e.clues+1);e.lastRoute=c.kind;e.history.push(`${e.chapter}:${c.kind}`);e.history=e.history.slice(-120);adventure.steps++;countTurn();e.place=c.kind==='battle'?runPick(['forest','road','cave','marsh']):c.kind==='elite'?'road':c.kind==='treasure'?'cave':c.kind==='rest'?'camp':'ruins';
 if(c.kind==='battle')startSmallBattle();else if(c.kind==='elite')enterEvent('elite');else if(c.kind==='event')enterEvent(pickEvent());else if(c.kind==='rest'){const n=healFraction(.35);if(runRandom()<.4)e.antidotes=Math.min(5,e.antidotes+1);resultEvent('你坐下來，世界沒有因此毀滅',`恢復 ${n} HP。老闆娘：「飯要吃，世界也要救，順序別搞錯。」`,86);}else if(c.kind==='relic'){prepareRelicOffers();enterEvent('relic_shrine');}else{if(runRandom()<.65)giveEventLoot(runPick(['WEAPON','SHIELD','RING']),'路邊失物招領');else enterEvent(runPick(['chest','living_luggage','receipt_duel']));}
 updateStatus();saveAuto();
}
function prepareRelicOffers(){const e=ensureExpedition(),pool=Object.keys(RUN_RELICS).filter(id=>!e.relics.includes(id));e.relicOffers=[];while(e.relicOffers.length<Math.min(3,pool.length)){const id=runPick(pool.filter(id=>!e.relicOffers.includes(id)));e.relicOffers.push(id);}}
function takeRelic(index){const e=ensureExpedition(),id=e.relicOffers[index];if(!id)return;if(e.relics.length>=5){adventure.gold+=18;resultEvent('神明說，你的背包已經夠吵了','奇物已達 5 件，改拿 18 金幣，不會強制丟掉舊奇物。',84);}else{e.relics.push(id);resultEvent(`收下「${RUN_RELICS[id].name}」`,RUN_RELICS[id].desc,84);}e.relicOffers=[];updateStatus();saveAuto();}
function chapterIntro(){const e=ensureExpedition();if(!e.pendingIntro)return false;e.pendingIntro=false;const s=CHAPTER_STORIES[e.chapter-1];adventure.result={tag:`第 ${e.chapter} 章`,title:s[0],text:s[1],object:84,portraitKey:e.chapter===4?'smith':'sage'};gameState='RESULT';renderResult();saveAuto();return true;}
function updateExpeditionPanel(){const host=$('expedition-summary');if(!host||gameState==='TITLE')return;const e=ensureExpedition(),weather=currentWeather();const helper=e.social?.helper;host.innerHTML=`${helper?`<p>🤝 同行：${NPC_ROSTER[helper].name} · 剩 ${e.social.helperBattles} 場</p>`:''}<div class="run-header"><b>第 ${e.chapter} 章 · 線索 ${e.clues}/${requiredClues()}</b><small>旅程 ${e.seed.toString(16).toUpperCase()}</small></div><p>${escapeHtml(weather.name)} · ${escapeHtml(weather.desc)}</p><div class="run-relics">${e.relics.length?e.relics.map(id=>`<span title="${escapeHtml(RUN_RELICS[id].desc)}">◈ ${escapeHtml(RUN_RELICS[id].name)}</span>`).join(''):'奇物 0/5 · 探索神明的失物招領，組出不同的能力組合。'}</div>`;}
function expeditionVictory(isBoss){const e=ensureExpedition();adventure.gold+=relicBonus('gold')+(currentWeather().id==='fog'&&!isBoss?2:0);if(relicBonus('heal'))healFraction(relicBonus('heal'));if(isBoss){e.pendingIntro=true;log(`📜 ${BOSS_DESIGNS.find(b=>b.name===currentEnemy.name)?.defeat||'前方還有新的故事。'}`);}}
function tacticalActionAvailable(action){const e=ensureExpedition();return (action==='FLEE'&&!adventure.battle?.isBoss)||action==='GUARD'||action==='POTION'&&e.potions>0||action==='CLEANSE'&&e.antidotes>0&&(hero.poisonStacks>0||hero.burnTurns>0||hero.defDownTurns>0);}
function useTacticalItem(action){const e=ensureExpedition();if(action==='POTION'){e.potions--;healFraction(.4);log('🧪 喝下藥水，回復 40% HP。本回合不攻擊。');}if(action==='CLEANSE'){e.antidotes--;hero.poisonStacks=0;hero.burnTurns=hero.burnDamage=hero.defDownTurns=hero.defDownRate=0;log('✧ 解毒藥洗去毒、灼燒與破甲。本回合不攻擊。');}}
function syncTactics(){const el=$('tactical-actions');if(!el)return;const active=['BATTLE','BATTLE_ACTION'].includes(gameState);const flee=$('tactic-flee');if(flee){flee.disabled=gameState!=='BATTLE'||!!adventure.battle?.isBoss;flee.textContent=adventure.battle?.isBoss?'首領不可逃':`逃跑 ${active?battleEscapeChance():0}%`;}el.hidden=!active;if(!active)return;const e=ensureExpedition();$('tactic-guard').disabled=gameState!=='BATTLE';$('tactic-potion').disabled=gameState!=='BATTLE'||e.potions<=0;$('tactic-potion').textContent=`藥水 ×${e.potions}`;$('tactic-cleanse').disabled=gameState!=='BATTLE'||!tacticalActionAvailable('CLEANSE');$('tactic-cleanse').textContent=`解毒 ×${e.antidotes}`;}
function initExpeditionUI(){
 const panel=document.createElement('section');panel.id='expedition-summary';panel.className='panel run-panel';document.querySelector('.play-column').insertBefore(panel,document.querySelector('.adventure-panel'));
 const row=document.createElement('div');row.id='tactical-actions';row.hidden=true;row.innerHTML='<button id="tactic-guard" title="消耗一回合，普通傷害減少 65%，大幅減少蓄力衝擊">堅守</button><button id="tactic-potion" title="消耗一回合回復 40% HP，敵人仍會行動">藥水</button><button id="tactic-cleanse" title="消耗一回合解除毒、灼燒與破甲">解毒</button>';commandMenu.after(row);
 for(const [id,action]of [['guard','GUARD'],['potion','POTION'],['cleanse','CLEANSE']])$(`tactic-${id}`).onclick=e=>{if(e.detail>1)return;handleBattleAction(action);};
 updateExpeditionPanel();syncTactics();
}
