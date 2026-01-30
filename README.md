# 購物網站 - 部署與設定教學

本文件將引導您如何設定此專案的後端資料庫 (Supabase)、上傳至 GitHub 並透過 Vercel 進行網站部署。

---

## 1. 準備工作

在開始之前，請確保您擁有以下帳號：
- **GitHub 帳號**: 用於託管程式碼。
- **Supabase 帳號**: 用於資料庫與圖片儲存。
- **Vercel 帳號**: 用於託管與發布網站。

---

## 2. Supabase 資料庫設定

此專案使用 Supabase 作為後端。請依照以下步驟設定：

### 2.1 建立專案
1. 登入 Supabase Dashboard。
2. 點擊 **"New Project"**。
3. 填寫專案名稱 (Name)、資料庫密碼 (Database Password)，選擇離您最近的 Region (例如 Singapore 或 Tokyo)。
4. 等待專案建立完成。

### 2.2 匯入資料庫結構 (Schema)
1. 在左側選單點擊 **"SQL Editor"** (圖標類似終端機 `>_`)。
2. 點擊 **"New query"**。
3. 開啟本專案中的 `schema.sql` 檔案，複製 **全部內容**。
4. 將內容貼上到 Supabase 的 SQL Editor 中。
5. 點擊右下角的 **"Run"** 按鈕執行。
   - 若出現 `Success` 訊息，代表資料表與權限已建立完成。

### 2.3 設定 Storage (已在 SQL 腳本中包含，此為檢查步驟)
1. 點擊左側選單的 **"Storage"**。
2. 確認是否有看到一個名為 `product-images` 的 Bucket。
3. 點擊 `Configuration` tab (或 Policies)，確認是否有設定 `Public Access` 與相關讀寫權限。 (SQL 腳本應已自動設定完成)。

### 2.4 取得 API 金鑰
1. 點擊左側選單的 **"Project Settings"** (齒輪圖示)。
2. 選擇 **"API"**。
3. 您會看到 `Project URL` 和 `Project API keys` (anon/public)。
   - **Project URL**: 您的專案網址。
   - **anon public**: 您的公開金鑰。
   - **(*請先記下這兩組資料，稍後會用到*)**。

---

## 3. 上傳程式碼至 GitHub

GitHub 用於備份您的代碼並提供給 Vercel 進行部署。

### 3.1 檢查檔案
確保專案根目錄下有 `.gitignore` 檔案，且內容包含：
```
node_modules
.env
dist
.DS_Store
```
*注意：絕對不要將 `.env` 檔案上傳到 GitHub，以保護您的密鑰安全。*

### 3.2 建立 Repository (儲存庫)
1. 登入 GitHub，點擊右上角 **"+" -> "New repository"**。
2. 輸入 Repository name (例如 `my-shop`)。
3. 選擇 **Private** (私有) 或 Public (公開)。
4. 點擊 **"Create repository"**。

### 3.3 推送程式碼
在您的專案資料夾中，開啟終端機 (Terminal/CMD) 並依序執行：

```bash
# 初始化 Git (若尚未初始化)
git init

# 加入所有檔案
git add .

# 提交變更
git commit -m "Initial deploy"

# 設定遠端倉庫 (將 URL 替換為您剛剛建立的 GitHub Repository 網址)
git remote add origin https://github.com/您的帳號/my-shop.git

# 推送到 GitHub
git push -u origin main
```

---

## 4. 部署至 Vercel

Vercel 是最推薦的 React/Vite 部署平台。

1. 登入 Vercel Dashboard。
2. 點擊 **"Add New..." -> "Project"**。
3. 在 "Import Git Repository" 區塊，找到您剛剛上傳的 GitHub 專案，點擊 **"Import"**。
4. **設定環境變數 (Environment Variables)**：
   - 展開 **"Environment Variables"** 選項。
   - 新增以下兩組變數 (填入步驟 2.4 取得的資料)：
     - Name: `VITE_SUPABASE_URL` , Value: (您的 Supabase Project URL)
     - Name: `VITE_SUPABASE_ANON_KEY` , Value: (您的 Supabase anon Key)
5. 其他設定保持預設 (Framework Preset 應會自動偵測為 Vite)。
6. 點擊 **"Deploy"**。

等待約 1-2 分鐘，部署完成後，您會看到滿滿的慶祝動畫。點擊預覽圖或 Domain 連結即可進入您的網站！

---

## 5. 後續設定

### 新增管理員
目前的商品管理頁面需要權限。建議您：
1. 造訪您的網站。
2. 進入 Supabase -> **Authentication** -> **Users**。
3. 您可以直接在 Supabase 新增使用者，或透過網站的前端註冊功能 (若有實作) 來建立帳號。
4. (進階) 若需要管理權限控制，請參考 `schema.sql` 中的 RLS Policy 設定，目前預設是所有登入使用者皆可管理商品 (適合單人管理)，若需更嚴格權限可自行調整 Policy。

### 進入後台
預設後台路徑為 `/a` (可於 `src/config.js` 中修改)，例如：`https://您的網址.vercel.app/a`。

---

## 常見問題

**Q: 圖片上傳失敗？**
A: 請檢查 Supabase Storage 的 `product-images` Bucket 是否存在，且 Policy 是否允許 `authenticated` 角色執行 INSERT/UPDATE。

**Q: 部署後畫面全白？**
A: 請檢查 Vercel 的 Environment Variables 是否設定正確。Vite 專案必須以 `VITE_` 開頭的變數才會被前端讀取。

**Q: 本地開發如何執行？**
A:
1. `npm install`
2. 建立 `.env` 檔案並填入變數。
3. `npm run dev`
