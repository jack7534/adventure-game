/* Strict additive save fields. Older v2/v2.1/v2.2 journeys keep their stats and equipment. */
function cleanExpedition(input){
 if(input==null)return null;const e=validObject(input);if(e.version!==1)throw new Error('旅程規則版本無效');
 const out={version:1,seed:validNumber(e.seed,1,4294967295),rng:validNumber(e.rng,1,4294967295),chapter:validNumber(e.chapter,1,5),depth:validNumber(e.depth),clues:validNumber(e.clues,0,8),generation:validNumber(e.generation),potions:validNumber(e.potions,0,5),antidotes:validNumber(e.antidotes,0,5),pendingIntro:validBool(e.pendingIntro),flags:{},choices:[],relics:[],relicOffers:[],recent:[],history:[],lastRoute:e.lastRoute??null,weather:e.weather??null,place:e.place??null,social:cleanSocial(e.social)};
 if(out.place!==null&&!Object.hasOwn(WORLD_PLACES,out.place))throw Error("地點無效");
 if(out.weather!==null&&!RUN_WEATHER.some(w=>w.id===out.weather))throw new Error('天氣資料無效');if(out.lastRoute!==null&&!Object.hasOwn(ROUTE_KINDS,out.lastRoute))throw new Error('路線類型無效');
 if(!Array.isArray(e.choices)||e.choices.length>3)throw new Error('路線選項無效');
 out.choices=e.choices.map(c=>{if(!Object.hasOwn(ROUTE_KINDS,c.kind))throw new Error('路線類型無效');return {kind:c.kind,id:validText(c.id,80),flavor:validNumber(c.flavor,0,3)};});
 for(const [key,limit]of [['relics',5],['relicOffers',3]]){if(!Array.isArray(e[key])||e[key].length>limit||new Set(e[key]).size!==e[key].length||e[key].some(id=>!Object.hasOwn(RUN_RELICS,id)))throw new Error('奇物資料無效');out[key]=[...e[key]];}
 if(!Array.isArray(e.recent)||e.recent.length>5||e.recent.some(id=>!Object.hasOwn(EVENTS,id)))throw new Error('遭遇紀錄無效');out.recent=[...e.recent];
 if(!Array.isArray(e.history)||e.history.length>120||e.history.some(v=>typeof v!=='string'||!/^([1-5]):(battle|event|elite|treasure|rest|relic)$/.test(v)))throw new Error('路程紀錄無效');out.history=[...e.history];
 if(e.flags?.chickenLoan!=null)out.flags.chickenLoan=validNumber(e.flags.chickenLoan);if(e.flags?.chickenDone!=null)out.flags.chickenDone=validBool(e.flags.chickenDone);
 return out;
}
function cleanBossState(input){
 if(input==null)return null;const s=validObject(input);if(!BOSS_DESIGNS.some(b=>b.id===s.id))throw new Error('首領機制無效');
 if(s.lastMove!=null&&!Object.hasOwn(MOVE_NAMES,s.lastMove))throw new Error('前次招式無效');
 if(!Array.isArray(s.sealMoves)||s.sealMoves.length>3||new Set(s.sealMoves).size!==s.sealMoves.length||s.sealMoves.some(m=>!Object.hasOwn(MOVE_NAMES,m)))throw new Error('破印資料無效');
 const out={id:s.id,ward:validNumber(s.ward,0,3),exposed:validNumber(s.exposed,0,4),lastMove:s.lastMove??null,repeats:validNumber(s.repeats),phase:validNumber(s.phase,1,2),charge:validNumber(s.charge,0,5),sealMoves:[...s.sealMoves],staggered:validBool(s.staggered)};
 if(s.resist!=null){if(!Object.hasOwn(MOVE_NAMES,s.resist)||!Object.hasOwn(MOVE_NAMES,s.weak))throw new Error('首領抗性無效');out.resist=s.resist;out.weak=s.weak;}
 if(s.plan){if(!['normal','siphon','charge','inferno','recover','venom','armor','stamp','seal','judgment'].includes(s.plan.kind))throw new Error('首領預告無效');if(s.plan.counter!=null&&!['⚔️','🌠','🛡️','GUARD','SEQUENCE','DIFFERENT'].includes(s.plan.counter))throw new Error('應對招式無效');out.plan={kind:s.plan.kind,title:validText(s.plan.title,150),hint:validText(s.plan.hint,400),counter:s.plan.counter??null};}
 return out;
}
function migrateExpeditionOnLoad(){
 ensureExpedition();if(bossLevel<=ENEMIES.BOSS.length){adventure.pendingEnding=false;if(gameState==='CREDITS'){gameState='MAP';adventure.expedition.pendingIntro=true;adventure.clearRecorded=false;log('📜 原來和平只有試用期：新增第四、第五章已接上，原裝備與等級全保留。');}}
 if(gameState==='BATTLE')initBossState();
}
