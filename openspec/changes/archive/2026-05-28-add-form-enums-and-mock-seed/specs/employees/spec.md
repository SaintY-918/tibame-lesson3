## MODIFIED Requirements

### Requirement: employee entity (員工實體) 結構 (Employee Entity Schema)

系統 SHALL 儲存 employee 並具備下列欄位：`id` (uuid)、`employeeNo` (員工編號，unique 非空字串)、`name` (姓名)、`email` (unique，須符合 RFC-5322 規範)、`department` (部門，**SHALL 為受控詞彙 `DEPARTMENTS` 中之一**)、`position` (職位，**SHALL 為受控詞彙 `POSITIONS` 中之一**)、`hiredAt` (入職日期)、`phone` (電話)、`status` (enum：`ACTIVE` 在職 / `INACTIVE` 離職，預設 `ACTIVE`)、`username` (登入帳號，unique 非空字串)、`passwordHash`、`role` (enum：`ADMIN` / `USER`，預設 `USER`)、`failedLoginCount` (登入失敗次數，integer，預設 0)、`lockedUntil` (鎖定到期時間，timestamp，可為 null)、`createdAt`、`updatedAt`。

`DEPARTMENTS` 與 `POSITIONS` 為 `@vms/shared` 匯出的 controlled vocabulary (受控詞彙)，由前後端共同引用；非詞彙清單內的值 SHALL 在 API 邊界由 Zod 擋下並回 `VALIDATION_ERROR` (400)。Prisma schema 的對應 column 仍維持 `String` 型別（不引入 DB enum），詞彙清單的擴充屬於 code change，不需要 DB migration。

#### Scenario: 唯一欄位 (unique field) 檢查 (Unique fields are enforced)

- **WHEN** admin 以已存在的 `employeeNo`、`email`、或 `username` 建立 employee
- **THEN** response SHALL 為 HTTP 409，body SHALL 為 `{ error: { code: "EMPLOYEE_CONFLICT", message, details: { field } } }`

#### Scenario: email 驗證 (Email is validated)

- **WHEN** admin 提交不符合 RFC-5322 規範的 `email`
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`

#### Scenario: 非詞彙清單內的 department 被拒 (Department outside the vocabulary is rejected)

- **WHEN** admin 對 `POST /api/employees` 或 `PATCH /api/employees/:id` 送出不在 `DEPARTMENTS` 中的 `department` 值（例如錯字 `"公務"`）
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`，且 `details` SHALL 指出 `department` 欄位錯誤

#### Scenario: 非詞彙清單內的 position 被拒 (Position outside the vocabulary is rejected)

- **WHEN** admin 對 `POST /api/employees` 或 `PATCH /api/employees/:id` 送出不在 `POSITIONS` 中的 `position` 值
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`，且 `details` SHALL 指出 `position` 欄位錯誤

### Requirement: 員工列表支援搜尋與篩選 (Search and Filter on Listing)

`GET /api/employees` SHALL 支援分頁 (`page`、`pageSize`)、`search` (對 `name`、`employeeNo`、`email` 做不分大小寫 substring 比對)、`department` filter、`status` filter (`ACTIVE` / `INACTIVE` / `ALL`，預設 `ACTIVE`)。`department` query 參數 SHALL 接受 `DEPARTMENTS` 中之一；非詞彙值 SHALL 走 `VALIDATION_ERROR` (400)。

#### Scenario: 預設不顯示 INACTIVE (Default excludes inactive)

- **GIVEN** 資料庫中有 3 名 ACTIVE、2 名 INACTIVE 員工
- **WHEN** admin 呼叫 `GET /api/employees` 且不帶 `status` 參數
- **THEN** response SHALL 包含 3 筆資料

#### Scenario: 明確指定 INACTIVE (Explicit INACTIVE filter)

- **WHEN** admin 呼叫 `GET /api/employees?status=INACTIVE`
- **THEN** 僅 `status === "INACTIVE"` 的 employee SHALL 被回傳

#### Scenario: department filter 比對受控詞彙 (Department filter matches the controlled vocabulary)

- **GIVEN** 資料庫中有 2 名 department=`"資訊"` 與 1 名 department=`"業務"` 的 ACTIVE 員工
- **WHEN** admin 呼叫 `GET /api/employees?department=資訊`
- **THEN** 僅 department=`"資訊"` 的 2 名 employee SHALL 被回傳

### Requirement: 員工管理前端頁面 (Employees Frontend Page)

Web app SHALL 提供 `/employees` 路由，且 SHALL 僅供 admin 存取。非 admin 進入 `/employees` SHALL 被導回 `/`，且 SHALL NOT 看到頁面內容或觸發任何對 `/api/employees*` 的 API 呼叫。建立／編輯員工表單中，`department` 與 `position` 欄位 SHALL 為 dropdown (下拉選單)，選項分別來自 `@vms/shared` 的 `DEPARTMENTS` 與 `POSITIONS`；SHALL NOT 接受自由文字輸入。

#### Scenario: admin 進入頁面 (Admin renders the page)

- **WHEN** admin 進入 `/employees`
- **THEN** 頁面 SHALL 渲染員工 data table、搜尋、篩選器與「新增員工」按鈕

#### Scenario: user 被導回首頁 (User is redirected)

- **WHEN** user 進入 `/employees`
- **THEN** client SHALL 將其導回 `/`，且 SHALL NOT 對任何 `/api/employees*` endpoint 發送請求

#### Scenario: 重設密碼 UI (Reset password UI)

- **WHEN** admin 點擊某員工列的「重設密碼」
- **THEN** SHALL 跳出 dialog 要求輸入新密碼，並 SHALL 在前端驗證長度 ≥ 8 後呼叫 `POST /api/employees/:id/reset-password`

#### Scenario: department 與 position 為下拉選擇 (Department and position render as dropdowns)

- **WHEN** admin 開啟「新增員工」或「編輯員工」表單
- **THEN** `department` 欄位 SHALL 渲染為 dropdown，選項等於 `DEPARTMENTS`；`position` 欄位 SHALL 渲染為 dropdown，選項等於 `POSITIONS`
- **AND** 表單 SHALL NOT 渲染為可自由輸入的 text input

#### Scenario: 編輯舊資料時遇到不在詞彙內的值 (Editing legacy out-of-vocabulary value)

- **GIVEN** 既有 employee 的 `department` 為不在 `DEPARTMENTS` 中的歷史值
- **WHEN** admin 開啟其「編輯員工」表單
- **THEN** `department` dropdown SHALL 顯示 placeholder 並要求重選；submit 時若仍為非詞彙值 SHALL 由前端 zod validation 擋下並顯示錯誤
