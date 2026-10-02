/* Initialize the visible game controls after the page is ready. */
function initGameUI(){
 initTitleSelectBox();updateStatus();setScene('map',88);
 story('YOUR STORY BEGINS','在出發之前，先想個好記的名字。','不選也沒關係，旅途會替你想一個。');
 $('app-shell').inert=true;
 $('btn-new-game').onclick=()=>{if(getBestSave()&&!confirm('開始新冒險會取代自動存檔；手動存檔與通關紀錄仍保留。確定開始？'))return;confirmTitle();};
 $('btn-guide').onclick=()=>$('guide-dialog').showModal();
 $('btn-records').onclick=openRecords;
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
 initSaveUI();initEnhancementUI();initMusic();
}
window.addEventListener('DOMContentLoaded',initGameUI);
