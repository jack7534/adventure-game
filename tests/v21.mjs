import {chromium} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1280,height:960}}),checks=[],errors=[],dialogs=[];let answer='accept';
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
page.on('dialog',async d=>{dialogs.push(d.message());await d[answer]();});
const mark=(name,ok=true)=>{assert.ok(ok,name);checks.push(name);};
const reset=()=>page.evaluate(()=>{confirmTitle();actionDelay=0;});
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8770/',{waitUntil:'networkidle'});
 mark('AudioContext is not started before a user gesture',await page.evaluate(()=>Music.ctx===null));
 await reset();
 await page.evaluate(()=>{hero.equipment.WEAPON={type:'WEAPON',name:'符文長劍',rarity:'Rare',power:37,affixes:['W_VETERAN']};offerLoot({type:'WEAPON',name:'微光長劍',rarity:'Magic',power:22,refine:0,refineSlots:0,affixes:[]});});
 const before=await page.evaluate(()=>JSON.stringify(captureSave().payload));
 mark('37 → 22 downgrade is visibly marked',await page.locator('.equip-impact').innerText().then(t=>t.includes('-15')));
 mark('Affix descriptions explain the original veteran effect',await page.locator('.loot-affixes').allTextContents().then(t=>t.join('').includes('30%')));
 mark('Risky equip button is not styled as a safe upgrade',await page.locator('#btn-decision-yes').getAttribute('class').then(s=>s.includes('risky-equip')));
 const cloneCheck=await page.evaluate(()=>{const pre=JSON.stringify(captureSave().payload),rng=Math.random;let calls=0;Math.random=()=>{calls++;return .5;};try{for(let i=0;i<10;i++)equipmentComparison(newLoot);}finally{Math.random=rng;}return {same:pre===JSON.stringify(captureSave().payload),calls};});
 mark('Comparison does not mutate state or consume random rolls',cloneCheck.same&&cloneCheck.calls===0);
 await page.screenshot({path:'v21-gear-warning.png',fullPage:true});
 answer='dismiss';await page.locator('#btn-decision-yes').click();
 mark('Cancel leaves equipment, pending loot, materials and stats intact',await page.evaluate(()=>JSON.stringify(captureSave().payload))===before);
 mark('Second confirmation explains stat loss and dismantling',dialogs.at(-1).includes('-15')&&dialogs.at(-1).includes('分解'));
 answer='accept';await page.locator('#btn-decision-yes').click();
 mark('Explicit confirmation permits a deliberate build change',await page.evaluate(()=>hero.equipment.WEAPON.power===22&&adventure.stats.loot===1));
 mark('Inherited weapon affix is preserved, not falsely removed',await page.evaluate(()=>hero.equipment.WEAPON.affixes.includes('W_VETERAN')));
 await reset();
 mark('Shield refinement and lost effects both trigger warnings',await page.evaluate(()=>{hero.equipment.SHIELD={type:'SHIELD',name:'精練盾',power:20,rarity:'Rare',refine:9,refineSlots:3,affixes:['S_BLOCK']};const c=equipmentComparison({type:'SHIELD',name:'新盾',power:45,rarity:'Epic',refine:0,affixes:[]});return c.risky&&c.reasons.some(s=>s.includes('精練'))&&c.reasons.some(s=>s.includes('我擋'));}));
 await reset();
 mark('Ring ability loss is warned even when its rarity improves',await page.evaluate(()=>{hero.equipment.RING={name:'生命戒指',type:'RING',ability:RING_ABILITIES.find(r=>r.id==='HEAL'),tier:4,rarity:'Rare'};const c=equipmentComparison({type:'RING',name:'魔導指環',ability:RING_ABILITIES.find(r=>r.id==='MAGIC'),tier:1,rarity:'Legendary'});return c.risky&&c.reasons.some(r=>r.includes('原戒指能力'));}));
 mark('Same-ring fusion is not mislabelled as a downgrade',await page.evaluate(()=>!equipmentComparison({type:'RING',name:'生命戒指',ability:RING_ABILITIES.find(r=>r.id==='HEAL'),tier:1,rarity:'Normal'}).risky));
 await reset();await page.locator('#btn-guide').click();
 mark('All 24 original affixes have inline guide explanations',await page.locator('#guide-affixes .affix-effect').count()===24);
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:844});
  const pos=await page.evaluate(()=>{const dialog=$('guide-dialog');dialog.scrollTop=0;return dialog.querySelector('.close-button').getBoundingClientRect().top;});
  await page.evaluate(()=>$('guide-dialog').scrollTop=$('guide-dialog').scrollHeight);await page.waitForTimeout(60);
  const rect=await page.locator('#guide-dialog .close-button').boundingBox();
  mark(`Guide close stays top-right after full scroll at ${width}px`,!!rect&&Math.abs(rect.y-pos)<2&&rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0);
  if(width===390)await page.screenshot({path:'v21-guide-sticky-mobile.png'});
 }
 await page.locator('[data-close="guide-dialog"]').click();mark('Sticky close remains clickable',!(await page.locator('#guide-dialog').isVisible()));
 await page.setViewportSize({width:1280,height:960});await reset();
 await page.locator('#btn-camp').click();
 const gold=await page.evaluate(()=>adventure.gold);await page.locator('[data-offer="weapon"]').click();
 mark('Gold buys real materials and preserves them without a weapon',await page.evaluate(gold=>adventure.gold===gold-12&&weaponMaterials===5,gold));
 mark('Purchase result is in the automatic save',await page.evaluate(()=>readSlot(SAVE_KEY).doc.payload.weaponMaterials===5));
 mark('Purchase button is briefly locked against rapid duplicate clicks',await page.locator('[data-offer="weapon"]').isDisabled());
 await page.waitForTimeout(520);await page.screenshot({path:'v21-camp.png'});await page.locator('[data-close="camp-dialog"]').click();
 await page.evaluate(()=>{startSmallBattle(0);openCamp();});
 mark('Shopping cannot change equipment or buffs during battle',await page.locator('[data-offer]:enabled').count()===0);
 await page.locator('[data-close="camp-dialog"]').click();
 await reset();
 const pet=await page.evaluate(()=>{adventure.flags.fox=true;adventure.flags.foxAt=0;createBattle({...ENEMIES.SMALL[0],hp:1000},false);gameState='BATTLE_ACTION';adventure.battle.round=2;const a=petAssist();adventure.battle.round=3;const expected=petAssistDamage(),b=petAssist(),hp=currentEnemy.hp,c=petAssist();return {a,b,c,expected,same:hp===currentEnemy.hp};});
 mark('Fox supports every third round, once only',pet.a===0&&pet.b===pet.expected&&pet.c===0&&pet.same);
 const legacy=await page.evaluate(()=>{gameState='BATTLE';const doc=captureSave();delete doc.payload.adventure.battle.petAssistRound;applySave(doc);return adventure.flags.fox&&adventure.battle.petAssistRound===0;});
 mark('v2 save without pet bookkeeping loads and keeps its existing fox',legacy);
 await reset();
 mark('Fox kill is settled exactly once',await page.evaluate(()=>{adventure.flags.fox=true;adventure.flags.foxAt=0;createBattle({...ENEMIES.SMALL[0],hp:1,exp:1,lootChance:1});adventure.battle.round=3;gameState='BATTLE_ACTION';petAssist();endBattle('win');endBattle('win');return adventure.stats.wins===1&&hero.exp===1&&gameState==='LOOT_DECISION';}));
 await reset();
 mark('Fox never attacks for a dead hero',await page.evaluate(()=>{adventure.flags.fox=true;adventure.flags.foxAt=0;createBattle({...ENEMIES.SMALL[0],hp:100});gameState='BATTLE_ACTION';adventure.battle.round=3;hero.hp=0;return petAssist()===0&&currentEnemy.hp===100;}));

 await reset();await page.locator('#btn-sound').click();await page.waitForFunction(()=>Music.ctx?.state==='running'&&Music.track==='explore');
 mark('Music starts from the audio control user gesture');
 const originalContext=await page.evaluate(()=>{window.qaContext=Music.ctx;return true;});
 const waveforms=await page.evaluate(async()=>{
  const results=[];
  for(const [id,t]of Object.entries(GAME_SCORES)){
   const duration=60/t.bpm*4+.5,sr=24000,c=new OfflineAudioContext(1,Math.ceil(duration*sr),sr),bus={gain:c.createGain(),voices:new Set()};bus.gain.gain.value=.2;bus.gain.connect(c.destination);
   const engine={ctx:c,noise:Music.noise,scheduled:0,note:Music.note,drum:Music.drum};
   for(let i=0;i<16;i++)Music.scheduleStep.call(engine,t,i,.03+i*(60/t.bpm/4),60/t.bpm/4,bus);
   const rendered=await c.startRendering(),data=rendered.getChannelData(0);let sum=0,peak=0,hash=0;
   for(let i=0;i<data.length;i++){sum+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]));if(i%97===0)hash=(Math.imul(hash,31)+Math.round(data[i]*1000000))|0;}
   results.push({id,bpm:t.bpm,rms:Math.sqrt(sum/data.length),peak,hash,notes:engine.scheduled});
  }
  return results;
 });
 for(const w of waveforms)mark(`Score ${w.id} renders actual nonzero unclipped audio`,w.rms>.001&&w.peak<1&&Number.isFinite(w.rms)&&w.notes>10);
 mark('All six scores have distinct waveforms',new Set(waveforms.map(w=>w.hash)).size===6);
 for(const [n,id]of [[1,'lich'],[2,'dragon'],[3,'ancient']]){
  await page.evaluate(n=>{bossLevel=n;createBattle({...ENEMIES.BOSS[n-1]},true);},n);
  await page.waitForFunction(id=>Music.track===id,id);
  mark(`Boss ${n} selects its own score ${id}`);
  const switches=await page.evaluate(()=>Music.switches);await page.evaluate(()=>{for(let i=0;i<10;i++)renderBattle();});
  mark(`Boss ${n} rendering does not restart or layer the soundtrack`,await page.evaluate(()=>Music.switches)===switches);
 }
 await page.screenshot({path:'v21-audio-settings.png'});await page.locator('[data-close="audio-dialog"]').click();
 await page.evaluate(()=>{enterMap();startSmallBattle(0);});mark('Ordinary battles select the regular battle track',await page.evaluate(()=>Music.track==='battle'));
 await page.evaluate(()=>enterMap());mark('Leaving combat restores upbeat exploration',await page.evaluate(()=>Music.track==='explore'));
 mark('One reusable AudioContext is retained across every transition',await page.evaluate(()=>Music.ctx===window.qaContext));
 const rng=await page.evaluate(()=>{const native=Math.random;let count=0;Math.random=()=>{count++;return .1;};try{Music.tick();}finally{Math.random=native;}return count;});
 mark('Music scheduling never changes game random outcomes',rng===0);
 await page.evaluate(()=>Music.setPreference('music',false));await page.waitForTimeout(220);const count=await page.evaluate(()=>Music.scheduled);await page.waitForTimeout(250);
 mark('Music off stops its timer and future music notes',await page.evaluate(c=>Music.timer===null&&Music.scheduled===c,count));
 await page.evaluate(()=>{Music.setPreference('sfx',true);playTone('reward');});
 mark('Sound effects can play while background music is off',await page.evaluate(c=>Music.timer===null&&Music.scheduled>c,count));
 await page.evaluate(()=>{Music.setPreference('musicVolume',.23);Music.setPreference('sfxVolume',.41);});
 await page.reload({waitUntil:'networkidle'});mark('Music choices survive reload without autoplay',await page.evaluate(()=>!Music.prefs.music&&Music.prefs.sfx&&Music.prefs.musicVolume===.23&&Music.prefs.sfxVolume===.41&&Music.ctx===null));
 await page.locator('#btn-continue').click();await page.evaluate(()=>Music.setPreference('music',true));await page.waitForFunction(()=>Music.timer!==null);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>Music.ctx.state==='suspended');mark('Hidden page suspends audio and cancels the scheduler',await page.evaluate(()=>Music.timer===null));
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>Music.ctx.state==='running'&&Music.timer!==null);
 mark('Returning to the page resumes one soundtrack');
 await page.waitForTimeout(400);mark('Active voices remain bounded',await page.evaluate(()=>Music.bus.voices.size<81));
 assert.deepEqual(errors,[]);
 fs.writeFileSync('v21-report.json',JSON.stringify({checks,waveforms,errors},null,2));console.log(JSON.stringify({passed:checks.length,checks,waveforms,errors},null,2));
}catch(e){console.error(e);console.log('BROWSER_ERRORS',errors);process.exitCode=1;fs.writeFileSync('v21-report.json',JSON.stringify({checks,errors,failure:String(e)},null,2));}finally{await browser.close();}
