# CanonCore Production Setup Guide

This guide covers the complete setup process for deploying CanonCore to production using Vercel and GitHub Actions CI/CD.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Neon Database**: Production PostgreSQL database at [neon.tech](https://neon.tech)

## Environment Variables Setup

### 1. Production Database (Neon)

1. Create a production database on Neon:
   - Go to [neon.tech](https://neon.tech) and create a new project
   - Copy the connection string from the dashboard
   - The URL format: `postgresql://username:password@host:5432/database_name`

### 2. Required Environment Variables

Set these in both your Vercel project settings and GitHub repository secrets:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# NextAuth.js
AUTH_SECRET="your-secure-random-32-character-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Testing (GitHub Secrets only)
TEST_DATABASE_URL="postgresql://test_username:password@host:5432/test_database"
```

### 3. GitHub Repository Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
DATABASE_URL=your_production_database_url
TEST_DATABASE_URL=your_test_database_url
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## Vercel Setup

### 1. Connect Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 2. Configure Build Settings

Vercel should auto-detect these, but verify:

```bash
# Build Command
pnpm build

# Output Directory
.next

# Install Command
pnpm install

# Development Command
pnpm dev
```

### 3. Environment Variables in Vercel

In your Vercel project dashboard:

1. Go to Settings > Environment Variables
2. Add all production environment variables
3. Set appropriate environments (Production, Preview, Development)

### 4. Get Vercel Project Information

Run these commands to get your project IDs:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (run from your project directory)
vercel link

# Get project info
vercel project ls
```

Copy the Project ID and Org ID to your GitHub secrets.

## Database Migration

### Production Database Setup

1. **Create Production Database**:

   ```bash
   # Create a separate production database on Neon
   # Use a different database name from development
   ```

2. **Run Migrations**:

   ```bash
   # Set production DATABASE_URL temporarily
   export DATABASE_URL="your_production_database_url"

   # Generate and push schema
   pnpm db:generate
   pnpm db:push
   ```

3. **Verify Schema**:
   ```bash
   # Use Drizzle Studio to verify
   pnpm db:studio
   ```

## CI/CD Pipeline

The GitHub Actions workflow includes:

### Testing Pipeline

- ✅ ESLint checking
- ✅ TypeScript type checking
- ✅ Unit and integration tests
- ✅ Test coverage reporting

### Build Pipeline

- ✅ Production build generation
- ✅ Build artifact upload

### Deployment Pipeline

- ✅ Preview deployments for PRs
- ✅ Production deployment on main branch
- ✅ Automatic PR comments with preview URLs

### Security & Maintenance

- ✅ Weekly security audits
- ✅ Lighthouse performance audits
- ✅ Bundle size analysis

## Deployment Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Pull Request Process

1. GitHub Actions will run all tests
2. A preview deployment will be created
3. Review the preview and tests
4. Merge when approved

### 3. Production Deployment

1. Merge to `main` branch triggers production deployment
2. GitHub Actions builds and deploys to Vercel
3. Live site is updated automatically

## Monitoring & Maintenance

### 1. Performance Monitoring

- Vercel Analytics (built-in)
- Lighthouse CI reports
- Bundle size tracking

### 2. Error Monitoring

- Next.js built-in error tracking
- Vercel runtime logs
- Optional: Sentry integration

### 3. Security

- Automated dependency audits
- Regular security updates
- Environment variable protection

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set
   - Verify database connection
   - Review build logs in Vercel/GitHub

2. **Database Connection**:
   - Verify DATABASE_URL format
   - Check Neon database status
   - Ensure connection pooling settings

3. **Authentication Issues**:
   - Verify AUTH_SECRET is set
   - Check NEXTAUTH_URL matches domain
   - Ensure all auth environment variables are present

### Debug Commands

```bash
# Local production build test
pnpm build
pnpm start

# Database connection test
pnpm db:studio

# Run production-like environment locally
cp .env.production .env.local
pnpm dev
```

## Security Checklist

- [ ] All secrets are stored in GitHub Secrets/Vercel Environment Variables
- [ ] No sensitive data in repository
- [ ] Production database has restricted access
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables properly scoped
- [ ] Regular security audits enabled

## Support

For issues with:

- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Neon**: [Neon Documentation](https://neon.tech/docs)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **GitHub Actions**: [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Next Steps

After successful deployment:

1. Set up custom domain in Vercel (optional)
2. Configure additional monitoring tools
3. Set up automated database backups
4. Consider adding staging environment
5. Implement feature flags for gradual rollouts
