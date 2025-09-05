# CanonCore Complete Architecture Redesign

## New Four-Tier Architecture

### 1. Universes (Top Level) 
- **Purpose**: Top-level franchise containers (unchanged)
- **Examples**: "Doctor Who Universe", "Marvel Cinematic Universe"  
- **Features**: User-owned, can be public/private, clickable pages
- **URL**: `/universes/[id]`

### 2. Collections (Chronological Level)
- **Purpose**: Chronological ordering containers within universes
- **Examples**: "Doctor Who Season 1 Part 1", "Torchwood Season 1", "Doctor Who Season 1 Part 2"
- **Features**: Allow groups to be split/repeated chronologically, clickable pages
- **URL**: `/universes/[universeId]/collections/[collectionId]`

### 3. Groups (Organizational Level)
- **Purpose**: Organizational categories within collections
- **Examples**: "Season 1", "Phase 1 Movies", "Avengers Series"
- **Features**: Hierarchical relationships, drag & drop reordering, clickable pages  
- **URL**: `/universes/[universeId]/collections/[collectionId]/groups/[groupId]`

### 4. Content (Item Level)
- **Purpose**: Individual content items
- **Examples**: "Episode 1", "Iron Man", "Character Profile"
- **Features**: Can be viewable or organizational, progress tracking, clickable pages
- **URL**: `/universes/[universeId]/collections/[collectionId]/groups/[groupId]/content/[contentId]`

## Implementation Plan

### Phase 1: Database & Core Architecture
1. ✅ Create new database schema with three-tier structure
2. ✅ Implement CollectionService (replaces UniverseService)
3. ✅ Implement GroupService (new middle-tier service)  
4. ✅ Refactor ContentService for new architecture
5. ✅ Create server actions for all three tiers

### Phase 2: Page Structure & Navigation
1. ✅ Build dashboard with collections overview
2. ✅ Create collection detail pages showing groups
3. ✅ Create group detail pages showing content
4. ✅ Create content detail pages
5. ✅ Implement add/edit forms for each tier
6. ✅ Set up proper breadcrumb navigation

### Phase 3: Headless-Tree Integration  
1. ✅ Implement CollectionTree component with drag & drop
2. ✅ Implement GroupTree component with hierarchical drag & drop
3. ✅ Implement ContentTree component with hierarchical drag & drop
4. ✅ Add multi-select and keyboard navigation
5. ✅ Integrate search functioinality with trees
6. ✅ Add progress tracking and favorites to trees

### Phase 4: Testing & Polish
1. ✅ Test complete navigation flow (Collections → Groups → Content)
2. ✅ Test drag & drop reordering and restructuring
3. ✅ Test multi-select bulk operations
4. ✅ Performance testing with large hierarchies
5. ✅ Accessibility testing for keyboard navigation
6. ✅ Integration with progress tracking and favorites


### Ensure for everything
- **Clean Architecture**: Separation of concerns with dedicated services for each tier
- **Scalable Design**: Can handle complex hierarchies with drag & drop performance
- **Maintainable Code**: Consistent patterns make it easy to add features across all tiers
- **Consistent Patterns**: Same architectural patterns 
- **Modern Stack**: Leverages Next.js 15, React 19, and headless-tree for optimal performance

## Future Implementation

### Phase 1: Tree Component Type Safety
**Priority**: Medium  
**Description**: Replace `any` types in tree components with proper TypeScript types for better type safety and maintainability.

**Files to update**:
- `components/tree/base-tree.tsx` - Line 102: Replace `any` with proper event type
- `components/tree/tree-types.ts` - Lines 32-36: Replace all `any` types with specific interfaces
- `lib/utils/error-handling.ts` - Line 26: Replace `any` with proper generic type

**Implementation approach**:
1. Define proper TypeScript interfaces for tree node data structures
2. Create specific event handler types for drag & drop operations  
3. Use generic types instead of `any` for flexible but type-safe operations
4. Ensure consistency with existing `TreeNode` and `HierarchyData` types

**Context7 best practices to follow**:
- Use discriminated unions for different node types
- Implement proper generic constraints
- Maintain consistency with existing type patterns
- Follow the same architectural patterns used in UserService

**Testing requirements**:
- Ensure tree functionality still works after type changes
- Verify drag & drop operations maintain type safety
- Test with Doctor Who demo universe creation workflow

### Phase 2

The following tables are documented for future enhancement but are not required for the core four-tier architecture functionality:

### User Progress Table
```typescript
// User progress tracking for viewable content
export const userProgress = pgTable('userProgress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentId: text('contentId').notNull().references(() => content.id, { onDelete: 'cascade' }),
  groupId: text('groupId').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  collectionId: text('collectionId').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  progress: integer('progress').default(0).notNull(), // 0-100 percentage
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
})
```

### Favorites Table
```typescript
// User favorites across all hierarchy levels
export const favorites = pgTable('favorites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: text('targetId').notNull(), // universeId, collectionId, groupId, or contentId
  targetType: varchar('targetType', { length: 20 }).notNull(), // 'universe', 'collection', 'group', or 'content'
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})
```

### Associated Services
```typescript
// ProgressService (future)
class ProgressService {
  getByUser(userId: string): Promise<UserProgress[]>
  updateProgress(userId: string, contentId: string, progress: number): Promise<UserProgress>
  getProgressByContent(userId: string, contentId: string): Promise<UserProgress | null>
}

// FavoritesService (future)  
class FavoritesService {
  getByUser(userId: string): Promise<Favorite[]>
  addFavorite(userId: string, targetId: string, targetType: string): Promise<Favorite>
  removeFavorite(userId: string, targetId: string): Promise<void>
  isFavorite(userId: string, targetId: string): Promise<boolean>
}
```