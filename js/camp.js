/* Gold has visible uses; purchases are map-only, saved atomically and click-token checked. */
const CAMP_OFFERS=[
 {id:'potion',name:'應急藥水',price:10,description:'戰鬥時消耗一回合恢復 40% HP。最多帶 5 瓶。',canBuy:()=>ensureExpedition().potions<5,apply:()=>ensureExpedition().potions++},
 {id:'antidote',name:'解毒藥',price:8,description:'戰鬥時消耗一回合解除毒、灼燒與破甲。最多帶 5 瓶。',canBuy:()=>ensureExpedition().antidotes<5,apply:()=>ensureExpedition().antidotes++},
 {id:'weapon',name:'武器零件包',price:12,description:'武器素材 +5。已有武器時立即自動精練；徒手時保留素材。',apply:()=>addMaterials('WEAPON',5)},
 {id:'shield',name:'盾牌零件包',price:12,description:'盾牌素材 +5。已有盾牌時立即自動精練；空手時保留素材。',apply:()=>addMaterials('SHIELD',5)},
 {id:'rations',name:'暖心便當',price:10,description:'接下來 5 個戰鬥回合，回復最大 HP 的 10%，至少 3 點。重買不疊加。',canBuy:()=>hero.regenTurns===0,apply:()=>{hero.regenTurns=5;hero.regenAmount=Math.max(3,Math.floor(hero.maxHp*.1));}},
 {id:'scout',name:'偵察情報',price:12,description:'接下來 5 個戰鬥回合，直接看穿敵人下一招。重買不疊加。',canBuy:()=>adventure.scoutTurns===0,apply:()=>{adventure.scoutTurns=5;}}
];
let campToken=0,campLockedUntil=0;
function petAssistDamage(){return petValue("fox");}

function updateCompanionPanel(){renderPetSummary();}

function petAssist(){return runPetRound();}

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
