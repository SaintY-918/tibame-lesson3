# Design — Add Form Enums, Mock Seed and Magic UI Polish

## Context（背景）

本 change 處理三個彼此相關的痛點：
1. 員工 / 車輛資料的關鍵分類欄位為自由文字，污染 dashboard 統計。
2. 開發環境 DB 缺乏多樣化資料，導致 dashboard、分頁、role-aware 等行為無法驗證。
3. 既有 UI 為樸素原型，與「現代化內部 SaaS」的形象不符；負責員工以 raw id 顯示／輸入，可用性差。

三者一起處理：受控詞彙提供 mock seed 與下拉選單的「合法值來源」，UI 升級則需要 mock 資料才能展示完整效果。

## Goals（目標）

- 用最小改動把四個自由文字欄位收斂為 enum：`Employee.department`、`Employee.position`、`Vehicle.make`、`Vehicle.color`。
- 提供一鍵 `npm run seed:mock` 指令，產出涵蓋多重情境的測試資料，免去 admin 反覆手建。
- Vehicles 列表 / 表單的負責員工改為人類可讀；表單以下拉避免亂填 id。
- UI 視覺升級到「現代化 SaaS」水準（藍紫漸層、玻璃 sidebar、卡片 spotlight、數字 ticker、toast 反饋），但不寫死視覺細節到 spec。

## Non-Goals（非目標）

- 不引入 DB lookup table 與對應 admin 管理頁。
- 不開放動態詞彙；新增廠牌仍是 code change。
- 不調整 Prisma schema 的 column 型別（仍為 `String`）。
- 不重設計 dashboard 的 query／圖表結構。

## Decisions（決策）

### Decision 1：受控詞彙寫在 `@vms/shared` 常數，而非 DB lookup table

- **理由**：內部使用、團隊 1–2 人、詞彙極少變動；DB lookup 需要 migration + lookup API + admin 管理頁，工作量遠大於收益。常數方案直接複用 Zod 既有 `z.enum(EMPLOYEE_STATUSES)` 模式，前後端共享、無漂移風險。
- **替代方案**：新增 `Department` / `Position` / `VehicleMake` 等 Prisma model + `/api/lookups` endpoint + admin lookup CRUD 頁面。捨棄因工作量不對等。

### Decision 2：Prisma schema 不改 enum，仍為 `String`

- **理由**：保留將來調整詞彙（如刪一個冷門廠牌）時不需 DB migration；避免 enum 與既有資料 mismatch 造成 migration 失敗；Zod 已能在 API 邊界擋住非法值，DB enum 屬於多餘的第二道守門。
- **替代方案**：改 Prisma 為 `enum Department { 資訊 工務 ... }`。捨棄因彈性差、且非英文 enum 值在 Prisma 文件上「不建議」。

### Decision 3：`POSITIONS` 內含「系統管理員」相容既有 admin seed

- **理由**：種子 admin (`apps/api/src/db/seed.ts`) 的 `position` 為「系統管理員」，若新詞彙不含該值，每次跑 `npm run seed` 都會壞掉，且 production 已部署的 admin 也會被 PATCH 擋下。
- **替代方案**：把種子 admin 的 position 改成「總經理」之類。捨棄因動既有資料的擴散面比加一個詞彙大。

### Decision 4：`seed:mock` 保留所有現有 ADMIN，只刪非 ADMIN 員工與全部車輛

- **理由**：種子 admin 必須保留以便登入；測試 (`src/test/setup.ts` 的 `resetDb()`) 可能在開發過程中被觸發並建立 admin1 等殘留 ADMIN，這個邏輯仍能讓 `seed:mock` 繼續成功。
- **替代方案**：保留只有 `SEED_ADMIN_USERNAME` 對應的 admin。捨棄因若種子 admin 已被 `resetDb()` 清掉，會無 admin 殘留導致登入失敗。

### Decision 5：Vehicles 「負責員工」由前端 lookup 解析，不改後端 API include

