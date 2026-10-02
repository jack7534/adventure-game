/* Visible client version and an opt-in, save-safe update action. Never clears localStorage. */
let newestRelease=null,checkingRelease=false;
function reloadLatestRelease(){
 if(gameState!=='TITLE'&&!STABLE_PHASES.includes(gameState)){toast('請等這個動作完成，再更新版本。');return;}
 if(gameState!=='TITLE'&&!saveAuto()){toast('存檔未成功，請先匯出 JSON 備份再重新整理。',true);return;}
 const u=new URL(location.href);u.pathname=u.pathname.replace(/index\.html$/,'');u.searchParams.set('v',(newestRelease?.version||APP_RELEASE.version)+'-'+(newestRelease?.revision||APP_RELEASE.revision));u.searchParams.set('refresh',Date.now().toString(36));location.assign(u.href);
}
async function checkRelease(manual=false){
 if(checkingRelease)return;checkingRelease=true;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const url=new URL('version.json',location.href);url.searchParams.set('check',Date.now().toString(36));
  const response=await fetch(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('版本檔無法讀取');const info=await response.json();
  if(typeof info.version!=='string'||!/^\d+\.\d+\.\d+$/.test(info.version)||typeof info.revision!=='string'||! /^[a-f0-9]{12}$/.test(info.revision))throw new Error('版本檔格式無效');
  const parts=info.version.split('.').map(Number),current=APP_RELEASE.version.split('.').map(Number);let cmp=0;for(let i=0;i<3;i++){if(parts[i]!==current[i]){cmp=Math.sign(parts[i]-current[i]);break;}}
  if(cmp<0){if(manual)toast('網站版本檔仍在同步，目前這頁已是較新版。');return;}
  newestRelease=info;const changed=info.revision!==APP_RELEASE.revision;$('update-game').hidden=!changed;
  $('release-message').textContent=changed?`新版 v${info.version} 已可用，存檔後更新。`:`正式站與目前版本一致 · ${APP_RELEASE.revision.slice(0,7)}`;
  if(manual&&!changed)toast(`目前是 v${APP_RELEASE.version}，與正式站一致。`);
 }catch(error){if(manual){$('release-message').textContent='暫時無法確認伺服器版本；你的存檔沒有被清除。';toast('檢查更新失敗，稍後可再試；不影響遊戲。',true);}}
 finally{clearTimeout(timer);checkingRelease=false;}
}
function initReleaseUI(){
 const bar=document.createElement('div');bar.className='release-strip';bar.innerHTML=`<strong id="client-version">v${APP_RELEASE.version} · 馭獸同行</strong><span id="release-message">雙戰鬥路線 · 連續獵怪 · 中後期配裝適應</span><button id="check-update" class="text-button">檢查更新</button><button id="update-game" class="secondary" hidden>存檔並更新</button>`;
 document.querySelector('.topbar').after(bar);$('check-update').onclick=()=>checkRelease(true);$('update-game').onclick=reloadLatestRelease;
 const welcome=document.createElement('small');welcome.className='welcome-version';welcome.textContent=`v${APP_RELEASE.version} · 32 種造型／馭獸同行`;
 document.querySelector('.welcome-actions').prepend(welcome);checkRelease(false);
}
