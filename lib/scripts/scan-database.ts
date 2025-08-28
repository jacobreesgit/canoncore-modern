import { db } from '../db'
import {
  users,
  universes,
  content,
  userProgress,
  favorites,
  contentRelationships,
} from '../db/schema'
import { eq, sql, count, desc, and, isNull } from 'drizzle-orm'

// Type definitions for query results
interface JoinedContentRelationship {
  content: typeof content.$inferSelect
  contentRelationships: typeof contentRelationships.$inferSelect
}

// Type for direct content relationship queries
type DirectContentRelationship = typeof contentRelationships.$inferSelect

// Union type for relationships
type RelationshipResult = JoinedContentRelationship | DirectContentRelationship

// Color constants for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Icons for console output
const icons = {
  database: '🗄️',
  chart: '📊',
  tree: '🌳',
  search: '🔍',
  folder: '📁',
  eye: '👁️',
  link: '🔗',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  info: 'ℹ️',
  activity: '📈',
  user: '👤',
  heart: '❤️',
  progress: '📊',
  orphan: '🚫',
}

// Utility functions for formatting output
function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`
}

function header(text: string, icon: string = icons.info): void {
  console.log(`\n${icon} ${colorize(text, 'bright')}`)
}

function subheader(text: string, indent: number = 0): void {
  const prefix = '  '.repeat(indent) + '├── '
  console.log(`${prefix}${colorize(text, 'cyan')}`)
}

function item(text: string, indent: number = 0, icon?: string): void {
  const prefix = '  '.repeat(indent) + '└── '
  const iconPrefix = icon ? `${icon} ` : ''
  console.log(`${prefix}${iconPrefix}${text}`)
}

function success(text: string, indent: number = 0): void {
  item(`${icons.success} ${text}`, indent)
}

function warning(text: string, indent: number = 0): void {
  item(
    `${colorize(icons.warning, 'yellow')} ${colorize(text, 'yellow')}`,
    indent
  )
}

function error(text: string, indent: number = 0): void {
  item(`${colorize(icons.error, 'red')} ${colorize(text, 'red')}`, indent)
}

// Safe query wrapper for error handling
async function safeQuery<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    error(`Error in ${context}: ${errorMessage}`)
    return null
  }
}

// Main scan functions
async function scanAllData(): Promise<void> {
  header('Database Overview', icons.database)

  // Get entity counts
  subheader('Entity Counts', 1)

  const userCount = await safeQuery(
    () => db.select({ count: count() }).from(users),
    'user count'
  )

  const universeCount = await safeQuery(
    () => db.select({ count: count() }).from(universes),
    'universe count'
  )

  const contentCount = await safeQuery(
    () => db.select({ count: count() }).from(content),
    'content count'
  )

  const viewableCount = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(eq(content.isViewable, true)),
    'viewable content count'
  )

  const organizationalCount = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(eq(content.isViewable, false)),
    'organizational content count'
  )

  const relationshipCount = await safeQuery(
    () => db.select({ count: count() }).from(contentRelationships),
    'relationship count'
  )

  const progressCount = await safeQuery(
    () => db.select({ count: count() }).from(userProgress),
    'progress count'
  )

  const favoriteCount = await safeQuery(
    () => db.select({ count: count() }).from(favorites),
    'favorite count'
  )

  // Display counts
  if (userCount) item(`Users: ${userCount[0].count}`, 2)
  if (universeCount) item(`Universes: ${universeCount[0].count}`, 2)
  if (contentCount) {
    item(`Content: ${contentCount[0].count}`, 2)
    if (viewableCount) item(`├── Viewable: ${viewableCount[0].count}`, 3)
    if (organizationalCount)
      item(`└── Organizational: ${organizationalCount[0].count}`, 3)
  }
  if (relationshipCount) item(`Relationships: ${relationshipCount[0].count}`, 2)
  if (progressCount) item(`Progress Records: ${progressCount[0].count}`, 2)
  if (favoriteCount) item(`Favorites: ${favoriteCount[0].count}`, 2)

  // Recent activity
  subheader('Recent Activity (Last 7 days)', 1)

  const recentUsers = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} > NOW() - INTERVAL '7 days'`),
    'recent users'
  )

  const recentUniverses = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(universes)
        .where(sql`${universes.createdAt} > NOW() - INTERVAL '7 days'`),
    'recent universes'
  )

  const recentContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(sql`${content.createdAt} > NOW() - INTERVAL '7 days'`),
    'recent content'
  )

  if (recentUsers) item(`New users: ${recentUsers[0].count}`, 2)
  if (recentUniverses) item(`New universes: ${recentUniverses[0].count}`, 2)
  if (recentContent) item(`Content added: ${recentContent[0].count}`, 2)

  // Quick health check
  await quickHealthCheck()
}

async function quickHealthCheck(): Promise<void> {
  subheader('Quick Health Check', 1)

  // Check for orphaned content (content without universe)
  const orphanedContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(isNull(content.universeId)),
    'orphaned content check'
  )

  // Check for broken relationships (relationships pointing to non-existent content)
  const brokenParentRels = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(contentRelationships)
        .leftJoin(content, eq(contentRelationships.parentId, content.id))
        .where(isNull(content.id)),
    'broken parent relationships'
  )

  const brokenChildRels = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(contentRelationships)
        .leftJoin(content, eq(contentRelationships.childId, content.id))
        .where(isNull(content.id)),
    'broken child relationships'
  )

  // Display health check results
  if (orphanedContent && orphanedContent[0].count === 0) {
    success('No orphaned content found', 2)
  } else if (orphanedContent) {
    warning(`${orphanedContent[0].count} orphaned content items found`, 2)
  }

  if (brokenParentRels && brokenChildRels) {
    const totalBroken = brokenParentRels[0].count + brokenChildRels[0].count
    if (totalBroken === 0) {
      success('All relationships valid', 2)
    } else {
      warning(`${totalBroken} broken relationships found`, 2)
    }
  }
}

async function scanEntityType(entityType: string): Promise<void> {
  header(
    `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Analysis`,
    icons.chart
  )

  switch (entityType.toLowerCase()) {
    case 'users':
      await scanUsers()
      break
    case 'universes':
      await scanUniverses()
      break
    case 'content':
      await scanContent()
      break
    case 'relationships':
      await scanRelationships()
      break
    case 'progress':
      await scanProgress()
      break
    case 'favorites':
      await scanFavorites()
      break
    default:
      error(`Unknown entity type: ${entityType}`)
  }
}

