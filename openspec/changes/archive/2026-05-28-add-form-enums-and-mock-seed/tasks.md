# Tasks — Add Form Enums, Mock Seed and Magic UI Polish

## 1. Shared 受控詞彙 (Shared Controlled Vocabulary)

- [x] 1.1 在 `packages/shared/src/types.ts` 新增 `DEPARTMENTS`、`POSITIONS`、`VEHICLE_MAKES`、`VEHICLE_COLORS` 四個 `as const` 陣列與對應 type alias `Department` / `Position` / `VehicleMake` / `VehicleColor`
- [x] 1.2 確認 `POSITIONS` 包含「系統管理員」，避免既有 admin seed 失效（見 design Decision 3）
- [x] 1.3 透過 `packages/shared/src/index.ts` re-export 新常數與型別（barrel 沿用既有結構，無需手動加 export）

## 2. Schema enum 化 (Zod Schemas Enum-ification)

- [x] 2.1 修改 `packages/shared/src/schemas/employee.ts`：`createEmployeeSchema` / `updateEmployeeSchema` 的 `department` 由 `z.string().min(1)` 改為 `z.enum(DEPARTMENTS)`，`position` 改為 `z.enum(POSITIONS)`
- [x] 2.2 修改 `packages/shared/src/schemas/vehicle.ts`：`createVehicleSchema` / `updateVehicleSchema` 的 `make` 改為 `z.enum(VEHICLE_MAKES)`、`color` 改為 `z.enum(VEHICLE_COLORS)`
- [x] 2.3 確認非法值仍走既有 `apps/api/src/middleware/error.ts` 的 `ZodError → 400 VALIDATION_ERROR` 流程；不新增任何 `ApiErrorCode`

## 3. API 測試與工具同步 (API Tests and Factories Sync)

- [x] 3.1 更新 `apps/api/src/test/factories.ts`：`MakeEmployeeOptions.department` 型別由 `string` 收斂為 `Department`，並 import `Department` 型別
- [x] 3.2 修改 `apps/api/src/routes/employees.test.ts`：將 hardcoded `position: "業務"` 改為 `position: "專員"`（避免 `業務` 同時當 department 與 position 造成詞彙錯位）
- [x] 3.3 修改 `apps/api/src/routes/vehicles.test.ts`：將 hardcoded `color: "white"` 全部改為 `color: "白"`
- [x] 3.4 修改 `apps/api/src/routes/dashboard.test.ts`：將 hardcoded `department: "A"` / `"B"` 改為合法詞彙 `"資訊"` / `"業務"`，並同步斷言中的部門 aggregate 結果
- [x] 3.5 跑 `npm test --workspace apps/api`，確認 31 個既有測試全綠

## 4. Mock seed 指令 (Mock Seed Command)

- [x] 4.1 新增 `apps/api/src/db/seed-mock.ts`：以 `tsx` 與 `@vms/shared` 詞彙建立 30 員工（含 2 名額外 ADMIN、4 名 INACTIVE）+ 50 vehicle（10 台 `ownerId=null`、status 35/10/5、`purchasedAt` 均勻分布過去 12 個月）
- [x] 4.2 守門：未帶 `--yes` 且 `NODE_ENV !== 'development'` 時 abort，避免誤觸 prod（見 design Decision 9）
- [x] 4.3 保留所有現有 `role=ADMIN` 員工，僅刪除非 ADMIN 員工與全部 vehicle（見 design Decision 4）
- [x] 4.4 mock 員工密碼統一 hash 為 `password1234`，方便 dev 切換登入
- [x] 4.5 `apps/api/package.json` 新增 `"seed:mock": "tsx src/db/seed-mock.ts"`；root `package.json` 新增 `"seed:mock": "npm run seed:mock --workspace apps/api -- --yes"`
- [x] 4.6 在乾淨 dev DB 上跑 `npm run seed:mock`，並用 pgAdmin 確認員工 / 車輛筆數與分布

## 5. 前端表單與顯示 (Frontend Forms and Display)

