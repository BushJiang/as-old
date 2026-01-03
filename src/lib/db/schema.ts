/**
 * 数据库 Schema 定义
 *
 * 技术栈:
 * - PostgreSQL + pgvector 扩展
 * - Drizzle ORM
 * - NextAuth.js 认证
 * - bge-m3 嵌入模型 (1024维)
 *
 * 现实约束 (来自 real.md):
 * - 用户密码必须使用 bcrypt 加密存储
 * - 用户个人资料必须加密存储和传输
 * - 匹配推荐算法必须考虑用户隐私设置
 * - 向量数据库中的用户嵌入向量必须定期更新和验证准确性
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  customType,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ============================================
// 自定义类型：pgvector 向量类型
// ============================================
const vector = customType<{
  data: number[]
  notNull: false
  default: false
}>({
  dataType() {
    return 'vector(1024)'
  },
  toDriver(value: number[]): string {
    // 将数组转换为 PostgreSQL vector 格式: "[0.1, -0.2, 0.3, ...]"
    return `[${value.join(',')}]`
  },
  fromDriver(value: unknown): number[] {
    // 将 PostgreSQL vector 格式转换为数组
    if (typeof value === 'string') {
      // 移除方括号并分割
      return value
        .slice(1, -1)
        .split(',')
        .map(v => parseFloat(v))
    }
    return value as number[]
  },
})

// ============================================
// NextAuth.js 认证表（自动创建）
// ============================================
// users, accounts, sessions, verification_tokens 由 NextAuth 自动管理

// ============================================
// 用户资料表
// ============================================
export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 基本信息
    name: varchar('name', { length: 50 }).notNull(),
    age: integer('age').notNull(),
    city: varchar('city', { length: 100 }),
    avatarUrl: varchar('avatar_url', { length: 500 }).default('/avatars/default.svg'),
    bio: text('bio'),

    // 兴趣、需求、提供（JSONB 数组格式）
    // 用户注册时通过多行文本输入，后端分割成数组
    interests: jsonb('interests').$type<string[]>().notNull().default([]),
    needs: jsonb('needs').$type<string[]>().notNull().default([]),
    provide: jsonb('provide').$type<string[]>().notNull().default([]),

    // 向量嵌入 (bge-m3: 1024维)
    // 用于 AI 匹配推荐
    // 注意：pgvector 扩展需要在数据库中手动启用: CREATE EXTENSION vector;
    embedding: vector('embedding'),

    // 向量生成状态
    embeddingGeneratedAt: timestamp('embedding_generated_at'),
    embeddingGenerationStatus: varchar('embedding_generation_status', {
      length: 20,
    }).default('pending'), // pending | completed | failed

    // 隐私设置
    privacySettings: jsonb('privacy_settings')
      .$type<{
        profileVisible: 'public' | 'matches' | 'private'
        showInterests: boolean
        showNeeds: boolean
        showProvide: boolean
      }>()
      .default({
        profileVisible: 'public',
        showInterests: true,
        showNeeds: true,
        showProvide: true,
      }),

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    // 唯一索引：一个用户一个资料
    userIdIdx: uniqueIndex('uniq_user_profiles_user_id').on(table.userId),

    // 查询索引
    cityIdx: index('idx_user_profiles_city').on(table.city),
    ageIdx: index('idx_user_profiles_age').on(table.age),
    embeddingStatusIdx: index('idx_user_profiles_embedding_status').on(
      table.embeddingGenerationStatus,
    ),

    // 向量相似度索引 (IVFFlat，适合 < 100万向量)
    // 注意：需要在数据库迁移后手动创建
    // CREATE INDEX idx_user_profiles_embedding ON user_profiles
    // USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  }),
)

// ============================================
// 用户偏好设置表
// ============================================
export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 匹配偏好
    ageRangeMin: integer('age_range_min').default(18),
    ageRangeMax: integer('age_range_max').default(100),
    preferredCities: jsonb('preferred_cities')
      .$type<string[]>()
      .default([]),
    preferredInterests: jsonb('preferred_interests')
      .$type<string[]>()
      .default([]),

    // 显示设置
    showMe: varchar('show_me', { length: 20 })
      .default('everyone'), // 'everyone' | 'matches' | 'none'

    // 通知设置
    emailNotifications: boolean('email_notifications').default(true),
    pushNotifications: boolean('push_notifications').default(false),
    notificationFrequency: varchar('notification_frequency', {
      length: 20,
    }).default('realtime'), // 'realtime' | 'daily' | 'weekly'

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('uniq_user_preferences_user_id').on(table.userId),
  }),
)

// ============================================
// 匹配关系表
// ============================================
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchedUserId: uuid('matched_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 匹配类型
    matchType: varchar('match_type', { length: 20 })
      .notNull(), // 'want_to_know' | 'passed' | 'mutual' | 'blocked'

    // 匹配度分数 (0-1)
    similarityScore: jsonb('similarity_score').$type<number>(),

    // 匹配原因（JSONB 格式存储，灵活扩展）
    matchReasons: jsonb('match_reasons')
      .$type<{
        commonInterests: string[]
        complementaryNeeds: string[]
        otherReasons: string[]
      }>()
      .default({
        commonInterests: [],
        complementaryNeeds: [],
        otherReasons: [],
      }),

    // 元数据
    metadata: jsonb('metadata').default({}),

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    // 防止重复匹配（A→B 和 B→A 视为同一对）
    uniqueMatchIdx: uniqueIndex('uniq_matches_pair').on(
      table.userId,
      table.matchedUserId,
    ),

    // 查询索引
    userIdIdx: index('idx_matches_user_id').on(table.userId),
    matchedUserIdIdx: index('idx_matches_matched_user_id').on(
      table.matchedUserId,
    ),
    matchTypeIdx: index('idx_matches_type').on(table.matchType),
    createdAtIdx: index('idx_matches_created_at').on(table.createdAt),
  }),
)

// ============================================
// 破冰话题表
// ============================================
export const icebreakers = pgTable(
  'icebreakers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    matchedUserId: uuid('matched_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 话题内容
    topics: jsonb('topics')
      .$type<
        Array<{
          type: 'interest' | 'experience' | 'value' | 'casual'
          content: string
        }>
      >()
      .notNull(),

    // 用户收藏的话题
    favoriteTopicIds: jsonb('favorite_topic_ids')
      .$type<number[]>()
      .default([]),

    // 生成状态
    generationStatus: varchar('generation_status', { length: 20 })
      .notNull(), // 'pending' | 'completed' | 'failed'

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    // 一个用户对一个匹配用户只有一组破冰话题
    uniquePairIdx: uniqueIndex('uniq_icebreakers_pair').on(
      table.userId,
      table.matchedUserId,
    ),

    // 查询索引
    userIdIdx: index('idx_icebreakers_user_id').on(table.userId),
    createdAtIdx: index('idx_icebreakers_created_at').on(table.createdAt),
  }),
)

// ============================================
// 匹配历史表（用于浏览和统计）
// ============================================
export const matchHistory = pgTable(
  'match_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 历史记录数据（JSONB，灵活存储）
    historyData: jsonb('history_data')
      .$type<{
        matchId: string
        matchedUserId: string
        matchType: string
        similarityScore: number | null
        viewedAt: string
        action: 'viewed' | 'interested' | 'passed' | 'blocked'
      }>()
      .notNull(),

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_match_history_user_id').on(table.userId),
    createdAtIdx: index('idx_match_history_created_at').on(
      table.createdAt,
    ),
  }),
)

// ============================================
// 用户向量嵌入表
// ============================================
// 支持每个用户存储多个向量，用于分类匹配
export const userEmbeddings = pgTable(
  'user_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 向量类型
    embeddingType: varchar('embedding_type', { length: 20 })
      .notNull(), // 'interest' | 'need' | 'provide' | 'profile'

    // 关联的原始内容
    sourceText: text('source_text').notNull(),
    sourceIndex: integer('source_index').notNull(), // 原数组中的索引

    // 向量嵌入 (bge-m3: 1024维)
    embedding: vector('embedding'),

    // 向量生成状态
    embeddingGeneratedAt: timestamp('embedding_generated_at'),
    embeddingGenerationStatus: varchar('embedding_generation_status', {
      length: 20,
    }).default('pending'), // pending | completed | failed

    // 时间戳
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    // 复合唯一索引：同一用户同一类型的同一位置只有一个向量
    uniqueEmbeddingIdx: uniqueIndex('uniq_user_embeddings_type_index').on(
      table.userId,
      table.embeddingType,
      table.sourceIndex,
    ),

    // 查询索引
    userIdIdx: index('idx_user_embeddings_user_id').on(table.userId),
    embeddingTypeIdx: index('idx_user_embeddings_type').on(table.embeddingType),
    statusIdx: index('idx_user_embeddings_status').on(table.embeddingGenerationStatus),

    // 向量相似度索引需要在数据库迁移后手动创建
    // 注意：条件索引需要使用原始 SQL，Drizzle 不直接支持
    // CREATE INDEX idx_user_embeddings_interest_embedding ON user_embeddings
    // USING ivfflat (embedding vector_cosine_ops)
    // WHERE embedding_type = 'interest'
    // WITH (lists = 100);
  }),
)

// ============================================
// NextAuth users 表
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: varchar('image', { length: 255 }),
  password: varchar('password', { length: 255 }), // bcrypt hash
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================
// Type Exports
// ============================================
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert

export type UserPreference = typeof userPreferences.$inferSelect
export type NewUserPreference = typeof userPreferences.$inferInsert

export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert

export type Icebreaker = typeof icebreakers.$inferSelect
export type NewIcebreaker = typeof icebreakers.$inferInsert

export type MatchHistory = typeof matchHistory.$inferSelect
export type NewMatchHistory = typeof matchHistory.$inferInsert

export type UserEmbedding = typeof userEmbeddings.$inferSelect
export type NewUserEmbedding = typeof userEmbeddings.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
