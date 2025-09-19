const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// 遊戲統計 API - 移植自 pages/api/games/stats.ts
router.get('/stats', async (req, res) => {
  const { sessionId, userId } = req.query;
  
  try {
    if (sessionId) {
      // 查詢特定會話（這裡需要根據實際數據模型調整）
      const session = await prisma.gameSession.findUnique({
        where: { id: sessionId }
      });
      
      if (session) {
        res.json(session);
      } else {
        res.status(404).json({ error: '遊戲會話未找到' });
      }
    } else if (userId) {
      // 查詢用戶的所有會話
      const userSessions = await prisma.gameSession.findMany({
        where: { userId }
      });
      res.json(userSessions);
    } else {
      // 返回總體統計
      const totalSessions = await prisma.gameSession.count();
      const stats = await prisma.gameSession.aggregate({
        _sum: {
          score: true,
          questionsAnswered: true,
          correctAnswers: true
        }
      });
      
      res.json({
        totalSessions,
        averageScore: totalSessions > 0 ? (stats._sum.score || 0) / totalSessions : 0,
        totalQuestions: stats._sum.questionsAnswered || 0,
        overallAccuracy: (stats._sum.questionsAnswered || 0) > 0 
          ? ((stats._sum.correctAnswers || 0) / (stats._sum.questionsAnswered || 0)) * 100 
          : 0
      });
    }
  } catch (error) {
    console.error('獲取遊戲統計失敗:', error);
    res.status(500).json({ error: '服務器錯誤' });
  }
});

// 保存遊戲統計
router.post('/stats', async (req, res) => {
  try {
    const sessionData = req.body;
    
    const newSession = await prisma.gameSession.create({
      data: {
        userId: sessionData.userId,
        gameType: sessionData.gameType || 'shimozurdo',
        score: sessionData.score || 0,
        questionsAnswered: sessionData.questionsAnswered || 0,
        correctAnswers: sessionData.correctAnswers || 0,
        wrongAnswers: sessionData.wrongAnswers || 0,
        vocabulary: sessionData.vocabulary || [],
        memoryData: sessionData.memoryData || [],
        startTime: new Date(sessionData.startTime || Date.now())
      }
    });
    
    console.log('✅ 遊戲會話已保存:', newSession.id);
    res.status(201).json({ 
      sessionId: newSession.id, 
      message: '遊戲統計已保存' 
    });
  } catch (error) {
    console.error('保存遊戲統計失敗:', error);
    res.status(500).json({ error: '保存失敗' });
  }
});

// 更新遊戲統計
router.put('/stats/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    const updatedSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: updateData
    });
    
    res.json({ 
      message: '遊戲統計已更新', 
      session: updatedSession 
    });
  } catch (error) {
    console.error('更新遊戲統計失敗:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

module.exports = router;
