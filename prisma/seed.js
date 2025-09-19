/**
 * WordWall 框架數據庫種子文件
 * 用於測試和初始化 WordWall 功能
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始 WordWall 框架數據庫種子...');

  try {
    // 創建遊戲模板
    console.log('📝 創建遊戲模板...');
    
    const templates = [
      {
        name: 'quiz',
        displayName: '測驗問答',
        description: '多選題測驗，支持計時和即時反饋',
        icon: '❓',
        category: 'QUIZ',
        difficulty: 'EASY',
        estimatedTime: '5-15分鐘',
        features: ['多選題', '計時', '即時反饋', '分數統計'],
        minItems: 1,
        maxItems: 50,
        requiresEvenItems: false,
        isActive: true,
        isPremium: false,
        sortOrder: 1
      },
      {
        name: 'hangman',
        displayName: '猜字遊戲',
        description: '經典猜字遊戲，逐字母猜測單詞',
        icon: '🎯',
        category: 'WORD_GAMES',
        difficulty: 'MEDIUM',
        estimatedTime: '3-8分鐘',
        features: ['字母選擇', '視覺提示', '難度調整'],
        minItems: 1,
        maxItems: 30,
        requiresEvenItems: false,
        isActive: true,
        isPremium: false,
        sortOrder: 4
      },
      {
        name: 'true-false',
        displayName: '是非題',
        description: '簡單的是非判斷題，快速測驗',
        icon: '✅',
        category: 'QUIZ',
        difficulty: 'EASY',
        estimatedTime: '2-8分鐘',
        features: ['快速答題', '即時反饋', '計時挑戰'],
        minItems: 1,
        maxItems: 50,
        requiresEvenItems: false,
        isActive: true,
        isPremium: false,
        sortOrder: 6
      }
    ];

    for (const template of templates) {
      await prisma.gameTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }

    console.log('✅ 遊戲模板創建完成');

    // 創建視覺主題
    console.log('🎨 創建視覺主題...');
    
    const themes = [
      {
        name: 'classic',
        displayName: 'Classic',
        description: '經典藍色主題',
        category: 'CLASSIC',
        isPremium: false,
        isActive: true,
        sortOrder: 0,
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        backgroundColor: '#ffffff',
        textColor: '#212529',
        accentColor: '#28a745',
        borderColor: '#dee2e6',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      {
        name: 'space',
        displayName: 'Space',
        description: '太空主題',
        category: 'THEMED',
        isPremium: false,
        isActive: true,
        sortOrder: 1,
        primaryColor: '#3f51b5',
        secondaryColor: '#303f9f',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        accentColor: '#ff4081',
        borderColor: '#5c6bc0',
        backgroundImage: 'radial-gradient(ellipse at center, #3f51b5 0%, #1a1a2e 100%)',
        borderRadius: '16px',
        boxShadow: '0 6px 24px rgba(63,81,181,0.4)'
      }
    ];

    for (const theme of themes) {
      await prisma.visualTheme.upsert({
        where: { name: theme.name },
        update: theme,
        create: theme
      });
    }

    console.log('✅ 視覺主題創建完成');

    // 創建 AI 提示詞
    console.log('🤖 創建 AI 提示詞...');
    
    const aiPrompts = [
      {
        name: 'quiz-generator',
        templateType: 'QUIZ',
        promptTemplate: '請根據描述創建測驗：{description}。生成 {questionCount} 個問題，每題 {answerCount} 個選項。',
        exampleInput: '小學數學加法',
        exampleOutput: '{"title": "數學加法測驗", "questions": [...]}',
        isActive: true,
        version: '1.0',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      },
      {
        name: 'hangman-generator',
        templateType: 'HANGMAN',
        promptTemplate: '請根據描述創建猜字遊戲：{description}。生成 {questionCount} 個單字和提示。',
        exampleInput: '動物名稱',
        exampleOutput: '{"title": "動物猜字遊戲", "words": [...]}',
        isActive: true,
        version: '1.0',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      }
    ];

    for (const prompt of aiPrompts) {
      await prisma.aIPrompt.upsert({
        where: { name: prompt.name },
        update: prompt,
        create: prompt
      });
    }

    console.log('✅ AI 提示詞創建完成');

    // 統計結果
    const templateCount = await prisma.gameTemplate.count();
    const themeCount = await prisma.visualTheme.count();
    const promptCount = await prisma.aIPrompt.count();

    console.log('\n📊 WordWall 框架數據庫種子完成！');
    console.log('🎮 遊戲模板:', templateCount, '個');
    console.log('🎨 視覺主題:', themeCount, '個');
    console.log('🤖 AI 提示詞:', promptCount, '個');
    console.log('\n🎉 WordWall 框架已準備就緒！');

  } catch (error) {
    console.error('❌ 種子過程中發生錯誤:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
