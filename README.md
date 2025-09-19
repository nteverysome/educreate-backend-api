# EduCreate Backend API

EduCreate 項目的後端 API 服務，提供用戶認證、遊戲統計和數據管理功能。

## 🚀 部署到 Railway

### 環境變量設置

在 Railway 控制台中設置以下環境變量：

```bash
# 數據庫連接
DATABASE_URL=postgresql://neondb_owner:npg_1234567890abcdef@ep-dry-cloud-00816876.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth 配置
NEXTAUTH_SECRET=educreate-dev-secret-key-2024
NEXTAUTH_URL=https://your-backend-domain.railway.app

# 服務器配置
PORT=3002
NODE_ENV=production

# CORS 配置
FRONTEND_URL=https://your-frontend-domain.vercel.app
PRODUCTION_FRONTEND_URL=https://your-frontend-domain.vercel.app

# JWT 配置
JWT_SECRET=educreate-dev-secret-key-2024
```

### 部署步驟

1. **創建 Railway 項目**
   - 訪問 [railway.app](https://railway.app)
   - 點擊 "New Project"
   - 選擇 "Deploy from GitHub repo"

2. **連接 GitHub 倉庫**
   - 上傳此 backend-api 目錄到 GitHub
   - 在 Railway 中選擇該倉庫

3. **配置環境變量**
   - 在 Railway 項目設置中添加上述環境變量

4. **部署**
   - Railway 會自動檢測 package.json 並運行 `npm start`
   - 等待部署完成

### API 端點

- `GET /health` - 健康檢查
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/verify` - 驗證 token
- `GET /api/games/stats` - 獲取遊戲統計
- `POST /api/games/stats` - 保存遊戲統計
- `GET /api/users/profile` - 獲取用戶資料
- `GET /api/activities` - 獲取活動列表

### 本地開發

```bash
# 安裝依賴
npm install

# 設置環境變量
cp .env.example .env
# 編輯 .env 文件

# 生成 Prisma 客戶端
npx prisma generate

# 啟動開發服務器
npm run dev
```

### 技術棧

- **框架**: Express.js
- **數據庫**: PostgreSQL (Neon)
- **ORM**: Prisma
- **認證**: JWT + bcryptjs
- **部署**: Railway

### 健康檢查

部署後可以通過以下 URL 檢查服務狀態：
```
https://your-backend-domain.railway.app/health
```

應該返回：
```json
{
  "status": "ok",
  "timestamp": "2025-09-19T13:14:23.743Z",
  "service": "EduCreate Backend API"
}
```