async function scanUsers(): Promise<void> {
  const totalUsers = await safeQuery(
    () => db.select({ count: count() }).from(users),
    'total users'
  )

  const usersWithUniverses = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .innerJoin(universes, eq(universes.userId, users.id)),
    'users with universes'
  )

  const usersWithProgress = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .innerJoin(userProgress, eq(userProgress.userId, users.id)),
    'users with progress'
  )

  const usersWithFavorites = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .innerJoin(favorites, eq(favorites.userId, users.id)),
    'users with favorites'
  )

  if (totalUsers) item(`Total Users: ${totalUsers[0].count}`, 1)
  if (usersWithUniverses)
    item(`Users with Universes: ${usersWithUniverses[0].count}`, 1)
  if (usersWithProgress)
    item(`Users with Progress: ${usersWithProgress[0].count}`, 1)
  if (usersWithFavorites)
    item(`Users with Favorites: ${usersWithFavorites[0].count}`, 1)
}

async function scanUniverses(): Promise<void> {
  const publicUniverses = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(universes)
        .where(eq(universes.isPublic, true)),
    'public universes'
  )

  const privateUniverses = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(universes)
        .where(eq(universes.isPublic, false)),
    'private universes'
  )

  const universesWithContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(universes)
        .innerJoin(content, eq(content.universeId, universes.id)),
    'universes with content'
  )

  if (publicUniverses) item(`Public Universes: ${publicUniverses[0].count}`, 1)
  if (privateUniverses)
    item(`Private Universes: ${privateUniverses[0].count}`, 1)
  if (universesWithContent)
    item(`Universes with Content: ${universesWithContent[0].count}`, 1)
}

async function scanContent(): Promise<void> {
  const viewableContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(eq(content.isViewable, true)),
    'viewable content'
  )

  const organizationalContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .where(eq(content.isViewable, false)),
    'organizational content'
  )

  const contentWithChildren = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .innerJoin(
          contentRelationships,
          eq(contentRelationships.parentId, content.id)
        ),
    'content with children'
  )

  const rootContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .leftJoin(
          contentRelationships,
          eq(contentRelationships.childId, content.id)
        )
        .where(isNull(contentRelationships.childId)),
    'root content (no parent)'
  )

  if (viewableContent) item(`Viewable Content: ${viewableContent[0].count}`, 1)
  if (organizationalContent)
    item(`Organizational Content: ${organizationalContent[0].count}`, 1)
  if (contentWithChildren)
    item(`Content with Children: ${contentWithChildren[0].count}`, 1)
  if (rootContent) item(`Root Content: ${rootContent[0].count}`, 1)
}

async function scanRelationships(): Promise<void> {
  const totalRelationships = await safeQuery(
    () => db.select({ count: count() }).from(contentRelationships),
    'total relationships'
  )

  // Get relationship depth statistics
  const maxDepth = await safeQuery(
    () =>
      db.execute(sql`
      WITH RECURSIVE content_depth AS (
        -- Base case: root nodes (content with no parent)
        SELECT 
          c.id,
          c.name,
          0 as depth
        FROM ${content} c
        LEFT JOIN ${contentRelationships} cr ON c.id = cr.child_id
        WHERE cr.child_id IS NULL
        
        UNION ALL
        
        -- Recursive case: children of nodes we've already processed
        SELECT 
          c.id,
          c.name,
          cd.depth + 1
        FROM ${content} c
        JOIN ${contentRelationships} cr ON c.id = cr.child_id
        JOIN content_depth cd ON cr.parent_id = cd.id
      )
      SELECT MAX(depth) as max_depth FROM content_depth
    `),
    'max relationship depth'
  )

  if (totalRelationships)
    item(`Total Relationships: ${totalRelationships[0].count}`, 1)
  if (maxDepth && maxDepth.rows[0]) {
    const depth = maxDepth.rows[0].max_depth
    item(`Maximum Tree Depth: ${depth ?? 'Unable to calculate'}`, 1)
  }
}

async function scanProgress(): Promise<void> {
  const totalProgress = await safeQuery(
    () => db.select({ count: count() }).from(userProgress),
    'total progress'
  )

  const completedProgress = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(userProgress)
        .where(eq(userProgress.progress, 100)),
    'completed progress'
  )

  if (totalProgress)
    item(`Total Progress Records: ${totalProgress[0].count}`, 1)
  if (completedProgress && totalProgress) {
    const completionRate = Math.round(
      (completedProgress[0].count / totalProgress[0].count) * 100
    )
    item(`Completion Rate: ${completionRate}%`, 1)
  }
}

async function scanFavorites(): Promise<void> {
  const totalFavorites = await safeQuery(
    () => db.select({ count: count() }).from(favorites),
    'total favorites'
  )

  const universeFavorites = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.targetType, 'universe')),
    'universe favorites'
  )

  const contentFavorites = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.targetType, 'content')),
    'content favorites'
  )

  if (totalFavorites) item(`Total Favorites: ${totalFavorites[0].count}`, 1)
  if (universeFavorites)
    item(`Universe Favorites: ${universeFavorites[0].count}`, 1)
  if (contentFavorites)
    item(`Content Favorites: ${contentFavorites[0].count}`, 1)
}

