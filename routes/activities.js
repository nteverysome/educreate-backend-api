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

// 獲取用戶的活動列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

    const activities = await prisma.activity.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        template: true,
        gameTemplate: true
      }
    });

    const total = await prisma.activity.count({ where });

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('獲取活動列表失敗:', error);
    res.status(500).json({ error: '獲取活動列表失敗' });
  }
});

// 獲取特定活動
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findFirst({
      where: {
        id,
        userId: req.user.id
      },
      include: {
        template: true,
        gameTemplate: true,
        gameSettings: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: '活動不存在' });
    }

    res.json(activity);
  } catch (error) {
    console.error('獲取活動失敗:', error);
    res.status(500).json({ error: '獲取活動失敗' });
  }
});

// 創建新活動
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      templateId,
      gameTemplateId,
      difficulty,
      tags = []
    } = req.body;

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        content: content || {},
        userId: req.user.id,
        templateId,
        gameTemplateId,
        difficulty,
        tags,
        status: 'DRAFT'
      },
      include: {
        template: true,
        gameTemplate: true
      }
    });

    res.status(201).json({
      message: '活動創建成功',
      activity
    });
  } catch (error) {
    console.error('創建活動失敗:', error);
    res.status(500).json({ error: '創建活動失敗' });
  }
});

// 更新活動
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 檢查活動是否屬於當前用戶
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: '活動不存在' });
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        template: true,
        gameTemplate: true
      }
    });

    res.json({
      message: '活動更新成功',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('更新活動失敗:', error);
    res.status(500).json({ error: '更新活動失敗' });
  }
});

// 刪除活動
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查活動是否屬於當前用戶
    const existingActivity = await prisma.activity.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: '活動不存在' });
    }

    await prisma.activity.delete({
      where: { id }
    });

    res.json({ message: '活動刪除成功' });
  } catch (error) {
    console.error('刪除活動失敗:', error);
    res.status(500).json({ error: '刪除活動失敗' });
  }
});

module.exports = router;