- **理由**：`GET /api/vehicles` 的 response shape 被 4 個既有測試以 `toEqual({...})` 嚴格驗證，後端加 `include: { owner }` 會 break 它們。前端用 `useQuery(["employees", "lookup-active"])` 抓 100 筆 ACTIVE 員工建 `Map<id, {name, employeeNo}>`，`staleTime: 60s` 已足夠，跨頁切換不會重複請求。
- **替代方案**：後端 `GET /api/vehicles` include owner，前端直接讀 `v.owner.name`。捨棄因會破測試且 API 形狀有破壞性變更。

### Decision 6：採 Sonner 而非自行包 Radix toast

- **理由**：`@radix-ui/react-toast` 已在 dependency 內但沒有實裝元件；Sonner 提供與 shadcn 一致的視覺、richColors、closeButton、theme="system" 等開箱可用功能，免維護成本。
- **替代方案**：自行寫 Radix toast wrapper。捨棄因工作量大、且現有 mutation 普遍只是 success / error 反饋，不需要複雜佇列。

### Decision 7：Magic UI 元件採 copy-paste 而非 npm 套件

- **理由**：Magic UI 官方就以「shadcn 風格 copy-paste」分發；放在 `apps/web/src/components/magicui/` 可在 repo 控制版本、可手動微調以對齊 brand token。
- **替代方案**：尋找對應 npm 套件。捨棄因 Magic UI 並未提供 npm 套件、且即使有也無法整合 brand CSS 變數。

### Decision 8：UI 視覺升級不寫入 spec delta

- **理由**：spec 描述行為（functional），不固化視覺細節（presentation）。寫死「Login 卡片要 BorderBeam」「Dashboard 統計卡要 NumberTicker」會造成 spec 與設計疊代週期不一致。下拉欄位、姓名顯示、enum 驗證等「行為層面」改動才寫入 delta。
- **替代方案**：把每個元件 / 動畫寫入前端頁面的 Requirement。捨棄因會把 spec 變成 UI 規範書、難以維護。

### Decision 9：`seed:mock` 守門用 `--yes` 或 `NODE_ENV=development`

- **理由**：破壞性 (清資料) 指令需明確 opt-in；當前無 prod 環境，但慣例先建立。
- **替代方案**：彈出 readline prompt 詢問。捨棄因 npm script 環境下 prompt 行為不一致、CI 不友善。

## Risks（風險）

### Risk 1：既有非開發環境的資料含不在詞彙清單的值

- **緩解**：目前無 prod 環境；開發環境跑 `seed:mock` 後資料皆合法。若日後有 prod，admin 編輯舊資料碰到非法 `department` 時表單會載入 placeholder「請重新選擇」，藉由表單載入時的 zod default 行為提示。後續若需嚴格遷移，可以另寫一次性 script 把舊值映射到合法詞彙。

### Risk 2：`seed:mock` 在 prod 誤觸

- **緩解**：守門 (`--yes` 或 `NODE_ENV=development`) 已擋住；root `npm run seed:mock` 預設帶 `--yes`，所以**只**在 dev 機器上有意義。

### Risk 3：前端員工 lookup query 在 USER 角色會 403

- **緩解**：`useActiveEmployees()` 第二參數 `enabled` 為 `isAdmin`；USER 不會送出該 request；USER 在 Vehicles 列表的「負責員工」直接顯示自己的 name（取自 `useAuthStore`）。

### Risk 4：`framer-motion` 增加 bundle size

- **緩解**：vite build 後 main chunk 約 1100 KB（gzipped 328 KB），增量約 100 KB（gzipped），可接受。後續可用 dynamic import 拆 Magic UI 元件。

### Risk 5：admin 編輯舊員工但忘了重選 position

- **緩解**：表單載入時用 defaultValues 帶入原 `position`；若該值不在 `POSITIONS` 內，shadcn `<Select>` 會顯示 placeholder「選擇職位」並要求重選，避免靜默失敗。前端 zod validation 會在 submit 時擋下並顯示錯誤。
