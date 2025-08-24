# CanonCore Deployment Checklist

Use this checklist before deploying to production to ensure everything is properly configured.

## Pre-Deployment Setup

### 1. Environment Variables ✅

- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `AUTH_SECRET` - Secure random 32-character string
- [ ] `NEXTAUTH_URL` - Production domain URL
- [ ] `VERCEL_TOKEN` - Vercel API token (GitHub Secrets)
- [ ] `VERCEL_ORG_ID` - Vercel organization ID (GitHub Secrets)
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID (GitHub Secrets)

### 2. Database Setup ✅

- [ ] Production database created on Neon
- [ ] Database schema migrated (`pnpm db:push`)
- [ ] Database connection tested
- [ ] Separate test database for CI/CD

### 3. Repository Configuration ✅

- [ ] GitHub repository created and code pushed
- [ ] GitHub Secrets configured
- [ ] Branch protection rules set (optional)
- [ ] Repository visibility set appropriately

### 4. Vercel Project Setup ✅

- [ ] Vercel project created and linked to GitHub
- [ ] Environment variables added to Vercel
- [ ] Build settings configured (auto-detected)
- [ ] Domain configured (if using custom domain)

## Build & Test Verification

### 5. Local Testing ✅

- [ ] `pnpm install` - Dependencies installed
- [ ] `pnpm lint` - No linting errors
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm test:run` - All tests passing
- [ ] `pnpm build` - Production build successful
- [ ] `pnpm start` - Production server runs locally

### 6. CI/CD Pipeline ✅

- [ ] GitHub Actions workflow file exists (`.github/workflows/ci-cd.yml`)
- [ ] Test job runs successfully
- [ ] Build job completes without errors
- [ ] Deployment jobs configured for preview and production

## Security & Performance

### 7. Security Configuration ✅

- [ ] No secrets in repository code
- [ ] `.env.*` files in `.gitignore`
- [ ] Security headers configured in `next.config.ts`
- [ ] HTTPS enforced (automatic with Vercel)

### 8. Performance Optimization ✅

- [ ] Image optimization configured
- [ ] Bundle analyzer setup (`pnpm analyze`)
- [ ] Lighthouse CI configured
- [ ] Caching headers set for static assets
- [ ] Compression enabled

### 9. Monitoring Setup ✅

- [ ] Health check endpoint (`/api/health`)
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Automated security audits enabled

## Deployment Process

### 10. Initial Deployment

- [ ] Create production branch if needed
- [ ] Push to `main` branch to trigger deployment
- [ ] Monitor GitHub Actions for successful completion
- [ ] Verify deployment in Vercel dashboard
- [ ] Test deployed application functionality

### 11. Post-Deployment Verification

- [ ] Production URL loads correctly
- [ ] User registration/login works
- [ ] Database operations function properly
- [ ] All main features working as expected
- [ ] Performance acceptable (test with DevTools)

## Ongoing Maintenance

### 12. Regular Tasks

- [ ] Monitor weekly security audit results
- [ ] Review Lighthouse performance reports
- [ ] Check bundle size changes
- [ ] Update dependencies regularly
- [ ] Monitor error rates and logs

### 13. Backup & Recovery

- [ ] Database backup strategy in place
- [ ] Recovery procedures documented
- [ ] Environment variable backup stored securely

## Common Issues & Solutions

### Build Failures

```bash
# Check environment variables
echo $DATABASE_URL
echo $AUTH_SECRET

# Test database connection
pnpm db:studio

# Clear build cache
rm -rf .next
pnpm build
```

### Deployment Issues

```bash
# Check Vercel logs
vercel logs --follow

# Re-deploy manually
vercel --prod

# Check GitHub Actions logs
# Go to repository > Actions tab
```

### Database Connection Issues

```bash
# Test connection locally
node -e "console.log(process.env.DATABASE_URL)"

# Verify schema is up to date
pnpm db:push
```

## Emergency Rollback

If critical issues are discovered after deployment:

1. **Quick Rollback via Vercel**:
   - Go to Vercel dashboard
   - Select previous working deployment
   - Click "Promote to Production"

2. **Rollback via GitHub**:

   ```bash
   # Revert to last working commit
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback**:
   - If database changes were made, you may need to manually revert
   - Restore from backup if available

## Support Resources

- **Vercel**: [Vercel Status](https://vercel.com/status)
- **Neon**: [Neon Status](https://neon.tech/status)
- **GitHub**: [GitHub Status](https://www.githubstatus.com/)
- **Documentation**: See `PRODUCTION_SETUP.md` for detailed setup instructions

---

✅ **All items checked?** Ready for production deployment!

🚀 **Deploy Command**: Push to main branch or run `vercel --prod`
