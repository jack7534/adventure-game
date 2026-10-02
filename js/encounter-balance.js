/* Snapshot medium/late encounters once at spawn. No RNG, live combat recalculation or boss changes. */
function encounterHeroProfile(){
 const original=hero;
 try{
  hero=equipClone(original);hero.hp=hero.maxHp;hero.defDownTurns=hero.defDownRate=0;calculateHeroStats();
  const ring=hero.equipment.RING,w=getAllWeaponAffixSet(),level=hero.level;
  let hits=1;if(ring.ability.id==='BERSERKER')hits+=(BERSERKER_MULTI_HIT_CHANCE[ring.tier]||0)*(1+(BERSERKER_THIRD_HIT_CHANCE[ring.tier]||0));
  if(w.has('W_EXTRA_HIT'))hits+=.2;if(w.has('W_RAGE'))hits+=.1;
  const p={level,hp:hero.maxHp,atk:hero.currentAttack,def:hero.currentDefense,magic:getMagicAttackValue(),crit:getHeroCritChance(),hits:Math.min(2.8,hits),veteran:w.has('W_VETERAN'),pierce:w.has('W_ARMOR_PEN'),petDamage:0,petRecovery:0};
  const pets=adventure.pets,owned=pets?.owned||[],order=pets?.order||[];
  const ids=order.filter(id=>owned.includes(id)).slice(0,petCapacity(ring));
  if(!pets&&adventure.flags.fox)ids.push('fox');
  const strength=petStrength();
  for(const id of ids){
   if(id==='fox')p.petDamage+=p.atk*.25/3;
   if(id==='wolf')p.petDamage+=p.atk*.3/3;
   if(id==='ember')p.petDamage+=p.magic*.38/4;
   if(id==='griffin')p.petDamage+=(p.atk*.28+p.magic*.12)*1.2/4;
   if(id==='rabbit')p.petRecovery+=p.hp*.05/4;
   if(id==='turtle')p.petRecovery+=(p.hp*.08+p.def*.12)/4;
  }
  p.petDamage*=strength;p.petRecovery*=strength;return p;
 }finally{hero=original;}
}
function scaleSmallEncounter(enemy,archetype,zone,elite=false){
 const p=encounterHeroProfile();if(zone===0&&p.level<8)return {...enemy};
 const blend=zone>0?Math.max(.35,Math.min(1,(p.level-5)/10)):Math.max(.15,Math.min(1,(p.level-7)/8));
 const reference=20+p.level*4,anchor=Math.max(p.atk,p.magic,p.def,1);
 const softAnchor=reference*Math.pow(Math.max(.2,anchor/reference),.65);
 const base=archetype||{hp:45,def:14,mDef:14};
 const defense=(key)=>Math.min(softAnchor*(elite?.8:.68),base[key]*(1+(p.level-1)*.045)+softAnchor*.10*Math.pow(Math.max(.1,base[key]/12),.7));
 const out={...enemy};for(const key of ['def','mDef'])out[key]=Math.round(Math.max(enemy[key],enemy[key]*(1-blend)+defense(key)*blend));
 const sword=(Math.max(1,p.atk-out.def*(p.pierce?.7:1))*(1+p.crit)+(p.veteran?p.magic*.30:0))*p.hits;
 const magic=Math.max(1,p.magic-out.mDef),shield=Math.max(1,p.def)*(enemy.name==='石頭人'?2:1)*p.hits;
 const options=[sword,magic,shield].sort((a,b)=>b-a);
 const output=options[0]*.65+options[1]*.35+p.petDamage*.9;
 const softOutput=reference*Math.pow(Math.max(.2,output/reference),.72);
 const body=elite?1:Math.max(.82,Math.min(1.18,.65+base.hp/90));
 const hpTarget=softOutput*(elite?6.1:3.5+zone*.18)*body;
 out.hp=Math.round(Math.max(enemy.hp,enemy.hp*(1-blend)+hpTarget*blend));
 const pressure=p.hp*(elite?.285:.20+zone*.012)+Math.min(p.hp*.025,p.petRecovery*.35);
 const attackTarget=Math.max(p.def+p.hp*(elite?.085:.045),p.def*.94+pressure);
 const upper=p.def+p.hp*(elite?.43:.30);
 out.atk=Math.round(Math.min(upper,Math.max(enemy.atk,p.def+(attackTarget-p.def)*blend)));
 for(const key of ['hp','atk','def','mDef'])out[key]=Math.min(1e7,Math.max(key==='hp'?1:0,out[key]));
 out.adaptiveLevel=p.level;return out;
}
