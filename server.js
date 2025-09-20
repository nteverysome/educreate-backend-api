const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// 安全中間件
app.use(helmet());

// CORS 配置 - 允許前端域名訪問
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://edu-create.vercel.app',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 請求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100 // 每個 IP 最多 100 個請求
});
app.use(limiter);

// 日誌中間件
app.use(morgan('combined'));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EduCreate Backend API'
  });
});

// 基本 API 測試端點
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API 測試端點正常運行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/users', require('./routes/users'));
app.use('/api/activities', require('./routes/activities'));

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduCreate Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
