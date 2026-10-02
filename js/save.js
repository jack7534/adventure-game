/* Versioned local saves. Imported data is validated before any live state is changed. */
const SAVE_KEY='jack-adventure.save.v2';
const BACKUP_KEY=SAVE_KEY+'.backup', CHECKPOINT_KEY=SAVE_KEY+'.camp', RECORD_KEY='jack-adventure.clears.v2';
let saveWarningShown=false;
function saveError(message){$('save-indicator').textContent='⚠ 本機存檔未成功，請匯出備份';$('save-indicator').classList.add('warning');if(!saveWarningShown){toast(message,true);saveWarningShown=true;}}
function validNumber(v,min=0,max=10000000,integer=true){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw new Error('存檔含有不合理的數值');return v;}
function validText(v,max=200){if(typeof v!=='string'||v.length>max)throw new Error('存檔文字格式錯誤');return v;}
function validBool(v){if(typeof v!=='boolean')throw new Error('存檔狀態格式錯誤');return v;}
function validObject(v){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('存檔結構不完整');return v;}
function validAffixes(value,pool){if(!Array.isArray(value)||value.length>12||value.some(id=>!pool.some(a=>a.id===id)))throw new Error('存檔裝備詞條無效');const ids=[...new Set(value)];if(ids.some(id=>{const a=pool.find(a=>a.id===id);return a.prereq&&!ids.includes(a.prereq);}))throw new Error('存檔詞條缺少前置效果');return ids;}
function cleanEquipment(value,type){
 const e=validObject(value);if(!RARITY_ORDER.includes(e.rarity))throw new Error('裝備稀有度無效');
 const out={type,name:validText(e.name,120),rarity:e.rarity};if(e.uid!=null)out.uid=validNumber(e.uid,1);
 if(type==='RING'){const id=e.ability?.id||e.abilityId,ability=RING_ABILITIES.find(a=>a.id===id);if(!ability)throw new Error('未知的戒指能力');out.ability=ability;out.tier=validNumber(e.tier,id==='NONE'?0:1,id==='NONE'?0:4);}
 else{out.power=validNumber(e.power);out.refine=validNumber(e.refine??0,0,10000);out.refineSlots=validNumber(e.refineSlots??0,0,10000);out.affixes=validAffixes(e.affixes||[],type==='WEAPON'?WEAPON_AFFIX_POOL:SHIELD_AFFIX_POOL);}
 return out;
}
function cleanHero(input){
 const value=validObject(input),out={};
 for(const [key,def]of Object.entries(INITIAL_HERO)){
  if(typeof def==='number')out[key]=validNumber(['titleCritBonus','poisonStacks'].includes(key)?(value[key]??0):value[key],0,key==='expToNextLevel'?1e12:1e7,!['berserkerBonus','berserkerPenalty','healRingDefBonus','currentDodge','dodgeOverflow','currentTieWinRate','buffDamageUpRate','defDownRate'].includes(key));
 }
 validNumber(out.titleCritBonus,0,5);validNumber(out.poisonStacks,0,5);
 out.name=validText(value.name,160);out.title=validText(value.title,160);
 validNumber(out.level,1,MAX_LEVEL);validNumber(out.highestLevel,out.level,MAX_LEVEL);validNumber(out.maxHp,1,1e7);validNumber(out.hp,1,out.maxHp);validNumber(out.expToNextLevel,1,1e12);if(out.exp>=out.expToNextLevel)throw new Error('經驗值門檻無效');
 for(const k of ['magicGuardTurns','burnTurns','defDownTurns','buffDamageUpTurns','regenTurns'])validNumber(out[k],0,100);
 validNumber(out.buffDamageUpRate,0,2,false);validNumber(out.defDownRate,0,1,false);
 out.weaponRefineAffixes=validAffixes(value.weaponRefineAffixes,WEAPON_AFFIX_POOL);
 const eq=validObject(value.equipment);out.equipment={WEAPON:cleanEquipment(eq.WEAPON,'WEAPON'),SHIELD:cleanEquipment(eq.SHIELD,'SHIELD'),RING:cleanEquipment(eq.RING,'RING')};
 return out;
}
function cleanEnemy(value){
 if(value==null)return null;const e=validObject(value),out={};
 out.name=validText(e.name,120);cleanNpcEnemy(e,out);if(e.bossId!=null){if(!BOSS_DESIGNS.some(b=>b.id===e.bossId))throw new Error("首領代號無效");out.bossId=e.bossId;}if(e.modifier!=null){if(!["plain","fierce","armored","nimble"].includes(e.modifier))throw new Error("敵人特性無效");out.modifier=e.modifier;}for(const k of ['hp','originalHp','atk','def','mDef','exp'])out[k]=validNumber(e[k],0,1e7);validNumber(out.originalHp,1,1e7);validNumber(out.hp,0,out.originalHp);out.dodge=validNumber(e.dodge,0,100,false);out.lootChance=validNumber(e.lootChance,0,1,false);
 out.bias={};let total=0;for(const move of Object.keys(MOVE_NAMES)){out.bias[move]=validNumber(e.bias?.[move],0,1,false);total+=out.bias[move];}if(Math.abs(total-1)>.001)throw new Error('怪物出招機率無效');
 if(e.level!=null)out.level=validNumber(e.level,1,ENEMIES.BOSS.length);if(e.elite!=null)out.elite=validBool(e.elite);if(e.ancientChargeState!=null){if(e.ancientChargeState!=='CHARGING')throw new Error('首領蓄力狀態無效');out.ancientChargeState=e.ancientChargeState;}
 return out;
}
function cleanIdentity(value){
 if(value==null)return null;const id=validObject(value);
 if(id.version!==1||!['new','legacy'].includes(id.source)||!HERO_LOOKS.some(p=>p.id===id.appearance))throw new Error('稱號或造型資料無效');
 if(id.source==='legacy'){if(id.parts!=null)throw new Error('舊旅程稱號資料無效');return {version:1,source:'legacy',parts:null,appearance:id.appearance};}
 if(!Array.isArray(id.parts)||id.parts.length!==3||id.parts.some((part,i)=>![TITLE_A,TITLE_B,TITLE_C][i].includes(part)))throw new Error('起始稱號內容無效');
 return {version:1,source:'new',parts:[...id.parts],appearance:id.appearance};
}
function cleanAdventure(value){
 const a=validObject(value),out={runId:validText(a.runId,100),flags:{},stats:{},eventVisits:{},identity:cleanIdentity(a.identity),expedition:cleanExpedition(a.expedition)};
 for(const k of ['seq','steps','gold','scoutTurns','nextEventAt'])out[k]=validNumber(a[k]);validNumber(out.scoutTurns,0,100);
 for(const k of ['eventResolved','pendingEnding','clearRecorded'])out[k]=validBool(a[k]);
 for(const k of ['eventId','lastEvent']){if(a[k]!=null&&!Object.hasOwn(EVENTS,a[k]))throw new Error('未知的冒險事件');out[k]=a[k];}
 if(!Array.isArray(a.eventDeck)||a.eventDeck.length>64||a.eventDeck.some(id=>!Object.hasOwn(EVENTS,id)))throw new Error('事件牌庫無效');out.eventDeck=[...a.eventDeck];
 for(const [key,val]of Object.entries(validObject(a.eventVisits))){if(!Object.hasOwn(EVENTS,key))throw new Error('事件紀錄無效');out.eventVisits[key]=validNumber(val);}
 for(const key of ['fox','foxGift','parcel','delivered'])if(a.flags?.[key]!=null)out.flags[key]=validBool(a.flags[key]);
 for(const key of ['foxAt','parcelAt'])if(a.flags?.[key]!=null)out.flags[key]=validNumber(a.flags[key]);
 if((out.flags.fox&&out.flags.foxAt==null)||(out.flags.parcel&&out.flags.parcelAt==null))throw new Error('委託進度不完整');
 for(const key of ['wins','deaths','events','loot','bosses','rests'])out.stats[key]=validNumber(a.stats?.[key]);
 if(!Array.isArray(a.logs)||a.logs.length>80)throw new Error('冒險手札過長');out.logs=a.logs.map(s=>validText(s,1600));
 if(a.result){const r=validObject(a.result);out.result={title:validText(r.title,200),text:validText(r.text,1800),tag:validText(r.tag,100),object:validNumber(r.object,0,129)};if(r.portraitKey!=null){if(!Object.hasOwn(SCENE_PORTRAITS,r.portraitKey))throw new Error('事件人物造型無效');out.result.portraitKey=r.portraitKey;}}else out.result=null;
 if(a.battle){const b=validObject(a.battle);if(!Object.hasOwn(MOVE_NAMES,b.nextMove))throw new Error('下一回合出招無效');out.battle={id:validNumber(b.id,1),settled:validBool(b.settled),round:validNumber(b.round,1),nextMove:b.nextMove,isBoss:validBool(b.isBoss),petAssistRound:validNumber(b.petAssistRound??0,0,b.round),boss:cleanBossState(b.boss),guarding:false};}else out.battle=null;
 return out;
}
function validateSave(doc){
 validObject(doc);if(doc.format!=='jack-adventure'||doc.version!==2)throw new Error('這不是支援的勇者模擬器 v2 存檔');validNumber(doc.savedAt,1,9e15);
 const p=validObject(doc.payload);if(!STABLE_PHASES.includes(p.gameState))throw new Error('存檔停在不支援的階段');
 const out={gameState:p.gameState,hero:cleanHero(p.hero),adventure:cleanAdventure(p.adventure),bossLevel:validNumber(p.bossLevel,1,ENEMIES.BOSS.length+1),currentEnemy:cleanEnemy(p.currentEnemy),newLoot:null,totalTurnCount:validNumber(p.totalTurnCount),lastHealTime:validNumber(p.lastHealTime,0,9e15),weaponMaterials:validNumber(p.weaponMaterials,0,5000),shieldMaterials:validNumber(p.shieldMaterials,0,5000)};
 if(p.newLoot){if(!['WEAPON','SHIELD','RING'].includes(p.newLoot.type))throw new Error('待領裝備種類無效');out.newLoot=cleanEquipment(p.newLoot,p.newLoot.type);validNumber(out.newLoot.uid,1,out.adventure.seq);}
 if(out.gameState==='BATTLE'&&(!out.currentEnemy||out.currentEnemy.hp<=0||!out.adventure.battle||out.adventure.battle.settled))throw new Error('戰鬥存檔不完整');
 if((out.gameState==='LOOT_DECISION')!==!!out.newLoot)throw new Error('戰利品存檔不完整');
 if(out.gameState==='EVENT'&&(!out.adventure.eventId||out.adventure.eventResolved))throw new Error('事件選擇存檔不完整');
 if(['RESULT','DEFEAT'].includes(out.gameState)&&!out.adventure.result)throw new Error('事件結果不完整');
 if(out.gameState==='CREDITS'&&![4,ENEMIES.BOSS.length+1].includes(out.bossLevel))throw new Error('通關進度不完整');
 if(out.gameState==='ROUTE'&&(!out.adventure.expedition||out.adventure.expedition.choices.length!==3))throw new Error('缺少路線選項');
 return {format:'jack-adventure',version:2,savedAt:doc.savedAt,payload:out};
}
function parseSave(text){
 if(typeof text!=='string'||text.length>262144)throw new Error('存檔過大，請選擇 256 KB 以內的 JSON');
 const doc=JSON.parse(text,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))throw new Error('存檔包含不允許的欄位');return value;});return validateSave(doc);
}

