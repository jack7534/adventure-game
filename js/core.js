/* Original game data, progression, and affix combat helpers. Jack, 2025–2026. */

    let gameState = 'TITLE';
    let totalTurnCount = 0;   // 這是你原本用來記錄破關排序的
    let turnCount = 0;        // 這個用來顯示「目前第幾回合」

    // ===== 稱號文字庫 =====

    const turnCountSpan = document.getElementById('turn-count');
    // 你之後想要 30 個就一直加
    const TITLE_A = [
      '烈焰', '爆轟', '蒼雷', '深淵', '迅影',
      '無畏', '孤高', '狂躁', '沉穩', '冰牙',
      '斬鐵', '迅猛', '赤紅', '秘境', '月影',
      '碎星', '朦朧', '滑稽', '胖胖', '奇妙',
      '背刺型', '超怕痛', '很會睡', '超衰', '超歐',
      '深海系', '熔岩系', '夢幻', '隱匿', '笨拙','視覺系',
      '偉大','暴走','神秘','無情','熱血',
      '悠哉','傳說中','孤獨','勇敢','佛系'
    ];
    const TITLE_B = [
      '暴走', '貪吃', '高能', '省電', '大雞雞',
      '迷了路的', '三分鐘熱度的', '不讀說明書的', '背包滿滿', '滿身DEBUFF',
      '怒氣值滿的', '操作鬼才', '臨時抱佛腳的', '邊走邊摸魚的', '太早起的',
      '人來瘋', '不講武德的', '躺著贏的', '躲草叢的', '手滑',
      '超會卡牆角的', '死要錢的', '喝藥喝很兇的', '怕痛的', '打王專用',
      '愛亂衝的', '不乾淨的', '放生隊友的', '網路卡卡', '認真的',
      '帥氣','陰沉','暴怒','冷靜','邊緣',
      '早睡','非洲','歐洲','開外掛'
    ];
    const TITLE_C = [
      '獵人', '研磨師', '大劍客', '連擊者', '炸彈魔',
      '鍋邊探頭者', '採集狂', '路痴冒險者', '龍車乘客', '團滅製造機',
      '補刀王', '喝藥專家', '蓋房者', '甩尾職人', '滅龍者',
      '菜鳥勇者', '資深摸魚員', '怪物觀察員', '爆肝王', '旅人',
      '路邊撿垃圾者', '大村長', '營火管理員', '討債人', '掉寶觀測員',
      '卡位者', '兇手', '轉蛋大師', '暴擊器', '躺贏者', '裝死高手',
      '老闆','勇者','上班族','廢人','魔王','上班族','工程師',
      '菜鳥','摸魚王','爆肝者','旅人','掛網者'
    ];


    const HERO_MAX_HP_START = 20;
    const MAX_LEVEL = 25;
    const HP_PER_LEVEL = 5;

    const RARITY_ORDER = ['Normal', 'Magic', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    const RARITY_MATERIAL_VALUE = {
        Normal: 0, Magic: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5
    };

    const MAGIC_REFINE_BONUS = {
        Normal: 1, Magic: 3, Rare: 5, Epic: 8, Legendary: 12, Mythic: 16
    };
    const WEAPON_MATERIAL_PER_REFINE = 5;
    const SHIELD_MATERIAL_PER_REFINE = 5;
    let weaponMaterials = 0;
    let shieldMaterials = 0;

    // 魔導：最高等級拉到 +160% 魔攻
    const MAGIC_RING_MAGIC_RATE = [0, 0.40, 0.80, 1.20, 1.60];
    const CRIT_RING_MAGIC_RATE  = [0, 0.10, 0.20, 0.30, 0.40]; // 原本就不錯，可留

    // 狂戰士：多段機率拉高
    const BERSERKER_MULTI_HIT_CHANCE = [0, 0.20, 0.30, 0.40, 0.50];
    const BERSERKER_THIRD_HIT_CHANCE = [0, 0.05, 0.15, 0.25, 0.35];

    let hero = {
        name: '無名英雄',
        hp: HERO_MAX_HP_START,
        maxHp: HERO_MAX_HP_START,
        level: 1,
        highestLevel: 1,
        paragonLevel: 0,        // ★ 巔峰等級
        exp: 0,
        title: "",   // ★★ 初始化稱號 → 不會沿用上次記錄
        expToNextLevel: 10,
        baseAttack: 15,
        baseDefense: 10,
        baseDodge: 5,       // 起始閃避 5%
        baseTieWinRate: 30,
        baseMagicAtk: 20,
        equipment: {
            WEAPON: { name: "徒手", power: 0, rarity: 'Normal', affixes: [] },
            SHIELD: { name: "無", power: 0, rarity: 'Normal', refine: 0, affixes: [], refineSlots: 0 },
            RING: { name: "無", ability: null, tier: 0, rarity: 'Normal' }
        },
        berserkerBonus: 0,
        berserkerPenalty: 0,
        healRingDefBonus: 0,
        currentAttack: 0,
        currentDefense: 0,
        currentDodge: 0,        // 顯示用 (最多 75%)
        dodgeOverflow: 0,       // 溢出的追擊機率（%）
        currentTieWinRate: 0,
        currentMagicAtk: 0,
        magicGuardTurns: 0,
        burnTurns: 0,
        burnDamage: 0,
        defDownTurns: 0,
        defDownRate: 0,
        weaponRefineLevel: 0,
        weaponRefineSlots: 0,
        weaponRefineAffixes: [],
        // 冒險事件 buff
        buffDamageUpTurns: 0,
        buffDamageUpRate: 0,
        regenTurns: 0,
        regenAmount: 0
    };

        //初始化稱號選單
    function initTitleSelectBox() {
        const selA = document.getElementById('titleA');
        const selB = document.getElementById('titleB');
        const selC = document.getElementById('titleC');

        // 先塞一個「不選」選項
        function fillSelect(sel, arr) {
            sel.innerHTML = '';
            const optEmpty = document.createElement('option');
            optEmpty.value = '';
            optEmpty.textContent = '（隨機）';
            sel.appendChild(optEmpty);

            arr.forEach(txt => {
                const opt = document.createElement('option');
                opt.value = txt;
                opt.textContent = txt;
                sel.appendChild(opt);
            });
        }

        fillSelect(selA, TITLE_A);
        fillSelect(selB, TITLE_B);
        fillSelect(selC, TITLE_C);
    }



    function getShieldRefineLevel() {
        return hero.equipment.SHIELD.refine || 0;
    }

    let currentEnemy = null;
    let bossLevel = 1;
    let newLoot = null;

    let healCooldown = 30000;
    let lastHealTime = 0;
    let healCooldownTimer = null;

    const CLASH_RULES = {
        '⚔️': '🌠',
        '🌠': '🛡️',
        '🛡️': '⚔️'
    };

    const RING_ABILITIES = [
        {
            id: 'CRIT',
            name: '幸運戒指',
            desc: '提高爆擊、掉寶與高稀有度機率，並增加魔攻',
            effect: () => {}
        },
        {
            id: 'HEAL',
            name: '生命戒指',
            desc: '格擋成功或盾擊造成傷害時回復 HP，回復量依 DEF 而定，並小幅提升 DEF',
            effect: () => {}
        },
        {
            id: 'DODGE',
            name: '敏捷指環',
            desc: '提高閃避，閃避超過 75% 的部分會變成追擊機率，成功閃避時還會普攻反擊一次',
            effect: (hero) => 0.10 + hero.equipment.RING.tier * 0.08
        },
        {
            id: 'MAGIC',
            name: '魔導指環',
            desc: '大幅提高魔法相關傷害',
            effect: (tier) => MAGIC_RING_MAGIC_RATE[tier] || 0
        },
        {
            id: 'BERSERKER',
            name: '狂戰士指環',
            desc: '依最大 HP 增加 ATK、DEF 降低 15%；物理攻擊可連擊、吸血',
            effect: (tier) => {
                const ratios = [0, 0.30, 0.40, 0.50, 0.60];
                return ratios[tier] || 0;
            }
        },
        {
            id: 'BALANCE',
            name: '平衡指環',
            desc: '提升平手時勇者獲勝的機率',
            effect: (tier) => 10 + tier * 10
        },
        { id: 'NONE', name: '無', desc: '無' }
    ];

    // === 武器詞條（12 個） ===
    const WEAPON_AFFIX_POOL = [
        { id: 'W_EXTRA_HIT', name: '偷摸一把', desc: '每次物理攻擊有 20% 機率多打一擊。', prereq: null },
        { id: 'W_ATK_UP',    name: '知識就是力量', desc: '最終物理攻擊 ATK +12%。', prereq: null },
        { id: 'W_MAGIC_UP',  name: '燃燒小宇宙🌀', desc: '基礎魔攻與武器精練魔攻合計 +10%，再計算戒指倍率。', prereq: null },
        { id: 'W_ARMOR_PEN', name: '神速脫衣', desc: '砍擊忽略敵人 30% 物理防禦；不影響魔法或盾擊。', prereq: null },
        { id: 'W_LIFESTEAL', name: '愛吃不辣的(Blood)', desc: '物理攻擊總傷害的 20% 轉成 HP，至少 1 點，不超過最大 HP。', prereq: null },
        { id: 'W_BALANCE',   name: '再加把勁', desc: '平手勝率 +7 個百分點，總上限 100%。', prereq: null },
        { id: 'W_CRIT_UP',   name: '塞你巴掌', desc: '砍擊爆擊率 +5 個百分點；爆擊造成 2 倍傷害。', prereq: null },
        { id: 'W_DODGE_UP',  name: '6點了我先下班了', desc: '閃避率 +3 個百分點；顯示上限 75%。', prereq: null },
        { id: 'W_BRAVE',     name: '加班勞碌命', desc: '目前 HP 不高於 30% 時，ATK +15%、砍擊爆擊率 +10 個百分點。', prereq: null },
        { id: 'W_VETERAN',   name: '老練老屁股', desc: '每一段砍擊額外附加總魔攻的 30% 傷害，至少 1 點；不扣敵方魔防。', prereq: null },
        { id: 'W_RAGE',      name: '火大亂砍', desc: '每次物理攻擊有 5% 機率變成至少 3 連擊。', prereq: null },
        { id: 'W_CHAIN',     name: '打了又打', desc: '同次攻擊的第 2 段傷害 +15%、第 3 段 +30%，之後每段再加 15%。', prereq: null }
    ];

    // === 盾牌詞條（12 個，含「詞上加詞」） ===
    const SHIELD_AFFIX_POOL = [
        { id: 'S_BLOCK',        name: '我擋~🛡️',       desc: '每次受擊有 20% 機率減少 50% 傷害；格擋後可觸發追加攻擊。', prereq: null },
        { id: 'S_MAGIC_GUARD',  name: '魔法胸罩',     desc: '魔法或盾擊命中時有 20% 機率取得護盾；接下來 3 次受擊減傷 50%，不是 3 個回合。', prereq: null },
        { id: 'S_DEF_UP',       name: '厚臉皮',       desc: '防禦 DEF +10%，也提高依 DEF 計算的盾擊傷害。', prereq: null },
        { id: 'S_TIE_UP',       name: '豹子通殺',     desc: '平手勝率 +5 個百分點，總上限 100%。', prereq: null },
        { id: 'S_REFLECT',      name: '怎麼刺刺的',     desc: '受到傷害後反彈實際損失 HP 的 20%，至少 1 點；致命傷不會因此復活。', prereq: null },
        { id: 'S_DODGE_UP',     name: '正在忙別的案子',     desc: '閃避率 +5 個百分點；顯示上限 75%。', prereq: null },
        { id: 'S_BOSS_GUARD',   name: '癢癢滴',     desc: '受到正式 Boss 的傷害減少 10%。', prereq: null },
        { id: 'S_SMALL_GUARD',  name: '不太痛',     desc: '受到非 Boss 敵人（含菁英）的傷害減少 10%。', prereq: null },
        { id: 'S_REGEN',        name: '吃個麵包先',     desc: '每場戰鬥取得至少 3 回合的回復，每回合回復最大 HP 的 3%，至少 2 點。', prereq: null },
        { id: 'S_MAT_BOOST',    name: 'YA~撿到十塊錢',     desc: '分解原本有素材價值的裝備時，有 30% 機率多得 1 份素材。', prereq: null },
        { id: 'S_BLOCK_STRIKE', name: '我再頂~💥',     desc: '需有「我擋~」。成功格擋且自己仍存活時，追加依 DEF 計算的盾擊，可被閃避。', prereq: 'S_BLOCK' },
        { id: 'S_BLOCK_CRIT',   name: '我再砍~🔪',     desc: '需有「我擋~」。成功格擋且自己仍存活時，追加砍擊，可爆擊、連擊與觸發武器詞條。', prereq: 'S_BLOCK' }
    ];

    function findAffix(pool, id) {
        return pool.find(a => a.id === id);
    }

    function getAllWeaponAffixSet() {
        const weapon = hero.equipment.WEAPON || {};
        const set = new Set();
        (weapon.affixes || []).forEach(id => set.add(id));
        (hero.weaponRefineAffixes || []).forEach(id => set.add(id));
        return set;
    }

    function addRandomAffixToWeaponRefine() {
        const existing = new Set(hero.weaponRefineAffixes);
        const candidates = WEAPON_AFFIX_POOL.filter(a => {
            if (existing.has(a.id)) return false;
            if (a.prereq && !existing.has(a.prereq)) return false;
            return true;
        });
        if (candidates.length === 0) return;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        hero.weaponRefineAffixes.push(chosen.id);
    }

    function updateWeaponRefineAffixes() {
        // 每 +3 精練，多一條
        const targetSlots = Math.floor(hero.weaponRefineLevel / 3);
        if (targetSlots > hero.weaponRefineSlots) {
            for (let i = 0; i < targetSlots - hero.weaponRefineSlots; i++) {
                addRandomAffixToWeaponRefine();
            }
        } else if (targetSlots < hero.weaponRefineSlots) {
            for (let i = 0; i < hero.weaponRefineSlots - targetSlots; i++) {
                if (hero.weaponRefineAffixes.length > 0) hero.weaponRefineAffixes.pop();
            }
        }
        hero.weaponRefineSlots = targetSlots;
    }

    function addRandomAffix(equip, pool) {
        if (!equip.affixes) equip.affixes = [];
        const existing = new Set(equip.affixes);
        const candidates = pool.filter(a => {
            if (existing.has(a.id)) return false;
            if (a.prereq && !existing.has(a.prereq)) return false;
            return true;
        });
        if (candidates.length === 0) return;
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        equip.affixes.push(chosen.id);
    }

    function updateShieldRefineAffixes(equip) {
        if (!equip) return;
        if (equip.refine == null) equip.refine = 0;
        if (equip.refineSlots == null) equip.refineSlots = 0;
        // 每 +3 精練，多一條
        const targetSlots = Math.floor(equip.refine / 3);
        if (targetSlots > equip.refineSlots) {
            for (let i = 0; i < targetSlots - equip.refineSlots; i++) {
                addRandomAffix(equip, SHIELD_AFFIX_POOL);
            }
        } else if (targetSlots < equip.refineSlots) {
            for (let i = 0; i < equip.refineSlots - targetSlots; i++) {
                if (equip.affixes && equip.affixes.length > 0) equip.affixes.pop();
            }
        }
        equip.refineSlots = targetSlots;
    }

    const RARITY_COLORS = {
        'Normal': 'Rarity-Normal',
        'Magic': 'Rarity-Magic',
        'Rare': 'Rarity-Rare',
        'Epic': 'Rarity-Epic',
        'Legendary': 'Rarity-Legendary',
        'Mythic': 'Rarity-Mythic'
    };

    // 小怪 / 王
    const ENEMIES = {
        SMALL: [
            { name: "哥布林", hp: 32, atk: 9, def: 8,  mDef: 12,  dodge: 35, lootChance: 0.80, exp: 8,  bias: { '⚔️': 0.3, '🌠': 0.4, '🛡️': 0.3 } },
            { name: "骷髏兵", hp: 45, atk: 8, def: 16, mDef: 6,  dodge: 5,  lootChance: 0.75, exp: 10, bias: { '⚔️': 0.3, '🌠': 0.3, '🛡️': 0.4 } },
            { name: "野狼",  hp: 42, atk: 9, def: 6,  mDef: 24, dodge: 20, lootChance: 0.80, exp: 11, bias: { '⚔️': 0.6, '🌠': 0.2, '🛡️': 0.2 } },
            { name: "石頭人", hp: 60, atk: 8,  def: 30, mDef: 4,  dodge: 5,  lootChance: 0.75, exp: 14, bias: { '⚔️': 0.6, '🌠': 0.1, '🛡️': 0.3 } },
            { name: "蝙蝠", hp: 22, atk: 10, def: 4,  mDef: 8, dodge: 60, lootChance: 0.85, exp: 7,  bias: { '⚔️': 0.2, '🌠': 0.5, '🛡️': 0.3 } }
        ],
        BOSS: [
            { level: 1, name: "不死巫妖", hp: 200, atk: 20, def: 10, mDef: 22, dodge: 10, lootChance: 1.0, exp: 70,  bias: { '⚔️': 0.2, '🌠': 0.5, '🛡️': 0.3 } },
            { level: 2, name: "火焰巨龍", hp: 380, atk: 28, def: 24, mDef: 12, dodge: 12, lootChance: 1.0, exp: 160, bias: { '⚔️': 0.5, '🌠': 0.2, '🛡️': 0.3 } },
            { level: 3, name: "遠古魔神", hp: 520, atk: 38, def: 24, mDef: 22, dodge: 15, lootChance: 1.0, exp: 380, bias: { '⚔️': 0.3, '🌠': 0.3, '🛡️': 0.4 } }
        ]
    };

    const ENEMY_ART = {
        "哥布林": [
            "",
            "/＼__/＼",
            "( o.o >",
            "( ^ )",
            "＼--/"
        ],
        "骷髏兵": [
            "",
            "  王",
            "( o o) /",
            " ＼＼_/",
            " /¯¯＼"
        ],
        "野狼": [
            "",
            "   /＼/＼",
            "   ( o　皿)",
            "((       )",
            ") \/\\_-_/"
        ],
        "石頭人": [
            "",
            "| O O |",
            "| \\_/ |",
            "|_____|",
            "| | |"
        ],
        "蝙蝠": [
            "",
            "＿      ＿ ",
            "）＼^ ^/ (",
            " )＿。。)(",
            "  |_︸_|",
            " _/¯¯¯＼_"
        ],

        "迷路的牛頭人菁英": [
            "",
        "   /\\__/\\",
        "  (  o_x) ",
        "  /  ^^ \\",
        " /_/   \\_\\"
        ],
        "度假中的迷你九頭蛇": [
            "",
        "    ~~~~~~",
        "  ~( o o o )~",
        "  ~( o o o )~ ",
        "    ~~~~~~"
        ],
        "被縮小的遠古小魔神": [
            "",
        "    /\\",
        "   (ಠ_ಠ)",
        "  _/|  |\\_",
        "    /  \\"
        ],

        "不死巫妖": [
            "",
            "    +--[⚰️]--+       ",
            "   | ( 💀 💀 ) |    ",
            "   |  /|v|\\  |    ",
            "   /  `-----'  \\   ",
            "  `-------------'   "
        ],
        "火焰巨龍": [
            "",
            "    <~🔥~>  <~🔥~>  ",
            "   /  ( 🐉 🐉 )  \\ ",
            "  |    |  v  |    | ",
            "   \\  /\\_/\\_/\\  /   ",
            "    `----------'    "
        ],
        "遠古魔神": [
            "",
            "    /\\/\\/\\/\\/\\   ",
            "   ( 👁️ [X] 👁️ )  ",
            "  |  /  |w|  \\  |  ",
            "   \\ |  |V|  | /    ",
            "    `-----------'   "
        ]
    };

    const ENEMY_INTRO_LINES = {
        "哥布林": "哥布林：『對面有個叫Jack的叫我來這，說這有好康?』",
        "骷髏兵": "骷髏兵：『唉~房貸還沒繳完就死了，只好回來加班。』",
        "野狼":   "野狼：『我剛剛UBER點的午餐就是你嗎?』",
        "石頭人": "石頭人：『我的皮很硬，我的肝更硬。』",
        "蝙蝠":   "蝙蝠：『什麼動物不用休息？』..................答：『蝙蝠，因為不休蝙蝠』",
        "不死巫妖": "不死巫妖：『你問我永生的秘訣？每天睡滿八小時，然後多運動，就這麼簡單。』",
        "火焰巨龍": "火焰巨龍：『我會噴火是因為我有嚴重的胃食道逆流，晚餐吃太辣了。』",
        "遠古魔神": "遠古魔神：『我就是資本主義的具象化，你每天都得幫我打工。』"
    };

    const mainView = document.getElementById('main-view');
    const messageLog = document.getElementById('message-log');
    const heroAtkVal = document.getElementById('hero-atk-val');
    const heroDefVal = document.getElementById('hero-def-val');
    const heroMatkVal = document.getElementById('hero-matk-val');
    const heroDodgeVal = document.getElementById('hero-dodge-val');
    const heroTieWinRateVal = document.getElementById('hero-tie-win-rate-val');
    const heroCritVal = document.getElementById('hero-crit-val');

    const commandMenu = document.getElementById('command-menu');
    const decisionMenu = document.getElementById('decision-menu');
    const btnDecYes = document.getElementById('btn-decision-yes');
    const btnDecNo = document.getElementById('btn-decision-no');

    const btn1 = document.getElementById('btn-action-1');
    const btn2 = document.getElementById('btn-action-2');
    const btn3 = document.getElementById('btn-action-3');

    const eqWeapon = document.getElementById('eq-weapon');
    const eqShield = document.getElementById('eq-shield');
    const eqRing = document.getElementById('eq-ring');
    const eqDetailWeapon = document.getElementById('eq-detail-weapon');
    const eqDetailShield = document.getElementById('eq-detail-shield');
    const eqDetailRing = document.getElementById('eq-detail-ring');
    const eqWeaponAffix = document.getElementById('eq-weapon-affix');
    const eqShieldAffix = document.getElementById('eq-shield-affix');

    const heroHpSpan = document.getElementById('hero-hp');
    const heroMaxHpSpan = document.getElementById('hero-max-hp');
    const heroLevelSpan = document.getElementById('hero-level');
    const heroExpSpan = document.getElementById('hero-exp');
    const heroExpMaxSpan = document.getElementById('hero-exp-max');
    // 把稱號塞進 hero-title在這裡加 ↓
    const heroTitleSpan = document.getElementById('hero-title');
    const weaponRefineLevelSpan = document.getElementById('weapon-refine-level');
    const shieldRefineLevelSpan = document.getElementById('shield-refine-level');
    const weaponMaterialsSpan = document.getElementById('weapon-materials');
    const shieldMaterialsSpan = document.getElementById('shield-materials');

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getEffectivePower(eq, slotType) {
        if (!eq) return 0;
        let base = eq.power || 0;
        if (slotType === 'SHIELD' && eq.refine && eq.refine > 0) {
            const per = 0.08;
            base = Math.floor(base * (1 + eq.refine * per));
        }
        return base;
    }

    function getMagicAttackValue() {
        let magic = hero.currentMagicAtk;
        const ring = hero.equipment.RING;
        if (ring && ring.ability) {
            if (ring.ability.id === 'MAGIC') {
                const rate = MAGIC_RING_MAGIC_RATE[ring.tier] || 0;
                magic = Math.floor(magic * (1 + rate));
            } else if (ring.ability.id === 'CRIT') {
                const rate = CRIT_RING_MAGIC_RATE[ring.tier] || 0;
                magic = Math.floor(magic * (1 + rate));
            }
        }
        if (magic < 0) magic = 0;
        return magic;
    }

    function getHeroBaseCritChance() {
        let base = 0.05;
        const affSet = getAllWeaponAffixSet();
        if (affSet.has('W_CRIT_UP')) base += 0.05;
        return base;
    }



    function getHeroCritRate() {
        return getHeroCritChance() * 100;
    }

    function attemptWeaponRefine() {
        const w = hero.equipment.WEAPON;
        if (!w || w.name === "徒手") {
            log("❗ 目前沒有可精練的武器（徒手不精練）。");
            return;
        }
        hero.weaponRefineLevel += 1;
        log(`🛠 武器精練成功！全武器精練等級提升為 +${hero.weaponRefineLevel}（換新武器也會沿用）。`);
        updateWeaponRefineAffixes();
    }

    function attemptShieldRefine() {
        const s = hero.equipment.SHIELD;
        if (!s || s.name === "無") {
            log("❗ 目前沒有可精練的盾牌。");
            return;
        }
        if (!s.refine) s.refine = 0;
        s.refine += 1;
        log(`🛡 盾牌精練成功！${s.name} 精練 +${s.refine}。`);
        updateShieldRefineAffixes(s);
    }



    function calculateHeroStats() {
        const weaponPower = getEffectivePower(hero.equipment.WEAPON, 'WEAPON');
        const shieldPower = getEffectivePower(hero.equipment.SHIELD, 'SHIELD');

        hero.currentAttack = hero.baseAttack + weaponPower;
        hero.currentDefense = hero.baseDefense + shieldPower;
        hero.healRingDefBonus = 0;

        const ring = hero.equipment.RING;

        if (ring.ability && ring.ability.id === 'HEAL') {
            const tier = ring.tier;
            const ratio = Math.min(0.12, 0.03 * tier);
            const extraDef = Math.floor(hero.currentDefense * ratio);
            hero.currentDefense += extraDef;
            hero.healRingDefBonus = extraDef;
        }

        let ringDodgeBonus = 0;
        if (ring.ability && ring.ability.id === 'DODGE') {
            ringDodgeBonus = ring.ability.effect(hero) * 100;
        }

        hero.currentTieWinRate = hero.baseTieWinRate;
        if (ring.ability && ring.ability.id === 'BALANCE') {
            hero.currentTieWinRate += ring.ability.effect(ring.tier);
        }

        const shield = hero.equipment.SHIELD;
        if (shield && shield.affixes) {
            if (shield.affixes.includes('S_DEF_UP')) {
                hero.currentDefense = Math.floor(hero.currentDefense * 1.10);
            }
            if (shield.affixes.includes('S_TIE_UP')) {
                hero.currentTieWinRate += 5;
            }
            if (shield.affixes.includes('S_DODGE_UP')) {
                ringDodgeBonus += 5;
            }
        }

        hero.currentTieWinRate = Math.min(100, hero.currentTieWinRate);

        hero.berserkerBonus = 0;
        hero.berserkerPenalty = 0;

        if (ring.ability && ring.ability.id === 'BERSERKER') {
            const tier = ring.tier;
            const ratio = ring.ability.effect(tier);
            const hpToAtk = Math.floor(hero.maxHp * ratio);
            const defReduction = Math.floor(hero.currentDefense * 0.15);
            hero.currentAttack += hpToAtk;
            hero.currentDefense -= defReduction;
            hero.berserkerBonus = hpToAtk;
            hero.berserkerPenalty = defReduction;
        }

        if (hero.defDownTurns > 0 && hero.defDownRate > 0) {
            const reduce = Math.floor(hero.currentDefense * hero.defDownRate);
            hero.currentDefense = Math.max(0, hero.currentDefense - reduce);
        }

        hero.currentDefense = Math.max(0, hero.currentDefense);

        // 閃避計算：先算 raw，再拆成顯示 + 溢出追擊
        const wAff = getAllWeaponAffixSet();

        // 武器詞條：知識就是力量（W_ATK_UP）→ 物理攻擊 +12%
        if (wAff.has('W_ATK_UP')) {
            hero.currentAttack = Math.floor(hero.currentAttack * 1.12);
        }

        // 武器詞條：再加把勁（W_BALANCE）→ 平手勝率 +7%
        if (wAff.has('W_BALANCE')) {
            hero.currentTieWinRate += 7;
        }

        // 再次壓上限，避免超過 100%
        hero.currentTieWinRate = Math.min(100, hero.currentTieWinRate);

        // 閃避計算：先算 raw，再拆成顯示 + 溢出追擊
        let rawDodge = hero.baseDodge + ringDodgeBonus;
        if (wAff.has('W_DODGE_UP')) rawDodge += 3;

        hero.dodgeOverflow = 0;
        if (ring.ability && ring.ability.id === 'DODGE' && rawDodge > 75) {
            hero.dodgeOverflow = rawDodge - 75;
        }
        hero.currentDodge = Math.min(75, rawDodge);

        const rarity = hero.equipment.WEAPON.rarity || 'Normal';
        const per = MAGIC_REFINE_BONUS[rarity] || 0;
        hero.currentMagicAtk = hero.baseMagicAtk + hero.weaponRefineLevel * per;
        if (wAff.has('W_MAGIC_UP')) {
            hero.currentMagicAtk = Math.floor(hero.currentMagicAtk * 1.10);
        }
        if (wAff.has('W_BRAVE') && hero.hp > 0 && hero.hp <= hero.maxHp * 0.3) {
            hero.currentAttack = Math.floor(hero.currentAttack * 1.15);
        }
        if (hero.currentMagicAtk < 0) hero.currentMagicAtk = 0;
    }

    function getAllWeaponAffixNames() {
        const ids = new Set();
        (hero.equipment.WEAPON.affixes || []).forEach(id => ids.add(id));
        (hero.weaponRefineAffixes || []).forEach(id => ids.add(id));
        if (ids.size === 0) return '無';
        return Array.from(ids).map(id => {
            const a = findAffix(WEAPON_AFFIX_POOL, id);
            return a ? a.name : id;
        }).join('、');
    }

    function getShieldAffixNames() {
        const s = hero.equipment.SHIELD;
        if (!s || !s.affixes || s.affixes.length === 0) return '無';
        return s.affixes.map(id => {
            const a = findAffix(SHIELD_AFFIX_POOL, id);
            return a ? a.name : id;
        }).join('、');
    }

















    // ===== 冒險事件區 =====




















    // 生命戒指：共用回血函數
    function healFromLifeRing(triggerSource) {
        const ring = hero.equipment.RING;
        if (!ring || !ring.ability || ring.ability.id !== 'HEAL' || ring.tier <= 0) return 0;
        if (hero.hp <= 0 || hero.hp >= hero.maxHp) return 0;

        const baseRatio = 0.10 + ring.tier * 0.03;
        const raw = Math.floor(hero.currentDefense * baseRatio);
        const heal = Math.max(3, raw);
        const missing = hero.maxHp - hero.hp;
        const actual = Math.min(heal, missing);
        if (actual <= 0) return 0;

        hero.hp += actual;
        const srcText = triggerSource === 'BLOCK' ? '成功格擋' : '盾擊命中';
        log(`💖 生命戒指：${srcText}，依 DEF 回復 ${actual} HP！`);
        flashBattleView('heal');
        updateStatus();
        return actual;
    }

    // 多段攻擊 & 老練老屁股魔傷 + 詳細 Log
    function applyHeroAttackEffects(baseDamage, isPhysical, attackKind, label) {
        let hits = 1;
        const ring = hero.equipment.RING;
        const tier = ring.tier;
        const critChance = getHeroCritChance();
        const wAff = getAllWeaponAffixSet();
        let totalDamage = 0;
        let hitDetails = [];
        const magicAtk = getMagicAttackValue();

        if (isPhysical && ring.ability && ring.ability.id === 'BERSERKER') {
            const multiChance = BERSERKER_MULTI_HIT_CHANCE[tier] || 0;
            const thirdChance = BERSERKER_THIRD_HIT_CHANCE[tier] || 0;
            if (Math.random() < multiChance) {
                hits++;
                if (Math.random() < thirdChance) hits++;
            }
        }

        if (isPhysical && wAff.has('W_EXTRA_HIT')) {
            if (Math.random() < 0.2) {
                hits++;
                log(`⚔️「偷摸一把」發動，多打一擊！`);
            }
        }

        if (isPhysical && wAff.has('W_RAGE')) {
            if (Math.random() < 0.05) {
                hits = Math.max(hits, 3);
                log(`🤬「火大亂砍」發動，本次至少 3 連擊！`);
            }
        }

        let hasVeteran = isPhysical && attackKind === 'SWORD' && wAff.has('W_VETERAN');
        let hasChain = isPhysical && wAff.has('W_CHAIN');

        for (let i = 0; i < hits; i++) {
            let dmg = baseDamage;
            let thisHitCrit = false;
            let thisMagicBonus = 0;

            // 打了又打：第二擊起每次 +15%
            if (hasChain && i > 0) {
                const factor = 1 + 0.15 * i;
                dmg = Math.floor(dmg * factor);
            }

            // 暴擊（只對砍擊 / 一般物理）
            if (isPhysical && attackKind === 'SWORD') {
                if (Math.random() < critChance) {
                    dmg = Math.floor(dmg * 2);
                    thisHitCrit = true;
                }
            }

            // 老練老屁股：砍擊附加魔攻比例魔傷
            if (hasVeteran && magicAtk > 0) {
                thisMagicBonus = Math.max(1, Math.floor(magicAtk * 0.30));
            }

            const singleTotal = dmg + thisMagicBonus;
            totalDamage += singleTotal;

            hitDetails.push({
                index: i + 1,
                dmg,
                isCrit: thisHitCrit,
                magicBonus: thisMagicBonus
            });
        }

        if (hitDetails.length > 1 || hitDetails.some(h => h.magicBonus > 0)) {
            const tag = label || '攻擊';
            log(`📊 ${tag}詳解：`);
            hitDetails.forEach(h => {
                let txt = `第${h.index}擊：${h.dmg}`;
                if (isPhysical) txt += ` 物理傷害`;
                if (h.isCrit) txt += `（暴擊）`;
                if (h.magicBonus > 0) txt += ` + ${h.magicBonus} 魔法傷害（老練老屁股）`;
                log(txt + '。');
            });
            log(`🔢 合計：${totalDamage} 點傷害。`);
        } else {
            // 單擊普通情況，保留原本簡單風格
        }

        // 吸血
        if (isPhysical && wAff.has('W_LIFESTEAL') && totalDamage > 0) {
            const heal = Math.max(1, Math.floor(totalDamage * 0.2));
            hero.hp = Math.min(hero.maxHp, hero.hp + heal);
            log(`🩸「愛吃不辣的(Blood)」生效，回復 ${heal} 點 HP！`);
        }

   // ===== 狂戰士戒指吸血（新增） =====
if (
    isPhysical &&
    ring &&                // ← 用上面已經宣告過的 ring
    ring.ability &&
    ring.ability.id === "BERSERKER" &&
    totalDamage > 0
) {
    const berserkTier = ring.tier || 0;
    const berserkLeechRate = [0, 0.03, 0.05, 0.07, 0.10][berserkTier];

    if (berserkLeechRate > 0) {
        const heal = Math.max(1, Math.floor(totalDamage * berserkLeechRate));
        const old = hero.hp;
        hero.hp = Math.min(hero.maxHp, hero.hp + heal);

        if (hero.hp > old) {
            log(`💢 狂戰士指環憤怒吸血，回復 ${hero.hp - old} 點 HP！`);
        }
    }
}


        return totalDamage;
    }

    function tryTriggerMagicGuard() {
        const shield = hero.equipment.SHIELD;
        if (shield && shield.affixes && shield.affixes.includes('S_MAGIC_GUARD')) {
            if (Math.random() < 0.2) {
                hero.magicGuardTurns = 3;
                log('✨「魔法胸罩」啟動！接下來 3 回合受到的傷害減半。');
            }
        }
    }

    function doShieldStrikeFollowUp(label) {
        if (!currentEnemy || currentEnemy.hp <= 0) return 0;
        const SHIELD_DMG = Math.max(1, hero.currentDefense);
        if (enemyDodged('🛡️')) {
            log(`😈 ${currentEnemy.name} 閃過了你的追加盾擊！`);
            return 0;
        }
        let dmg = applyHeroAttackEffects(SHIELD_DMG, true, 'SHIELD', label || '盾擊追打');
        currentEnemy.hp -= dmg;
        maybeExtraOverflowAttack('盾擊追擊');
        updateBattleView();
        return dmg;
    }

    function doSwordStrikeFollowUp(label) {
        if (!currentEnemy || currentEnemy.hp <= 0) return 0;
        const wAff = getAllWeaponAffixSet();
        let enemyDefForSword = currentEnemy.def || 0;
        if (wAff.has('W_ARMOR_PEN')) {
            enemyDefForSword = Math.floor(enemyDefForSword * 0.7);
        }
        let atkForCalc = hero.currentAttack;
        if (hero.buffDamageUpTurns > 0 && hero.buffDamageUpRate > 0) {
            atkForCalc = Math.floor(atkForCalc * (1 + hero.buffDamageUpRate));
        }
        let baseSwordDmg = Math.max(1, atkForCalc - enemyDefForSword);
        if (enemyDodged('⚔️')) {
            log(`😈 ${currentEnemy.name} 閃過了你的追加砍擊！`);
            return 0;
        }
        let dmg = applyHeroAttackEffects(baseSwordDmg, true, 'SWORD', label || '額外砍擊');
        currentEnemy.hp -= dmg;
        maybeExtraOverflowAttack('額外砍擊追擊');
        updateBattleView();
        return dmg;
    }

    function triggerBlockFollowUps() {
        const shield = hero.equipment.SHIELD;
        if (!shield || !shield.affixes) return;

        if (shield.affixes.includes('S_BLOCK_STRIKE')) {
            const dmg = doShieldStrikeFollowUp('我再頂~💥');
            if (dmg > 0) {
                log(`🛡️「我再頂~💥」追加盾擊造成 ${dmg} 點傷害！`);
            }
        }
        if (shield.affixes.includes('S_BLOCK_CRIT')) {
            const dmg2 = doSwordStrikeFollowUp('我再砍~🔪');
            if (dmg2 > 0) {
                log(`⚔️「我再砍~🔪」補上一刀造成 ${dmg2} 點傷害！`);
            }
        }
    }







    function calcBossAttackDamage(baseDamage) {
        if (!currentEnemy) {
            return { damage: baseDamage, skip: false };
        }

        if (currentEnemy.name === '遠古魔神') {
            if (currentEnemy.ancientChargeState === 'CHARGING') {
                currentEnemy.ancientChargeState = null;
                const dmg = Math.max(1, baseDamage * 2);
                log('⚡ 遠古魔神釋放【蓄力重擊】，造成 2 倍傷害！');
                return { damage: dmg, skip: false };
            }

            if (!currentEnemy.ancientChargeState && Math.random() < 0.25) {
                currentEnemy.ancientChargeState = 'CHARGING';
                log('💥 遠古魔神開始蓄力，準備在下一回合使出【蓄力重擊】！本回合不攻擊。');
                return { damage: 0, skip: true };
            }
        }

        return { damage: baseDamage, skip: false };
    }

    function applyBossPostHitEffects(finalDamage) {
        if (!currentEnemy || finalDamage <= 0) return;

        if (currentEnemy.name === '哥布林') {
            if (Math.random() < 0.20) {
                const extra = Math.max(1, Math.floor(finalDamage * 0.3));
                hero.hp = Math.max(0, hero.hp - extra);
                log(`🗡️ 哥布林趁亂偷襲，再造成 ${extra} 點額外傷害！`);
            }
        } else if (currentEnemy.name === '骷髏兵') {
            if (Math.random() < 0.20) {
                hero.defDownTurns = 2;
                hero.defDownRate = 0.15;
                log('🦴 骷髏兵敲碎你的護甲，未來 2 回合防禦力降低 15%。');
            }
        } else if (currentEnemy.name === '野狼') {
            if (Math.random() < 0.25) {
                const extra = Math.max(1, Math.floor(finalDamage * 0.5));
                hero.hp = Math.max(0, hero.hp - extra);
                log(`🐺 野狼趁勢再咬一口，額外造成 ${extra} 點傷害！`);
            }
        } else if (currentEnemy.name === '石頭人') {
            if (Math.random() < 0.20) {
                const oldDef = currentEnemy.def || 0;
                const addDef = Math.max(1, Math.floor(oldDef * 0.1));
                currentEnemy.def = oldDef + addDef;
                log(`🪨 石頭人啟動【硬化】，防禦力永久提升 ${addDef} 點（本場戰鬥）。`);
            }
        } else if (currentEnemy.name === '蝙蝠') {
            if (Math.random() < 0.20) {
                const heal = Math.max(1, Math.floor(finalDamage * 0.3));
                currentEnemy.hp = Math.min(currentEnemy.originalHp, currentEnemy.hp + heal);
                log(`🦇 蝙蝠吸食你的鮮血，回復 ${heal} 點 HP。`);
            }
        } else if (currentEnemy.name === '不死巫妖') {
            if (Math.random() < 0.25) {
                const heal = Math.max(1, Math.floor(finalDamage * 0.15));
                currentEnemy.hp = Math.min(currentEnemy.originalHp, currentEnemy.hp + heal);
                log(`🩸 不死巫妖從你的生命中汲取力量，回復 ${heal} HP。`);
            }
            if (Math.random() < 0.20) {
                hero.defDownTurns = 3;
                hero.defDownRate = 0.20;
                log('🕯️ 不死巫妖的詛咒削弱了你的護甲，未來 3 回合防禦力降低 20%。');
            }
        } else if (currentEnemy.name === '火焰巨龍') {
            if (Math.random() < 0.25) {
                const burnDmg = Math.max(1, Math.floor(hero.maxHp * 0.03));
                hero.burnTurns = 3;
                hero.burnDamage = burnDmg;
                log(`🔥 火焰巨龍的龍炎附著在你身上，未來 3 回合開始時會各損失 ${burnDmg} HP！`);
            }
            if (Math.random() < 0.25) {
                hero.defDownTurns = 2;
                hero.defDownRate = 0.25;
                log('💢 火焰巨龍的重擊砸裂了你的護甲，未來 2 回合防禦力降低 25%。');
            }
        } else if (currentEnemy.name === '遠古魔神' || currentEnemy.name.includes('小魔神')) {
            if (Math.random() < 0.30) {
                hero.defDownTurns = 2;
                hero.defDownRate = 0.30;
                log('🕳️ 遠古魔神施放【虛空侵蝕】，未來 2 回合你的防禦力降低 30%。');
            }
            if (Math.random() < 0.25) {
                const heal = Math.max(1, Math.floor(finalDamage * 0.25));
                currentEnemy.hp = Math.min(currentEnemy.originalHp, currentEnemy.hp + heal);
                log(`🩸 遠古魔神從你的痛苦中汲取力量，回復 ${heal} HP。`);
            }
        }
    }









    function gainExp(amount) {
        hero.exp += amount;
        log(`獲得了 ${amount} 點經驗值!`);

        while (hero.exp >= hero.expToNextLevel) {
            hero.exp -= hero.expToNextLevel;
            if (hero.level < MAX_LEVEL) {
                levelUp();
            } else {
                // 已滿等，改成巔峰等級
                gainParagonLevel();
            }
        }
        updateStatus();
    }


    function levelUp() {
        if (hero.level >= MAX_LEVEL) return;
        const oldLevel = hero.level;
        hero.level++;
        hero.expToNextLevel = Math.floor(hero.expToNextLevel * 1.15) + 3;

        if (hero.level > hero.highestLevel) {
            hero.highestLevel = hero.level;

            hero.maxHp += HP_PER_LEVEL;
            const atkGain   = randInt(1, 3);
            const defGain   = randInt(1, 3);
            const dodgeGain = randInt(0, 2);   // 閃避成長縮小，避免太誇張
            const tieGain   = randInt(1, 3);
            const matkGain  = randInt(3, 5);

            hero.baseAttack     += atkGain;
            hero.baseDefense    += defGain;
            hero.baseDodge      += dodgeGain;
            hero.baseTieWinRate += tieGain;
            hero.baseMagicAtk   += matkGain;

            hero.hp = hero.maxHp;
            log(`🎉 升級! Lv.${oldLevel} → Lv.${hero.level} (首次達到該等級)`);
            log(`   HP +${HP_PER_LEVEL}，ATK +${atkGain}，DEF +${defGain}，閃避 +${dodgeGain}% ，平手勝率 +${tieGain}% ，MATK +${matkGain}`);
        } else {
            hero.maxHp += HP_PER_LEVEL;
            hero.hp = hero.maxHp;
            log(`⬆️ 回到曾經到過的等級 Lv.${hero.level}，只恢復最大 HP，不再追加能力成長。`);
        }
    }

    function gainParagonLevel() {
        hero.paragonLevel = (hero.paragonLevel || 0) + 1;

        // 每次巔峰都給一點小成長（偏向魔攻＋血量）
        const hpGain   = 3;
        const atkGain  = randInt(1, 2);
        const defGain  = randInt(1, 2);
        const matkGain = randInt(2, 4);

        hero.maxHp       += hpGain;
        hero.baseAttack  += atkGain;
        hero.baseDefense += defGain;
        hero.baseMagicAtk+= matkGain;
        hero.hp           = hero.maxHp;

        // 巔峰等級的經驗門檻也慢慢變難
        hero.expToNextLevel = Math.floor(hero.expToNextLevel * 1.10) + 5;

        log(`🌟 巔峰等級 +1！(現在巔峰 Lv.${hero.paragonLevel})`);
        log(`   HP +${hpGain}，ATK +${atkGain}，DEF +${defGain}，MATK +${matkGain}`);
    }


    function unlockNewRarity() {
        if (bossLevel === 2) {
            log(`🎉 已擊敗 Boss 1：開始有機會掉落 <span class="${RARITY_COLORS['Legendary']}">橘武、橘盾</span>！`);
        } else if (bossLevel === 3) {
            log(`🎉 已擊敗 Boss 2：開始有機會掉落 <span class="${RARITY_COLORS['Mythic']}">紅武、紅盾</span>！`);
        }
    }

//通關時把角色快照存到 localStorage









            //稱號確認 & 隨機按鈕
        function buildRandomTitle() {
            let aPart = TITLE_A[Math.floor(Math.random() * TITLE_A.length)];
            let bPart = TITLE_B[Math.floor(Math.random() * TITLE_B.length)];
            let cPart = TITLE_C[Math.floor(Math.random() * TITLE_C.length)];
            return `${aPart}的${bPart}${cPart}`;
        }

        // 只單純抽一組給玩家看，不開始遊戲
        function randomTitleOnly() {
            const title = buildRandomTitle();
            alert(`抽到的稱號是：\n「${title}」\n如果喜歡，可以自己從下拉選單挑一樣的組合；\n不改直接按「開始冒險」會再重抽一次。`);
        }




        // ===== 依等級切換成長階段 =====



    function getPowerRange(rarity, isWeapon, isBoss) {
        const base = isWeapon ? 10 : 5;
        const multiplier = isWeapon ? 1.5 : 1;
        const bossBonus = isBoss ? hero.level * 0.5 : 0;
        switch (rarity) {
            case 'Mythic':   return { min: (base * 5.0 * multiplier) + bossBonus * 15, max: (base * 6.5 * multiplier) + bossBonus * 15 };
            case 'Legendary':return { min: (base * 4.0 * multiplier) + bossBonus * 10, max: (base * 5.0 * multiplier) + bossBonus * 10 };
            case 'Epic':     return { min: (base * 3.0 * multiplier) + bossBonus * 5,  max: (base * 4.0 * multiplier) + bossBonus * 5 };
            case 'Rare':     return { min: (base * 2.0 * multiplier) + bossBonus * 2,  max: (base * 3.0 * multiplier) + bossBonus * 2 };
            case 'Magic':    return { min: (base * 1.0 * multiplier) + bossBonus * 1,  max: (base * 2.0 * multiplier) + bossBonus * 1 };
            default:         return { min: base * 0.5 * multiplier, max: base * 1.0 * multiplier };
        }
    }

    function generateLoot(type, isBoss) {
        let rarity = getRandomRarity(type, isBoss);

        if (type === 'RING') {
            const abilityIndex = Math.floor(Math.random() * (RING_ABILITIES.length - 1));
            const ability = RING_ABILITIES[abilityIndex];
            let tier = 1;
            if (isBoss) tier = Math.min(4, bossLevel + 1);
            else tier = Math.min(2, Math.ceil(Math.random() * 2));
            return { type: 'RING', name: ability.name, ability: ability, tier: tier, rarity: rarity };
        }

        const isWeapon = type === 'WEAPON';
        const range = getPowerRange(rarity, isWeapon, isBoss);
        const power = Math.floor(Math.random() * (range.max - range.min) + range.min) + 1;
        const name = `${({Normal:"磨舊",Magic:"微光",Rare:"符文",Epic:"暮星",Legendary:"誓約",Mythic:"破曉"})[rarity]}${isWeapon?"長劍":"圓盾"}`;
        const equip = {
            type, name, power, rarity,
            refine: 0,
            refineSlots: 0,
            affixes: [],
        };

        const baseSlotsByRarity = {
            Normal: 0, Magic: 0, Rare: 1, Epic: 1, Legendary: 2, Mythic: 3
        };
        const baseSlots = baseSlotsByRarity[rarity] || 0;
        const pool = isWeapon ? WEAPON_AFFIX_POOL : SHIELD_AFFIX_POOL;
        for (let i = 0; i < baseSlots; i++) {
            addRandomAffix(equip, pool);
        }
        return equip;
    }











    // 初始化戒指為 NONE
    hero.equipment.RING = {
        name: "無",
        ability: RING_ABILITIES.find(a => a.id === 'NONE'),
        tier: 0,
        rarity: 'Normal'
    };




    // ===== 頁面載入後：先處理稱號，再啟動遊戲 =====
