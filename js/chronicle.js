/* Odd little stories with costs, persistent consequences and a few delayed payoffs. */
function journeyXP(fraction=.16){gainExp(Math.max(8,Math.floor(hero.expToNextLevel*fraction)));}
function safeWound(rate){const n=Math.min(hero.hp-1,Math.max(1,Math.floor(hero.maxHp*rate)));hero.hp-=Math.max(0,n);return Math.max(0,n);}
Object.assign(EVENTS,{
 relic_shrine:{title:'神明清倉，不接受退貨',tag:'失物招領',object:84,available:()=>false,text:'神像把桌上三樣破爛推給你：「這些不是垃圾，是尚未被理解的神器。」',choices:()=>ensureExpedition().relicOffers.map((id,i)=>choice(RUN_RELICS[id].name,RUN_RELICS[id].desc,()=>takeRelic(i)))},
 living_luggage:{title:'你的行李說它也要休假',tag:'勞資糾紛（背包限定）',object:92,text:'一只箱子追上你，堅稱自己才是主角。「你只是負責背我的交通工具。」',choices:()=>[
 choice('支付行李的交通費','6 金幣 → 藥水 +2',()=>{adventure.gold-=6;ensureExpedition().potions=Math.min(5,ensureExpedition().potions+2);resultEvent('箱子收錢後，態度非常親切','牠吐出兩瓶藥水，並偷偷把你列為常客。',91);},()=>adventure.gold>=6),
 choice('跟牠比誰比較會裝','50% 拿戒指；50% 損失 15% HP',()=>{if(runRandom()<.5)giveEventLoot('RING','行李認輸的賠禮');else{safeWound(.15);resultEvent('你裝得太像，被當行李摔了一下','損失 15% 最大 HP，最低保留 1 HP。箱子給你的演技五顆星。',92);}}),
 choice('把牠寄回家','免費 · 經驗值',()=>{journeyXP(.12);resultEvent('沒有填地址，照樣寄出了','郵差說他們從不保證送達，但保證會迷路。',122);})]},
 receipt_duel:{title:'收據比怪物還難打',tag:'報帳副本',object:85,text:'商人說你上次救了世界沒有開發票，所以世界和平不能報帳。',choices:()=>[
 choice('補開統一發票','花 8 金幣 · 防禦素材 +5',()=>{adventure.gold-=8;addMaterials('SHIELD',5);resultEvent('發票的紙比你的盾還硬','盾牌素材 +5，商人提醒你月底前送件。',85);},()=>adventure.gold>=8),
 choice('把收據當武器','武器素材 +3 · 損失 10% HP',()=>{safeWound(.1);addMaterials('WEAPON',3);resultEvent('紙割傷是真的傷','武器素材 +3。你從此不敢輕視文書工作。',103);}),
 choice('宣稱自己是贈品','免費 · 獲得 5 金幣',()=>{adventure.gold+=5;resultEvent('商人把你放進買一送一專區','你趁他轉身找膠帶時逃走，順手領了 5 金幣的體驗費。',85);})]},
 chicken_loan:{title:'一隻雞跟你借創業基金',tag:'高風險投資（雞界）',object:88,available:()=>!ensureExpedition().flags.chickenLoan&&!ensureExpedition().flags.chickenDone,text:'「咕。」雞說。旁邊寫著：年化報酬一百顆蛋，保本不保命。',choices:()=>[
 choice('投資雞的夢想','12 金幣 · 幾次探索後收到回報',()=>{adventure.gold-=12;const e=ensureExpedition();e.flags.chickenLoan=adventure.steps;resultEvent('牠留下了一個腳印當合約','雞帶著錢跑了。也許牠真的是去創業。',88);},()=>adventure.gold>=12),
 choice('只投資一頓飯','回復 25% HP',()=>{healFraction(.25);resultEvent('你和雞一起吃了素食','牠開始相信這世界還有好人。',86);}),
 choice('要求五年營運計畫','經驗值 · 免費',()=>{journeyXP(.12);resultEvent('雞沉默了，你學到很多','至少你現在知道，咕咕叫不等於有商業模式。',85);})]},
 chicken_return:{title:'雞真的回來了，還穿著領帶',tag:'前面的選擇有了回音',object:85,available:()=>false,text:'牠帶著兩個保鑣，還有一張人類看不懂的損益表。你決定先問錢在哪。',choices:()=>[
 choice('領取現金分紅','收回 30 金幣',()=>{const e=ensureExpedition();e.flags.chickenDone=true;e.flags.chickenLoan=0;adventure.gold+=30;resultEvent('這是你見過最守信用的雞','金幣 +30。狐狸對自己一直只撿兩塊錢感到壓力。',85);}),
 choice('把分紅換成奇物','選一件旅途奇物',()=>{const e=ensureExpedition();e.flags.chickenDone=true;e.flags.chickenLoan=0;prepareRelicOffers();enterEvent('relic_shrine');}),
 choice('要一年的雞蛋','藥水與解毒藥各 +2（上限 5）',()=>{const e=ensureExpedition();e.flags.chickenDone=true;e.flags.chickenLoan=0;e.potions=Math.min(5,e.potions+2);e.antidotes=Math.min(5,e.antidotes+2);resultEvent('雞把業務轉交給了鴨','補給各 +2。你決定不追究為什麼雞蛋會裝在藥瓶裡。',86);})]},
 door_interview:{title:'一扇門要求你先面試',tag:'會說話的捷徑',object:33,text:'「請用三個詞形容你自己。」門問。你懷疑牠只是想收集你的稱號資料。',choices:()=>[
 choice('誠實、自律、沒帶鑰匙','免費 · 多取得 1 通行線索',()=>{const e=ensureExpedition();e.clues=Math.min(requiredClues(),e.clues+1);resultEvent('門笑得把鉸鏈震鬆了','通行線索 +1。你從門框旁邊走了過去。',33);}),
 choice('敲門，但用劍','武器素材 +4 · 損失 12% HP',()=>{safeWound(.12);addMaterials('WEAPON',4);resultEvent('面試結束，雙方都不太滿意','武器素材 +4。門說你的溝通方式非常直接。',103);}),
 choice('反問薪資與休假','獲得經驗，門不再說話',()=>{journeyXP(.18);resultEvent('這次輪到門保持沉默','你學會了讓任何面試快速結束的方法。',33);})]},
 ghost_band:{title:'幽靈樂團缺一個活人觀眾',tag:'地下音樂會（真的地下）',object:84,text:'主唱說只要有人鼓掌，他們就能安心成佛。鼓手提醒他這是搖滾樂團。',choices:()=>[
 choice('聽完安可曲','花 6 金幣 · 下 5 回合傷害 +25%',()=>{adventure.gold-=6;hero.buffDamageUpTurns=5;hero.buffDamageUpRate=.25;resultEvent('你獲得了不屬於這個世界的節拍','砍擊與魔法基礎攻擊 +25%，持續 5 個戰鬥回合。',84);},()=>adventure.gold>=6),
 choice('上台敲三角鐵','看穿下 3 回合敵人出招',()=>{adventure.scoutTurns=Math.max(adventure.scoutTurns,3);resultEvent('三角鐵一響，靈魂都震清醒了','洞察至少 3 回合。主唱說你搶戲搶得很專業。',87);}),
 choice('幫他們把音量調小','恢復 25% HP',()=>{healFraction(.25);resultEvent('你終於聽見自己的心跳','恢復 25% HP。樂團對這種前衛的寂靜十分感動。',84);})]},
 slime_court:{title:'史萊姆告你踩到牠的影子',tag:'森林小額法庭',object:108,text:'法官也是史萊姆，陪審團也是。唯一的證人是一灘水。',choices:()=>[
 choice('庭外和解','8 金幣 · 解毒藥 +3',()=>{adventure.gold-=8;const e=ensureExpedition();e.antidotes=Math.min(5,e.antidotes+3);resultEvent('法官判定：皆大歡喜','解毒藥 +3。原告主動替你擦乾鞋子。',108);},()=>adventure.gold>=8),
 choice('要求影子出庭作證','免費 · 經驗值 + 金幣 4',()=>{journeyXP(.15);adventure.gold+=4;resultEvent('法庭陷入了哲學危機','你在休庭期間離開，還拿到 4 金幣交通補助。',108);}),
 choice('把整間法庭舀進桶子','普通戰鬥 · 勝利可打寶',()=>{log('史萊姆的律師開始憤怒冒泡！');startSmallBattle(0);})]},
 fortune_cookie:{title:'預言餅乾預言了你會吃它',tag:'百分之百準確',object:86,text:'紙條寫著：「接下來你會看到三個選項。」太準了，令人毛骨悚然。',choices:()=>[
 choice('把紙條也吃掉','損失 8% HP · 看穿下 6 回合出招',()=>{safeWound(.08);adventure.scoutTurns=Math.max(6,adventure.scoutTurns);resultEvent('你吃下了未來，也有點噎到','洞察至少 6 回合。未來的味道像廉價油墨。',86);}),
 choice('分給狐狸／路人','藥水 +1',()=>{const e=ensureExpedition();e.potions=Math.min(5,e.potions+1);resultEvent('紙條說：好心會有好報','你得到 1 瓶藥水。餅乾公司對這次業配很滿意。',88);}),
 choice('要求餅乾先報明牌','50% +18 金幣；50% 沒中',()=>{const win=runRandom()<.5;if(win)adventure.gold+=18;resultEvent(win?'你中了！但只有十八塊':'餅乾說，它只預言過去',win?'金幣 +18。不要拿去加碼。':'沒有損失，也沒有收穫。至少餅乾不難吃。',86);})]},
 clock_fixer:{title:'修鐘師傅把星期一拆掉了',tag:'時間維修站',object:87,text:'「所以大家都精神很好。」他說。你看著牆上的星期二，感覺它也快下班了。',choices:()=>[
 choice('買一段午休時間','10 金幣 · HP 全滿、負面狀態全清',()=>{adventure.gold-=10;healFully();hero.poisonStacks=0;resultEvent('你醒來時，天氣還是剛才那樣','HP 全滿，毒、灼燒與破甲解除。',87);},()=>adventure.gold>=10),
 choice('幫忙撿地上的秒針','盾牌素材 +3',()=>{addMaterials('SHIELD',3);resultEvent('時間就是金錢，秒針就是素材','盾牌素材 +3。別把它調回星期一。',87);}),
 choice('把明天的勇氣借來','下 4 回合傷害 +30%',()=>{hero.buffDamageUpTurns=4;hero.buffDamageUpRate=.3;resultEvent('明天的你可能會有點慫','本次先勇敢一下：砍擊與魔法 +30%，持續 4 回合。',87);})]},
 soup_inspector:{title:'假冒的食安員，真的會解毒',tag:'遺跡攤販',object:85,text:'證件上寫「食安猿」，照片是一隻猴子。他堅稱是印刷錯誤。',choices:()=>[
 choice('買他的解毒藥','7 金幣 → 解毒藥 +2',()=>{adventure.gold-=7;const e=ensureExpedition();e.antidotes=Math.min(5,e.antidotes+2);resultEvent('證件雖假，藥倒是真的','解毒藥 +2。猿先生祝你食用愉快。',85);},()=>adventure.gold>=7),
 choice('舉發他的錯字','獲得 6 金幣封口費',()=>{adventure.gold+=6;resultEvent('他現場改成了「食安元」','金幣 +6。你決定讓他先去學國字。',85);}),
 choice('試喝免費檢驗樣本','HP +30%，50% 中 1 層毒',()=>{healFraction(.3);if(runRandom()<.5)hero.poisonStacks=Math.min(5,hero.poisonStacks+1);resultEvent('檢驗結果是：需要再檢驗','恢復 30% HP；可能帶有 1 層毒，開打前留意狀態。',86);})]},
 lost_hero:{title:'有人穿著跟你一樣的裝備',tag:'主角撞衫',object:98,text:'對方拿出一張主角證明。「你也是？」你們決定先不要吵，兩個主角打折嗎？',choices:()=>[
 choice('交換打王心得','下 5 回合洞察',()=>{adventure.scoutTurns=Math.max(adventure.scoutTurns,5);resultEvent('他說，看到蓄力就不要裝沒看到','洞察至少 5 回合。這建議居然真的有用。',98);}),
 choice('交換剩下的零件','兩種素材各 +2',()=>{addMaterials('WEAPON',2);addMaterials('SHIELD',2);resultEvent('互相交換之後，兩個背包都更重了','武器與盾牌素材各 +2。',98);}),
 choice('決定誰當下一集主角','菁英切磋 · 較高風險',()=>startEliteBattle())]}
});
Object.assign(EVENT_CAST,{relic_shrine:['sage','violet'],receipt_duel:['merchant'],chicken_loan:['auburn'],chicken_return:['merchant'],door_interview:['sentinel'],ghost_band:['violet','sage'],fortune_cookie:['veteran'],clock_fixer:['smith'],soup_inspector:['merchant'],lost_hero:['swordsman','silver','ranger']});
const oldPickEvent=pickEvent;
pickEvent=function(){const e=ensureExpedition();if(e.flags.chickenLoan&&adventure.steps-e.flags.chickenLoan>=4)return 'chicken_return';const id=oldPickEvent();e.recent.push(id);e.recent=e.recent.slice(-5);return id;};
