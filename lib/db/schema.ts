import {
  boolean,
  timestamp,
  date,
  pgTable,
  text,
  integer,
  varchar,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// Users table (NextAuth.js compatible)
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  image: text('image'),
  passwordHash: text('passwordHash'),
  preferredLanguage: varchar('preferredLanguage', { length: 10 }),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
})

// Universes (top level - franchise containers)
export const universes = pgTable(
  'universes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('isPublic').default(false).notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('universes_userId_idx').on(table.userId),
    index('universes_order_idx').on(table.order),
  ]
)

// Collections (chronological containers within universes)
export const collections = pgTable(
  'collections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    universeId: text('universeId')
      .notNull()
      .references(() => universes.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('collections_universeId_idx').on(table.universeId),
    index('collections_userId_idx').on(table.userId),
    index('collections_order_idx').on(table.order),
  ]
)

// Groups (organizational categories within collections)
export const groups = pgTable(
  'groups',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    collectionId: text('collectionId')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemType: varchar('itemType', { length: 50 }).notNull().default('series'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('groups_collectionId_idx').on(table.collectionId),
    index('groups_userId_idx').on(table.userId),
    index('groups_order_idx').on(table.order),
  ]
)

// Content (individual items within groups)
export const content = pgTable(
  'content',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    groupId: text('groupId')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isViewable: boolean('isViewable').default(true).notNull(),
    itemType: varchar('itemType', { length: 50 }).notNull().default('video'),
    releaseDate: date('releaseDate'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('content_groupId_idx').on(table.groupId),
    index('content_userId_idx').on(table.userId),
    index('content_order_idx').on(table.order),
    index('content_isViewable_idx').on(table.isViewable),
  ]
)

// Group relationships (for hierarchical groups within collections)
export const groupRelationships = pgTable(
  'group_relationships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentGroupId: text('parentGroupId')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    childGroupId: text('childGroupId')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('group_relationships_parent_idx').on(table.parentGroupId),
    index('group_relationships_child_idx').on(table.childGroupId),
    uniqueIndex('group_relationships_unique').on(
      table.parentGroupId,
      table.childGroupId
    ),
  ]
)

// Content relationships (for hierarchical content within groups)
export const contentRelationships = pgTable(
  'content_relationships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    parentContentId: text('parentContentId')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    childContentId: text('childContentId')
      .notNull()
      .references(() => content.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  },
  table => [
    index('content_relationships_parent_idx').on(table.parentContentId),
    index('content_relationships_child_idx').on(table.childContentId),
    uniqueIndex('content_relationships_unique').on(
      table.parentContentId,
      table.childContentId
    ),
  ]
)

// NextAuth.js tables
export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  account => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  verificationToken => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Universe = typeof universes.$inferSelect
export type NewUniverse = typeof universes.$inferInsert

export type Collection = typeof collections.$inferSelect
export type NewCollection = typeof collections.$inferInsert

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert

export type Content = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert

export type GroupRelationship = typeof groupRelationships.$inferSelect
export type NewGroupRelationship = typeof groupRelationships.$inferInsert

export type ContentRelationship = typeof contentRelationships.$inferSelect
export type NewContentRelationship = typeof contentRelationships.$inferInsert

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
