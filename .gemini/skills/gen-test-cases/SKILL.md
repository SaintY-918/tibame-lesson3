---
name: Gen Test Cases
description: 根據選取的程式碼或功能範圍，自動產生測試案例清單與對應的測試程式，並驗證結果
---

扮演一位經驗豐富的軟體測試專家，根據以下步驟進行協作：

---

## STEP 1: 探測專案結構

掃描專案根目錄，判斷以下兩件事：

**1a. 專案層級（layers）**

讀取根目錄結構，識別有哪些層級存在：

| 偵測到的目錄或特徵 | 識別為 |
|---|---|
| `frontend/`、`client/`、`web/`，或根目錄有 `vite.config.*` / `next.config.*` | `frontend` |
| `backend/`、`server/`、`api/`，或根目錄有 `package.json` 且無前端特徵 | `backend` |
| `src/` 且同時含 UI 與 API 程式碼 | `app`（monolith） |
| 其他服務目錄（如 `worker/`、`jobs/`、`infra/`） | 以目錄名稱作為 layer 名 |

**1b. 測試框架**

對每個識別到的 layer，檢查：
- `package.json` 的 `devDependencies` / `scripts.test`
- 是否存在 `jest.config.*`、`vitest.config.*`、`pytest.ini`、`go.mod` 等設定檔
- 現有測試目錄（`__tests__/`、`tests/`、`spec/` 等）的位置與命名慣例

**1c. 建立 doc/test 子目錄**

依識別到的 layers 建立對應子目錄，例如：
- 前後端分離 → `doc/test/frontend/` + `doc/test/backend/`
- 純前端 → `doc/test/frontend/`
- Monolith → `doc/test/app/`
- 多服務 → `doc/test/<service-name>/`（每個服務一個）

> 若 `doc/test/` 已存在且有子目錄，沿用現有結構，不重建。

**1d. 掃描現有測試檔案**

對指定範圍對應的測試檔（如 `auth.test.ts`、`Login.test.tsx`）：
- 讀取現有測試檔，列出所有 `describe` / `it` / `test` 描述
- 判斷哪些案例已存在、哪些是新增的
- 若現有測試結構不符合 STEP 3 的規則（見下方），在 STEP 3 一併整併重構，**不另開新檔**

---

## STEP 2: 撰寫測試案例清單

根據指定範圍，依 layer 分別撰寫測試案例：
- 格式參考 `references/test-doc-template.md`
- 每個 layer 的案例寫入對應的 `doc/test/<layer>/` 子目錄，一個功能一個檔案
- 完成後列出清單供 Review，**不要直接生成測試程式**，確認符合預期後再進行下一步

---

## STEP 3: 撰寫測試程式

參考 `doc/test/<layer>/` 的案例文件，依照 STEP 1 偵測到的框架與慣例撰寫測試程式：
- 測試檔案放在對應 layer 現有的測試目錄（若無則在 `src/__tests__/` 或 `tests/` 下建立）
- 不同功能 / 頁面 / 路由建立獨立檔案
- 若 layer 尚未安裝測試框架，先列出需要安裝的套件並等待確認，再繼續

**撰寫規則：**
- 第二層 `describe()` 必須為「測試類型」（對應 Markdown 標題的【】內文字，如「Mock API」、「表單驗證」、「CSRF 守衛」）
- 每個 `it()` / `test()` 的描述直接使用 Markdown 原文（`##` 標題去掉狀態符號和【測試類型】後的文字），不翻譯、不重新命名

**整併現有測試檔規則（當 STEP 1d 發現既有測試時）：**
- 不另開新檔，直接修改現有測試檔
- 將現有 `it()` / `test()` 的描述改為對應 Markdown 案例的原文
- 將現有測試依測試類型分組，補上第二層 `describe(測試類型)` 包裹
- 新增案例補寫在對應的測試類型 `describe` 區塊內
- 整併後的結構範例：
  ```ts
  describe("auth", () => {
    describe("成功登入", () => {
      test("正確帳密 → 200、回傳 user + csrfToken、Set-Cookie httpOnly", ...)
    })
    describe("帳號鎖定", () => {
      test("連續 5 次失敗鎖定帳號", ...)
      test("4 次失敗尚未鎖定", ...)       // 新增
    })
  })
  ```

---

## STEP 4: 驗證測試程式

執行對應 layer 的測試指令（從 STEP 1 偵測到的 `scripts.test` 或框架預設指令）。

若測試通過，到對應的 `doc/test/<layer>/` Markdown 檔將已通過的案例打勾（`[ ]` → `[x]`）。

---

## STEP 5: 修復迴圈

若測試不符預期，重複 STEP 3–4，最多 5 次。5 次仍失敗則停下來說明原因與建議方向。
