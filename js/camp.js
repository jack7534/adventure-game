/* Gold has visible uses; purchases are map-only, saved atomically and click-token checked. */
const CAMP_OFFERS=[
 {id:'weapon',name:'武器零件包',price:12,description:'武器素材 +5。已有武器時立即自動精練；徒手時保留素材。',apply:()=>addMaterials('WEAPON',5)},
 {id:'shield',name:'盾牌零件包',price:12,description:'盾牌素材 +5。已有盾牌時立即自動精練；空手時保留素材。',apply:()=>addMaterials('SHIELD',5)},
 {id:'rations',name:'暖心便當',price:10,description:'接下來 5 個戰鬥回合，回復最大 HP 的 10%，至少 3 點。重買不疊加。',canBuy:()=>hero.regenTurns===0,apply:()=>{hero.regenTurns=5;hero.regenAmount=Math.max(3,Math.floor(hero.maxHp*.1));}},
 {id:'scout',name:'偵察情報',price:12,description:'接下來 5 個戰鬥回合，直接看穿敵人下一招。重買不疊加。',canBuy:()=>adventure.scoutTurns===0,apply:()=>{adventure.scoutTurns=5;}}
];
let campToken=0,campLockedUntil=0;
function petAssistDamage(){return Math.max(2,Math.floor(hero.currentAttack*.25));}
function updateCompanionPanel(){
 const active=!!adventure.flags.fox,el=$('companion-note');
 el.innerHTML=active?`<strong>🦊 嘴硬的小狐狸 · 已跟隨</strong><span>尋寶鼻：每次勝利額外 +2 金幣。</span><span>夾擊：戰鬥第 3、6、9…回合，追加 ${petAssistDamage()} 傷害（你 ATK 的 25%，至少 2 點）。</span><small>夾擊無視防禦／閃避，不觸發戒指與武器詞條；你或敵人倒下就不追加。</small>`:'<span>🦊 旅伴尚未加入。探索時幫助受困的小狐狸，即可獲得尋寶與戰鬥支援。</span>';
}
function petAssist(){
 const b=adventure.battle;
 if(!adventure.flags.fox||!b||b.settled||gameState!=='BATTLE_ACTION'||b.round%3!==0||b.petAssistRound===b.round||hero.hp<=0||!currentEnemy||currentEnemy.hp<=0)return 0;
 b.petAssistRound=b.round;const damage=Math.min(currentEnemy.hp,petAssistDamage());currentEnemy.hp-=damage;
 log(`🦊 小狐狸【夾擊】造成 ${damage} 傷害！無視防禦，沒有觸發額外連擊。`);
 animateClass($('companion-actor'),'pet-strike',420);floatingNumber(`🦊 −${damage}`);return damage;
}
function openCamp(){if(gameState==='TITLE')return;renderCamp();$('camp-dialog').showModal();}
function renderCamp(){
 const token=++campToken,canShop=gameState==='MAP',locked=Date.now()<campLockedUntil;
 $('camp-balance').textContent=`目前持有 ${adventure.gold} 金幣`;
 $('camp-warning').textContent=canShop?'營地可隨時補給。路上遇見的鐵匠有更便宜的 8 金幣零件。':'現在只能查看。請先完成戰鬥、事件或裝備選擇，回到地圖再購買。';
 $('camp-offers').replaceChildren();
 for(const offer of CAMP_OFFERS){const row=document.createElement('section');row.className='camp-offer';const ready=!offer.canBuy||offer.canBuy();row.innerHTML=`<div><h3>${escapeHtml(offer.name)}</h3><p>${escapeHtml(offer.description)}</p></div>`;const btn=document.createElement('button');btn.className='secondary';btn.textContent=ready?`${offer.price} 金幣 · 購買`:'效果尚未用完';btn.dataset.offer=offer.id;btn.disabled=!canShop||locked||!ready||adventure.gold<offer.price;btn.onclick=()=>buyCampItem(offer.id,token);row.append(btn);$('camp-offers').append(row);}
 $('camp-pet').innerHTML=$('companion-note').innerHTML;
}
function buyCampItem(id,token){
 const offer=CAMP_OFFERS.find(o=>o.id===id);
 if(token!==campToken||!$('camp-dialog').open||gameState!=='MAP'||Date.now()<campLockedUntil||!offer||adventure.gold<offer.price||(offer.canBuy&&!offer.canBuy()))return false;
 const epoch=sessionEpoch;campLockedUntil=Date.now()+450;campToken++;adventure.gold-=offer.price;offer.apply();log(`◉ 營地補給：${offer.name}，花費 ${offer.price} 金幣。`);updateStatus();saveAuto();renderCamp();
 setTimeout(()=>{if(epoch===sessionEpoch&&$('camp-dialog').open)renderCamp();},480);return true;
}
function initEnhancementUI(){
 // Give every long modal its own scrollable body and a sticky, opaque header.
 for(const dialog of document.querySelectorAll('dialog.modal')){const header=dialog.querySelector(':scope > .modal-top');if(!header)continue;const body=document.createElement('div');body.className='modal-body';while(header.nextSibling)body.append(header.nextSibling);dialog.append(body);}
 $('btn-camp').onclick=$('btn-gold-help').onclick=openCamp;
 $('guide-affixes').innerHTML=`<h3>武器詞條 · 原作 12 種</h3>${affixLines(WEAPON_AFFIX_POOL.map(a=>a.id),'WEAPON')}<h3>盾牌詞條 · 原作 12 種</h3>${affixLines(SHIELD_AFFIX_POOL.map(a=>a.id),'SHIELD')}`;
 updateCompanionPanel();
}
