/* Named scene variants for the game's local display. */
const WORLD_PLACES={forest:'林間小徑',village:'風鈴村莊',market:'流動市集',tavern:'歪杯子酒館',cave:'迴聲洞穴',marsh:'迷霧沼澤',road:'舊石板商道',camp:'旅人營地',ruins:'巫妖祠堂',volcano:'餘燼龍巢',citadel:'發條城寨',casino:'倒轉骰宮'};
const EVENT_PLACES={forge:'village',merchant:'market',soup:'tavern',bard:'tavern',courier:'road',delivery:'village',spring:'marsh',bridge:'road',chest:'cave',campfire:'camp',shrine:'ruins',elite:'road',relic_shrine:'ruins',living_luggage:'market',receipt_duel:'market',chicken_loan:'village',chicken_return:'market',door_interview:'citadel',ghost_band:'cave',slime_court:'marsh',fortune_cookie:'tavern',clock_fixer:'village',soup_inspector:'market',lost_hero:'camp'};
function settlementPlace(){return ['village','market','camp','citadel','tavern'][Math.min(4,bossLevel-1)];}
function currentPlace(mode){
 if(gameState==='TITLE')return 'forest';
 if(mode==='battle'&&adventure.battle?.isBoss)return ['ruins','volcano','marsh','citadel','casino'][Math.min(4,bossLevel-1)];
 if(gameState==='MAP')return settlementPlace();
 if(gameState==='ROUTE')return 'road';
 return adventure.expedition?.place||'forest';
}
function showPlace(mode){
 const place=currentPlace(mode);$('stage').dataset.place=place;
 $('region-label').textContent=WORLD_PLACES[place];
 let layer=$('place-scenery');
 if(!layer){layer=document.createElement('div');layer.id='place-scenery';layer.setAttribute('aria-hidden','true');for(let i=0;i<5;i++){const item=document.createElement('i');item.className='scenery-piece piece-'+i;layer.append(item);}$('stage').insertBefore(layer,$('hero-actor'));}
 layer.dataset.place=place;
}
