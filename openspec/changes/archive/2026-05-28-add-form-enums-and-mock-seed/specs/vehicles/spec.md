## MODIFIED Requirements

### Requirement: vehicle entity (車輛實體) 結構 (Vehicle Entity Schema)

系統 SHALL 儲存 vehicle 並具備下列欄位：`id` (uuid)、`plate` (車牌，unique 不可重複的非空字串)、`make` (廠牌，**SHALL 為受控詞彙 `VEHICLE_MAKES` 中之一**)、`model` (車型)、`year` (年份，integer，介於 1900 與「當年 + 1」之間)、`color` (顏色，**SHALL 為受控詞彙 `VEHICLE_COLORS` 中之一**)、`status` (enum：`AVAILABLE` 可用、`MAINTENANCE` 維修中、`RETIRED` 報廢)、`mileage` (里程數，非負 integer，單位公里)、`purchasedAt` (購買日期)、`ownerId` (負責員工 id，可為 null，外鍵指向 employees.id)、`createdAt`、`updatedAt`。

`VEHICLE_MAKES` 與 `VEHICLE_COLORS` 為 `@vms/shared` 匯出的 controlled vocabulary (受控詞彙)，由前後端共同引用；非詞彙清單內的值 SHALL 在 API 邊界由 Zod 擋下並回 `VALIDATION_ERROR` (400)。Prisma schema 的對應 column 仍維持 `String` 型別（不引入 DB enum），詞彙清單的擴充屬於 code change，不需要 DB migration。

#### Scenario: plate (車牌) 唯一性檢查 (Plate uniqueness is enforced)

- **WHEN** admin 以已存在的 `plate` 建立 vehicle
- **THEN** response SHALL 為 HTTP 409，body SHALL 為 `{ error: { code: "VEHICLE_PLATE_CONFLICT", message } }`

#### Scenario: year (年份) 驗證 (Year is validated)

- **WHEN** admin 提交 `year < 1900` 或 `year > 當年 + 1` 的 vehicle
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`

#### Scenario: owner (負責員工) 必須是在職員工 (Owner must reference active employee)

- **WHEN** admin 將 `ownerId` 設為一個不存在或 `status` 不為 `ACTIVE` 的員工 id
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "INVALID_OWNER", message } }`

#### Scenario: 非詞彙清單內的 make 被拒 (Make outside the vocabulary is rejected)

- **WHEN** admin 對 `POST /api/vehicles` 或 `PATCH /api/vehicles/:id` 送出不在 `VEHICLE_MAKES` 中的 `make` 值
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`，且 `details` SHALL 指出 `make` 欄位錯誤

#### Scenario: 非詞彙清單內的 color 被拒 (Color outside the vocabulary is rejected)

- **WHEN** admin 對 `POST /api/vehicles` 或 `PATCH /api/vehicles/:id` 送出不在 `VEHICLE_COLORS` 中的 `color` 值（例如 `"white"` 而非 `"白"`）
- **THEN** response SHALL 為 HTTP 400，body SHALL 為 `{ error: { code: "VALIDATION_ERROR", message, details } }`，且 `details` SHALL 指出 `color` 欄位錯誤

### Requirement: 車輛前端頁面 (Vehicle Frontend Pages)

Web app SHALL 提供 `/vehicles` 路由，呈現具分頁與搜尋功能的 data table (資料表)。admin SHALL 看到「新增車輛」按鈕與每一列的「編輯」「刪除」操作；user SHALL NOT 看到任何 mutation (變更) 按鈕。建立／編輯車輛表單中，`make`、`color` 欄位 SHALL 為 dropdown (下拉選單)，選項分別來自 `@vms/shared` 的 `VEHICLE_MAKES` 與 `VEHICLE_COLORS`；`ownerId` 欄位 SHALL 為 dropdown，選項來自當前 ACTIVE 員工清單（含「未指派」對應 `null`）。列表「負責員工」欄 SHALL 顯示為「`姓名（工號）`」格式，而非 raw uuid。

#### Scenario: admin 看到變更按鈕 (Admin sees mutation controls)

- **WHEN** admin 進入 `/vehicles`
- **THEN** 頁面 SHALL 顯示「新增車輛」按鈕
- **AND** 每一列 SHALL 顯示「編輯」與「刪除」按鈕

#### Scenario: user 看不到變更按鈕 (User does not see mutation controls)

- **WHEN** user 進入 `/vehicles`
- **THEN** 頁面 SHALL NOT 顯示任何新增／編輯／刪除按鈕或 menu (選單) 項目

#### Scenario: 刪除需二次確認 (Delete requires confirmation)

- **WHEN** admin 點擊某一列的「刪除」
- **THEN** SHALL 跳出 confirmation dialog (確認對話框)，使用者需明確按下確認後才會送出 `DELETE /api/vehicles/:id`

#### Scenario: make、color、ownerId 為下拉選擇 (Make, color and owner render as dropdowns)

- **WHEN** admin 開啟「新增車輛」或「編輯車輛」表單
- **THEN** `make` 欄位 SHALL 渲染為 dropdown，選項等於 `VEHICLE_MAKES`
- **AND** `color` 欄位 SHALL 渲染為 dropdown，選項等於 `VEHICLE_COLORS`
- **AND** `ownerId` 欄位 SHALL 渲染為 dropdown，選項為當前所有 ACTIVE 員工（顯示「`姓名（工號）`」）加上「未指派」一項（送出時對應 `null`）
- **AND** 表單 SHALL NOT 渲染為可自由輸入的 text input

#### Scenario: 列表「負責員工」欄顯示人類可讀名稱 (Owner column shows human-readable name)

- **GIVEN** vehicle V 的 `ownerId` 對應到員工 E（`name = "陳志明"`、`employeeNo = "EMP0007"`）
- **WHEN** admin 進入 `/vehicles` 並看到 V 的列
- **THEN** 「負責員工」欄 SHALL 顯示「`陳志明（EMP0007）`」，而非 V 的 `ownerId` uuid

#### Scenario: 未指派或員工不存在時的 fallback (Fallback when owner is missing)

- **GIVEN** vehicle V 的 `ownerId` 為 `null`，或對應員工已不在 ACTIVE lookup 中（例如該員工已被改為 INACTIVE 而未重新拉取 lookup）
- **WHEN** admin 進入 `/vehicles` 並看到 V 的列
- **THEN** 「負責員工」欄 SHALL 顯示「未指派」

#### Scenario: USER 角色不觸發員工 lookup 請求 (USER does not fetch employee lookup)

- **WHEN** USER 角色登入並進入 `/vehicles`
- **THEN** 前端 SHALL NOT 對 `/api/employees` 發送任何請求（避免 403）
- **AND** 「負責員工」欄 SHALL 顯示登入者自身的姓名（取自 auth session）
