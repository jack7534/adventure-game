/* Atomic, token-checked loot decisions. */
function getRandomRarity(type,isBoss=false){
 const phase=hero.level>=22?3:hero.level>=15?2:hero.level>=8?1:0;
 const tables=type==='RING'?[[25,30,25,15,5,0],[15,25,30,20,8,2],[10,18,28,25,14,5],[6,12,24,28,20,10]]:[[45,35,15,5,0,0],[30,30,25,12,3,0],[15,20,30,25,8,2],[8,12,25,30,18,7]];
 const weights=[...tables[phase]],luck=hero.equipment.RING.ability.id==='CRIT'?hero.equipment.RING.tier:0;
 if(type!=='RING'){if(bossLevel>=2)weights[4]=Math.max(weights[4],4);else weights[4]=0;if(bossLevel>=3)weights[5]=Math.max(weights[5],2);else weights[5]=0;}
 for(let i=0;i<6;i++)weights[i]*=(isBoss?[.2,.6,1,1.5,1.8,2.2][i]:1)*(i>=2?1+luck*.12:1);
 let n=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<6;i++){n-=weights[i];if(n<0)return RARITY_ORDER[i];}return 'Normal';
}
function handleLootDrop(enemy,isBoss){
 if(gameState!=='SETTLING')return;
 const luck=hero.equipment.RING.ability.id==='CRIT'?hero.equipment.RING.tier*.025:0;
 if(!isBoss&&Math.random()>Math.min(1,enemy.lootChance+luck)){log('🧱 對手這次沒帶裝備，但經驗與金幣還是你的。');gameState='RESULT';renderResult();return;}
 offerLoot(generateLoot(['WEAPON','SHIELD','RING'][randInt(0,2)],isBoss));
}
function offerLoot(loot){if(newLoot||gameState==='LOOT_DECISION')return false;newLoot={...loot,uid:++adventure.seq};gameState='LOOT_DECISION';adventure.eventId=null;log(`✨ 發現 ${RARITY_NAMES[loot.rarity]} ${loot.name}！`);playTone('reward');renderLootDecision();saveAuto();return true;}
function materialValue(eq){if(!eq||eq.name==='徒手'||eq.name==='無')return 0;let n=RARITY_MATERIAL_VALUE[eq.rarity]||0;if(n>0&&hero.equipment.SHIELD.affixes.includes('S_MAT_BOOST')&&Math.random()<.3){n++;log('🛠 材料加成：額外找到一份零件。');}return n;}
function salvage(eq){if(!eq||eq.name==='徒手'||eq.name==='無')return;const amount=materialValue(eq);if(eq.type==='RING'){adventure.gold+=Math.max(2,amount*2);log(`◉ 戒指換成 ${Math.max(2,amount*2)} 金幣。`);}else{const type=eq.type==='SHIELD'?'SHIELD':'WEAPON';addMaterials(type,amount);log(`🔧 ${eq.name} 分解為 ${type==='WEAPON'?'武器':'盾牌'}素材 ${amount}。`);}}
function lootCard(eq,type,label,isNew){
 const cls=`Rarity-${eq.rarity}`;let desc,affixes='';
 if(type==='RING')desc=`Lv.${eq.tier} · ${eq.ability.desc}`;
 else{desc=`${type==='WEAPON'?'攻擊':'防禦'} +${getEffectivePower(eq,type)}${type==='SHIELD'?` · 精練 +${eq.refine||0}`:''}`;affixes=affixLines(eq.affixes||[],type,'無原生詞條');}
 return `<div class="loot-card ${isNew?'new':''}"><small>${label} · ${RARITY_NAMES[eq.rarity]}</small><strong class="${cls}">${escapeHtml(eq.name)}</strong><p>${escapeHtml(desc)}</p>${affixes?`<div class="loot-affixes">${affixes}</div>`:''}</div>`;
}
function renderLootDecision(){
 updateStatus();setScene('loot',91);const loot=newLoot,cur=hero.equipment[loot.type];
 story('A LITTLE TREASURE','這份新發現，要帶著走嗎？','比較後再決定。每一件戰利品，只會結算一次。');
 mainView.insertAdjacentHTML('beforeend',`<div class="loot-comparison">${lootCard(cur,loot.type,'現在使用',false)}${lootCard(loot,loot.type,'剛剛找到',true)}</div>`);
 let title='裝上新裝備',hint='替換舊裝備，舊裝備轉成素材',note='';
 if(loot.type==='RING'){
  const same=cur.ability.id===loot.ability.id&&cur.ability.id!=='NONE';
  if(same){title=cur.tier<4?'融合並升級':'融合稀有度';hint=`Lv.${cur.tier} → Lv.${Math.min(4,Math.max(cur.tier+(cur.tier<4?1:0),loot.tier))} · 不會降級`;}
  else{title='換上新戒指';hint=`Lv.${loot.tier} ${loot.name} · 舊戒指換金幣`;}
  note='同能力的戒指會融合；滿級戒指不會被低等級覆蓋。放棄新戒指時換成金幣。';
 }else{
  const delta=getEffectivePower(loot,loot.type)-getEffectivePower(cur,loot.type);
  note=`裝備本體${loot.type==='WEAPON'?'攻擊':'防禦'} ${delta>=0?'+':''}${delta}。`+(loot.type==='WEAPON'?'角色的武器精練與舊武器詞條全部保留。':'盾牌精練跟著盾牌，新盾從 +0 開始。請連詞條一起比較。');
 }
 const comparison=equipmentComparison(loot);
 mainView.insertAdjacentHTML('beforeend',comparisonMarkup(comparison)+`<p class="loot-note">${escapeHtml(note)}</p>`);
 commandMenu.hidden=true;commandMenu.style.display='none';decisionMenu.hidden=false;decisionMenu.style.display='flex';
 btnDecYes.classList.toggle('risky-equip',comparison.risky);btnDecNo.classList.toggle('recommended-keep',comparison.risky);
 btnDecYes.innerHTML=`<strong>${comparison.risky?'⚠ 仍要換上（需再確認）':'✓ '+escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small>`;btnDecNo.innerHTML=`<strong>保留目前裝備</strong><small>${loot.type==='RING'?'新戒指換成金幣':`分解新裝備 · 素材 ${RARITY_MATERIAL_VALUE[loot.rarity]||0}`}</small>`;
 btnDecYes.disabled=btnDecNo.disabled=false;
 const uid=loot.uid;btnDecYes.onclick=e=>{if(e.detail>1)return;handleLootDecision('YES',uid);revealCurrentContent();};btnDecNo.onclick=e=>{if(e.detail>1)return;handleLootDecision('NO',uid);revealCurrentContent();};
 $('action-tip').textContent='尚未做決定的戰利品也會存檔。重整後可以接著選。';syncActionDock();
}
function handleRingDecision(choice){handleLootDecision(choice);}
function handleLootDecision(choice,uid=newLoot?.uid){
 if(gameState!=='LOOT_DECISION'||!newLoot||uid!==newLoot.uid||!['YES','NO'].includes(choice))return;
 const loot=newLoot,epoch=sessionEpoch,originalHero=hero;
 if(choice==='YES'&&!confirmEquipmentLoss(loot,equipmentComparison(loot)))return;
 if(epoch!==sessionEpoch||hero!==originalHero||gameState!=='LOOT_DECISION'||newLoot?.uid!==uid)return;
 newLoot=null;gameState='LOOT_RESOLVING';disableCommands(true);adventure.stats.loot++;
 const type=loot.type,cur=hero.equipment[type];
 if(choice==='YES'){
  if(type==='RING'&&cur.ability.id===loot.ability.id&&cur.ability.id!=='NONE'){
   cur.tier=Math.min(4,Math.max(cur.tier+(cur.tier<4?1:0),loot.tier));if(RARITY_ORDER.indexOf(loot.rarity)>RARITY_ORDER.indexOf(cur.rarity))cur.rarity=loot.rarity;log(`💍 融合完成：${cur.name} Lv.${cur.tier}。`);
  }else{
   if(type==='WEAPON')loot.affixes=[...new Set([...(loot.affixes||[]),...(cur.affixes||[])])];
   hero.equipment[type]=loot;log(`✓ 裝上了 ${loot.name}${type==='RING'?` Lv.${loot.tier}`:''}。`);
   salvage({...cur,type});processMaterials();
  }
 }else salvage(loot);
 updateStatus();
 if(adventure.pendingEnding){showCredits();return;}
 adventure.result={tag:'行囊整理好了',title:choice==='YES'?'帶上新的可能，繼續走。':'熟悉的裝備，也值得信任。',text:choice==='YES'?`${loot.name} 已經處理完成。裝備與素材的變動都已記錄。`:`你保留目前的裝備，${loot.type==='RING'?'新戒指已換成金幣':'新裝備已分解'}。`,object:91};
 gameState='RESULT';renderResult();saveAuto();
}
function showCredits(){gameState='CREDITS';adventure.pendingEnding=false;recordClearRun();renderCredits();saveAuto();}
function renderCredits(){
 updateStatus();setScene('map',88);story('THE END · AND A NEW BEGINNING','世界和平了。你終於可以休假了。',`三位首領都被你打倒了。這趟旅程走了 ${totalTurnCount} 回合，經歷 ${adventure.stats.events} 次路邊故事。謝謝你，讓這個小小的世界有了故事。`,'原創遊戲：Jack · 像素素材：Kenney、Clint Bellanger（CC0） · 特別感謝：沒有半途放棄的你。');
 setCommands({text:'繼續自由探索',hint:'裝備與進度全部保留',value:'continue'},{text:'看看旅程紀錄',hint:'你的稱號與通關回合數',value:'records'},null,v=>v==='records'?openRecords():enterMap(),'CREDITS');$('action-tip').textContent='這不是倒數計時。想多坐一下也沒關係。';
}
