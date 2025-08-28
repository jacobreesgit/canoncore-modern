import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey, // eslint-disable-line @typescript-eslint/no-unused-vars
  integer,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// User accounts table
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  image: text('image'),
  // Custom field for credentials authentication
  passwordHash: text('passwordHash'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
})

// CanonCore application tables

// Universes (top-level franchise containers)
export const universes = pgTable(
  'universes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('isPublic').default(false).notNull(),
    sourceLink: varchar('sourceLink', { length: 500 }),
    sourceLinkName: varchar('sourceLinkName', { length: 255 }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Indexes for performance
    index('universes_userId_idx').on(table.userId),
    index('universes_isPublic_idx').on(table.isPublic),
    index('universes_createdAt_idx').on(table.createdAt),
  ]
)

// Content (both viewable and organisational content within universes)
export const content = pgTable(
  'content',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    universeId: text('universeId')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isViewable: boolean('isViewable').default(false).notNull(),
    mediaType: varchar('mediaType', { length: 50 }).notNull(), // 'video', 'audio', 'text', 'character', 'location', 'item', 'event', 'collection'
    sourceLink: varchar('sourceLink', { length: 500 }),
    sourceLinkName: varchar('sourceLinkName', { length: 255 }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Indexes for performance
    index('content_universeId_idx').on(table.universeId),
    index('content_userId_idx').on(table.userId),
    index('content_isViewable_idx').on(table.isViewable),
    index('content_mediaType_idx').on(table.mediaType),
    index('content_createdAt_idx').on(table.createdAt),
  ]
)

// Content relationships (for hierarchical organization)
export const contentRelationships = pgTable(
  'contentRelationships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentId: text('parentId').references(() => content.id, {
      onDelete: 'cascade',
    }),
    childId: text('childId')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    universeId: text('universeId')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayOrder: integer('displayOrder').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Indexes for performance
    index('contentRelationships_parentId_idx').on(table.parentId),
    index('contentRelationships_childId_idx').on(table.childId),
    index('contentRelationships_universeId_idx').on(table.universeId),
    // Unique constraint to prevent duplicate relationships
    uniqueIndex('contentRelationships_parent_child_unique').on(
      table.parentId,
      table.childId
    ),
  ]
)

// User progress tracking (individual per user, per content)
export const userProgress = pgTable(
  'userProgress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentId: text('contentId')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    universeId: text('universeId')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    progress: integer('progress').default(0).notNull(), // 0-100 percentage
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Indexes for performance
    index('userProgress_userId_idx').on(table.userId),
    index('userProgress_contentId_idx').on(table.contentId),
    index('userProgress_universeId_idx').on(table.universeId),
    // Unique constraint to ensure one progress entry per user per content
    uniqueIndex('userProgress_user_content_unique').on(
      table.userId,
      table.contentId
    ),
  ]
)

// User favourites (for universes and content)
export const favorites = pgTable(
  'favorites',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetId: text('targetId').notNull(), // universeId or contentId
    targetType: varchar('targetType', { length: 20 }).notNull(), // 'universe' or 'content'
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    // Indexes for performance
    index('favorites_userId_idx').on(table.userId),
    index('favorites_targetId_idx').on(table.targetId),
    index('favorites_targetType_idx').on(table.targetType),
    // Unique constraint to prevent duplicate favourites
    uniqueIndex('favorites_user_target_unique').on(
      table.userId,
      table.targetId,
      table.targetType
    ),
  ]
)

// Type exports for the application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// CanonCore type exports
export type Universe = typeof universes.$inferSelect
export type NewUniverse = typeof universes.$inferInsert
export type Content = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert
export type ContentRelationship = typeof contentRelationships.$inferSelect
export type NewContentRelationship = typeof contentRelationships.$inferInsert
export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert
export type Favorite = typeof favorites.$inferSelect
export type NewFavorite = typeof favorites.$inferInsert
