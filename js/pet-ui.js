/* All party changes are camp-only. Inspecting the panel never consumes gold or a reward. */
let petPanelToken=0,petPurchaseUntil=0;
function openPets(){if(gameState==='TITLE')return;renderPetPanel();$('pets-dialog').showModal();$('pets-dialog').scrollTop=0;}
function renderPetPanel(){
 const p=ensurePets(),active=activePetIds(),token=++petPanelToken,canEdit=gameState==='MAP',lock=Date.now()<petPurchaseUntil;
 $('pet-capacity').textContent=`出戰 ${active.length}/${petCapacity()} · 已結識 ${p.owned.length}/8 · 金幣 ${adventure.gold}`;
 $('pet-mode-note').textContent=canEdit?'調整出戰或領養夥伴。換掉馭獸戒指後，超出位數的寵物只會休息，不會消失。':'現在可查看能力；完成戰鬥、事件或裝備選擇，回到營地才能調整／購買。';
 $('beast-ring-description').textContent=BEAST_RING.desc;
 const ringButton=$('buy-beast-ring');ringButton.disabled=!canEdit||lock||adventure.gold<32||(beastTier()===4);ringButton.textContent=beastTier()===4?'馭獸戒指已滿級':'32 金幣 · 取得馭獸戒指 Lv.1';ringButton.onclick=()=>buyBeastRing(token);
 const grid=$('pet-catalog');grid.replaceChildren();
 for(const [id,pet]of Object.entries(PET_CATALOG)){
  const owned=p.owned.includes(id),selected=p.order.includes(id),out=active.includes(id),available=bossLevel>=pet.chapter;
  const card=document.createElement('article');card.className=`pet-card ${out?'pet-active':''}`;card.dataset.petCard=id;
  const header=document.createElement('div');header.className='pet-card-head';const art=document.createElement('span');art.className='sprite';drawPet(art,id,48);const name=document.createElement('div');name.innerHTML=`<strong>${escapeHtml(pet.name)}</strong><small>${pet.role} · ${out?'出戰中':selected?'候補／位數不足':owned?'休息中':`第 ${pet.chapter} 章可結識`}</small>`;header.append(art,name);card.append(header);
  const description=document.createElement('p');description.textContent=pet.desc;card.append(description);
  const stats=document.createElement('small');stats.className='pet-current';stats.textContent=['fox','wolf','ember','griffin'].includes(id)?`目前基準傷害 ${petValue(id)}（首領抗性另計）`:id==='rabbit'?`目前每次回復 ${petValue(id)} HP`:id==='turtle'?`目前每次護盾 ${petValue(id)} 點`:'偵察／淨化頻率不受戒指強度倍率影響';card.append(stats);
  const button=document.createElement('button');button.className='secondary';button.dataset.petAction=id;
  if(owned){button.textContent=selected?(out?'讓牠休息':'取消候補'):'加入出戰';button.disabled=!canEdit||(!selected&&p.order.length>=petCapacity());button.onclick=()=>togglePet(id,token);}
  else{button.textContent=id==='fox'?'探索時救下小狐狸':available?`${pet.price} 金幣 · 領養`:`第 ${pet.chapter} 章開放`;button.disabled=!canEdit||lock||id==='fox'||!available||adventure.gold<pet.price;button.onclick=()=>buyPet(id,token);}
  card.append(button);grid.append(card);
 }
}
function togglePet(id,token){const p=ensurePets();if(gameState!=='MAP'||!$('pets-dialog').open||token!==petPanelToken||!p.owned.includes(id))return false;const i=p.order.indexOf(id);if(i>=0)p.order.splice(i,1);else{if(p.order.length>=petCapacity())return false;p.order.push(id);}updateStatus();saveAuto();renderPetPanel();return true;}
function buyPet(id,token){const pet=PET_CATALOG[id],p=ensurePets();if(gameState!=='MAP'||!$('pets-dialog').open||token!==petPanelToken||Date.now()<petPurchaseUntil||!pet||id==='fox'||p.owned.includes(id)||bossLevel<pet.chapter||adventure.gold<pet.price)return false;
 petPanelToken++;petPurchaseUntil=Date.now()+450;adventure.gold-=pet.price;adoptPet(id);updateStatus();saveAuto();renderPetPanel();const epoch=sessionEpoch;setTimeout(()=>{if(epoch===sessionEpoch&&$('pets-dialog').open)renderPetPanel();},480);return true;
}
function buyBeastRing(token){if(gameState!=='MAP'||!$('pets-dialog').open||token!==petPanelToken||Date.now()<petPurchaseUntil||newLoot||adventure.gold<32||beastTier()===4)return false;petPanelToken++;adventure.gold-=32;$('pets-dialog').close();offerLoot({type:'RING',name:BEAST_RING.name,ability:BEAST_RING,tier:1,rarity:'Rare'});updateStatus();saveAuto();revealCurrentContent();return true;}
function initPetsUI(){
 const dialog=document.createElement('dialog');dialog.id='pets-dialog';dialog.className='modal pets-modal';
 dialog.innerHTML='<div class="modal-top"><div><span class="eyebrow">BEASTKEEPERS GUILD</span><h2>寵物與馭獸公會</h2></div><button class="close-button" aria-label="關閉寵物視窗">×</button></div><div class="modal-body"><strong id="pet-capacity"></strong><p id="pet-mode-note" class="muted"></p><section class="beast-contract"><h3>馭獸契約戒指</h3><p id="beast-ring-description"></p><button id="buy-beast-ring" class="secondary"></button><small>取得後仍會進入裝備比較；同能力戒指沿用融合升級，最高 Lv.4。寵物不綁外觀，任何造型都能玩馭獸流。</small></section><div id="pet-catalog"></div><p class="storage-note">同種寵物只能擁有一位。可收集八種，依戒指位數挑選出戰組合；未出戰的不提供戰鬥、尋寶或逃跑加成。本版為支援型寵物，不另外計算寵物受擊或死亡。換裝警告會提醒出戰位減少。</p></div>';
 document.body.append(dialog);dialog.querySelector('.close-button').onclick=()=>dialog.close();
 const party=document.createElement('div');party.id='pet-party';party.className='pet-party';party.setAttribute('aria-label','出戰寵物');$('stage').append(party);
 const tools=document.querySelector('.dock-tools'),button=document.createElement('button');button.id='btn-dock-pets';button.className='text-button';button.textContent='寵物';button.onclick=openPets;tools.insertBefore(button,$('btn-dock-audio'));
 const campLink=document.createElement('button');campLink.id='btn-camp-pets';campLink.className='secondary';campLink.textContent='🐾 寵物編隊／馭獸公會';campLink.onclick=()=>{$('camp-dialog').close();openPets();};$('camp-pet').after(campLink);
 $('camp-dialog').querySelector('.section-label').textContent='寵物隊伍';renderPetSummary();
}
function preparePetEncounter(id){if(id!=='beast_guild')return;const p=ensurePets();if(p.offer)return;const pool=Object.keys(PET_CATALOG).filter(id=>id!=='fox'&&!p.owned.includes(id)&&PET_CATALOG[id].chapter<=bossLevel);p.offer=pool.length?runPick(pool):null;}
EVENTS.beast_guild={title:'馭獸師公會，今天也是毛茸茸的一天',tag:'馭獸流派',object:88,text:'馭獸師把契約推到你面前：「牠們不是裝備，是會搶你晚餐的同伴。」桌下傳來一致同意的叫聲。',choices:()=>{
 const id=ensurePets().offer,pet=id&&PET_CATALOG[id];return [
 choice('簽下馭獸契約','24 金幣 · 馭獸戒指 Lv.1',()=>{adventure.gold-=24;ensurePets().offer=null;offerLoot({type:'RING',name:BEAST_RING.name,ability:BEAST_RING,tier:1,rarity:'Rare'});},()=>adventure.gold>=24),
 choice(pet?`照顧${pet.name}`:'交流照養心得',pet?'8 金幣 · 結識這位寵物':'已結識目前章節的夥伴 · 回復 15% HP',()=>{if(pet){adventure.gold-=8;adoptPet(id);ensurePets().offer=null;resultEvent('牠決定把你的背包當第二個家',`${pet.name} 已加入名冊。回營地打開「寵物」選擇出戰；${pet.desc}`,88);}else{healFraction(.15);resultEvent('養寵物的第一守則：先把自己餵飽','回復 15% HP。這是公會最認真的建議。',88);}},()=>!pet||adventure.gold>=8),
 choice('一起分享點心','免費 · 回復 15% HP',()=>{ensurePets().offer=null;healFraction(.15);resultEvent('點心瞬間消失了，友情增加了','回復 15% HP。下次要記得把自己的那一份先藏好。',88);})];}};
EVENT_CAST.beast_guild=['beast_warden','beast_shaman','falconer'];
