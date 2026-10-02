/* A static, low-cost pixel landscape. Redrawn only when the chapter changes. */
const SCENES = [
  {name:'微光森林',boss:'不死巫妖',level:5,sky:'#91b9a8',light:'#f5e4ad',far:'#668d85',mid:'#476d67',ground:'#395849',grass:'#567c53'},
  {name:'餘燼山道',boss:'火焰巨龍',level:10,sky:'#c59378',light:'#ffe0aa',far:'#966c68',mid:'#725352',ground:'#63493f',grass:'#90724f'},
  {name:'月落遺跡',boss:'遠古魔神',level:16,sky:'#777caa',light:'#ece2c4',far:'#5c6089',mid:'#434b71',ground:'#374a52',grass:'#667775'}
];
const ENEMY_SPRITES = {'哥布林':10,'骷髏兵':1,'野狼':23,'石頭人':127,'蝙蝠':138,'不死巫妖':96,'火焰巨龍':33,'遠古魔神':123,'迷路的牛頭人菁英':20,'度假中的迷你九頭蛇':110,'被縮小的遠古小魔神':123};
let lastSceneKey = '', audioEnabled = false, audioContext = null;
const $ = id => document.getElementById(id);
function spriteAt(el, index, size=64) {
  el.style.backgroundImage="url(assets/dungeon.png)";
  el.style.width=el.style.height=`${size}px`;
  el.style.backgroundSize=`${12*size}px ${11*size}px`;
  el.style.backgroundPosition=`-${index%12*size}px -${Math.floor(index/12)*size}px`;
}
function creatureAt(el,index,size=64){el.style.backgroundImage="url(assets/creatures.png)";el.style.width=el.style.height=`${size}px`;el.style.backgroundSize=`${10*size}px ${18*size}px`;el.style.backgroundPosition=`-${index%10*size}px -${Math.floor(index/10)*size}px`;}
function drawLandscape(zone=0) {
  const canvas=$('landscape'), c=canvas.getContext('2d'); if(!c) return;
  const key=String(zone); if(key===lastSceneKey)return; lastSceneKey=key;
  const p=SCENES[zone], W=640,H=280; c.imageSmoothingEnabled=false;
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  rect(0,0,W,H,p.sky); rect(436,48,28,28,p.light);rect(440,44,20,36,p.light);
  [[55,48,52],[155,71,43],[303,38,60],[511,67,50]].forEach(([x,y,w])=>{rect(x,y,w,5,'#eadfc366');rect(x+8,y-4,w-22,4,'#eadfc366');});
  poly([[0,130],[70,80],[118,112],[192,55],[252,113],[315,88],[360,122],[421,85],[480,118],[546,82],[640,119],[640,230],[0,230]],p.far);
  poly([[0,168],[76,112],[135,149],[219,127],[291,171],[389,115],[451,155],[526,115],[594,157],[640,135],[640,250],[0,250]],p.mid);
  poly([[0,188],[98,177],[212,194],[340,172],[430,178],[516,165],[640,189],[640,280],[0,280]],p.ground);
  poly([[349,165],[372,167],[334,184],[374,208],[478,245],[640,267],[640,280],[504,280],[380,244],[315,210],[303,186]],zone===2?'#729999':'#779992');
  for(let i=0;i<10;i++)rect(327+(i*19)%180,191+i*8,9+i%4*3,2,'#b5c5a666');
  poly([[0,251],[136,226],[226,223],[317,235],[430,229],[559,217],[640,225],[640,248],[553,243],[427,253],[315,257],[228,244],[139,245],[0,280]],zone===1?'#b19570':'#abaf7e');
  for(let i=0;i<43;i++){const x=(i*97+23)%640,y=213+(i*13)%65;rect(x,y,3,2,p.grass);if(i%4===0)rect(x+3,y-2,2,4,p.grass);}
  function tree(x,y,s=1){rect(x-3*s,y-6*s,6*s,28*s,'#4e5040');poly([[x,y-67*s],[x-23*s,y-27*s],[x-16*s,y-27*s],[x-31*s,y-5*s],[x+30*s,y-5*s],[x+16*s,y-28*s],[x+22*s,y-28*s]],p.mid);poly([[x,y-60*s],[x-20*s,y-27*s],[x-10*s,y-27*s],[x-26*s,y-8*s],[x-1*s,y-8*s]],p.grass);}
  if(zone<2){[[32,207,1.3],[82,184,.7],[545,193,.8],[609,220,1.4],[123,199,.55]].forEach(t=>tree(...t));}
  else {for(const [x,y,h] of [[38,209,64],[87,183,35],[548,202,51],[603,223,75]]){rect(x,y-h,13,h,'#728386');rect(x-3,y-h-7,19,8,'#929b95');rect(x+4,y-h+7,3,h-14,'#596879');rect(x-4,y,21,6,'#929b95');}rect(551,147,60,8,'#8e9998');}
  // A distant destination, separate from the battle actors.
  rect(247,116,43,51,'#425254');rect(242,109,13,13,'#465a58');rect(282,105,13,13,'#465a58');rect(246,100,5,10,'#cfb887');rect(285,96,5,10,'#cfb887');rect(263,143,10,24,'#293e42');rect(253,127,5,8,p.light);rect(278,127,5,8,p.light);
  // Edge plants and dappled light, without a continuous canvas animation loop.
  for(let i=0;i<19;i++){let x=(i*83)%640;rect(x,269+i%3*3,4,8,'#203c37');rect(x-3,270+i%3*3,10,3,'#456849');}
  c.fillStyle='#eedc8d13'; c.fillRect(412,0,12,H);c.fillRect(450,0,23,H);
}
function setScene(mode='map', object=89) {
  Music.sync();
  const zone=Math.min(SCENES.length-1,Math.max(0,bossLevel-1)); $('stage').dataset.zone=zone;drawLandscape(zone);
  $('region-label').textContent=`✦ ${SCENES[zone].name}`;showPlace(mode);
  $('enemy-actor').hidden=mode!=='battle';$('enemy-hud').hidden=mode!=='battle';$('scene-object').hidden=mode==='battle';
  drawPortrait($('hero-actor').querySelector('.actor-sprite'),currentIdentity().appearance,80);
  let portrait=mode==='event'?(gameState==='EVENT'?eventPortraitKey(adventure.eventId):adventure.result?.portraitKey):null;
  if(!portrait&&object===122)portrait='postman';if(!portrait&&object===123)portrait='fox';
  if(mode==='map'&&object===88&&gameState!=='MAP')portrait=['ranger','auburn','veteran','smith','sage'][zone];
  if(portrait)drawPortrait($('scene-object'),portrait,64);else {spriteAt($('scene-object'),object,64);delete $('scene-object').dataset.portrait;delete $('scene-object').dataset.portraitKind;}
  $('scene-npc-name').hidden=mode==='battle'||!portrait;$('scene-npc-name').textContent=portrait?SCENE_PORTRAITS[portrait].name:'';
  $('companion-actor').hidden=!adventure.flags.fox;drawPortrait($('companion-actor'),'fox',40);
  $('scene-caption').firstElementChild.textContent=mode==='battle'?'看穿對手的習慣，比一味亂砍更有用。':adventure.flags.fox?'小狐狸跟在你後面。牠堅持自己只是順路。':'森林很大。沒關係，今天走一小段也算。';
  if(mode==='battle'&&currentEnemy){creatureAt($('enemy-actor').querySelector('.actor-sprite'),ENEMY_SPRITES[currentEnemy.name]??123,80);$('enemy-name').textContent=currentEnemy.name;$('enemy-actor').classList.toggle('boss',!!adventure.battle?.isBoss);}
  renderNpcScene(mode);
}
function animateClass(el,cls,duration=350){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),duration);}
function flashBattleView(type){if(type==='heal')animateClass($('stage'),'heal-flash',450);else animateClass($(type==='monster-hit'?'hero-actor':'enemy-actor'),'hit');}
function floatingNumber(text,target='enemy'){const el=$('combat-float');el.textContent=text;el.style.left=target==='hero'?'23%':'66%';animateClass(el,'show',650);}
function playTone(kind='hit'){Music.sfx(kind);}
