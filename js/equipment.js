/* Read-only equipment previews and loss-aware confirmation. No salvage or RNG in previews. */
const EQUIP_STATS=[['atk','攻擊'],['def','防禦／盾擊'],['matk','魔攻'],['dodge','閃避 %'],['crit','爆擊 %'],['tie','平手勝率 %']];
function affixLines(ids,type,empty='無詞條'){
 const pool=type==='WEAPON'?WEAPON_AFFIX_POOL:SHIELD_AFFIX_POOL;
 const unique=[...new Set(ids||[])];
 return unique.length?unique.map(id=>{const a=findAffix(pool,id);return a?`<span class="affix-effect"><b>${escapeHtml(a.name)}</b><span>${escapeHtml(a.desc)}</span></span>`:'';}).join(''):`<span class="affix-empty">${escapeHtml(empty)}</span>`;
}
function equipClone(value){const clone=JSON.parse(JSON.stringify(value));if(clone.equipment)restoreRingAbility(clone.equipment.RING);if(clone.type==='RING'||clone.ability)restoreRingAbility(clone);return clone;}
function withHeroStats(target){
 const actual=hero;
 try{hero=target;calculateHeroStats();return {atk:hero.currentAttack,def:hero.currentDefense,matk:getMagicAttackValue(),dodge:hero.currentDodge,crit:getHeroCritRate(),tie:hero.currentTieWinRate};}
 finally{hero=actual;}
}
function equipmentComparison(loot){
 const current=hero.equipment[loot.type],beforeHero=equipClone(hero),afterHero=equipClone(hero),newItem=equipClone(loot);
 const sameRing=loot.type==='RING'&&current.ability.id!=='NONE'&&current.ability.id===loot.ability.id;
 if(sameRing){const ring=afterHero.equipment.RING;ring.tier=Math.min(4,Math.max(current.tier+(current.tier<4?1:0),loot.tier));if(RARITY_ORDER.indexOf(loot.rarity)>RARITY_ORDER.indexOf(ring.rarity))ring.rarity=loot.rarity;}
 else{if(loot.type==='WEAPON')newItem.affixes=[...new Set([...(newItem.affixes||[]),...(current.affixes||[])])];afterHero.equipment[loot.type]=newItem;}
 const before=withHeroStats(beforeHero),after=withHeroStats(afterHero),reasons=[];
 for(const [id,label] of EQUIP_STATS){if(after[id]<before[id]-.001)reasons.push(`${label} ${formatStat(before[id])} → ${formatStat(after[id])}（${formatStat(after[id]-before[id])}）`);}
 if(!sameRing&&RARITY_ORDER.indexOf(loot.rarity)<RARITY_ORDER.indexOf(current.rarity))reasons.push(`稀有度 ${RARITY_NAMES[current.rarity]} → ${RARITY_NAMES[loot.rarity]}`);
 if(loot.type==='SHIELD'){
  if((current.refine||0)>(loot.refine||0))reasons.push(`盾牌精練 +${current.refine} → +${loot.refine||0}`);
  for(const id of current.affixes||[])if(!(loot.affixes||[]).includes(id)){const a=findAffix(SHIELD_AFFIX_POOL,id);if(a)reasons.push(`失去「${a.name}」：${a.desc}`);}
 }
 if(loot.type==='RING'&&!sameRing&&current.ability.id!=='NONE'){
  reasons.push(`失去原戒指能力「${current.name} Lv.${current.tier}」：${current.ability.desc}`);
  if(loot.tier<current.tier)reasons.push(`戒指等級 Lv.${current.tier} → Lv.${loot.tier}`);
 }
 return {before,after,reasons,risky:reasons.length>0,sameRing};
}
function formatStat(n){return Number(n.toFixed(1)).toString();}
function comparisonMarkup(c){
 return `<section class="equip-impact ${c.risky?'has-risk':''}" aria-label="換裝能力比較"><h3>${c.risky?'⚠ 這次換裝有能力下降或效果損失':'換上後的角色能力'}</h3><div class="impact-table"><div class="impact-head"><span>能力</span><span>目前</span><span>換上後</span><span>變化</span></div>${EQUIP_STATS.map(([id,label])=>{const delta=c.after[id]-c.before[id];return `<div class="impact-row ${delta<-.001?'loss':delta>.001?'gain':''}"><span>${label}</span><span>${formatStat(c.before[id])}</span><span>${formatStat(c.after[id])}</span><b>${delta>0?'+':''}${formatStat(delta)}</b></div>`;}).join('')}</div>${c.reasons.length?`<div class="risk-reasons">${c.reasons.map(t=>`<p>⚠ ${escapeHtml(t)}</p>`).join('')}</div>`:''}<p class="impact-footnote">以上按目前 HP／增益與換裝後的裝備計算，尚未加入分解舊裝備後可能產生的自動精練。詞條不是只看攻擊數字就能判斷好壞。</p></section>`;
}
function confirmEquipmentLoss(loot,c){
 if(!c.risky)return true;
 const text=`⚠ 要放棄目前的好裝備嗎？\n\n${hero.equipment[loot.type].name} → ${loot.name}\n\n${c.reasons.join('\n')}\n\n${loot.type==='RING'?'原戒指將換成金幣':'原裝備將被分解，不能直接換回'}。\n按「取消」保留現況並返回比較；確定仍要換上才按「確定」。`;
 return window.confirm(text);
}
