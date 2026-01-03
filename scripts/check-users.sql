-- 检查数据库用户数量
-- 在 Neon 控制台的 SQL Editor 中运行

-- 统计用户数量
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as profile_count FROM user_profiles;

-- 列出所有用户（ID、邮箱、姓名）
SELECT
  id,
  email,
  name,
  created_at
FROM users
ORDER BY created_at;

-- 检查哪些用户没有资料
SELECT u.id, u.email, u.name
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;
