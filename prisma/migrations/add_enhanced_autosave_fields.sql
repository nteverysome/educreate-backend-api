-- 基於 Wordwall 深度分析的增強自動保存字段
-- 添加 GUID 追蹤、Session 管理、壓縮支持等功能

-- 為 UniversalContent 表添加新字段
ALTER TABLE "UniversalContent" 
ADD COLUMN IF NOT EXISTS "guid" TEXT,
ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
ADD COLUMN IF NOT EXISTS "templateId" INTEGER,
ADD COLUMN IF NOT EXISTS "folderId" INTEGER;

-- 創建自動保存事件記錄表 (用於分析和優化)
CREATE TABLE IF NOT EXISTS "AutoSaveEvent" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "guid" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL, -- 'typing', 'paste', 'delete', 'template-switch'
    "changeCount" INTEGER NOT NULL DEFAULT 0,
    "saveReason" TEXT NOT NULL, -- 'interval', 'change', 'manual', 'page-switch'
    "compressionRatio" DECIMAL(5,2),
    "responseTime" INTEGER, -- 響應時間 (毫秒)
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AutoSaveEvent_activityId_fkey" 
        FOREIGN KEY ("activityId") REFERENCES "UniversalContent"("id") ON DELETE CASCADE,
    CONSTRAINT "AutoSaveEvent_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 創建索引以提升查詢性能
CREATE INDEX IF NOT EXISTS "AutoSaveEvent_activityId_idx" ON "AutoSaveEvent"("activityId");
CREATE INDEX IF NOT EXISTS "AutoSaveEvent_userId_idx" ON "AutoSaveEvent"("userId");
CREATE INDEX IF NOT EXISTS "AutoSaveEvent_guid_idx" ON "AutoSaveEvent"("guid");
CREATE INDEX IF NOT EXISTS "AutoSaveEvent_sessionId_idx" ON "AutoSaveEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "AutoSaveEvent_createdAt_idx" ON "AutoSaveEvent"("createdAt");

-- 為 UniversalContent 的新字段創建索引
CREATE INDEX IF NOT EXISTS "UniversalContent_guid_idx" ON "UniversalContent"("guid");
CREATE INDEX IF NOT EXISTS "UniversalContent_sessionId_idx" ON "UniversalContent"("sessionId");
CREATE INDEX IF NOT EXISTS "UniversalContent_templateId_idx" ON "UniversalContent"("templateId");
CREATE INDEX IF NOT EXISTS "UniversalContent_folderId_idx" ON "UniversalContent"("folderId");

-- 創建檔案夾表 (基於 Wordwall My Activities 分析)
CREATE TABLE IF NOT EXISTS "Folder" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER, -- 支持嵌套檔案夾
    "color" TEXT DEFAULT '#3B82F6', -- 檔案夾顏色
    "icon" TEXT DEFAULT 'folder', -- 檔案夾圖標
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Folder_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Folder_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE
);

-- 檔案夾索引
CREATE INDEX IF NOT EXISTS "Folder_userId_idx" ON "Folder"("userId");
CREATE INDEX IF NOT EXISTS "Folder_parentId_idx" ON "Folder"("parentId");
CREATE INDEX IF NOT EXISTS "Folder_sortOrder_idx" ON "Folder"("sortOrder");

-- 創建活動縮圖表 (基於 Wordwall 縮圖系統)
CREATE TABLE IF NOT EXISTS "ActivityThumbnail" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL UNIQUE,
    "thumbnailUrl" TEXT NOT NULL,
    "width" INTEGER DEFAULT 400, -- 基於 Wordwall 400px 寬度
    "height" INTEGER DEFAULT 300,
    "fileSize" INTEGER,
    "format" TEXT DEFAULT 'png',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    
    CONSTRAINT "ActivityThumbnail_activityId_fkey" 
        FOREIGN KEY ("activityId") REFERENCES "UniversalContent"("id") ON DELETE CASCADE
);

-- 縮圖索引
CREATE INDEX IF NOT EXISTS "ActivityThumbnail_activityId_idx" ON "ActivityThumbnail"("activityId");

-- 創建分享記錄表 (基於 Wordwall 分享系統)
CREATE TABLE IF NOT EXISTS "ActivityShare" (
    "id" SERIAL PRIMARY KEY,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "shareType" TEXT NOT NULL, -- 'public', 'private', 'class'
    "shareUrl" TEXT NOT NULL UNIQUE,
    "accessCode" TEXT, -- 私人分享的訪問碼
    "expiresAt" TIMESTAMP(3), -- 分享過期時間
    "viewCount" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ActivityShare_activityId_fkey" 
        FOREIGN KEY ("activityId") REFERENCES "UniversalContent"("id") ON DELETE CASCADE,
    CONSTRAINT "ActivityShare_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 分享記錄索引
CREATE INDEX IF NOT EXISTS "ActivityShare_activityId_idx" ON "ActivityShare"("activityId");
CREATE INDEX IF NOT EXISTS "ActivityShare_userId_idx" ON "ActivityShare"("userId");
CREATE INDEX IF NOT EXISTS "ActivityShare_shareUrl_idx" ON "ActivityShare"("shareUrl");
CREATE INDEX IF NOT EXISTS "ActivityShare_shareType_idx" ON "ActivityShare"("shareType");

-- 添加外鍵約束到 UniversalContent
ALTER TABLE "UniversalContent" 
ADD CONSTRAINT IF NOT EXISTS "UniversalContent_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL;

-- 創建性能分析視圖 (基於自動保存事件)
CREATE OR REPLACE VIEW "AutoSaveAnalytics" AS
SELECT 
    DATE_TRUNC('hour', "createdAt") as "hour",
    COUNT(*) as "saveCount",
    AVG("responseTime") as "avgResponseTime",
    AVG("compressionRatio") as "avgCompressionRatio",
    COUNT(DISTINCT "userId") as "activeUsers",
    COUNT(DISTINCT "activityId") as "activeActivities"
FROM "AutoSaveEvent"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', "createdAt")
ORDER BY "hour" DESC;