async function scanHierarchy(universeId: string): Promise<void> {
  header(`Content Hierarchy Analysis`, icons.tree)

  // First, get the universe info
  const universeInfo = await safeQuery(
    () => db.select().from(universes).where(eq(universes.id, universeId)),
    'universe info'
  )

  if (!universeInfo || universeInfo.length === 0) {
    error(`Universe with ID ${universeId} not found`)
    return
  }

  const universe = universeInfo[0]
  subheader(`Universe: ${universe.name}`, 1)

  // Get all content for this universe
  const universeContent = await safeQuery(
    () => db.select().from(content).where(eq(content.universeId, universeId)),
    'universe content'
  )

  if (!universeContent || universeContent.length === 0) {
    warning('No content found in this universe', 1)
    return
  }

  // Get all relationships for this content
  const relationships = await safeQuery(
    () =>
      db
        .select()
        .from(contentRelationships)
        .innerJoin(content, eq(content.id, contentRelationships.childId))
        .where(eq(content.universeId, universeId)),
    'content relationships'
  )

  // Statistics
  subheader('Tree Statistics', 1)
  const totalContent = universeContent.length
  const viewableContent = universeContent.filter(c => c.isViewable).length
  const organizationalContent = universeContent.filter(
    c => !c.isViewable
  ).length
  const totalRelationships = relationships ? relationships.length : 0

  item(`Total Content: ${totalContent}`, 2)
  item(`├── Viewable: ${viewableContent}`, 2)
  item(`└── Organizational: ${organizationalContent}`, 2)
  item(`Total Relationships: ${totalRelationships}`, 2)

  // Build hierarchy tree
  subheader('Content Tree Structure', 1)

  // Find root content (content that has no parent in relationships)
  let childIds: Set<string> = new Set()
  if (relationships && relationships.length > 0) {
    if (relationships[0].contentRelationships) {
      // Joined query structure
      childIds = new Set(
        relationships.map(
          (r: JoinedContentRelationship) => r.contentRelationships.childId
        )
      )
    } else {
      // Direct query structure (fallback, shouldn't happen with current query)
      childIds = new Set(
        relationships
          .filter(r => !('contentRelationships' in r))
          .map(r => (r as DirectContentRelationship).childId)
      )
    }
  }
  const rootContent = universeContent.filter(c => !childIds.has(c.id))

  if (rootContent.length === 0 && universeContent.length > 0) {
    warning('All content has parent relationships - no root content found!', 2)
    // Show all content as potentially orphaned
    universeContent.forEach(contentItem => {
      const icon = contentItem.isViewable ? icons.eye : icons.folder
      const type = contentItem.isViewable ? 'viewable' : 'organizational'
      item(`${icon} ${contentItem.name} (${type}) [${contentItem.id}]`, 2)
    })
  } else {
    // Display tree structure recursively
    await displayContentTree(
      rootContent,
      relationships || [],
      universeContent,
      2
    )
  }

  // Find orphaned content (content that should have relationships but don't)
  const orphanedContent = universeContent.filter(c => {
    const hasParent = childIds.has(c.id)
    let hasChildren = false

    if (relationships && relationships.length > 0) {
      if (relationships[0].contentRelationships) {
        hasChildren = relationships.some(
          (r: JoinedContentRelationship) =>
            r.contentRelationships.parentId === c.id
        )
      } else {
        hasChildren = relationships
          .filter(r => !('contentRelationships' in r))
          .some(r => (r as DirectContentRelationship).parentId === c.id)
      }
    }

    // If it's not root and has no parent or children, it might be orphaned
    return !rootContent.includes(c) && !hasParent && !hasChildren
  })

  if (orphanedContent.length > 0) {
    subheader('Issues Found', 1)
    orphanedContent.forEach(contentItem => {
      const icon = contentItem.isViewable ? icons.eye : icons.folder
      const type = contentItem.isViewable ? 'viewable' : 'organizational'
      error(
        `${icon} ORPHANED: "${contentItem.name}" (${type}) [${contentItem.id}]`,
        2
      )
    })
  } else {
    success('No orphaned content found', 1)
  }
}

async function displayContentTree(
  parentContent: (typeof content.$inferSelect)[],
  relationships: RelationshipResult[],
  allContent: (typeof content.$inferSelect)[],
  indent: number
): Promise<void> {
  try {
    for (let i = 0; i < parentContent.length; i++) {
      const contentItem = parentContent[i]
      const isLast = i === parentContent.length - 1

      // Display current item
      const icon = contentItem.isViewable ? icons.eye : icons.folder
      const type = contentItem.isViewable ? 'viewable' : 'organizational'
      const prefix = '  '.repeat(indent) + (isLast ? '└── ' : '├── ')
      console.log(
        `${prefix}${icon} ${contentItem.name} (${type}) [${contentItem.id.slice(-8)}]`
      )

      // Find children - handle both possible relationship structures
      let childRelationships: (
        | JoinedContentRelationship
        | typeof contentRelationships.$inferSelect
      )[] = []
      if (
        relationships.length > 0 &&
        'contentRelationships' in relationships[0]
      ) {
        // Joined query structure
        childRelationships = relationships.filter(
          (r): r is JoinedContentRelationship =>
            'contentRelationships' in r &&
            r.contentRelationships.parentId === contentItem.id
        )
      } else {
        // Direct query structure
        childRelationships = relationships
          .filter(r => !('contentRelationships' in r))
          .filter(
            r => (r as DirectContentRelationship).parentId === contentItem.id
          )
      }

      const children = childRelationships
        .map(r => {
          const childId =
            'contentRelationships' in r
              ? r.contentRelationships.childId
              : r.childId
          return allContent.find(c => c.id === childId)
        })
        .filter(
          (child): child is typeof content.$inferSelect => child !== undefined
        )

      if (children.length > 0) {
        await displayContentTree(
          children,
          relationships,
          allContent,
          indent + 1
        )
      }
    }
  } catch (err) {
    console.error('Error in displayContentTree:', err)
    console.log(
      'Relationships structure:',
      JSON.stringify(relationships[0], null, 2)
    )
  }
}

async function scanIndividualEntity(
  entityType: string,
  entityId: string
): Promise<void> {
  header(
    `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Deep Dive`,
    icons.search
  )

  switch (entityType.toLowerCase()) {
    case 'universe':
      await scanUniverseEntity(entityId)
      break
    case 'content':
      await scanContentEntity(entityId)
      break
    case 'user':
      await scanUserEntity(entityId)
      break
    default:
      error(`Unknown entity type: ${entityType}`)
  }
}

