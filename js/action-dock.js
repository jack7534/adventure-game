/* One real set of action buttons, fixed to the viewport. No cloned actions. */
let dockObserver=null,lastDockHeight=0,dockFrame=0;
function syncDockGeometry(){
 const dock=$('action-dock');if(!dock||dock.hidden)return;
 const rect=document.querySelector('.play-column').getBoundingClientRect(),width=document.documentElement.clientWidth;
 const left=width<=760?10:Math.max(10,rect.left),w=width<=760?width-20:Math.min(rect.width,width-left-10);
 dock.style.setProperty('--dock-left',`${left}px`);dock.style.setProperty('--dock-width',`${w}px`);
 const h=Math.ceil(dock.getBoundingClientRect().height);if(h!==lastDockHeight){lastDockHeight=h;document.documentElement.style.setProperty('--dock-space',`${h+28}px`);}
}
function syncActionDock(){
 const dock=$('action-dock');if(!dock)return;dock.hidden=gameState==='TITLE';if(dock.hidden)return;
 const phase=gameState==='BATTLE_ACTION'?'BATTLE':gameState;
 dock.dataset.phase=phase;$('dock-title').textContent=mainView.querySelector('h2')?.textContent||'下一步，由你決定';
 let summary='按鈕固定在這裡，不必再滑到頁面底部。';
 if(phase==='LOOT_DECISION'&&newLoot){const c=equipmentComparison(newLoot);summary=c.risky?c.reasons.slice(0,2).join(' ／ '):'沒有偵測到能力下降；仍可查看詞條再決定。';dock.classList.toggle('dock-risk',c.risky);}
 else{dock.classList.remove('dock-risk');if(phase==='BATTLE'&&currentEnemy)summary=`你 HP ${Math.max(0,hero.hp)}/${hero.maxHp} · ${currentEnemy.name} ${Math.max(0,currentEnemy.hp)}/${currentEnemy.originalHp}`;else if(phase==='EVENT')summary='選項下方寫有代價；選好後才會繼續。';}
 $('dock-summary').textContent=summary;syncDockGeometry();
}
function revealCurrentContent(){
 const target=['LOOT_DECISION','RESULT','DEFEAT','CREDITS'].includes(gameState)?mainView:$('stage');
 if(!target)return;const r=target.getBoundingClientRect();if(r.top<8||r.top>innerHeight*.45)target.scrollIntoView({block:'start',behavior:'instant'});
}
function scheduleDock(){if(dockFrame)return;dockFrame=requestAnimationFrame(()=>{dockFrame=0;syncDockGeometry();});}
function initActionDock(){
 const dock=document.createElement('section');dock.id='action-dock';dock.setAttribute('aria-label','固定操作選單');dock.hidden=true;
 dock.innerHTML='<div class="dock-heading"><div><strong id="dock-title"></strong><span id="dock-summary"></span></div><button id="btn-dock-detail" class="text-button" type="button">看詳情 ↑</button></div>';
 const utility=document.querySelector('.utility-bar'),note=document.querySelector('.action-footnote');
 dock.append(commandMenu,decisionMenu,utility,note);$('app-shell').append(dock);
 const tools=document.createElement('div');tools.className='dock-tools';
 for(const [id,label,fn]of [['save','存檔',openSaveDialog],['guide','指南',()=>$('guide-dialog').showModal()],['look','造型',()=>{renderWardrobe();$('identity-dialog').showModal();}],['audio','♫',()=>{$('btn-sound').click();}]]){const b=document.createElement('button');b.id=`btn-dock-${id}`;b.type='button';b.className='text-button';b.textContent=label;b.setAttribute('aria-label',id==='audio'?'音樂與音效':label);b.onclick=fn;tools.append(b);}
 utility.insertBefore(tools,$('music-status'));$('btn-camp').textContent='◉ 營地商店';$('btn-dock-detail').onclick=()=>{const target=gameState==='LOOT_DECISION'?mainView:$('stage');target.scrollIntoView({block:'start',behavior:'instant'});};
 dockObserver=new ResizeObserver(scheduleDock);dockObserver.observe(dock);dockObserver.observe(document.querySelector('.play-column'));
 window.addEventListener('resize',scheduleDock);window.visualViewport?.addEventListener('resize',scheduleDock);
 syncActionDock();
}
