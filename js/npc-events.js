/* Dialogue choices are explicit; danger, costs and chances are disclosed before selection. */
Object.assign(EVENTS,{
 npc_party:{title:'三個冒險者，四種前進方向',tag:'其他冒險隊',object:88,text:()=>`${npcNames()} 正在吵誰拿反地圖。阿苔堅持自己只是測試大家有沒有在看路。`,choices:()=>[
 choice('一起走兩場','阿苔暫時加入 · 交情 +1',()=>recruitNpc('moss')),
 choice('交換路線情報','交情 +1 · 洞察至少 3 回合',()=>{npcBond(ensureSocial().active,1);adventure.scoutTurns=Math.max(3,adventure.scoutTurns);resultEvent('露娜把地圖轉正，世界突然順眼了','你記下情報。他們會記得你曾幫忙，往後說話也會不同。',84);}),
 choice('假裝自己只是在散步','安全離開 · 無報酬',()=>resultEvent('你把吵架的工作留給專業人士','沒損失，也沒拿獎勵。三個人的友情暫時還沒有解散。',88))]},
 npc_rival:{title:'白梨說：切磋而已，我會放水',tag:'主角以外的冒險者',object:98,text:'白梨拔出劍，小叮則準備好計分板。你發現「放水」旁邊寫著很小的免責聲明。',choices:()=>[
 choice('接受切磋','真正戰鬥 · 勝利有經驗、金幣與掉落機會',()=>startNpcBattle(['snow'],true)),
 choice('請她示範招式','6 金幣 · 經驗、交情 +1',()=>{adventure.gold-=6;journeyXP(.16);npcBond(['snow'],1);resultEvent('她示範得很慢，你還是只看到殘影','得到經驗值。白梨說你有進步，至少這次沒拿反劍。',98);},()=>adventure.gold>=6),
 choice('誠實承認今天懶得打','安全離開',()=>resultEvent('白梨說，她也只是想找人聊天','你們交換一句抱怨。不是每次見面都需要打架。',98))]},
 npc_bandits:{title:'盜賊三人組的收費站',tag:'不太友善的遭遇',object:85,text:()=>`${npcNames()} 擋在路中央。金牙喊「此路是我開」，板磚補了一句「其實是公家鋪的」。`,choices:()=>[
 choice('打敗他們','三人隊伍戰 · 勝利必掉裝備與額外金幣',()=>startNpcBattle(['coin','brick','snip'])),
 choice('說服他們改行',`交涉成功率 ${npcCheckChance('talk')}% · 依平手率、等級與名聲`,()=>npcNegotiate(['coin','brick','snip'])),
 choice('找空隙逃離',npcEscapeHint(),()=>npcTryEscape(['coin','brick','snip']))]},
 npc_pickpocket:{title:'小剪的手，放在不太對的口袋',tag:'市場扒手',object:85,text:'阿栗故意大喊「誰的錢包掉了」，小剪轉頭比你還快。你這才發現他的手在你包裡。',choices:()=>[
 choice('當場抓住他','單人戰 · 勝利額外金幣、裝備',()=>startNpcBattle(['snip'])),
 choice('追他進小巷',`追上機率 ${npcCheckChance('escape')}% · 失敗最多損失 15% 金幣（上限18）`,()=>{if(runRandom()*100<npcCheckChance('escape')){npcBond(['amber'],1);startNpcBattle(['snip']);}else{const loss=Math.min(18,Math.floor(adventure.gold*.15));adventure.gold-=loss;resultEvent('他跑得快，你罵得更快',`損失 ${loss} 金幣，裝備沒有被偷。阿栗替你記下他的特徵。`,85);}}),
 choice('緊抓錢包，先離開','無損失 · 不追擊',()=>resultEvent('有時候，不上鉤就是贏了','你保住所有金幣和裝備，沒有拿到戰利品。',85))]},
 npc_ambush:{title:'商人的護衛，正在搶自己的老闆',tag:'洞穴裡的翻臉',object:85,text:'阿栗看到你差點哭出來。「他們剛才說加薪，我還以為在開玩笑！」金牙表示這叫內部轉帳。',choices:()=>[
 choice('幫阿栗擺平護衛','兩人戰 · 商人交情 +2；勝利另有懸賞',()=>{npcBond(['amber'],2);startNpcBattle(['coin','brick'],false,12);}),
 choice('勸板磚看清勞動合約',`交涉 ${npcCheckChance('talk')}% · 失敗會開戰`,()=>npcNegotiate(['coin','brick'])),
 choice('先顧好自己',npcEscapeHint(),()=>{npcBond(['amber'],-1);npcTryEscape(['coin','brick']);})]},
 npc_tavern:{title:'酒館組隊，隊名吵了半小時',tag:'三人一桌的冒險者',object:86,text:'阿苔提議「方向感很好」，白梨投反對票。紅豆只在乎隊伍能不能報銷晚餐。',choices:()=>[
 choice('請大家吃點東西','8 金幣 · 回復 30% HP、三人交情 +1',()=>{adventure.gold-=8;healFraction(.3);npcBond(ensureSocial().active,1);resultEvent('隊名最後叫「先吃再說」','HP 回復 30%。三個人都記得這頓飯是你請的。',86);},()=>adventure.gold>=8),
 choice('邀白梨暫時同行','接下來 2 場有夥伴支援',()=>recruitNpc('snow')),
 choice('只聽旅途八卦','免費 · 洞察至少 2 回合',()=>{adventure.scoutTurns=Math.max(2,adventure.scoutTurns);resultEvent('你聽到三個版本，只有一個是真的','但首領會蓄力這件事，三個人都同意。洞察至少 2 回合。',86);})]},
 npc_wounded:{title:'盾衛的盾沒壞，人先累了',tag:'沼澤救援',object:88,text:'鐵餅坐在泥地裡，露娜正把補血咒語念成請假申請書。他們這場冒險顯然不太順。',choices:()=>[
 choice('分一瓶藥水給鐵餅','消耗藥水 1 · 他會陪你打兩場',()=>{ensureExpedition().potions--;npcRecord('iron').hp=npcRecord('iron').maxHp;recruitNpc('iron');},()=>ensureExpedition().potions>0),
 choice('一起修補裝備','兩人交情 +1 · 盾素材 +2',()=>{npcBond(['iron','lune'],1);addMaterials('SHIELD',2);resultEvent('修好盾之後，他說還想修一下人生','盾素材 +2。露娜記住你願意蹲下來幫忙。',88);}),
 choice('說你去叫人，然後先走','安全離開 · 交情 −1',()=>{npcBond(['iron','lune'],-1);resultEvent('他們目送你離開，沒說什麼','以後再遇到，可能不會那麼熱情。',88);})]},
 npc_fake_guard:{title:'這位守衛的制服好像穿反了',tag:'假哨站',object:97,text:'板磚拿著通行費牌子，金牙在後面教他念。「我代表村長收稅！」背後的字卻是「盜賊公會」。',choices:()=>[
 choice('拆穿並交手','兩人戰 · 勝利有懸賞',()=>startNpcBattle(['brick','coin'],false,8)),
 choice('問他村長叫什麼',`交涉 ${npcCheckChance('talk')}% · 失敗開戰`,()=>npcNegotiate(['brick','coin'])),
 choice('付錢通過','8 金幣 · 確定安全，不給裝備',()=>{adventure.gold-=8;resultEvent('板磚收錢後還找了你一張發票','你安全離開，決定不去研究那張發票。',97);},()=>adventure.gold>=8)]},
 npc_camp:{title:'營地裡不只有你在冒險',tag:'坐下來聊兩句',object:88,available:()=>false,text:()=>`${npcNames()} 朝你揮手。這些是有自己性格與旅程紀錄的 NPC；他們會記得前幾次相遇。`,choices:()=>[
 choice('聊聊最近打的怪','免費 · 交情 +1、洞察至少 1 回合',()=>{npcBond(ensureSocial().active,1);adventure.scoutTurns=Math.max(1,adventure.scoutTurns);resultEvent('你們交換了一點用得到的抱怨','洞察至少 1 回合。探索一次再回來，可以看到誰還留在營地。',88);}),
 choice('用補給交換情報','6 金幣 · 交情 +1、洞察至少 4 回合',()=>{adventure.gold-=6;npcBond(ensureSocial().active,1);adventure.scoutTurns=Math.max(4,adventure.scoutTurns);resultEvent('他把真正有用的部分畫在地圖背面','洞察至少 4 回合。這次沒有畫反。',88);},()=>adventure.gold>=6),
 choice('說聲嗨就走','沒有代價 · 回營地',()=>resultEvent('路上小心，下次再聊','他們繼續整理自己的行囊。你也還有路要走。',88))]}
});
