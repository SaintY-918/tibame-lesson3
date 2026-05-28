# Add Form Enums, Mock Seed and Magic UI Polish（新增表單受控詞彙、模擬資料 seed 與 Magic UI 風格升級）

## Why（動機）

- 員工 `department` / `position` 與車輛 `make` / `color` 目前是自由文字（`z.string().min(1)`），admin 容易輸入錯字（例如「工務」打成「公務」），造成 dashboard 部門統計與列表搜尋失準，無法做穩定的 aggregate (彙整)。
- 開發環境 seed 只建立 1 名 admin，dashboard 圖表、role-aware 列表、分頁、表格 hover 等場景皆無資料可實際驗證，每次改動都得手動建。
- 既有 UI 為原型外觀（純黑白灰、無 micro-interaction (微互動)、無 toast (通知)），與「現代化內部 SaaS (Software as a Service，軟體即服務)」的形象有落差，內部展示時觀感薄弱。
- 車輛列表的「負責員工」目前以截斷後的 `ownerId` 字串顯示，admin 無法直接辨識；表單也以 raw id 自由文字輸入，極易誤填。

## What Changes（變更內容）

- `@vms/shared` 新增 4 個 controlled vocabulary (受控詞彙) 常數：`DEPARTMENTS`、`POSITIONS`、`VEHICLE_MAKES`、`VEHICLE_COLORS`，與對應 type alias。
- `packages/shared/src/schemas/{employee,vehicle}.ts` 的 `department`、`position`、`make`、`color` 由 `z.string().min(1)` 改為 `z.enum(...)`（create + update 皆改）。
- 後端路由不需改動，Zod 自動驗證；驗證失敗仍走既有 `VALIDATION_ERROR` (400) 流程。
- 前端 `apps/web/src/pages/{Employees,Vehicles}.tsx` 將上述四欄改用 shadcn `<Select>`（透過 react-hook-form `Controller`）；順手把原本的原生 `<select>` 狀態欄統一改為 shadcn `<Select>`。
- Vehicles 列表「負責員工」欄改為顯示「`姓名（工號）`」；表單 `ownerId` 由文字 input 改為下拉，選項來自 ACTIVE 員工。前端透過 `useActiveEmployees()` (TanStack Query，`staleTime: 60s`) 取 lookup，不修改後端 `GET /api/vehicles` 的 response shape，以保留既有 31 個 API 測試。
- 新增 `apps/api/src/db/seed-mock.ts` 與對應 `npm run seed:mock` 指令：保留所有 ADMIN、清空其他員工與全部 vehicle，重建 30 員工（含 2 名額外 ADMIN、4 名 INACTIVE）+ 50 vehicle（10 台 `ownerId=null`、status 35/10/5、`purchasedAt` 均勻分布過去 12 個月，確保 dashboard 趨勢圖每月有資料）。
- 安裝 `framer-motion` 與 `sonner`；新增 4 個 Magic UI 元件 (`NumberTicker`、`MagicCard`、`AnimatedGradientText`、`BorderBeam`)；擴充 brand 漸層 / glass / popover / mesh / keyframes 等 CSS 變數與 Tailwind theme；以 Sonner toast 取代既有 `setError("root")` 的硬訊息反饋。
- 修補 `select.tsx` 的 `bg-popover` 透明問題（補 `--popover` / `--popover-foreground` CSS 變數與 Tailwind `colors.popover`）。

## Capabilities（能力清單）

### New Capabilities

（無新 capability。本 change 在既有 capability 上做修改與工具補強。）

### Modified Capabilities

- `employees`：`department` 與 `position` 改為受控詞彙；前端表單改為下拉，不再接受自由文字。
- `vehicles`：`make` 與 `color` 改為受控詞彙；前端表單與列表的「負責員工」由 id 改為「姓名（工號）」顯示與下拉選擇。

## Impact（影響範圍）

- **新檔案／結構**
  - `apps/api/src/db/seed-mock.ts`（mock 資料 seed 工具）
  - `apps/web/src/components/magicui/{number-ticker,magic-card,animated-gradient-text,border-beam}.tsx`
- **依賴新增**
  - web：`framer-motion`（Magic UI 元件動畫所需）、`sonner`（取代未實裝的 Radix toast）
  - api / shared：無新增
- **環境變數**：無新增；可選 `SEED_MOCK_CONFIRM=1` 環境變數取代 `--yes` flag。
- **資料庫 migration**：無。Prisma schema 仍維持 `String`，受控詞彙由 Zod 於 API 邊界守門；不引入 Prisma enum，以便後續調整詞彙無需 migration、無 data drift (資料漂移) 顧慮。
- **API 路由**：無新增。既有 `POST /api/employees`、`PATCH /api/employees/:id`、`POST /api/vehicles`、`PATCH /api/vehicles/:id` 對應四欄的可接受值由「任意非空字串」收斂為「受控詞彙清單之一」；非法值會走既有 `VALIDATION_ERROR` (400)。
- **前端路由**：無新增。
- **npm scripts**：root `package.json` 新增 `seed:mock`；`apps/api/package.json` 新增 `seed:mock`。
- **測試覆蓋**：既有 31 個 API 測試全綠（同步把 hardcoded `"white"`、`"業務"`（position）、`"A"`、`"B"` 改為合法詞彙）；`apps/web` `tsc -b && vite build` 通過。

## Non-goals（非目標）

- 不引入 Prisma DB enum；不開放讓 admin 透過 UI 動態維護下拉選項（採 shared 常數）。
- 不引入 i18n／selector 元件動態翻譯。
- 不重構 Prisma 既有索引；不重新設計 dashboard 的 query。
- Magic UI 視覺升級屬於前端表現層，不寫入 spec delta；行為層面（下拉、姓名顯示、enum 驗證）才寫入 delta。
- 不修改 `GET /api/vehicles` 的 response shape（不 include `owner`），avoid 破壞既有測試。
