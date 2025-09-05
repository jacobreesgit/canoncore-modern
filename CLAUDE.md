# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbo
pnpm dev

# Run all checks before building
pnpm pre-build  # Runs type-check, lint, and format:check

# Build for production
pnpm build

# Quality checks
pnpm type-check     # TypeScript compilation check
pnpm lint          # ESLint checks
pnpm lint:fix      # Auto-fix ESLint issues
pnpm format        # Format code with Prettier
pnpm format:check  # Check code formatting
pnpm check         # Run all quality checks + knip
pnpm knip          # Find unused dependencies and code

# Database management
pnpm db:generate   # Generate Drizzle migrations
pnpm db:push       # Push schema changes to database
pnpm db:studio     # Open Drizzle Studio
```

## Architecture Overview

CanonCore is a franchise content organization system built with a **four-tier hierarchical architecture**:

### 1. Four-Tier Data Model
- **Universes** → **Collections** → **Groups** → **Content**
- Each tier has dedicated services, actions, and pages
- Hierarchical relationships supported (Groups can contain sub-Groups, Content can contain sub-Content)

#### Tier Details:
- **Universes (Top Level)**: Top-level franchise containers (e.g., "Doctor Who Universe", "Marvel Cinematic Universe"). User-owned, can be public/private, clickable pages. URL: `/universes/[id]`

- **Collections (Chronological Level)**: Chronological ordering containers within universes (e.g., "Doctor Who Season 1 Part 1", "Torchwood Season 1"). Allow groups to be split/repeated chronologically. URL: `/universes/[universeId]/collections/[collectionId]`

- **Groups (Organizational Level)**: Organizational categories within collections (e.g., "Season 1", "Phase 1 Movies", "Avengers Series"). Features hierarchical relationships, drag & drop reordering. URL: `/universes/[universeId]/collections/[collectionId]/groups/[groupId]`

- **Content (Item Level)**: Individual content items (e.g., "Episode 1", "Iron Man", "Character Profile"). Can be viewable or organizational, supports progress tracking. URL: `/universes/[universeId]/collections/[collectionId]/groups/[groupId]/content/[contentId]`

### 2. Database Schema (PostgreSQL + Drizzle ORM)
- **Neon Database** with connection pooling
- **NextAuth.js** integration with Drizzle adapter
- All entities include `userId`, `order`, timestamps
- Cascade deletions and proper indexing

### 3. Service Layer Pattern
Each tier has dedicated services in `lib/services/`:
- `UniverseService` - Top-level franchise containers  
- `CollectionService` - Chronological ordering within universes
- `GroupService` - Organizational categories with hierarchy support
- `ContentService` - Individual items with viewable/organizational types
- `RelationshipService` - Manages hierarchical relationships
- `UserService` - Authentication and user management

### 4. Authentication (NextAuth.js v5)
- **Credentials provider** with bcrypt hashing
- **JWT strategy** with 30-day sessions  
- Authentication logic centralized in UserService
- Sign-in page integrated into homepage

### 5. Tree Components (@headless-tree/react)
Interactive hierarchical navigation with:
- **Drag & drop reordering** across all tiers
- **Multi-select operations** with keyboard navigation
- **Search integration** within trees
- **TypeScript strict typing** - no `any` types allowed

### 6. Error Handling (Context7 Pattern)
Consistent error/success responses across services:
- `ServiceResponse` union type with specific data types
- `ErrorResponse` with standardized error codes
- `createError()` and `createSuccess()` helper functions

## Key Technical Patterns

### Page Structure
```
/app/
├── page.tsx                    # Homepage with auth
├── dashboard/                  # Universe overview
└── universes/[id]/
    ├── page.tsx               # Universe detail
    ├── collections/[cId]/
    │   └── page.tsx           # Collection detail
    └── create-collection/     # Collection creation
```

### Component Organization
```
/components/
├── auth/           # Authentication forms
├── layout/         # Header, Footer (reusable across pages)
├── tree/           # Headless-tree components for each tier
└── ui/             # shadcn/ui base components
```

### Type Safety Requirements
- **No `any` or `unknown` types** - use specific concrete types
- Import type interfaces from `@headless-tree/core` (e.g., `ItemInstance<T>`)
- Use union types for service responses: `ServiceData` covers all possible return types

### Database Relationships
- **Cascading deletes** - removing Universe deletes all child entities
- **Order-based sorting** - each entity has `order` field for user-defined sequences  
- **Hierarchical support** - Groups and Content can have parent-child relationships

## Future Enhancements

### Planned Database Extensions
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

// User favorites across all hierarchy levels
export const favorites = pgTable('favorites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: text('targetId').notNull(), // universeId, collectionId, groupId, or contentId
  targetType: varchar('targetType', { length: 20 }).notNull(), // 'universe', 'collection', 'group', or 'content'
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})
```

### Associated Future Services
- **ProgressService**: `getByUser()`, `updateProgress()`, `getProgressByContent()`
- **FavoritesService**: `getByUser()`, `addFavorite()`, `removeFavorite()`, `isFavorite()`

## Architectural Principles

### Design Standards
- **Clean Architecture**: Separation of concerns with dedicated services for each tier
- **Scalable Design**: Can handle complex hierarchies with drag & drop performance
- **Maintainable Code**: Consistent patterns make it easy to add features across all tiers
- **Consistent Patterns**: Follow established patterns when adding new features. Examples:
  - **Server Actions**: All tiers follow same pattern - `create`, `update`, `delete`, `updateOrder` actions with Zod validation (`universe-actions.ts`, `collection-actions.ts`, `group-actions.ts`, `content-actions.ts`)
  - **Services**: Each tier has dedicated service class with CRUD operations (`UniverseService`, `CollectionService`, `GroupService`, `ContentService`)
  - **Page Structure**: Consistent routing and page organization (`/universes/[id]/collections/[collectionId]/groups/[groupId]`)
  - **Authentication**: Unified auth patterns using NextAuth.js with consistent validation (`components/auth/*`, server actions use `auth()`)
  - **Client/Server Split**: Server Components for data fetching, Server Actions for mutations, Client Components only when interactivity needed (forms, trees)
- **Modern Stack**: Leverages Next.js 15, React 19, and headless-tree for optimal performance

## Stack Details
- **Next.js 15** with Turbopack and App Router
- **React 19** with Server Components
- **TypeScript 5** with strict typing
- **Tailwind CSS 4** + shadcn/ui components
- **Drizzle ORM** with PostgreSQL (Neon)
- **NextAuth.js v5** with JWT strategy