/**
 * 为测试账户生成 SVG 头像
 */

import { writeFileSync } from "fs"
import { join } from "path"

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B195', '#F67280', '#C06C84', '#6C5B7B',
  '#355C7D', '#99B898', '#FECEA8', '#FF847C',
  '#E84A5F', '#2A363B', '#FFCC5C', '#96CEB4',
]

function generateColor(name: string): string {
  const hash = name.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0
  )
  return COLORS[hash % COLORS.length]
}

function generateAvatarSVG(name: string): string {
  const color = generateColor(name)
  const initial = name.charAt(0).toUpperCase()

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

const TEST_ACCOUNTS = [
  { id: 'c6b5bf02-e393-441c-a0bc-28c89759ac8d', name: '测试账号' },
  { id: '9d30c7ce-8030-410b-a785-8f04ed6e7b9c', name: '用户测试' },
]

const avatarsDir = join(process.cwd(), 'public', 'avatars')

for (const account of TEST_ACCOUNTS) {
  const svg = generateAvatarSVG(account.name)
  const filename = `${account.id}.svg`
  const filepath = join(avatarsDir, filename)
  writeFileSync(filepath, svg)
  console.log(`✅ ${account.name}: ${filename}`)
}

console.log('\n=== 测试账户头像生成完成 ===')
