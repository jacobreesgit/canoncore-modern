# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CanonCore Modern is a complete ground-up rebuild of CanonCore using 2025's best web development practices. Built with Next.js 15, PostgreSQL, Drizzle ORM, and NextAuth.js v5.

### Tech Stack

- **Framework**: Next.js 15 with React 19 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Credentials provider
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest with comprehensive service layer testing
- **Deployment**: Vercel with automated CI/CD

## External Documentation

### Headless Tree Library

The Tree component (`components/content/Tree.tsx`) uses the [@headless-tree/react](https://headless-tree.lukasbach.com/) library for hierarchical content display. Documentation references:

- **Quick Reference**: `HEADLESS_TREE_DOCS.md` - Implementation guide and feature overview
- **Primary Documentation**: `headless-tree-docs.txt` - Comprehensive documentation table of contents
- **Full Documentation**: `llms-full.txt` - Complete documentation (6,459 lines, use in sections)
- **Online Documentation**: [headless-tree.lukasbach.com](https://headless-tree.lukasbach.com/)

**Currently implemented features:**

- Sync Data Loader for content hierarchy
- Expand/collapse functionality (with proper event handling)
- Search integration
- Custom styling and theming
- Progress tracking integration
- **Prop Memoization** - Performance optimization for re-renders

**Available but not yet implemented:**

- Selection feature (multi-select with Ctrl/Shift)
- Keyboard navigation (arrow keys, Enter, Space)
- Drag & drop content reordering
- Performance optimizations (prop memoization, virtualization)
- Bulk operations with checkboxes
- Built-in search with highlighting

Refer to `HEADLESS_TREE_DOCS.md` for quick implementation examples, or the full documentation files for detailed feature information when enhancing the Tree component.

## Development Commands

### Essential Development Commands

```bash
# Development
pnpm dev                # Start development server with Turbopack
pnpm build              # Build for production (includes type-check and lint)
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix ESLint issues automatically
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting
pnpm type-check         # Run TypeScript type checking

# Testing
pnpm test               # Run all tests with Vitest
pnpm test:ui            # Run tests with UI
pnpm test:coverage      # Run tests with coverage report
pnpm test:run           # Run tests once (no watch mode)

# Database Management
pnpm db:generate        # Generate Drizzle migrations
pnpm db:push            # Push schema changes to database
pnpm db:studio          # Open Drizzle Studio for database management
pnpm db:clear           # Clear all data from database (development only)

# Performance Analysis
pnpm build:analyze      # Analyze bundle size
pnpm bench              # Run performance benchmarks
```

### Running Single Tests

```bash
# Run specific test file
pnpm test lib/services/__tests__/content.service.test.ts

# Run tests matching pattern
pnpm test --grep "content service"

# Run tests in specific directory
pnpm test lib/services/__tests__/
```

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with React 19 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Credentials provider
- **State Management**: Zustand for client state
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest with comprehensive service layer testing
- **Deployment**: Vercel with automated CI/CD

### Core Architecture Patterns

**Data Flow**: Server Components → Server Actions → Service Layer → Drizzle ORM → PostgreSQL

**Authentication**: NextAuth.js with database sessions, email/password only (no OAuth)

**State Management**:

- Server state: Fetched in Server Components, passed as props
- Client state: Zustand stores (favourites, progress)
- Form state: React Hook Form with Zod validation

### Database Schema Architecture

The database uses PostgreSQL with Drizzle ORM and follows these key entities:

1. **Users** - NextAuth.js user accounts with password authentication
2. **Universes** - Top-level content containers (franchises)
3. **Content** - Items within universes (viewable or organizational)
4. **Content Relationships** - Hierarchical parent-child relationships
5. **User Progress** - Progress tracking per user per content
6. **Favorites** - User favoriting of universes and content

All tables include proper foreign key constraints, indexes for performance, and cascade deletes.

### Service Layer Pattern

Services are located in `lib/services/` and provide:

- Type-safe database operations using Drizzle ORM
- Business logic encapsulation
- Error handling and validation
- Consistent API patterns across all data operations

Key services:

- `userService` - User management and favorites
- `universeService` - Universe CRUD and access control
- `contentService` - Content management with relationships
- `relationshipService` - Hierarchical content organization
- `progressService` - Progress tracking and calculations

### Server Actions Pattern

Server Actions in `lib/actions/` handle:

- Form submissions with validation
- Authentication checks
- Permission verification
- Optimistic UI updates coordination
- Error handling with user-friendly messages

### Component Architecture

**Layout Components** (`components/layout/`):

- `Navigation.tsx` - Responsive nav with auth integration
- `PageLayout.tsx`, `PageHeader.tsx` - Consistent page structure

**Form Components** (`components/forms/`):

- All form inputs with validation and accessibility
- Consistent error handling and loading states

**Interactive Components** (`components/interactive/`):

- Buttons with variants and loading states
- Search functionality with Fuse.js
- Breadcrumb navigation

**Content Components** (`components/content/`):

- `Tree.tsx` - Hierarchical content display
- `UniverseCard.tsx` - Universe display with favorites
- Progress tracking components

### State Management Details

**Zustand Stores** (`stores/`):

- `favourites-store.ts` - Optimistic favorites with server sync
- `progress-store.ts` - Progress state with real-time updates

Both stores include:

- localStorage persistence
- Optimistic updates with rollback
- DevTools integration
- Server synchronization

## Testing Strategy

### Service Layer Testing (94% Coverage)

All services have comprehensive unit tests covering:

- CRUD operations and business logic
- Error handling scenarios
- Edge cases and validation
- Cross-service integration workflows

Test files are located in `lib/services/__tests__/` with realistic mock data.

### Test Setup

- Vitest configuration with node environment
- Mock database using Drizzle's query builder mocks
- Comprehensive error simulation
- Integration test scenarios

## Key Implementation Notes

### Authentication Implementation

- Uses NextAuth.js v5 with Credentials provider only
- Database sessions (not JWT) for security
- Middleware protection for authenticated routes
- Registration handled via custom API route

### Database Best Practices

- All queries use prepared statements for performance
- Proper indexes on frequently queried columns
- Cascade deletes maintain referential integrity
- Connection pooling for production scalability

### Form Handling Pattern

- React Hook Form with Zod schema validation
- Server Actions for form processing
- Optimistic UI updates where appropriate
- Consistent error display patterns

### Development Workflow

1. Always run `pnpm type-check` before commits
2. Format code with `pnpm format`
3. Run relevant tests for modified areas
4. Use `pnpm db:studio` for database inspection
5. Clear test data with `pnpm db:clear` when needed

### Production Readiness

- Comprehensive CI/CD pipeline with GitHub Actions
- Security headers and optimizations in `next.config.ts`
- Performance monitoring with Lighthouse integration
- Bundle analysis tools available
- Deployment checklist in `DEPLOYMENT_CHECKLIST.md`

## Common Development Tasks

### Adding New Database Tables

1. Add table definition to `lib/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply to database: `pnpm db:push`
4. Create service with CRUD operations
5. Add comprehensive tests

### Creating New Components

1. Follow existing component patterns in respective directories
2. Include proper TypeScript types
3. Add loading states and error handling
4. Ensure accessibility (ARIA labels, keyboard navigation)
5. Follow consistent styling patterns

### Adding Server Actions

1. Create in appropriate `lib/actions/` file
2. Include authentication and permission checks
3. Validate inputs with Zod schemas
4. Handle errors gracefully with user-friendly messages
5. Consider optimistic UI updates where appropriate

### Debugging Database Issues

- Use `pnpm db:studio` to inspect data
- Check prepared statements in service files
- Review indexes in schema for query performance
- Use `pnpm db:clear` to reset development data

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- PostgreSQL database (Neon recommended)

### Installation Steps

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your database URL and authentication secrets.

3. **Set up the database:**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the application.

## Production Deployment

### Environment Variables Setup

Set these in both your Vercel project settings and GitHub repository secrets:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# NextAuth.js
AUTH_SECRET="your-secure-random-32-character-secret"
AUTH_URL="https://your-domain.vercel.app"

# Testing (GitHub Secrets only)
TEST_DATABASE_URL="postgresql://test_username:password@host:5432/test_database"
```

### GitHub Repository Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
DATABASE_URL=your_production_database_url
TEST_DATABASE_URL=your_test_database_url
AUTH_SECRET=your_auth_secret
AUTH_URL=https://your-domain.vercel.app
```

### Vercel Setup

1. **Connect Repository:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project" and import your GitHub repository
   - Vercel will auto-detect Next.js settings

2. **Environment Variables in Vercel:**
   - Go to Settings > Environment Variables
   - Add all production environment variables
   - Set appropriate environments (Production, Preview, Development)

3. **Get Vercel Project Information:**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login and link project
   vercel login
   vercel link

   # Get project info
   vercel project ls
   ```

### Production Database Setup

1. **Create production database on Neon**
2. **Run migrations:**

   ```bash
   # Set production DATABASE_URL temporarily
   export DATABASE_URL="your_production_database_url"

   # Generate and push schema
   pnpm db:generate
   pnpm db:push
   ```

3. **Verify with Drizzle Studio:**
   ```bash
   pnpm db:studio
   ```

### Deployment Workflow

1. **Feature Development:**

   ```bash
   git checkout -b feature/new-feature
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Pull Request Process:**
   - GitHub Actions runs all tests
   - Preview deployment is created
   - Review and merge when approved

3. **Production Deployment:**
   - Merge to `main` branch triggers production deployment
   - GitHub Actions builds and deploys to Vercel automatically

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check environment variables are set
   - Verify database connection
   - Review build logs in Vercel/GitHub

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Check Neon database status
   - Ensure connection pooling settings

3. **Authentication Issues:**
   - Verify AUTH_SECRET is set
   - Check AUTH_URL matches domain
   - Ensure all auth environment variables are present

### Debug Commands

```bash
# Local production build test
pnpm build && pnpm start

# Database connection test
pnpm db:studio

# Clear development data
pnpm db:clear
```

## Design System Standards

### Color Token Usage

**ALWAYS use design tokens instead of hardcoded colors:**

```css
/* ✅ CORRECT - Use semantic color tokens */
text-neutral-900, text-primary-600, bg-success-100, border-error-500

/* ❌ INCORRECT - Never use hardcoded Tailwind colors */
text-gray-900, text-blue-600, bg-green-100, border-red-500
```

**Semantic Color Categories:**

- `primary-*` - Brand colors, CTAs, links
- `secondary-*` - Secondary buttons, alternative actions
- `success-*` - Success states, confirmations
- `warning-*` - Warnings, cautions
- `error-*` - Errors, destructive actions
- `neutral-*` - Text, backgrounds, borders
- `surface-*` - Layout surfaces, cards, elevated elements

**Color Scale Usage:**

- `50-200` - Subtle backgrounds, hover states
- `300-400` - Muted text, inactive states
- `500-600` - Default text, active states
- `700-800` - Emphasis text, hover states
- `900-950` - High contrast text, headings

### Typography Hierarchy

**Heading Standards:**

- `H1` - Page titles only (`text-2xl font-bold text-neutral-900`)
- `H2` - Major sections (`text-xl font-semibold text-neutral-900`)
- `H3` - Subsections (`text-lg font-medium text-neutral-900`)
- `H4` - Minor headings (`text-sm font-medium text-neutral-900`)

**Text Size Standards:**

- `text-3xl` - Hero titles
- `text-2xl` - Page headers, statistics
- `text-xl` - Section headers
- `text-lg` - Subsection headers, cards
- `text-base` - Body text (default)
- `text-sm` - Supporting text, captions
- `text-xs` - Labels, metadata

### Spacing System Standards

**Use consistent spacing scale:**

- `1-2` - Fine adjustments
- `3-4` - Small spacing
- `6-8` - Medium spacing
- `12-16` - Large spacing
- `24-32` - Extra large spacing

**Layout Patterns:**

- Use `gap-*` for flexbox/grid spacing
- Use `space-x-*` / `space-y-*` for sequential elements
- Use `p-*` for internal padding
- Use `m-*` for external margins

### Responsive Design Standards

**Breakpoint Usage:**

- `sm:` (640px+) - Small tablets, large phones
- `md:` (768px+) - Tablets
- `lg:` (1024px+) - Laptops, desktops
- `xl:` (1280px+) - Large screens
- `2xl:` (1536px+) - Extra large screens

**Common Responsive Patterns:**

- Navigation: `flex flex-col sm:flex-row`
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Typography: `text-2xl sm:text-3xl`
- Spacing: `px-4 sm:px-6 lg:px-8`

### Component Consistency Standards

**Form Components:**

- All inputs use `FormInput`, `FormSelect`, `FormTextarea`
- Consistent error handling with `FormError`
- Use `FormActions` for button groupings

**Interactive Elements:**

- Use `Button` component with semantic variants
- Use `ButtonLink` for navigation
- Consistent loading states and disabled states

**Layout Components:**

- Use `PageContainer` for consistent page width
- Use `PageHeader` for consistent page headers
- Use `Navigation` component for all navigation

**Validation Requirements:**

- Run `pnpm type-check` before commits
- Run `pnpm lint` to ensure code quality
- Run `pnpm format:check` to validate formatting
- Run `pnpm test` to ensure functionality

## Client/Server Component Patterns

### Server Component Pattern (Pages)

**Purpose**: Server components handle data fetching, authentication, and server-side logic.

**File naming**: Direct page files (e.g., `app/page.tsx`, `app/discover/page.tsx`)

**Responsibilities**:

- Server-side data fetching with database queries
- Authentication checks and user session handling
- Error handling for database/network issues
- SEO optimization and initial page rendering
- Data transformation and processing
- Passing processed data to client components

**Example Structure**:

```typescript
// app/discover/page.tsx (Server Component)
export default async function DiscoverPage() {
  const user = await getCurrentUser() // Server-side auth
  const data = await universeService.getPublic() // Database query

  return <DiscoverClient initialData={data} user={user} />
}
```

### Client Component Pattern (-client.tsx)

**Purpose**: Client components handle interactivity, state management, and client-side logic.

**File naming**: `*-client.tsx` suffix (e.g., `dashboard-client.tsx`, `discover-client.tsx`)

**Responsibilities**:

- Interactive UI elements (forms, buttons, modals)
- Client-side state management (search, filters, preferences)
- Real-time updates and optimistic UI
- Browser APIs and local storage
- Complex user interactions and animations
- URL state management with Next.js router

**Example Structure**:

```typescript
// app/discover/discover-client.tsx (Client Component)
'use client'

export function DiscoverClient({ initialData, user }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})

  return (
    <PageLayout currentPage="discover">
      {/* Interactive search and filtering */}
    </PageLayout>
  )
}
```

### Layout Standardization

**PageLayout Component**: All pages now use the standardized `PageLayout` component which provides:

- Consistent navigation with `currentPage` highlighting
- Integrated `PageHeader` with breadcrumbs, actions, and search
- Surface design system integration (`bg-surface`, `bg-surface-elevated`)
- Responsive spacing and container widths
- Proper accessibility and semantic structure

**Usage Pattern**:

```typescript
<PageLayout
  currentPage="dashboard"
  header={{
    title: "Page Title",
    description: "Page description",
    breadcrumbs: [...],
    actions: [...],
    extraContent: <SearchBar />
  }}
>
  {/* Page content */}
</PageLayout>
```

This architecture provides a solid foundation for building and maintaining the CanonCore application with modern web development best practices.