async function scanUniverseEntity(universeId: string): Promise<void> {
  // Get universe basic info
  const universeInfo = await safeQuery(
    () => db.select().from(universes).where(eq(universes.id, universeId)),
    'universe info'
  )

  if (!universeInfo || universeInfo.length === 0) {
    error(`Universe with ID ${universeId} not found`)
    return
  }

  const universe = universeInfo[0]

  // Basic Info
  subheader('Basic Information', 1)
  item(`ID: ${universe.id}`, 2)
  item(`Name: ${universe.name}`, 2)
  item(`Description: ${universe.description || 'None'}`, 2)
  item(`Visibility: ${universe.isPublic ? 'Public' : 'Private'}`, 2)
  item(
    `Created: ${universe.createdAt ? new Date(universe.createdAt).toLocaleString() : 'Unknown'}`,
    2
  )
  item(
    `Updated: ${universe.updatedAt ? new Date(universe.updatedAt).toLocaleString() : 'Unknown'}`,
    2
  )

  // Get owner info
  const owner = await safeQuery(
    () =>
      db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, universe.userId)),
    'universe owner'
  )

  if (owner && owner[0]) {
    item(`Owner: ${owner[0].name || owner[0].email}`, 2)
  }

  // Content Statistics
  subheader('Content Statistics', 1)
  const contentStats = await safeQuery(
    () =>
      db
        .select({
          total: count(),
          viewable:
            sql<number>`count(case when ${content.isViewable} = true then 1 end)`.as(
              'viewable'
            ),
          organizational:
            sql<number>`count(case when ${content.isViewable} = false then 1 end)`.as(
              'organizational'
            ),
        })
        .from(content)
        .where(eq(content.universeId, universeId)),
    'content statistics'
  )

  if (contentStats && contentStats[0]) {
    item(`Total Content: ${contentStats[0].total}`, 2)
    item(`├── Viewable: ${contentStats[0].viewable}`, 2)
    item(`└── Organizational: ${contentStats[0].organizational}`, 2)
  }

  // Relationship Statistics
  const relationshipStats = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(contentRelationships)
        .innerJoin(content, eq(content.id, contentRelationships.childId))
        .where(eq(content.universeId, universeId)),
    'relationship statistics'
  )

  if (relationshipStats && relationshipStats[0]) {
    item(`Total Relationships: ${relationshipStats[0].count}`, 2)
  }

  // Activity Statistics
  subheader('Activity Statistics', 1)
  const favoriteCount = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(favorites)
        .where(
          and(
            eq(favorites.targetType, 'universe'),
            eq(favorites.targetId, universeId)
          )
        ),
    'favorite count'
  )

  if (favoriteCount && favoriteCount[0]) {
    item(`Favorites: ${favoriteCount[0].count}`, 2)
  }

  // Progress Statistics
  const progressStats = await safeQuery(
    () =>
      db
        .select({
          total: count(),
          completed:
            sql<number>`count(case when ${userProgress.progress} = 100 then 1 end)`.as(
              'completed'
            ),
        })
        .from(userProgress)
        .innerJoin(content, eq(content.id, userProgress.contentId))
        .where(eq(content.universeId, universeId)),
    'progress statistics'
  )

  if (progressStats && progressStats[0]) {
    const completionRate =
      progressStats[0].total > 0
        ? Math.round(
            (progressStats[0].completed / progressStats[0].total) * 100
          )
        : 0
    item(`Progress Records: ${progressStats[0].total}`, 2)
    item(`Completion Rate: ${completionRate}%`, 2)
  }

  // Check integrity
  subheader('Integrity Status', 1)
  await checkUniverseIntegrity(universeId)
}

async function scanContentEntity(contentId: string): Promise<void> {
  // Get content basic info
  const contentInfo = await safeQuery(
    () => db.select().from(content).where(eq(content.id, contentId)),
    'content info'
  )

  if (!contentInfo || contentInfo.length === 0) {
    error(`Content with ID ${contentId} not found`)
    return
  }

  const contentItem = contentInfo[0]

  // Basic Info
  subheader('Basic Information', 1)
  item(`ID: ${contentItem.id}`, 2)
  item(`Name: ${contentItem.name}`, 2)
  item(`Description: ${contentItem.description || 'None'}`, 2)
  item(`Type: ${contentItem.isViewable ? 'Viewable' : 'Organizational'}`, 2)
  item(
    `Created: ${contentItem.createdAt ? new Date(contentItem.createdAt).toLocaleString() : 'Unknown'}`,
    2
  )
  item(
    `Updated: ${contentItem.updatedAt ? new Date(contentItem.updatedAt).toLocaleString() : 'Unknown'}`,
    2
  )

  // Get universe info
  if (contentItem.universeId) {
    const universeInfo = await safeQuery(
      () =>
        db
          .select({ name: universes.name })
          .from(universes)
          .where(eq(universes.id, contentItem.universeId!)),
      'universe info'
    )

    if (universeInfo && universeInfo[0]) {
      item(`Universe: ${universeInfo[0].name}`, 2)
    }
  }

  // Relationship Analysis
  subheader('Relationships', 1)

  // Get parent relationships
  const parentRels = await safeQuery(
    () =>
      db
        .select({
          parent: {
            id: content.id,
            name: content.name,
            isViewable: content.isViewable,
          },
        })
        .from(contentRelationships)
        .innerJoin(content, eq(content.id, contentRelationships.parentId))
        .where(eq(contentRelationships.childId, contentId)),
    'parent relationships'
  )

  // Get child relationships
  const childRels = await safeQuery(
    () =>
      db
        .select({
          child: {
            id: content.id,
            name: content.name,
            isViewable: content.isViewable,
          },
        })
        .from(contentRelationships)
        .innerJoin(content, eq(content.id, contentRelationships.childId))
        .where(eq(contentRelationships.parentId, contentId)),
    'child relationships'
  )

  if (parentRels && parentRels.length > 0) {
    item(`Parents: ${parentRels.length}`, 2)
    parentRels.forEach((rel, index) => {
      const type = rel.parent.isViewable ? 'viewable' : 'organizational'
      const isLast = index === parentRels.length - 1
      item(`${isLast ? '└──' : '├──'} ${rel.parent.name} (${type})`, 3)
    })
  } else {
    item(`Parents: None (Root content)`, 2)
  }

  if (childRels && childRels.length > 0) {
    item(`Children: ${childRels.length}`, 2)
    childRels.forEach((rel, index) => {
      const type = rel.child.isViewable ? 'viewable' : 'organizational'
      const isLast = index === childRels.length - 1
      item(`${isLast ? '└──' : '├──'} ${rel.child.name} (${type})`, 3)
    })
  } else {
    item(`Children: None`, 2)
  }

  // Activity Analysis
  subheader('Activity', 1)

  // Get favorites
  const favoriteCount = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(favorites)
        .where(
          and(
            eq(favorites.targetType, 'content'),
            eq(favorites.targetId, contentId)
          )
        ),
    'favorite count'
  )

  if (favoriteCount && favoriteCount[0]) {
    item(`Favorites: ${favoriteCount[0].count}`, 2)
  }

  // Get progress (only for viewable content)
  if (contentItem.isViewable) {
    const progressStats = await safeQuery(
      () =>
        db
          .select({
            total: count(),
            completed:
              sql<number>`count(case when ${userProgress.progress} = 100 then 1 end)`.as(
                'completed'
              ),
          })
          .from(userProgress)
          .where(eq(userProgress.contentId, contentId)),
      'progress statistics'
    )

    if (progressStats && progressStats[0]) {
      const completionRate =
        progressStats[0].total > 0
          ? Math.round(
              (progressStats[0].completed / progressStats[0].total) * 100
            )
          : 0
      item(`Progress Records: ${progressStats[0].total}`, 2)
      item(`Completion Rate: ${completionRate}%`, 2)
    }
  }

  // Check integrity
  subheader('Integrity Status', 1)
  await checkContentIntegrity(contentId)
}

