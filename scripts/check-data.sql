-- 在 Neon 控制台运行此 SQL 查询

-- 1. 查看 users 表数量
SELECT COUNT(*) as user_count FROM users;

-- 2. 查看 user_profiles 表数量
SELECT COUNT(*) as profile_count FROM user_profiles;

-- 3. 找出缺少 user_profiles 的用户
SELECT
  u.id,
  u.email,
  u.name
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- 4. 查看所有 user_profiles 的 avatar_url（检查头像格式）
SELECT
  up.user_id,
  up.name,
  up.avatar_url
FROM user_profiles up
ORDER BY up.created_at DESC
LIMIT 10;
