const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// 認證中間件
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供認證 token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: '用戶不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('認證失敗:', error);
    res.status(401).json({ error: 'Token 無效' });
  }
};

// 獲取用戶資料
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('獲取用戶資料失敗:', error);
    res.status(500).json({ error: '獲取用戶資料失敗' });
  }
});

// 更新用戶資料
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, image } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(image && { image })
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: '用戶資料更新成功',
      user: updatedUser
    });
  } catch (error) {
    console.error('更新用戶資料失敗:', error);
    res.status(500).json({ error: '更新用戶資料失敗' });
  }
});

// 獲取用戶統計
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // 獲取用戶的活動統計
    const activityCount = await prisma.activity.count({
      where: { userId: req.user.id }
    });

    // 獲取用戶的遊戲統計（如果有 GameSession 模型）
    let gameStats = { totalSessions: 0, totalScore: 0 };
    try {
      const gameSessions = await prisma.gameSession.findMany({
        where: { userId: req.user.id }
      });
      
      gameStats = {
        totalSessions: gameSessions.length,
        totalScore: gameSessions.reduce((sum, session) => sum + (session.score || 0), 0),
        averageScore: gameSessions.length > 0 
          ? gameSessions.reduce((sum, session) => sum + (session.score || 0), 0) / gameSessions.length 
          : 0
      };
    } catch (error) {
      // GameSession 模型可能不存在，忽略錯誤
      console.log('GameSession 模型不存在，跳過遊戲統計');
    }

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      stats: {
        activityCount,
        ...gameStats
      }
    });
  } catch (error) {
    console.error('獲取用戶統計失敗:', error);
    res.status(500).json({ error: '獲取用戶統計失敗' });
  }
});

module.exports = router;