async function scanUserEntity(userId: string): Promise<void> {
  // Get user basic info
  const userInfo = await safeQuery(
    () => db.select().from(users).where(eq(users.id, userId)),
    'user info'
  )

  if (!userInfo || userInfo.length === 0) {
    error(`User with ID ${userId} not found`)
    return
  }

  const user = userInfo[0]

  // Basic Info
  subheader('Basic Information', 1)
  item(`ID: ${user.id}`, 2)
  item(`Name: ${user.name || 'Not set'}`, 2)
  item(`Email: ${user.email || 'Not set'}`, 2)
  item(
    `Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}`,
    2
  )
  item(
    `Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}`,
    2
  )

  // Universe Statistics
  subheader('Universe Ownership', 1)
  const universeStats = await safeQuery(
    () =>
      db
        .select({
          total: count(),
          public:
            sql<number>`count(case when ${universes.isPublic} = true then 1 end)`.as(
              'public'
            ),
          private:
            sql<number>`count(case when ${universes.isPublic} = false then 1 end)`.as(
              'private'
            ),
        })
        .from(universes)
        .where(eq(universes.userId, userId)),
    'universe statistics'
  )

  if (universeStats && universeStats[0]) {
    item(`Total Universes: ${universeStats[0].total}`, 2)
    item(`├── Public: ${universeStats[0].public}`, 2)
    item(`└── Private: ${universeStats[0].private}`, 2)
  }

  // Activity Statistics
  subheader('Activity Statistics', 1)

  // Favorites
  const favoriteStats = await safeQuery(
    () =>
      db
        .select({
          total: count(),
          universes:
            sql<number>`count(case when ${favorites.targetType} = 'universe' then 1 end)`.as(
              'universes'
            ),
          content:
            sql<number>`count(case when ${favorites.targetType} = 'content' then 1 end)`.as(
              'content'
            ),
        })
        .from(favorites)
        .where(eq(favorites.userId, userId)),
    'favorite statistics'
  )

  if (favoriteStats && favoriteStats[0]) {
    item(`Total Favorites: ${favoriteStats[0].total}`, 2)
    item(`├── Universe Favorites: ${favoriteStats[0].universes}`, 2)
    item(`└── Content Favorites: ${favoriteStats[0].content}`, 2)
  }

  // Progress
  const progressStats = await safeQuery(
    () =>
      db
        .select({
          total: count(),
          completed:
            sql<number>`count(case when ${userProgress.progress} = 100 then 1 end)`.as(
              'completed'
            ),
        })
        .from(userProgress)
        .where(eq(userProgress.userId, userId)),
    'progress statistics'
  )

  if (progressStats && progressStats[0]) {
    const completionRate =
      progressStats[0].total > 0
        ? Math.round(
            (progressStats[0].completed / progressStats[0].total) * 100
          )
        : 0
    item(`Progress Records: ${progressStats[0].total}`, 2)
    item(`Completion Rate: ${completionRate}%`, 2)
  }

  // Recent Activity
  subheader('Recent Activity', 1)
  const recentProgress = await safeQuery(
    () =>
      db
        .select({
          contentName: content.name,
          completed: sql<boolean>`${userProgress.progress} = 100`,
          updatedAt: userProgress.updatedAt,
        })
        .from(userProgress)
        .innerJoin(content, eq(content.id, userProgress.contentId))
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.updatedAt))
        .limit(5),
    'recent progress'
  )

  if (recentProgress && recentProgress.length > 0) {
    item(`Recent Progress Updates:`, 2)
    recentProgress.forEach((prog, index) => {
      const status = prog.completed ? '✅' : '⏳'
      const date = prog.updatedAt
        ? new Date(prog.updatedAt).toLocaleDateString()
        : 'Unknown'
      const isLast = index === recentProgress.length - 1
      item(
        `${isLast ? '└──' : '├──'} ${status} ${prog.contentName} (${date})`,
        3
      )
    })
  }

  // Check integrity
  subheader('Integrity Status', 1)
  await checkUserIntegrity(userId)
}

async function checkUniverseIntegrity(universeId: string): Promise<void> {
  let issueCount = 0

  // Check for content without relationships that should have them
  const orphanedContent = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .leftJoin(
          contentRelationships,
          eq(contentRelationships.childId, content.id)
        )
        .where(
          and(
            eq(content.universeId, universeId),
            isNull(contentRelationships.childId)
          )
        ),
    'orphaned content'
  )

  if (orphanedContent && orphanedContent[0] && orphanedContent[0].count > 1) {
    warning(
      `${orphanedContent[0].count} content items have no parent relationships`,
      2
    )
    issueCount++
  }

  if (issueCount === 0) {
    success('No integrity issues found', 2)
  } else {
    warning(`${issueCount} integrity issues found`, 2)
  }
}

