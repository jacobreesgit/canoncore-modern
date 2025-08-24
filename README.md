# CanonCore Modern

A modern rebuild of CanonCore using 2025's best web development practices. Built with Next.js 15, PostgreSQL, Drizzle ORM, and NextAuth.js v5.

## Overview

This is a complete ground-up rebuild of CanonCore, focusing on modern architecture patterns while maintaining all existing functionality. The original implementation in `../old/` serves as a reference for business logic and feature requirements.

## Tech Stack

- **Framework**: Next.js 15 with React 19 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Credentials provider
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **TypeScript**: Strict mode enabled
- **Testing**: Playwright MCP for E2E testing

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- PostgreSQL database (Neon recommended)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database URL and authentication secrets.

3. Set up the database:

```bash
pnpm db:generate
pnpm db:migrate
```

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:push` - Push schema changes to database
- `pnpm test:e2e` - Run E2E tests with Playwright

## Project Status

This project is currently in active development. See `../REBUILDING_CANONCORE.md` for the complete implementation roadmap and progress tracking.

### Completed Phases

- ✅ Phase 1.1: Environment Setup
- ✅ Phase 1.2: Database & ORM Setup

### Current Phase

- 🚧 Phase 1.3: Authentication Setup

## Architecture

### Modern Improvements Over Original

1. **Database**: PostgreSQL + Drizzle ORM (vs Firebase Firestore)
   - Better relational data handling
   - Type-safe queries
   - More predictable costs

2. **Authentication**: NextAuth.js v5 (vs Firebase Auth)
   - Email/password only (no OAuth complexity)
   - Database sessions
   - Built-in security best practices

3. **State Management**: Zustand (vs React Context)
   - Better performance
   - Simpler API
   - Clear separation of client/server state

4. **API Layer**: Route Handlers + Drizzle (vs dual service layers)
   - Simplified architecture
   - Type-safe end-to-end
   - Standard REST patterns

### Project Structure

```
app/                    # Next.js App Router pages
├── (auth)/            # Authentication routes
├── dashboard/         # Main dashboard
├── universes/         # Universe management
└── api/              # API routes

components/            # React components
├── ui/               # Base UI components
├── forms/            # Form components
└── layout/           # Layout components

lib/                  # Utilities and configuration
├── db/              # Database configuration
├── auth.ts          # NextAuth.js setup
└── utils.ts         # Utility functions

stores/               # Zustand state stores
migrations/           # Database migrations
```

## Testing

This project includes comprehensive testing with Vitest and Playwright MCP:

### Unit & Integration Tests

```bash
pnpm test          # Run all tests
pnpm test:ui       # Run tests with UI
pnpm test:coverage # Run tests with coverage
```

### Performance Benchmarks

Built-in performance benchmarking using Vitest:

```bash
pnpm bench            # Run all performance benchmarks
pnpm bench:db         # Database performance benchmarks
pnpm bench:api        # API service benchmarks
pnpm bench:memory     # Memory usage benchmarks
```

Performance benchmarks test:

- Database query performance with realistic datasets
- API service performance under load
- Memory usage patterns and leak detection
- Concurrent operations and connection pooling

### E2E Testing

E2E testing with Playwright MCP:

```bash
pnpm test:e2e
```

Testing covers:

- Complete user workflows
- Cross-browser compatibility
- Responsive design validation
- Authentication flows
- Database operations

### Load Testing & Lighthouse Audits

```bash
pnpm perf:load       # Artillery load testing
pnpm perf:lighthouse # Lighthouse performance audits
```

## Database Management

Drizzle Studio provides a web interface for database management:

```bash
pnpm db:studio
```

This opens a local web interface to view and edit your database schema and data.

## Deployment

The application is configured for deployment on Vercel with automated CI/CD:

1. Connect your repository to Vercel
2. Configure GitHub Secrets for deployment
3. Deploy automatically on push to main branch via GitHub Actions

See the [deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

This project follows the implementation plan in `../REBUILDING_CANONCORE.md`. Please reference this document for:

- Architecture decisions and rationale
- Implementation phases and dependencies
- Code patterns and conventions
- Testing requirements

## Reference Implementation

The original CanonCore implementation in `../old/` serves as a reference for:

- Business logic and feature requirements
- UI/UX patterns and design
- Data model relationships
- Testing protocols

## License

[License information to be added]