function captureSave(){
 const phase=gameState==='BATTLE_ACTION'?'BATTLE':gameState;if(!STABLE_PHASES.includes(phase))return null;
 return {format:'jack-adventure',version:2,savedAt:Date.now(),payload:JSON.parse(JSON.stringify({gameState:phase,hero,adventure,bossLevel,currentEnemy,newLoot,totalTurnCount,lastHealTime,weaponMaterials,shieldMaterials}))};
}
function readSlot(key){try{const raw=localStorage.getItem(key);if(!raw)return {kind:'empty',key};try{return {kind:'valid',key,doc:parseSave(raw)};}catch(e){return {kind:'invalid',key,error:e.message};}}catch(e){return {kind:'blocked',key,error:e.message};}}
function getBestSave(){const auto=readSlot(SAVE_KEY);if(auto.kind==='valid')return {...auto,recovered:false};const backup=readSlot(BACKUP_KEY);if(backup.kind==='valid')return {...backup,recovered:true};return null;}
function writeSave(key,doc){
 if(!doc)return false;
 try{
  const text=JSON.stringify(doc);
  if(key===SAVE_KEY){const previous=readSlot(SAVE_KEY);if(previous.kind==='valid')localStorage.setItem(BACKUP_KEY,JSON.stringify(previous.doc));}
  localStorage.setItem(key,text);saveWarningShown=false;$('save-indicator').classList.remove('warning');$('save-indicator').textContent=`● 已存檔 ${new Date(doc.savedAt).toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}`;return true;
 }catch(e){saveError('瀏覽器無法儲存進度，遊戲仍可玩。請用「匯出存檔」保留進度。');return false;}
}
function saveAuto(){return writeSave(SAVE_KEY,captureSave());}
function saveCheckpoint(){if(gameState==='MAP')return writeSave(CHECKPOINT_KEY,captureSave());return false;}
function applySave(doc,notice='已接回你的旅程。'){
 const checked=validateSave(doc),p=checked.payload;
 sessionEpoch++;clearTimeout(healCooldownTimer);overflowActive=false;
 hero=p.hero;adventure=p.adventure;bossLevel=p.bossLevel;currentEnemy=p.currentEnemy;newLoot=p.newLoot;totalTurnCount=turnCount=p.totalTurnCount;weaponMaterials=p.weaponMaterials;shieldMaterials=p.shieldMaterials;lastHealTime=Math.min(p.lastHealTime,Date.now());gameState=p.gameState;
 $('titleSelectBox').hidden=true;$('app-shell').inert=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 migrateExpeditionOnLoad();if(gameState==='CREDITS')recordClearRun();renderCurrent();saveAuto();toast(notice);return true;
}
function loadSlot(key,ask=true){const slot=readSlot(key);if(slot.kind!=='valid'){toast(slot.kind==='empty'?'這個存檔槽還是空的。':'這個存檔無法讀取，請改用備援或匯入備份。',true);return false;}if(ask&&gameState!=='TITLE'&&!confirm('讀取會回到這份存檔的進度，取代目前進度。確定讀取？'))return false;return applySave(slot.doc);}
function openSaveDialog(){renderSaveSlots();$('save-dialog').showModal();}
function formatSaveSummary(doc){const p=doc.payload;return `${p.hero.title} · Lv.${p.hero.level} · 第 ${p.totalTurnCount} 回合 · ${new Date(doc.savedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}`;}
function renderSaveSlots(){
 const host=$('save-slots');host.replaceChildren();
 const slots=[['自動存檔',SAVE_KEY,false],['手動存檔 1',SAVE_KEY+'.1',true],['手動存檔 2',SAVE_KEY+'.2',true],['手動存檔 3',SAVE_KEY+'.3',true],['上一份自動備援',BACKUP_KEY,false]];
 for(const [name,key,manual]of slots){
  const slot=readSlot(key),row=document.createElement('div');row.className='save-slot';const info=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');title.textContent=name;sub.textContent=slot.kind==='valid'?formatSaveSummary(slot.doc):slot.kind==='empty'?'尚未留下書籤':slot.kind==='blocked'?'瀏覽器不允許儲存':'資料損壞，請使用其他備份';info.append(title,sub);row.append(info);
  const buttons=document.createElement('div');buttons.className='slot-actions';
  if(manual){const b=document.createElement('button');b.className='secondary';b.textContent='儲存';b.disabled=!captureSave();b.onclick=()=>{if(slot.kind==='valid'&&!confirm(`要覆寫「${name}」嗎？`))return;if(writeSave(key,captureSave()))toast('手動書籤已儲存，不會被自動存檔覆蓋。');renderSaveSlots();};buttons.append(b);}
  const load=document.createElement('button');load.className='secondary';load.textContent='讀取';load.disabled=slot.kind!=='valid';load.onclick=()=>loadSlot(key);buttons.append(load);row.append(buttons);host.append(row);
 }
 $('btn-export').disabled=!captureSave();$('btn-checkpoint').disabled=readSlot(CHECKPOINT_KEY).kind!=='valid';
}
function exportSave(){
 const doc=captureSave();if(!doc){toast('請先開始或讀取一段旅程。',true);return;}
 const blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`勇者旅程_Lv${hero.level}_${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出旅程檔案。把它留在安全的地方。');
}
async function importSaveFile(file){
 if(!file)return false;try{
  if(file.size>262144)throw new Error('檔案超過 256 KB，請選擇遊戲匯出的 JSON 存檔');
  const doc=parseSave(await file.text());
  if(!confirm(`讀取 ${doc.payload.hero.title}（Lv.${doc.payload.hero.level}）？目前的自動存檔將被取代。`))return false;
  return applySave(doc,'匯入成功，旅程接上了。');
 }catch(e){toast(`匯入失敗：${e.message}。目前進度沒有被變更。`,true);return false;}
}
function initSaveUI(){
 $('btn-save').onclick=$('btn-title-slots').onclick=openSaveDialog;$('btn-export').onclick=exportSave;
 $('btn-import').onclick=$('btn-title-import').onclick=()=>$('import-file').click();
 $('import-file').onchange=async e=>{await importSaveFile(e.target.files[0]);e.target.value='';};
 $('btn-checkpoint').onclick=()=>loadSlot(CHECKPOINT_KEY);
 const best=getBestSave();$('btn-continue').hidden=!best;
 if(best){$('new-title-details').open=false;$('continue-summary').textContent=(best.recovered?'自動存檔有問題，已找到上一份備援。 ':'')+formatSaveSummary(best.doc);$('btn-continue').onclick=()=>applySave(best.doc,best.recovered?'已從上一份自動備援恢復。':'歡迎回來。你的旅程還在。');}
 else{const slot=readSlot(SAVE_KEY);if(slot.kind==='invalid')$('continue-summary').textContent='本機自動存檔無法讀取。可匯入 JSON 備份，或開始新旅程。';if(slot.kind==='blocked')saveError('瀏覽器限制了本機儲存，請定期匯出存檔。');}
}
function readClearRecords(){try{const list=JSON.parse(localStorage.getItem(RECORD_KEY)||'[]');return Array.isArray(list)?list.filter(r=>r&&typeof r.title==='string'&&Number.isFinite(r.totalTurn)&&Number.isFinite(r.level)&&Number.isFinite(r.time)).slice(0,10):[];}catch{return [];}}
function recordClearRun(){
 const records=readClearRecords();if(records.some(r=>r.runId===adventure.runId&&r.campaign==='five-seals')){adventure.clearRecorded=true;return;}
 const record={runId:adventure.runId,campaign:'five-seals',title:hero.title,level:hero.level,totalTurn:totalTurnCount,time:Date.now(),weapon:hero.equipment.WEAPON.name,shield:hero.equipment.SHIELD.name,ring:hero.equipment.RING.name};
 try{records.push(record);records.sort((a,b)=>a.totalTurn-b.totalTurn);localStorage.setItem(RECORD_KEY,JSON.stringify(records.slice(0,10)));adventure.clearRecorded=true;log('📒 通關紀錄已寫進旅程名冊。');}catch{adventure.clearRecorded=false;saveError('通關完成，但瀏覽器無法寫入紀錄；請匯出存檔保留。');}
}
function openRecords(){
 const host=$('run-records'),stats=adventure.stats;host.innerHTML=`<div class="record-grid"><div><b>${stats.wins}</b><span>勝利場次</span></div><div><b>${stats.events}</b><span>路邊故事</span></div><div><b>${Object.keys(adventure.eventVisits).length}</b><span>發現的事件種類</span></div></div><p class="muted">通關紀錄：回合越少越靠前，保留前 10 名。只記錄這個瀏覽器內的旅程。</p>`;
 const list=readClearRecords();if(!list.length){const p=document.createElement('p');p.className='muted';p.textContent='名冊還留著你的位置。打敗三位首領後，就能在這裡看到自己的名字。';host.append(p);}
 for(const [i,r]of list.entries()){const row=document.createElement('div');row.className='record-item';const title=document.createElement('strong');title.textContent=`${i+1}. ${r.title}`;const sub=document.createElement('small');sub.textContent=`Lv.${r.level} · ${r.totalTurn} 回合 · ${new Date(r.time).toLocaleDateString('zh-TW')}`;row.append(title,sub);host.append(row);}
 $('records-dialog').showModal();
}