async function checkContentIntegrity(contentId: string): Promise<void> {
  let issueCount = 0

  // Check if content has universe
  const contentInfo = await safeQuery(
    () =>
      db
        .select({ universeId: content.universeId })
        .from(content)
        .where(eq(content.id, contentId)),
    'content universe check'
  )

  if (!contentInfo || contentInfo.length === 0 || !contentInfo[0].universeId) {
    error('Content has no universe assignment', 2)
    issueCount++
  }

  // Check for broken parent relationships
  const brokenParentRels = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(contentRelationships)
        .leftJoin(content, eq(content.id, contentRelationships.parentId))
        .where(
          and(eq(contentRelationships.childId, contentId), isNull(content.id))
        ),
    'broken parent relationships'
  )

  if (
    brokenParentRels &&
    brokenParentRels[0] &&
    brokenParentRels[0].count > 0
  ) {
    error(`${brokenParentRels[0].count} broken parent relationships`, 2)
    issueCount++
  }

  if (issueCount === 0) {
    success('No integrity issues found', 2)
  } else {
    warning(`${issueCount} integrity issues found`, 2)
  }
}

async function checkUserIntegrity(userId: string): Promise<void> {
  let issueCount = 0

  // Check for favorites pointing to non-existent items
  const brokenFavorites = await safeQuery(
    () =>
      db.execute(sql`
      SELECT COUNT(*) as count FROM ${favorites} f
      LEFT JOIN ${universes} u ON f.target_type = 'universe' AND f.target_id = u.id
      LEFT JOIN ${content} c ON f.target_type = 'content' AND f.target_id = c.id  
      WHERE f.user_id = ${userId} AND u.id IS NULL AND c.id IS NULL
    `),
    'broken favorites'
  )

  if (
    brokenFavorites &&
    brokenFavorites.rows[0] &&
    (brokenFavorites.rows[0] as { count: number }).count > 0
  ) {
    warning(
      `${(brokenFavorites.rows[0] as { count: number }).count} favorites point to non-existent items`,
      2
    )
    issueCount++
  }

  // Check for progress on non-existent content
  const brokenProgress = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(userProgress)
        .leftJoin(content, eq(content.id, userProgress.contentId))
        .where(and(eq(userProgress.userId, userId), isNull(content.id))),
    'broken progress'
  )

  if (brokenProgress && brokenProgress[0] && brokenProgress[0].count > 0) {
    warning(
      `${brokenProgress[0].count} progress records point to non-existent content`,
      2
    )
    issueCount++
  }

  if (issueCount === 0) {
    success('No integrity issues found', 2)
  } else {
    warning(`${issueCount} integrity issues found`, 2)
  }
}

