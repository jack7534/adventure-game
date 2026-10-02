/* Named, visually audited portraits. Never use an arbitrary tile as a person. */
const HERO_LOOKS=[
 {id:'iron',name:'鐵甲騎士',atlas:'dungeon',tile:96},
 {id:'sentinel',name:'城門衛士',atlas:'dungeon',tile:97},
 {id:'swordsman',name:'劍術旅人',atlas:'dungeon',tile:98},
 {id:'sun',name:'金髮冒險家',atlas:'dungeon',tile:99},
 {id:'silver',name:'銀髮劍士',atlas:'dungeon',tile:100},
 {id:'violet',name:'紫袍法師',atlas:'dungeon',tile:84},
 {id:'merchant',name:'行腳商旅',atlas:'dungeon',tile:85},
 {id:'veteran',name:'鬍鬚老手',atlas:'dungeon',tile:86},
 {id:'smith',name:'矮人工匠',atlas:'dungeon',tile:87},
 {id:'auburn',name:'赤髮旅人',atlas:'dungeon',tile:88},
 {id:'sage',name:'白鬚術士',atlas:'dungeon',tile:111},
 {id:'ranger',name:'綠衣遊俠',atlas:'dungeon',tile:112},
 {id:'jade',name:'翠玉守衛',atlas:'creatures',tile:16},
 {id:'azure',name:'蒼藍守衛',atlas:'creatures',tile:17},
 {id:'ruby',name:'赤鐵守衛',atlas:'creatures',tile:18},
 {id:'shadow',name:'夜行斥候',atlas:'creatures',tile:19}
];
const SCENE_PORTRAITS=Object.fromEntries(HERO_LOOKS.map(p=>[p.id,{...p,kind:'person'}]));
Object.assign(SCENE_PORTRAITS,{
 postman:{id:'postman',name:'骷髏郵差',atlas:'creatures',tile:1,kind:'undead'},
 fox:{id:'fox',name:'嘴硬的小狐狸',atlas:'creatures',tile:157,kind:'animal'},
 challenger:{id:'challenger',name:'練習中的菁英',atlas:'creatures',tile:20,kind:'monster'}
});
const EVENT_CAST={fox:['fox'],foxGift:['fox'],forge:['smith','silver'],bridge:['sentinel','azure'],soup:['sun','auburn'],courier:['postman'],delivery:['veteran'],shrine:['sage','violet'],bard:['violet','sage'],elite:['challenger'],merchant:['merchant','swordsman'],campfire:['auburn','ranger','shadow','jade']};
const TITLE_STAT_LABELS={maxHp:'HP',baseAttack:'攻擊',baseDefense:'防禦',baseMagicAtk:'魔攻',baseDodge:'閃避',baseTieWinRate:'平手勝率',titleCritBonus:'爆擊'};
const A_BONUSES={power:{baseAttack:2},guard:{baseDefense:2},magic:{baseMagicAtk:3},vigor:{maxHp:4},swift:{baseDodge:2},poise:{baseTieWinRate:3},lucky:{titleCritBonus:2}};
const A_GROUPS={power:['爆轟','狂躁','斬鐵','赤紅','暴走','無情','熱血'],guard:['無畏','沉穩','超怕痛','笨拙','勇敢'],magic:['烈焰','蒼雷','深淵','冰牙','秘境','碎星','奇妙','深海系','熔岩系','夢幻','神秘'],vigor:['胖胖','很會睡','悠哉','佛系'],swift:['迅影','迅猛','月影','背刺型','隱匿'],poise:['孤高','朦朧','滑稽','視覺系','偉大','傳說中','孤獨'],lucky:['超衰','超歐']};
const B_BONUSES={power:{baseAttack:1},guard:{baseDefense:1},magic:{baseMagicAtk:2},vigor:{maxHp:2},swift:{baseDodge:1},poise:{baseTieWinRate:2},lucky:{titleCritBonus:1}};
const B_GROUPS={power:['暴走','怒氣值滿的','不講武德的','打王專用','愛亂衝的','暴怒','大雞雞'],guard:['背包滿滿','超會卡牆角的','怕痛的','認真的'],magic:['高能','臨時抱佛腳的','陰沉','開外掛'],vigor:['貪吃','省電','太早起的','喝藥喝很兇的','早睡','滿身DEBUFF'],swift:['迷了路的','邊走邊摸魚的','躲草叢的','手滑','放生隊友的','邊緣'],poise:['三分鐘熱度的','不讀說明書的','操作鬼才','人來瘋','網路卡卡','帥氣','冷靜'],lucky:['躺著贏的','死要錢的','不乾淨的','非洲','歐洲']};
const VOCATIONS={
 blade:{name:'劍術底子',bonus:{baseAttack:2},looks:['iron','swordsman','ruby']},
 guard:{name:'守衛訓練',bonus:{baseDefense:2},looks:['sentinel','jade','azure']},
 mage:{name:'法術學識',bonus:{baseMagicAtk:3},looks:['violet','sage','silver']},
 scout:{name:'斥候步法',bonus:{baseDodge:2},looks:['ranger','shadow','auburn']},
 hearty:{name:'充足體力',bonus:{maxHp:4},looks:['veteran','sun','auburn']},
 diplomat:{name:'臨場應變',bonus:{baseTieWinRate:3},looks:['merchant','sage','veteran']},
 artisan:{name:'工匠基本功',bonus:{baseAttack:1,baseDefense:1},looks:['smith','silver','merchant']},
 lucky:{name:'捕捉破綻',bonus:{titleCritBonus:2},looks:['shadow','sun','ranger']},
 wanderer:{name:'旅人經驗',bonus:{maxHp:2,baseAttack:1},looks:['swordsman','auburn','sun']}
};
const C_GROUPS={blade:['大劍客','連擊者','團滅製造機','補刀王','滅龍者','討債人','兇手'],guard:['龍車乘客','蓋房者','卡位者'],mage:['炸彈魔','怪物觀察員','魔王'],scout:['獵人','採集狂','甩尾職人','資深摸魚員','裝死高手','摸魚王'],hearty:['鍋邊探頭者','喝藥專家','營火管理員','躺贏者','廢人','爆肝者'],diplomat:['大村長','老闆','上班族','掛網者'],artisan:['研磨師','路邊撿垃圾者','工程師'],lucky:['掉寶觀測員','轉蛋大師','暴擊器'],wanderer:['路痴冒險者','菜鳥勇者','爆肝王','旅人','勇者','菜鳥']};
function stableIdentityHash(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function groupFor(groups,part){return Object.keys(groups).find(k=>groups[k].includes(part))||Object.keys(groups)[stableIdentityHash(part)%Object.keys(groups).length];}
function titleProfile(parts){
 const [a,b,c]=parts,role=VOCATIONS[groupFor(C_GROUPS,c)],bonus={};
 const sources=[{label:`風格 · ${a}`,bonus:A_BONUSES[groupFor(A_GROUPS,a)]},{label:`個性 · ${b}`,bonus:B_BONUSES[groupFor(B_GROUPS,b)]},{label:`身分 · ${c}`,bonus:role.bonus}];
 for(const source of sources)for(const [key,value] of Object.entries(source.bonus))bonus[key]=(bonus[key]||0)+value;
 return {role:role.name,bonus,sources,look:role.looks[stableIdentityHash(parts.join('|'))%role.looks.length]};
}
function bonusText(bonus){return Object.entries(bonus).map(([key,n])=>`${TITLE_STAT_LABELS[key]} +${n}${['baseDodge','baseTieWinRate','titleCritBonus'].includes(key)?'%':''}`).join('、');}
function drawPortrait(el,key,size){if(!el)return;const p=SCENE_PORTRAITS[key]||SCENE_PORTRAITS.iron;(p.atlas==='creatures'?creatureAt:spriteAt)(el,p.tile,size);el.dataset.portrait=p.id;el.dataset.portraitKind=p.kind;}
function eventPortraitKey(id){const cast=EVENT_CAST[id];return cast?cast[stableIdentityHash(`${adventure.runId}|${id}|${adventure.eventVisits[id]||0}`)%cast.length]:null;}
function currentIdentity(){return adventure.identity||{version:1,source:'legacy',parts:null,appearance:HERO_LOOKS[stableIdentityHash(hero.title||hero.name)%HERO_LOOKS.length].id};}
function applyStartingIdentity(parts,appearance='auto'){
 if(adventure.identity?.source==='new')return false;
 const profile=titleProfile(parts);adventure.identity={version:1,source:'new',parts:[...parts],appearance:appearance==='auto'?profile.look:appearance};
 for(const [key,value]of Object.entries(profile.bonus))hero[key]=(hero[key]||0)+value;
 hero.hp=hero.maxHp;return true;
}
function updateIdentityDisplay(){
 const id=currentIdentity(),portrait=HERO_LOOKS.find(p=>p.id===id.appearance)||HERO_LOOKS[0];
 drawPortrait(document.querySelector('.hero-portrait'),portrait.id,64);drawPortrait($('hero-actor').querySelector('.actor-sprite'),portrait.id,80);
 if($('hero-origin'))$('hero-origin').textContent=id.source==='new'?`${portrait.name} · ${bonusText(titleProfile(id.parts).bonus)}`:`${portrait.name} · 舊旅程數值保留`;
}
let titleDraft={parts:null,appearance:'auto'};
function flavorIndex(length){if(globalThis.crypto?.getRandomValues){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]%length;}return stableIdentityHash(`${Date.now()}|${performance.now()}`)%length;}
function resolveTitleParts(){
 const arrays=[TITLE_A,TITLE_B,TITLE_C];
 const parts=['titleA','titleB','titleC'].map((key,i)=>{const value=$(key).value;if(arrays[i].includes(value))return value;const chosen=arrays[i][flavorIndex(arrays[i].length)];$(key).value=chosen;return chosen;});
 titleDraft.parts=parts;return parts;
}
function refreshTitlePreview(){
 const parts=resolveTitleParts(),profile=titleProfile(parts),appearance=$('hero-look-select')?.value||'auto';titleDraft.appearance=appearance;
 const look=appearance==='auto'?profile.look:appearance;drawPortrait(document.querySelector('.welcome-hero'),look,112);drawPortrait($('creation-portrait'),look,64);
 $('creation-title').textContent=`${parts[0]}的${parts[1]}${parts[2]}`;$('creation-look-name').textContent=HERO_LOOKS.find(p=>p.id===look).name;
 $('creation-bonuses').innerHTML=profile.sources.map(s=>`<p><b>${escapeHtml(s.label)}</b><span>${escapeHtml(bonusText(s.bonus))}</span></p>`).join('');
 const final={...INITIAL_HERO};for(const [k,n]of Object.entries(profile.bonus))final[k]=(final[k]||0)+n;
 $('creation-totals').textContent=`起始 HP ${final.maxHp} · 攻擊 ${final.baseAttack} · 防禦 ${final.baseDefense} · 魔攻 ${final.baseMagicAtk} · 閃避 ${final.baseDodge}% · 爆擊 ${5+final.titleCritBonus}% · 平手 ${final.baseTieWinRate}%`;
}
function initIdentityUI(){
 const select=$('hero-look-select');select.innerHTML='<option value="auto">依稱號配對外觀</option>'+HERO_LOOKS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
 ['titleA','titleB','titleC','hero-look-select'].forEach(id=>$(id).addEventListener('change',refreshTitlePreview));
 $('btn-random-title').onclick=()=>{for(const [i,id] of ['titleA','titleB','titleC'].entries())$(id).value=[TITLE_A,TITLE_B,TITLE_C][i][flavorIndex([TITLE_A,TITLE_B,TITLE_C][i].length)];refreshTitlePreview();};
 $('btn-random-look').onclick=()=>{select.value=HERO_LOOKS[flavorIndex(HERO_LOOKS.length)].id;refreshTitlePreview();};
 $('btn-identity').onclick=()=>{renderWardrobe();$('identity-dialog').showModal();};
 const body=document.querySelector('.welcome-body'),scroll=document.createElement('div'),actions=document.createElement('div');scroll.className='welcome-scroll';actions.className='welcome-actions';
 actions.append($('btn-continue'),$('btn-new-game'));while(body.firstChild)scroll.append(body.firstChild);body.append(scroll,actions);
 $('new-title-details').addEventListener('toggle',()=>{$('btn-new-game').hidden=!$('new-title-details').open;});
 refreshTitlePreview();updateIdentityDisplay();
}
function renderWardrobe(){
 const id=currentIdentity();$('identity-description').textContent=id.source==='new'?`這次旅程的稱號底子：${bonusText(titleProfile(id.parts).bonus)}。開局時已加入基礎數值，換造型、讀檔不會重複加成。`:'這是更新前的旅程：等級、HP、裝備與基礎數值全部保持原樣。新稱號加成只在開始新旅程時套用，現在可以免費換造型。';
 $('wardrobe-grid').replaceChildren();for(const look of HERO_LOOKS){const button=document.createElement('button');button.className='look-choice';button.setAttribute('aria-pressed',String(look.id===id.appearance));button.dataset.look=look.id;const art=document.createElement('span');art.className='sprite';art.setAttribute('aria-hidden','true');drawPortrait(art,look.id,48);const label=document.createElement('span');label.textContent=look.name;button.append(art,label);button.onclick=()=>{if(!STABLE_PHASES.includes(gameState)||!$('identity-dialog').open)return;adventure.identity={...currentIdentity(),appearance:look.id};updateIdentityDisplay();saveAuto();renderWardrobe();};$('wardrobe-grid').append(button);}
}
