/* Pet build: each companion acts once per round, without recursive equipment procs. */
const PET_CATALOG={
 fox:{name:'嘴硬的小狐狸',role:'尋寶／夾擊',icon:'🦊',atlas:'expansion',tile:16,period:3,chapter:1,price:0,desc:'每 3 回合追加 ATK 25% 傷害；出戰時每次勝利 +2 金幣。透過狐狸事件結識。'},
 wolf:{name:'灰牙幼狼',role:'物理追擊',icon:'🐺',tile:23,period:3,chapter:1,price:20,desc:'每 3 回合撲咬：ATK 30% − 敵人物防 18%，至少 2 點。'},
 owl:{name:'夜眼小鴞',role:'偵察',icon:'🦉',tile:130,period:4,chapter:1,price:18,desc:'每 4 回合偵察，公開下一回合敵人的出招；不會代替你破解首領機制。'},
 rabbit:{name:'藥草長耳兔',role:'治療',icon:'🐇',tile:177,period:4,chapter:1,price:20,desc:'每 4 回合回復最大 HP 的 5%，至少 2 點；不能復活玩家。'},
 turtle:{name:'苔甲小龜',role:'防護',icon:'🐢',tile:149,period:4,chapter:2,price:28,desc:'每 4 回合建立護盾：最大 HP 8% + DEF 12%。抵擋受擊，維持 4 回合，不疊加。'},
 deer:{name:'淨露幼鹿',role:'淨化',icon:'🦌',tile:161,period:4,chapter:2,price:30,desc:'每 4 回合解除 1 層毒，縮短 1 回合灼燒；重毒仍需要解毒藥。'},
 ember:{name:'火絨幼龍',role:'魔法攻擊',icon:'🔥',tile:33,period:4,chapter:3,price:40,desc:'每 4 回合火球：MATK 38% − 敵人魔防 18%，至少 2 點。'},
 griffin:{name:'破風幼獅鷲',role:'收尾追獵',icon:'🪽',tile:104,period:4,chapter:4,price:55,desc:'每 4 回合俯衝：ATK 28% + MATK 12%；敵人 HP 不高於 40% 時，這次傷害 ×1.6。'}
};
const BEAST_RING={id:'BEASTMASTER',name:'馭獸契約戒指',desc:'馭獸流派：Lv.1／2／3／4 可帶 2／3／4／4 隻寵物，寵物傷害、治療、護盾強度 +0／10／20／30%。不改變淨化層數、偵察頻率或尋寶金幣。',effect:tier=>[1,2,3,4,4][tier]||1};
RING_ABILITIES.splice(RING_ABILITIES.findIndex(r=>r.id==='NONE'),0,BEAST_RING);
function beastTier(){return hero.equipment.RING.ability?.id==='BEASTMASTER'?hero.equipment.RING.tier:0;}
function petCapacity(ring=hero.equipment.RING){return ring.ability?.id==='BEASTMASTER'?[1,2,3,4,4][ring.tier]||1:1;}
function petStrength(){return 1+([0,0,.1,.2,.3][beastTier()]||0);}
function ensurePets(){
 if(!adventure.pets)adventure.pets={version:1,owned:[],order:[],offer:null};const p=adventure.pets;
 if(adventure.flags.fox&&!p.owned.includes('fox')){p.owned.unshift('fox');if(p.order.length<petCapacity())p.order.unshift('fox');}
 return p;
}
function activePetIds(){const p=ensurePets();return p.order.filter(id=>p.owned.includes(id)).slice(0,petCapacity());}
function petBattleState(){const b=adventure.battle;if(!b)return null;b.pets??={lastRound:0,shield:0,shieldUntil:0,revealRound:0};return b.pets;}
function petGoldBonus(){return activePetIds().includes('fox')?2:0;}
function petValue(id){const p=PET_CATALOG[id],s=petStrength();if(!p)return 0;
 if(id==='fox')return Math.max(2,Math.floor(hero.currentAttack*.25*s));
 if(id==='wolf')return Math.max(2,Math.floor((hero.currentAttack*.3-(currentEnemy?.def||0)*.18)*s));
 if(id==='rabbit')return Math.max(2,Math.floor(hero.maxHp*.05*s));
 if(id==='turtle')return Math.max(2,Math.floor((hero.maxHp*.08+hero.currentDefense*.12)*s));
 if(id==='ember')return Math.max(2,Math.floor((getMagicAttackValue()*.38-(currentEnemy?.mDef||0)*.18)*s));
 if(id==='griffin')return Math.max(2,Math.floor((hero.currentAttack*.28+getMagicAttackValue()*.12)*s*(currentEnemy&&currentEnemy.hp<=currentEnemy.originalHp*.4?1.6:1)));
 return 0;
}
function petHasReveal(){return !!adventure.battle&&activePetIds().includes('owl')&&adventure.battle.pets?.revealRound===adventure.battle.round;}
function petShieldDamage(damage){const s=adventure.battle?.pets;if(!s||s.shield<=0)return damage;if(adventure.battle.round>s.shieldUntil){s.shield=0;return damage;}
 const n=Math.min(damage,s.shield);s.shield-=n;log(`🐢 苔甲護盾吸收 ${n} 傷害，剩餘 ${s.shield}。`);return damage-n;
}
function runPetRound(){
 const b=adventure.battle;if(!b||b.settled||gameState!=='BATTLE_ACTION'||hero.hp<=0||!currentEnemy||currentEnemy.hp<=0)return 0;
 const state=petBattleState();if(state.lastRound===b.round)return 0;state.lastRound=b.round;let total=0;
 for(const id of activePetIds()){
  if(hero.hp<=0||currentEnemy.hp<=0)break;const p=PET_CATALOG[id];if(b.round%p.period!==0||(id==='fox'&&b.petAssistRound===b.round))continue;const value=petValue(id);
  if(['fox','wolf','ember','griffin'].includes(id)){
   let n;if(id==='fox'){n=Math.min(currentEnemy.hp,value);currentEnemy.hp-=n;b.petAssistRound=b.round;}else n=dealToEnemy(value,'PET');total+=n;
   log(`${p.icon} ${p.name}【${p.role}】造成 ${n} 傷害。`);floatingNumber(`${p.icon} −${n}`);
  }else if(id==='rabbit'){const n=Math.min(hero.maxHp-hero.hp,value);hero.hp+=n;if(n){log(`🐇 長耳兔送來藥草，回復 ${n} HP。`);flashBattleView('heal');}}
  else if(id==='turtle'){state.shield=Math.max(state.shield,value);state.shieldUntil=b.round+4;log(`🐢 苔甲小龜建立 ${state.shield} 點護盾，不與舊盾相加。`);}
  else if(id==='deer'){const poison=hero.poisonStacks||0,burn=hero.burnTurns;hero.poisonStacks=Math.max(0,poison-1);hero.burnTurns=Math.max(0,burn-1);if(!hero.burnTurns)hero.burnDamage=0;if(poison||burn)log('🦌 淨露幼鹿：毒 −1 層、灼燒 −1 回合。');}
  else if(id==='owl'){state.revealRound=b.round+1;log(`🦉 夜眼小鴞已偵察：第 ${state.revealRound} 回合的敵人出招將公開。`);}
  const sprite=document.querySelector(`[data-party-pet="${id}"]`);if(sprite)animateClass(sprite,'pet-strike',400);
 }
 return total;
}
function drawPet(el,id,size=40){const p=PET_CATALOG[id];if(!p)return;(p.atlas==='expansion'?expansionAt:creatureAt)(el,p.tile,size);el.dataset.pet=id;el.title=`${p.name}｜${p.desc}`;}
function renderPetParty(){const box=$('pet-party');if(!box)return;const ids=activePetIds();$('companion-actor').hidden=true;const key=ids.join('|');box.hidden=gameState==='TITLE'||!ids.length;box.dataset.count=ids.length;
 if(box.dataset.squad===key)return;box.dataset.squad=key;box.replaceChildren();for(const id of ids){const el=document.createElement('span');el.className='sprite party-pet';el.dataset.partyPet=id;el.setAttribute('role','img');el.setAttribute('aria-label',PET_CATALOG[id].name);drawPet(el,id,40);box.append(el);}
}
function renderPetSummary(){
 const el=$('companion-note');if(!el)return;const p=ensurePets(),ids=activePetIds();
 el.innerHTML=`<strong>🐾 ${beastTier()?`馭獸師 Lv.${beastTier()}`:'旅途寵物'} · 出戰 ${ids.length}/${petCapacity()}</strong>${ids.length?ids.map(id=>`<span><b>${escapeHtml(PET_CATALOG[id].name)}</b> · ${PET_CATALOG[id].role}<small>${escapeHtml(PET_CATALOG[id].desc)}</small></span>`).join(''):'<span>救下小狐狸，或到「寵物・馭獸公會」結識新的夥伴。</span>'}<small>已結識 ${p.owned.length}/8 種。寵物不觸發武器連擊；主人倒下時不會復活或繼續追擊。</small>`;
 renderPetParty();
}
function cleanPets(value){
 if(value==null)return null;const p=validObject(value);if(p.version!==1)throw new Error('寵物版本無效');
 for(const [key,max]of [['owned',8],['order',4]]){if(!Array.isArray(p[key])||p[key].length>max||new Set(p[key]).size!==p[key].length||p[key].some(id=>!Object.hasOwn(PET_CATALOG,id)))throw new Error('寵物名冊無效');}
 if(p.order.some(id=>!p.owned.includes(id)))throw new Error('出戰寵物尚未結識');if(p.offer!=null&&!Object.hasOwn(PET_CATALOG,p.offer))throw new Error('領養對象無效');
 return {version:1,owned:[...p.owned],order:[...p.order],offer:p.offer??null};
}
function cleanPetBattle(value,round){
 if(value==null)return null;const s=validObject(value);
 return {lastRound:validNumber(s.lastRound,0,round),shield:validNumber(s.shield,0,1e7),shieldUntil:validNumber(s.shieldUntil,0,round+4),revealRound:validNumber(s.revealRound,0,round+1)};
}
function adoptPet(id){const p=ensurePets();if(!Object.hasOwn(PET_CATALOG,id)||p.owned.includes(id))return false;p.owned.push(id);if(p.order.length<petCapacity())p.order.push(id);log(`🐾 ${PET_CATALOG[id].name} 加入名冊！可在營地調整出戰。`);return true;}
