import { db } from '@/lib/db'
import { matches, matchHistory, userProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkMatches() {
  const allMatches = await db.select().from(matches)
  const allHistory = await db.select().from(matchHistory)

  console.log('=== matches 表 ===')
  console.log(`总数: ${allMatches.length}\n`)

  const matchTypeCount = new Map()
  allMatches.forEach(m => {
    matchTypeCount.set(m.matchType, (matchTypeCount.get(m.matchType) || 0) + 1)
  })
  console.log('按类型统计:', Object.fromEntries(matchTypeCount))

  if (allMatches.length > 0) {
    console.log('\n详情:')
    for (const m of allMatches) {
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, m.userId))

      const matchedProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, m.matchedUserId))

      const name1 = profile[0]?.name || m.userId
      const name2 = matchedProfile[0]?.name || m.matchedUserId

      console.log(`- ${name1} → ${name2}`)
      console.log(`  类型: ${m.matchType}, 相似度: ${m.similarityScore}`)
    }
  }

  console.log('\n=== match_history 表 ===')
  console.log(`总数: ${allHistory.length}\n`)

  const actionCount = new Map()
  allHistory.forEach(h => {
    actionCount.set(h.historyData.action, (actionCount.get(h.historyData.action) || 0) + 1)
  })
  console.log('按操作类型统计:', Object.fromEntries(actionCount))

  if (allHistory.length > 0) {
    console.log('\n详情:')
    for (const h of allHistory) {
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, h.userId))

      const name = profile[0]?.name || h.userId

      console.log(`- ${name}: ${h.historyData.action}`)
      console.log(`  查看: ${h.historyData.matchedUserId}, 时间: ${h.historyData.viewedAt}`)
    }
  }
}

checkMatches()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
