/* Encounter definitions contain behavior; saves contain only their stable IDs. */
const choice=(text,hint,act,enabled=()=>true)=>({text,hint,act,enabled});
const EVENTS={
 fox:{title:'一隻假裝不需要幫忙的狐狸',tag:'森林來客',object:123,text:'捕獸夾旁的小狐狸瞪著你。「我只是在研究這個機關。」牠的尾巴卻抖得很誠實。',available:()=>!adventure.flags.fox,
 choices:()=>[choice('分牠一點乾糧','花費 3 金幣 · 結識旅伴',()=>{adventure.gold-=3;adventure.flags.fox=true;adventure.flags.foxAt=adventure.steps;resultEvent('牠決定「順路」跟著你','小狐狸替你嗅出路邊零錢。往後每次戰鬥勝利，多得 2 金幣。',123);},()=>adventure.gold>=3),choice('徒手拆開機關','損失 10% 最大 HP，最低留 1 HP',()=>{hero.hp=Math.max(1,hero.hp-Math.max(1,Math.floor(hero.maxHp*.1)));adventure.flags.fox=true;adventure.flags.foxAt=adventure.steps;resultEvent('手指痛，心裡倒是暖的','狐狸咬住你的披風：好啦，牠加入隊伍。每次勝利額外找到 2 金幣。',123);}),choice('留下安全標記','不付代價 · 繼續前進',()=>resultEvent('你在樹上刻下求援的箭頭','至少，下個路過的人不會再錯過牠。',123))]},
 foxGift:{title:'小狐狸有一份「路上撿的」禮物',tag:'約定的回音',object:123,text:'牠把一包亮晶晶的東西放在你腳邊，然後很忙似的看向別處。',available:()=>false,
 choices:()=>[choice('收下閃亮的禮物','獲得一枚戒指',()=>{adventure.flags.foxGift=true;giveEventLoot('RING','狐狸藏起來的寶物');}),choice('拿去交換補給','獲得 15 金幣並恢復 HP',()=>{adventure.flags.foxGift=true;adventure.gold+=15;healFully();resultEvent('一起吃飽，才有力氣繼續','狐狸堅稱自己沒有搖尾巴。你獲得 15 金幣，HP 恢復全滿。',123);}),choice('一起把它埋起來','獲得武器、盾牌素材各 3',()=>{adventure.flags.foxGift=true;addMaterials('WEAPON',3);addMaterials('SHIELD',3);resultEvent('新的藏寶地點誕生了','整理包裹時找到武器、盾牌素材各 3。狐狸滿意地踩了踩土。',89);})]},
 forge:{title:'只收零件，不收加班費的鐵匠',tag:'路邊工坊',object:100,text:'鐵匠敲了兩下空鍋：「裝備可以壞，手藝不能壞。你的包裡有沒有不要的螺絲？」',
 choices:()=>[choice('買武器零件','8 金幣 → 武器素材 5',()=>{adventure.gold-=8;addMaterials('WEAPON',5);resultEvent('這次敲打很值得','武器素材 +5。有武器時會自動精練；徒手時素材會保留。',100);},()=>adventure.gold>=8),choice('買盾牌零件','8 金幣 → 盾牌素材 5',()=>{adventure.gold-=8;addMaterials('SHIELD',5);resultEvent('安全感也可以敲出來','盾牌素材 +5。有盾牌時會自動精練；沒有盾時不會吃掉素材。',100);},()=>adventure.gold>=8),choice('幫忙收拾工坊','免費 · 隨機素材 2',()=>{const type=Math.random()<.5?'WEAPON':'SHIELD';addMaterials(type,2);resultEvent('好手藝，需要乾淨的桌面',`${type==='WEAPON'?'武器':'盾牌'}素材 +2。鐵匠說下次路過再來坐。`,100);})]},
 chest:{title:'那個寶箱，好像打了個嗝',tag:'可疑的發現',object:89,text:'苔蘚上的寶箱微微晃動，縫裡伸出一點紅色。也許是緞帶；也許不是。',
 choices:()=>[choice('先敲三下再開','穩妥搜查 · 得到 2–4 素材',()=>{const n=randInt(2,4);addMaterials('WEAPON',n);resultEvent('寶箱裡住著一隻打呼的松鼠',`牠抱走橡果，留下武器素材 ${n}。禮貌真的有用。`,91);}),choice('直接掀開蓋子','一半是裝備，一半是怪物',()=>{if(Math.random()<.5)giveEventLoot(Math.random()<.5?'WEAPON':'SHIELD','苔蘚寶箱');else{log('寶箱沒有寶物，卻藏著一隻下班中的哥布林！');startSmallBattle(0);}}),choice('連箱子一起拆了','盾牌素材 +2 · 沒有戰鬥',()=>{addMaterials('SHIELD',2);resultEvent('從另一個角度看，箱子也是素材','盾牌素材 +2。裡面的松鼠對你的工法頗有意見。',91);})]},
 bridge:{title:'寫著「非常安全」的吊橋',tag:'山徑岔路',object:85,text:'牌子是今天才掛的。橋板看起來不是。河對岸有個閃亮的包裹。',
 choices:()=>[choice('慢慢繞過淺灘','安全 · 經驗值 +8',()=>{gainExp(8);resultEvent('慢一點，風景多一點','你平安過河，學會辨認水流，得到 8 經驗值。',85);}),choice('衝過去拿包裹','付出 15% 最大 HP · 必得裝備',()=>{hero.hp=Math.max(1,hero.hp-Math.max(1,Math.floor(hero.maxHp*.15)));giveEventLoot(Math.random()<.5?'WEAPON':'SHIELD','橋另一端的包裹');}),choice('在橋下釣一會兒魚','回復 30% 最大 HP',()=>{const n=healFraction(.3);resultEvent('釣到的不是大魚，是喘息的時間',`你煮了一小鍋魚湯，恢復 ${n} HP。`,86);})]},
 soup:{title:'今日特餐：勇者不准空腹上班',tag:'流動食堂',object:86,text:'大嬸把湯杓敲在鍋邊：「世界末日也要先吃飯。你這臉色，一看就是沒休息。」',
 choices:()=>[choice('來一碗熱湯','6 金幣 · 全滿 HP、解除負面狀態',()=>{adventure.gold-=6;healFully();resultEvent('這碗湯，連疲憊一起暖開了','HP 恢復全滿，灼燒與破甲解除。',86);},()=>adventure.gold>=6),choice('打包一份便當','8 金幣 · 下 5 回合持續回血',()=>{adventure.gold-=8;hero.regenTurns=5;hero.regenAmount=Math.max(3,Math.floor(hero.maxHp*.1));resultEvent('背包裡多了一點家的味道',`接下來 5 個戰鬥回合，每回合回復 ${hero.regenAmount} HP。`,86);},()=>adventure.gold>=8),choice('幫忙洗碗','免費 · 回復 20% HP',()=>{const n=healFraction(.2);resultEvent('你洗得比揮劍還認真',`大嬸多塞了一個麵包。恢復 ${n} HP。`,86);})]},
 courier:{title:'不能再遲到的骷髏郵差',tag:'一個小委託',object:122,text:'「我已經遲到了八十年。」郵差把信交給你，「再晚一點，我就要被扣全勤了。」',available:()=>!adventure.flags.parcel&&!adventure.flags.delivered,
 choices:()=>[choice('順路幫忙送信','後續探索會遇到收件人',()=>{adventure.flags.parcel=true;adventure.flags.parcelAt=adventure.steps;resultEvent('八十年的信，終於又往前走了一點','你收下了信。往前探索幾次，留意路邊的小屋。',122);}),choice('幫他畫一張路線圖','立即獲得 8 金幣',()=>{adventure.gold+=8;resultEvent('地圖要先轉正才看得懂','郵差終於發現自己一直把地圖拿反。金幣 +8。',122);}),choice('聽他抱怨一下','經驗值 +10',()=>{gainExp(10);resultEvent('死人也有職場壓力','你學到了幾個避免加班的方法。經驗值 +10。',122);})]},
 delivery:{title:'小屋裡還有人在等那封信',tag:'委託的後續',object:100,text:'老人看到信封，沉默了好一陣子。「原來，他真的有寄。」窗邊的茶還溫著。',available:()=>false,
 choices:()=>[choice('收下紀念用的戒指','完成委託 · 獲得戒指',()=>{adventure.flags.parcel=false;adventure.flags.delivered=true;giveEventLoot('RING','一封遲到八十年的信');}),choice('留下喝一杯茶','完成委託 · 20 金幣、全滿 HP',()=>{adventure.flags.parcel=false;adventure.flags.delivered=true;adventure.gold+=20;healFully();resultEvent('有些故事，慢慢聽才好','老人分享了當年的冒險。你獲得 20 金幣，HP 全滿。',100);}),choice('把報酬換成補給','完成委託 · 兩種素材各 5',()=>{adventure.flags.parcel=false;adventure.flags.delivered=true;addMaterials('WEAPON',5);addMaterials('SHIELD',5);resultEvent('帶著別人的祝福繼續走','武器、盾牌素材各 +5。門口的風鈴替你送行。',100);})]},
 shrine:{title:'神像今天不收香油錢',tag:'林間神龕',object:84,text:'石碑上寫著：「許願請具體。『變強』不算具體。」你懷疑神明也受夠了模糊需求。',
 choices:()=>[choice('祈求一往無前','付出 10% HP · 5 回合傷害 +30%',()=>{hero.hp=Math.max(1,hero.hp-Math.max(1,Math.floor(hero.maxHp*.1)));hero.buffDamageUpTurns=5;hero.buffDamageUpRate=.3;resultEvent('你的願望，神明有讀完','接下來 5 個戰鬥回合，砍擊與魔法基礎攻擊提升 30%。',84);}),choice('祈求看清前路','下 5 回合看穿敵人出招',()=>{adventure.scoutTurns=5;resultEvent('霧裡的動作突然清楚了','接下來 5 個戰鬥回合，敵人的下一招會直接顯示。',84);}),choice('幫神像擦掉鳥糞','恢復 25% HP',()=>{const n=healFraction(.25);resultEvent('神明沒有說話，但你感覺好多了',`恢復 ${n} HP。這大概就是功德。`,84);})]},
 bard:{title:'吟遊詩人的新歌，還沒寫副歌',tag:'旅途樂聲',object:87,text:'「傳說中有位勇者──」他停下來看著你，「後面那句你自己選，好嗎？」',
 choices:()=>[choice('「一刀砍翻全公司」','下 4 回合傷害 +25%',()=>{hero.buffDamageUpTurns=4;hero.buffDamageUpRate=.25;resultEvent('你聽完，突然很想準時下班','接下來 4 個戰鬥回合，砍擊與魔法基礎攻擊提升 25%。',87);}),choice('「每天睡滿八小時」','恢復 40% HP',()=>{const n=healFraction(.4);resultEvent('最好的英雄故事，也需要休止符',`你在歌聲中打了個盹，回復 ${n} HP。`,87);}),choice('「先付我出場費」','獲得 6 金幣',()=>{adventure.gold+=6;resultEvent('合約精神，從小細節開始','詩人心痛地拿出 6 金幣，並把你寫進反派名單。',87);})]},
 spring:{title:'會冒泡的泉水，不一定是汽水',tag:'喘息的地方',object:116,text:'泉邊立著小牌子：「請勿把裝備也丟進來。上次的劍我還沒撈到。」',
 choices:()=>[choice('坐下泡一會兒','全滿 HP · 解除負面狀態',()=>{healFully();resultEvent('今天最值得停下來的地方','你洗去身上的疲憊與詛咒，HP 全滿。',116);}),choice('撈撈看那把劍','獲得武器素材 4',()=>{addMaterials('WEAPON',4);resultEvent('劍沒撈到，螺絲倒是很多','武器素材 +4。你把泉邊整理乾淨才離開。',103);}),choice('觀察水中的倒影','看穿接下來 4 回合的敵人招式',()=>{adventure.scoutTurns=4;resultEvent('水面映出的，是還沒發生的事','下 4 個戰鬥回合可看穿敵方下一招。',116);})]},
 elite:{title:'菁英怪在徵求練習對手',tag:'自選挑戰',object:110,text:'「說好，點到為止。醫藥費各付各的。」對方把裝備獎品放在地上，等你答應。',available:()=>hero.level>=4,
 choices:()=>[choice('接受挑戰','較強敵人 · 勝利必掉裝備',()=>startEliteBattle()),choice('先請他教一招','花費 5 金幣 · 經驗值 +18',()=>{adventure.gold-=5;gainExp(18);resultEvent('今天不用流血也學得到東西','菁英怪教你三種站姿。經驗值 +18。',110);},()=>adventure.gold>=5),choice('禮貌地說改天','沒有代價 · 安全離開',()=>resultEvent('量力而為，也是一種勇氣','你交換了聯絡方式。當然，這裡並沒有手機訊號。',110))]},
 merchant:{title:'迷路商人的「最後一天特價」',tag:'小小補給站',object:85,text:'他說這是最後一天。但你很確定，剛才在另一條路也看到一樣的招牌。',
 choices:()=>[choice('買武器包裹','12 金幣 · 隨機武器',()=>{adventure.gold-=12;giveEventLoot('WEAPON','商人的武器包裹');},()=>adventure.gold>=12),choice('買護具包裹','10 金幣 · 隨機盾牌',()=>{adventure.gold-=10;giveEventLoot('SHIELD','商人的護具包裹');},()=>adventure.gold>=10),choice('只問路，不消費','免費 · 經驗值 +6',()=>{gainExp(6);resultEvent('商人的笑容依然專業','你記下他口中的近路，得到 6 經驗值。',85);})]},
 campfire:{title:'營火旁，留了一個位置',tag:'陌生人的善意',object:88,text:'旅人沒有問你打倒了幾隻怪，只往旁邊挪了挪。「坐吧，火還很暖。」',
 choices:()=>[choice('交換一路上的故事','恢復 35% HP · 經驗值 +8',()=>{healFraction(.35);gainExp(8);resultEvent('不是每次停下，都叫做浪費時間','你吃了熱食，交換了情報。回復 35% HP，經驗值 +8。',88);}),choice('一起修補裝備','兩種素材各 +2',()=>{addMaterials('WEAPON',2);addMaterials('SHIELD',2);resultEvent('一個人難弄，兩個人就容易多了','武器素材 +2、盾牌素材 +2。',88);}),choice('守夜，讓他先睡','獲得 10 金幣',()=>{adventure.gold+=10;resultEvent('明早的包裹裡，多了一張謝謝','金幣 +10。你沒有叫醒他，輕輕離開營地。',88);})]}
};
function pickEvent(){
 if(adventure.flags.parcel&&adventure.steps-adventure.flags.parcelAt>=3)return 'delivery';
 if(adventure.flags.fox&&!adventure.flags.foxGift&&adventure.steps-adventure.flags.foxAt>=5)return 'foxGift';
 const eligible=Object.keys(EVENTS).filter(id=>(!EVENTS[id].available||EVENTS[id].available())&&id!==adventure.lastEvent);
 if(!adventure.eventDeck.some(id=>eligible.includes(id))){adventure.eventDeck=[...eligible];for(let i=adventure.eventDeck.length-1;i>0;i--){const j=randInt(0,i);[adventure.eventDeck[i],adventure.eventDeck[j]]=[adventure.eventDeck[j],adventure.eventDeck[i]];}}
 let id;while(adventure.eventDeck.length&&!eligible.includes(id))id=adventure.eventDeck.pop();return id||eligible[0]||'campfire';
}
function enterEvent(id){if(!EVENTS[id])return;gameState='EVENT';adventure.eventId=id;adventure.lastEvent=id;adventure.eventResolved=false;adventure.eventVisits[id]=(adventure.eventVisits[id]||0)+1;renderEvent();saveAuto();}
function renderEvent(){const e=EVENTS[adventure.eventId];setScene('event',e.object);story(e.tag,e.title,e.text);const choices=e.choices();setCommands(...choices.map((c,i)=>({text:c.text,hint:c.hint,value:i,disabled:!c.enabled()})),chooseEvent,'EVENT');$('action-tip').textContent='先看代價，再做選擇。這個決定會留在你的旅程裡。';}
function chooseEvent(index){
 if(gameState!=='EVENT'||adventure.eventResolved||!Number.isInteger(index))return;
 const c=EVENTS[adventure.eventId]?.choices()[index];if(!c||!c.enabled())return;
 gameState='EVENT_RESOLVING';adventure.eventResolved=true;adventure.stats.events++;disableCommands(true);
 c.act();updateStatus();saveAuto();
}
function resultEvent(title,text,object=89){adventure.result={title,text,object,tag:'旅途的回聲'};adventure.eventId=null;gameState='RESULT';renderResult();saveAuto();}
function giveEventLoot(type,source){log(`✦ ${source}：你發現了一件裝備。`);offerLoot(generateLoot(type,false));}
