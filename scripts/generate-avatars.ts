/**
 * 为所有用户生成 SVG 头像
 *
 * 功能：
 * 1. 为 Mock 用户生成头像
 * 2. 使用用户 UUID 作为文件名，确保唯一性
 * 3. 使用用户名首字母作为头像内容
 * 4. 根据用户名生成独特的背景颜色
 */

import { MOCK_USERS } from "@/data/mock/users"
import { writeFileSync } from "fs"
import { join } from "path"

// 测试账户（需要在数据库中获取实际 ID）
// 这里暂时使用占位符，实际使用时需要从数据库获取
const TEST_ACCOUNTS = [
  { id: 'test-account-placeholder', name: '测试账号' },
]

// 柔和的配色方案
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B195', '#F67280', '#C06C84', '#6C5B7B',
  '#355C7D', '#99B898', '#FECEA8', '#FF847C',
  '#E84A5F', '#2A363B', '#FFCC5C', '#96CEB4',
]

/**
 * 根据用户名生成唯一颜色
 */
function generateColor(name: string): string {
  const hash = name.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0
  )
  return COLORS[hash % COLORS.length]
}

/**
 * 获取用户名首字母
 */
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

/**
 * 生成 SVG 头像
 */
function generateAvatarSVG(name: string): string {
  const color = generateColor(name)
  const initial = getInitial(name)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="${color}"/>
  <text x="100" y="100"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="80"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central">${initial}</text>
</svg>`
}

/**
 * 主函数：生成所有头像
 */
async function generateAllAvatars() {
  const avatarsDir = join(process.cwd(), 'public', 'avatars')

  console.log("开始生成 SVG 头像...\n")

  let totalGenerated = 0

  // 为 Mock 用户生成头像
  console.log("=== 为 Mock 用户生成头像 ===")
  for (const user of MOCK_USERS) {
    const svg = generateAvatarSVG(user.name)
    const filename = `${user.id}.svg`
    const filepath = join(avatarsDir, filename)

    writeFileSync(filepath, svg, 'utf-8')
    console.log(`  ✅ ${user.name}: ${filename}`)
    totalGenerated++
  }

  console.log("\n=== 完成 ===")
  console.log(`共生成 ${totalGenerated} 个头像文件`)
  console.log(`保存位置: ${avatarsDir}`)
}

generateAllAvatars().catch(console.error)