async function scanOrphans(): Promise<void> {
  header('🔍 Scanning for Orphaned Records')

  let totalOrphans = 0

  // 1. Orphaned content (content.universeId not in universes.id)
  const orphanedContent = await safeQuery(
    () =>
      db
        .select({
          id: content.id,
          name: content.name,
          universeId: content.universeId,
        })
        .from(content)
        .leftJoin(universes, eq(content.universeId, universes.id))
        .where(isNull(universes.id)),
    'orphaned content'
  )

  if (orphanedContent && orphanedContent.length > 0) {
    item(`Orphaned Content: ${orphanedContent.length}`, 1, '❌')
    orphanedContent.forEach(c => {
      item(
        `- Content "${c.name}" (ID: ${c.id}) references non-existent universe ${c.universeId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedContent.length
  } else {
    item('Orphaned Content: 0', 1, '✅')
  }

  // 2. Orphaned content relationships - invalid parent IDs
  const orphanedParentRelations = await safeQuery(
    () =>
      db
        .select({
          id: contentRelationships.id,
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .leftJoin(content, eq(contentRelationships.parentId, content.id))
        .where(isNull(content.id)),
    'orphaned parent relationships'
  )

  if (orphanedParentRelations && orphanedParentRelations.length > 0) {
    item(
      `Orphaned Parent Relations: ${orphanedParentRelations.length}`,
      1,
      '❌'
    )
    orphanedParentRelations.forEach(r => {
      item(
        `- Relationship ${r.id} references non-existent parent ${r.parentId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedParentRelations.length
  } else {
    item('Orphaned Parent Relations: 0', 1, '✅')
  }

  // 3. Orphaned content relationships - invalid child IDs
  const orphanedChildRelations = await safeQuery(
    () =>
      db
        .select({
          id: contentRelationships.id,
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .leftJoin(content, eq(contentRelationships.childId, content.id))
        .where(isNull(content.id)),
    'orphaned child relationships'
  )

  if (orphanedChildRelations && orphanedChildRelations.length > 0) {
    item(`Orphaned Child Relations: ${orphanedChildRelations.length}`, 1, '❌')
    orphanedChildRelations.forEach(r => {
      item(
        `- Relationship ${r.id} references non-existent child ${r.childId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedChildRelations.length
  } else {
    item('Orphaned Child Relations: 0', 1, '✅')
  }

  // 4. Orphaned user progress - invalid user IDs
  const orphanedUserProgress = await safeQuery(
    () =>
      db
        .select({
          id: userProgress.id,
          userId: userProgress.userId,
          contentId: userProgress.contentId,
        })
        .from(userProgress)
        .leftJoin(users, eq(userProgress.userId, users.id))
        .where(isNull(users.id)),
    'orphaned user progress (invalid users)'
  )

  if (orphanedUserProgress && orphanedUserProgress.length > 0) {
    item(
      `Orphaned User Progress (Invalid Users): ${orphanedUserProgress.length}`,
      1,
      '❌'
    )
    orphanedUserProgress.forEach(p => {
      item(
        `- Progress ${p.id} references non-existent user ${p.userId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedUserProgress.length
  } else {
    item('Orphaned User Progress (Invalid Users): 0', 1, '✅')
  }

  // 5. Orphaned user progress - invalid content IDs
  const orphanedContentProgress = await safeQuery(
    () =>
      db
        .select({
          id: userProgress.id,
          userId: userProgress.userId,
          contentId: userProgress.contentId,
        })
        .from(userProgress)
        .leftJoin(content, eq(userProgress.contentId, content.id))
        .where(isNull(content.id)),
    'orphaned user progress (invalid content)'
  )

  if (orphanedContentProgress && orphanedContentProgress.length > 0) {
    item(
      `Orphaned User Progress (Invalid Content): ${orphanedContentProgress.length}`,
      1,
      '❌'
    )
    orphanedContentProgress.forEach(p => {
      item(
        `- Progress ${p.id} references non-existent content ${p.contentId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedContentProgress.length
  } else {
    item('Orphaned User Progress (Invalid Content): 0', 1, '✅')
  }

  // 6. Orphaned favorites - invalid user IDs
  const orphanedUserFavorites = await safeQuery(
    () =>
      db
        .select({
          id: favorites.id,
          userId: favorites.userId,
          targetType: favorites.targetType,
          targetId: favorites.targetId,
        })
        .from(favorites)
        .leftJoin(users, eq(favorites.userId, users.id))
        .where(isNull(users.id)),
    'orphaned favorites (invalid users)'
  )

  if (orphanedUserFavorites && orphanedUserFavorites.length > 0) {
    item(
      `Orphaned Favorites (Invalid Users): ${orphanedUserFavorites.length}`,
      1,
      '❌'
    )
    orphanedUserFavorites.forEach(f => {
      item(
        `- Favorite ${f.id} references non-existent user ${f.userId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedUserFavorites.length
  } else {
    item('Orphaned Favorites (Invalid Users): 0', 1, '✅')
  }

  // 7. Orphaned favorites - invalid universe targets
  const orphanedUniverseFavorites = await safeQuery(
    () =>
      db
        .select({
          id: favorites.id,
          userId: favorites.userId,
          targetType: favorites.targetType,
          targetId: favorites.targetId,
        })
        .from(favorites)
        .leftJoin(universes, eq(favorites.targetId, universes.id))
        .where(and(eq(favorites.targetType, 'universe'), isNull(universes.id))),
    'orphaned universe favorites'
  )

  if (orphanedUniverseFavorites && orphanedUniverseFavorites.length > 0) {
    item(
      `Orphaned Universe Favorites: ${orphanedUniverseFavorites.length}`,
      1,
      '❌'
    )
    orphanedUniverseFavorites.forEach(f => {
      item(
        `- Favorite ${f.id} references non-existent universe ${f.targetId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedUniverseFavorites.length
  } else {
    item('Orphaned Universe Favorites: 0', 1, '✅')
  }

  // 8. Orphaned favorites - invalid content targets
  const orphanedContentFavorites = await safeQuery(
    () =>
      db
        .select({
          id: favorites.id,
          userId: favorites.userId,
          targetType: favorites.targetType,
          targetId: favorites.targetId,
        })
        .from(favorites)
        .leftJoin(content, eq(favorites.targetId, content.id))
        .where(and(eq(favorites.targetType, 'content'), isNull(content.id))),
    'orphaned content favorites'
  )

  if (orphanedContentFavorites && orphanedContentFavorites.length > 0) {
    item(
      `Orphaned Content Favorites: ${orphanedContentFavorites.length}`,
      1,
      '❌'
    )
    orphanedContentFavorites.forEach(f => {
      item(
        `- Favorite ${f.id} references non-existent content ${f.targetId}`,
        2,
        '⚠️'
      )
    })
    totalOrphans += orphanedContentFavorites.length
  } else {
    item('Orphaned Content Favorites: 0', 1, '✅')
  }

  // 9. Inactive users (users with no universes, favorites, or progress)
  const inactiveUsers = await safeQuery(
    () =>
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(universes, eq(users.id, universes.userId))
        .leftJoin(favorites, eq(users.id, favorites.userId))
        .leftJoin(userProgress, eq(users.id, userProgress.userId))
        .where(
          and(
            isNull(universes.id),
            isNull(favorites.id),
            isNull(userProgress.id)
          )
        )
        .groupBy(users.id, users.email, users.name, users.createdAt),
    'inactive users'
  )

  if (inactiveUsers && inactiveUsers.length > 0) {
    item(`Inactive Users (No Activity): ${inactiveUsers.length}`, 1, '⚠️')
    inactiveUsers.forEach(u => {
      const createdDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString()
        : 'Unknown'
      item(
        `- User "${u.name || u.email}" (ID: ${u.id}) created ${createdDate}`,
        2,
        '💤'
      )
    })
  } else {
    item('Inactive Users: 0', 1, '✅')
  }

  // Summary
  if (totalOrphans > 0) {
    item(`Total Orphaned Records: ${totalOrphans}`, 0, '❌')
    item(
      'Recommended: Clean up orphaned records to maintain data integrity',
      1,
      '💡'
    )
  } else {
    item('No orphaned records found - database integrity looks good!', 0, '🎉')
  }
}

async function scanIntegrity(): Promise<void> {
  header('🔍 Comprehensive Data Integrity Check')

  let totalIssues = 0

  // 1. Check for circular relationships in content hierarchy
  const circularRefs = await checkCircularReferences()
  if (circularRefs > 0) {
    item(`Circular References Found: ${circularRefs}`, 1, '❌')
    totalIssues += circularRefs
  } else {
    item('Circular References: 0', 1, '✅')
  }

  // 2. Check email format validation
  const invalidEmails = await checkEmailFormats()
  if (invalidEmails > 0) {
    item(`Invalid Email Formats: ${invalidEmails}`, 1, '❌')
    totalIssues += invalidEmails
  } else {
    item('Email Formats: Valid', 1, '✅')
  }

  // 3. Check date ranges are reasonable
  const dateIssues = await checkDateRanges()
  if (dateIssues > 0) {
    item(`Date Range Issues: ${dateIssues}`, 1, '❌')
    totalIssues += dateIssues
  } else {
    item('Date Ranges: Valid', 1, '✅')
  }

  // 4. Check progress values are in valid range
  const progressIssues = await checkProgressRanges()
  if (progressIssues > 0) {
    item(`Progress Range Issues: ${progressIssues}`, 1, '❌')
    totalIssues += progressIssues
  } else {
    item('Progress Ranges: Valid', 1, '✅')
  }

  // 5. Check business rules
  const businessRuleIssues = await checkBusinessRules()
  if (businessRuleIssues > 0) {
    item(`Business Rule Violations: ${businessRuleIssues}`, 1, '❌')
    totalIssues += businessRuleIssues
  } else {
    item('Business Rules: Valid', 1, '✅')
  }

  // Summary
  if (totalIssues > 0) {
    item(`Total Integrity Issues: ${totalIssues}`, 0, '❌')
    item(
      'Recommended: Review and fix integrity issues for optimal performance',
      1,
      '💡'
    )
  } else {
    item('All integrity checks passed!', 0, '🎉')
  }
}

// Helper functions for integrity checking
async function checkCircularReferences(): Promise<number> {
  // Use recursive CTE to detect circular references
  const circularCheck = await safeQuery(
    () =>
      db.execute(sql`
      WITH RECURSIVE path_check AS (
        SELECT 
          "parentId",
          "childId", 
          "parentId" || '->' || "childId" AS path,
          1 as depth
        FROM "contentRelationships"
        
        UNION ALL
        
        SELECT 
          pc."parentId",
          cr."childId",
          pc.path || '->' || cr."childId",
          pc.depth + 1
        FROM path_check pc
        JOIN "contentRelationships" cr ON pc."childId" = cr."parentId"
        WHERE pc.depth < 10 AND pc.path NOT LIKE '%' || cr."childId" || '%'
      )
      SELECT COUNT(*) as circular_count
      FROM path_check
      WHERE "parentId" = "childId" AND depth > 1
    `),
    'circular reference check'
  )

  if (circularCheck && circularCheck.rows[0]) {
    return (
      (circularCheck.rows[0] as { circular_count: number }).circular_count || 0
    )
  }
  return 0
}

async function checkEmailFormats(): Promise<number> {
  const invalidEmails = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .where(
          sql`email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`
        ),
    'invalid email formats'
  )

  return invalidEmails?.[0]?.count || 0
}

async function checkDateRanges(): Promise<number> {
  const now = new Date()
  const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24) // 1 day from now
  const oldDate = new Date('2000-01-01')

  // Check for future creation dates
  const futureDates = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .where(sql`"createdAt" > ${futureDate.toISOString()}`),
    'future creation dates'
  )

  // Check for unreasonably old dates
  const oldDates = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(users)
        .where(sql`"createdAt" < ${oldDate.toISOString()}`),
    'unreasonably old dates'
  )

  return (futureDates?.[0]?.count || 0) + (oldDates?.[0]?.count || 0)
}

async function checkProgressRanges(): Promise<number> {
  const invalidProgress = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(userProgress)
        .where(sql`progress < 0 OR progress > 100`),
    'invalid progress ranges'
  )

  return invalidProgress?.[0]?.count || 0
}

async function checkBusinessRules(): Promise<number> {
  let issues = 0

  // Check: Organizational content should have children (if any content exists)
  const orgContentWithoutChildren = await safeQuery(
    () =>
      db
        .select({ count: count() })
        .from(content)
        .leftJoin(
          contentRelationships,
          eq(content.id, contentRelationships.parentId)
        )
        .where(
          and(
            eq(content.isViewable, false),
            isNull(contentRelationships.parentId)
          )
        ),
    'organizational content without children'
  )

  if (
    orgContentWithoutChildren &&
    orgContentWithoutChildren[0]?.count &&
    orgContentWithoutChildren[0].count > 0
  ) {
    item(
      `Organizational content without children: ${orgContentWithoutChildren[0].count}`,
      2,
      '⚠️'
    )
    issues += orgContentWithoutChildren[0].count
  }

  // Check: Private universes should only be accessible by owner
  // (This would require checking actual access patterns, which we'll skip for now)

  // Check: Content should belong to the same universe as their relationships
  const crossUniverseRelations = await safeQuery(
    () =>
      db.execute(sql`
      SELECT COUNT(*) as count
      FROM "contentRelationships" cr
      JOIN "content" child_content ON cr."childId" = child_content."id"
      JOIN "content" parent_content ON cr."parentId" = parent_content."id"
      WHERE child_content."universeId" != parent_content."universeId"
    `),
    'cross-universe relationships'
  )

  if (
    crossUniverseRelations &&
    crossUniverseRelations.rows[0] &&
    (crossUniverseRelations.rows[0] as { count: number }).count > 0
  ) {
    item(
      `Cross-universe relationships: ${(crossUniverseRelations.rows[0] as { count: number }).count}`,
      2,
      '❌'
    )
    issues += (crossUniverseRelations.rows[0] as { count: number }).count
  }

  return issues
}

// CLI argument parsing and main execution
async function main(): Promise<void> {
  // Filter out dotenv arguments
  const args = process.argv
    .slice(2)
    .filter(arg => !arg.startsWith('dotenv_config_path'))

  if (args.length === 0 || args[0] === 'all') {
    await scanAllData()
    return
  }

  const command = args[0]
  const param = args[1]

  try {
    switch (command) {
      case '--type':
        if (!param) {
          error(
            'Please specify a type: users, universes, content, relationships, progress, favorites'
          )
          return
        }
        await scanEntityType(param)
        break

      case '--universe':
        if (!param) {
          error('Please specify a universe ID')
          return
        }
        await scanIndividualEntity('universe', param)
        break

      case '--content':
        if (!param) {
          error('Please specify a content ID')
          return
        }
        await scanIndividualEntity('content', param)
        break

      case '--user':
        if (!param) {
          error('Please specify a user ID')
          return
        }
        await scanIndividualEntity('user', param)
        break

      case '--hierarchy':
        if (!param) {
          error('Please specify a universe ID')
          return
        }
        await scanHierarchy(param)
        break

      case '--orphans':
        await scanOrphans()
        break

      case '--integrity':
        await scanIntegrity()
        break

      case '--health':
        await quickHealthCheck()
        break

      default:
        error(`Unknown command: ${command}`)
        console.log('\nAvailable commands:')
        console.log('  pnpm scan-db                    # Database overview')
        console.log(
          '  pnpm scan-db --type <type>      # Type-specific analysis'
        )
        console.log('  pnpm scan-db --universe <id>    # Universe deep dive')
        console.log('  pnpm scan-db --content <id>     # Content deep dive')
        console.log('  pnpm scan-db --user <id>        # User deep dive')
        console.log('  pnpm scan-db --hierarchy <id>   # Content tree analysis')
        console.log('  pnpm scan-db --orphans          # Find orphaned records')
        console.log('  pnpm scan-db --integrity        # Data integrity check')
        console.log('  pnpm scan-db --health           # Quick health check')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error running scan:', error)
    }
    throw error
  }
}

// Run the scan operation
main()
  .then(() => {
    console.log('\n🎉 Scan completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Failed to run scan:', error)
    }
    process.exit(1)
  })
