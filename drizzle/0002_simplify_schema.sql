-- 简化数据库 Schema
-- 删除不需要的表和字段

-- 删除 user_preferences 表（前端未使用）
DROP TABLE IF EXISTS user_preferences CASCADE;

-- 删除 icebreakers 表（功能未实现）
DROP TABLE IF EXISTS icebreakers CASCADE;

-- 从 user_profiles 表删除不需要的字段
ALTER TABLE user_profiles DROP COLUMN IF EXISTS embedding;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS embedding_generated_at;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS embedding_generation_status;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS privacy_settings;

-- 从 user_profiles 表删除相关索引
DROP INDEX IF EXISTS idx_user_profiles_embedding_status;

-- 添加 gender 字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- 从 matches 表删除 metadata 字段
ALTER TABLE matches DROP COLUMN IF EXISTS metadata;