- [x] 5.1 新增 `useActiveEmployees()` hook（TanStack Query key `["employees", "lookup-active"]`、`staleTime: 60s`、`enabled: isAdmin`），向 `GET /api/employees?status=ACTIVE&pageSize=100` 抓 lookup
- [x] 5.2 `apps/web/src/pages/Employees.tsx`：將 `department` / `position` 由 `<Input>` 改為 shadcn `<Select>`（搭配 react-hook-form `Controller`，選項來自 `DEPARTMENTS` / `POSITIONS`）；同步把原生 `<select>` 狀態欄統一改為 shadcn `<Select>`
- [x] 5.3 `apps/web/src/pages/Vehicles.tsx`：將 `make` / `color` 改為 shadcn `<Select>`（選項來自 `VEHICLE_MAKES` / `VEHICLE_COLORS`）；`ownerId` 改為下拉，選項來自 `useActiveEmployees()`，含「未指派」一項對應 `null`
- [x] 5.4 `apps/web/src/pages/Vehicles.tsx` 列表「負責員工」欄：以 `useActiveEmployees()` 解析為「`姓名（工號）`」；找不到時 fallback 顯示「未指派」（負責員工已離職或不存在）
- [x] 5.5 修補 `apps/web/src/components/ui/select.tsx` 的 `bg-popover` 透明問題：補 `--popover` / `--popover-foreground` CSS 變數與 Tailwind `colors.popover`
- [x] 5.6 跑 `cd apps/web && npx tsc -b && npx vite build`，確認 build 通過

## 6. Magic UI 視覺升級 (Magic UI Polish)

- [x] 6.1 新增 `apps/web/package.json` 依賴：`framer-motion`、`sonner`
- [x] 6.2 新增 `apps/web/src/components/magicui/{number-ticker,magic-card,animated-gradient-text,border-beam}.tsx` 四個 Magic UI 元件（copy-paste 風格，見 design Decision 7）
- [x] 6.3 擴充 `apps/web/src/index.css`：新增 brand 漸層、glass、popover、mesh、keyframes 等 CSS 變數
- [x] 6.4 擴充 `apps/web/tailwind.config.js`：加入 brand colors、漸層 utility、animation 設定
- [x] 6.5 `apps/web/src/App.tsx` 掛上 `<Toaster position="top-right" richColors closeButton theme="system" />`
- [x] 6.6 以 Sonner toast 取代 `Login`、`Employees`、`Vehicles` 既有 `setError("root")` 等硬訊息反饋（成功 / 失敗 / 表單錯誤）
- [x] 6.7 `Dashboard`、`Employees`、`Vehicles`、`AppShell`、`Login` 套用 NumberTicker / MagicCard / AnimatedGradientText / BorderBeam 等元件，落實 brand 視覺
- [x] 6.8 視覺升級**不**寫入 spec delta（見 design Decision 8）

## 7. Spec 工作流程 (Spec Workflow)

- [x] 7.1 撰寫 `openspec/changes/add-form-enums-and-mock-seed/proposal.md`（Why / What Changes / Capabilities / Impact / Non-goals，雙語標題）
- [x] 7.2 撰寫 `openspec/changes/add-form-enums-and-mock-seed/design.md`（Context / Goals / Non-Goals / Decisions / Risks，9 條 Decision 含理由與替代方案）
- [x] 7.3 撰寫 `openspec/changes/add-form-enums-and-mock-seed/specs/employees/spec.md`（`MODIFIED Requirements`：受控詞彙、列表 department filter）
- [x] 7.4 撰寫 `openspec/changes/add-form-enums-and-mock-seed/specs/vehicles/spec.md`（`MODIFIED Requirements`：受控詞彙、前端負責員工顯示與選擇）
- [x] 7.5 撰寫 `openspec/changes/add-form-enums-and-mock-seed/tasks.md`（本檔；N.M 樹狀；已完成標 [x]）
- [x] 7.6 同步主 specs：將 delta 套用到 `openspec/specs/{employees,vehicles}/spec.md`
- [x] 7.7 歸檔：將 `openspec/changes/add-form-enums-and-mock-seed/` 移到 `openspec/changes/archive/2026-05-28-add-form-enums-and-mock-seed/`
