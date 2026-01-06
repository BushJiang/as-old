import { db } from '@/lib/db'
import { userEmbeddings, userProfiles, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkPending() {
  const pending = await db
    .select({
      id: userEmbeddings.id,
      userId: userEmbeddings.userId,
      type: userEmbeddings.embeddingType,
      sourceIndex: userEmbeddings.sourceIndex,
      sourceText: userEmbeddings.sourceText,
      userName: userProfiles.name,
    })
    .from(userEmbeddings)
    .leftJoin(userProfiles, eq(userEmbeddings.userId, userProfiles.userId))
    .where(eq(userEmbeddings.embeddingGenerationStatus, 'pending'))

  console.log('=== 待处理的向量 ===\n')
  console.log(`总数: ${pending.length}\n`)

  const grouped = new Map<string, any[]>()
  pending.forEach(p => {
    const key = p.userName || p.userId
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(p)
  })

  for (const [userName, embeddings] of grouped.entries()) {
    console.log(`${userName}:`)
    embeddings.forEach(e => {
      console.log(`  - ${e.type} [${e.sourceIndex}]: ${e.sourceText}`)
    })
  }
}

checkPending()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
