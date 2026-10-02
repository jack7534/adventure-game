# 勇者模擬器 · 暮光旅途 v2.1

遊戲：https://jack7534.github.io/adventure-game/

保留 Jack 原作的三招克制、幹話稱號、戒指流派與裝備詞條，重新整理結算、存檔、事件與畫面。

## v2.1 更新

裝備防誤換與二次確認、24 個原作詞條完整效果、固定的視窗關閉鈕、營地商店、小狐狸戰鬥支援，以及探索／戰鬥／三位 Boss／通關的六首原創合成背景音樂。舊版 v2 存檔相容，不必重練。細節與驗收見 `docs/V2_1_UPDATE.md`。

## v2.0 更新

- 戰鬥結算與戰利品決策各自只允許一次；反擊、連點、舊計時器不會重複發獎。
- 三個像素場景、角色與怪物、血條、出招偏好、裝備比較、手機版戰鬥血量。
- 14 種事件、42 個選項；狐狸旅伴與送信委託有後續故事，不會把選擇畫面直接跳掉。
- 自動存檔、上一份自動備援、三個手動槽、最近營地與 JSON 匯出／匯入。
- Boss 依章節固定強度；戰敗保留等級與裝備，只扣目前經驗值的 10%。

## 遊玩與存檔

用畫面上的選項卡操作。砍擊克魔法、魔法克盾擊、盾擊克砍擊；平手依角色數值判定。每第 3 回合會直接顯示敵人的下一招。完整說明在右上角「遊戲指南」。

本機存檔不是雲端同步。清除瀏覽器資料、使用無痕視窗或更換裝置都可能失去進度；重要進度請用「存檔／讀檔 → 匯出存檔」備份。舊版沒有儲存完整冒險狀態，無法憑空還原更新前已關閉的旅程。

## 開發

網站執行時不需要 Node、框架、帳號、API Key 或伺服器資料庫。GitHub Pages 直接提供 index.html、CSS、遊戲 bundle 與兩張像素圖集。

開發環境使用 Node.js 22：

```sh
npm ci
npm run build
npm run dev
```

瀏覽 http://127.0.0.1:8770/ 。修改 js/ 下的原始模組後，執行 `npm run build`；不要手動改 `js/game.bundle.js`。建置會同步更新 JS／CSS 的內容版本碼，避免新舊版本快取混用。

## 測試

```sh
npx playwright-core install --with-deps chromium
npm test
```

也可設定 `BROWSER_PATH` 指向已安裝的 Edge／Chrome。測試一律使用全新的隔離瀏覽器，不讀取玩家個人瀏覽器設定。報告與截圖寫入被 git 忽略的 `test-results/`。

GitHub Actions 在 main 與本次修復分支上執行相同測試；使用標準 Ubuntu runner、唯讀內容權限，不使用自架電腦或專案秘密。

## 原始檔

- `js/core.js`：原作資料、成長、詞條與精練輔助邏輯。
- `js/game.js`、`js/loot.js`：遊戲狀態、戰鬥與單次戰利品結算。
- `js/events.js`：事件與後續委託；存檔只保存事件 ID。
- `js/save.js`：版本化存檔、驗證、備援、匯出／匯入與通關名冊。
- `js/scene.js`、`js/ui.js`、`css/game.css`：場景、圖集與介面。

## 素材與備份

原創遊戲：Jack。場景以程式繪製。圖集使用 Kenney 的 Tiny Dungeon 與 Clint Bellanger 的 Tiny Creatures，兩者均為 CC0；原始授權保留於 assets/，詳見 docs/ASSET_CREDITS.md。

修改前的版本：commit `45b1d14e4f1e847a7a13961cf11ad3b8fbc4f543`，備份分支 `backup/pre-repair-20261002`。本次未改動原有的 indexAAA.html。
