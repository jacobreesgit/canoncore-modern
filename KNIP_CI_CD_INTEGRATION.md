# Code Quality CI/CD Integration Guide

*Comprehensive guide for integrating Knip unused code detection and Prettier formatting into your CI/CD pipeline*

## 📋 Table of Contents

- [Why Integrate Code Quality Tools](#why-integrate-code-quality-tools)
- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Knip Configuration](#knip-configuration)
- [Prettier Configuration](#prettier-configuration)
- [GitHub Actions Integration](#github-actions-integration)
- [Workflow Strategies](#workflow-strategies)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Reporting](#monitoring--reporting)
- [Troubleshooting](#troubleshooting)
- [Maintenance & Best Practices](#maintenance--best-practices)

## Why Integrate Code Quality Tools?

Based on our current codebase analysis, Knip found:
- **30 unused files** 
- **72 unused exports**
- **5 unused devDependencies**
- **13 duplicate exports**
- **1 unlisted dependency**

## 📊 Detailed Knip Analysis Results

### Unused Files (30)
```
components/content/index.ts                  
components/forms/index.ts                    
components/forms/ValidatedForm.tsx           
components/forms/ValidationErrorDisplay.tsx  
components/layout/Footer.tsx                 
components/lazy/index.ts                     
components/lazy/LazyComponents.tsx           
components/lazy/LoadingSpinner.tsx           
components/lazy/SuspenseWrapper.tsx          
hooks/useErrorHandler.ts                     
hooks/useFormValidation.ts                   
lib/actions/user-actions.ts                  
lib/actions/validated-actions.ts             
lib/auth-client.ts                           
lib/hooks/index.ts                           
lib/hooks/useErrorBoundary.ts                
lib/hooks/useImageOptimization.ts            
lib/performance/__tests__/api.bench.ts       
lib/performance/__tests__/database.bench.ts  
lib/performance/__tests__/memory.bench.ts    
lib/performance/config.ts                    
lib/utils/version.ts                         
lib/validation/form-validation.ts            
lib/validation/index.ts                      
lib/validation/schemas.ts                    
stores/app-store.ts                          
stores/index.ts                              
stores/slices/favourites-slice.ts            
stores/slices/progress-slice.ts              
test/mocks/server-only.ts
```

### Unused devDependencies (5)
```
autocannon          package.json:72:6
eslint-config-next  package.json:75:6
lighthouse          package.json:76:6
tailwindcss         package.json:79:6
web-vitals          package.json:83:6
```

### Unlisted Dependencies (1)
```
postcss  postcss.config.mjs
```

### High-Value Unused Exports (Sample of 72)
```
deleteContentAction              lib/actions/content-actions.ts:143:23      
addToFavouritesAction            lib/actions/favourites-actions.ts:84:23    
removeFromFavouritesAction       lib/actions/favourites-actions.ts:123:23   
getUserProgressByUniverseAction  lib/actions/progress-actions.ts:80:23      
bulkUpdateProgressAction         lib/actions/progress-actions.ts:153:23     
getProgressSummaryAction         lib/actions/progress-actions.ts:210:23     
ConnectionHealthMonitor          lib/db/connection-pool.ts:91:14            
ConnectionOptimizer              lib/db/connection-pool.ts:128:14           
getPerformanceRecommendations    lib/db/connection-pool.ts:169:17           
DatabasePerformanceMonitor       lib/db/connection-pool.ts:207:14           
validateFormData                 lib/validation/form-validation.ts:29:23    
withValidation                   lib/validation/form-validation.ts:97:23    
createValidationMiddleware       lib/validation/form-validation.ts:127:23   
```

### Duplicate Exports (13)
```
Badge|default          components/content/Badge.tsx         
ProgressBar|default    components/content/ProgressBar.tsx   
Tree|default           components/content/Tree.tsx          
UniverseCard|default   components/content/UniverseCard.tsx  
FormActions|default    components/forms/FormActions.tsx     
FormError|default      components/forms/FormError.tsx       
FormField|default      components/forms/FormField.tsx       
FormLabel|default      components/forms/FormLabel.tsx       
Breadcrumb|default     components/interactive/Breadcrumb.tsx
SearchBar|default      components/interactive/SearchBar.tsx 
Navigation|default     components/layout/Navigation.tsx     
PageContainer|default  components/layout/PageContainer.tsx  
PageHeader|default     components/layout/PageHeader.tsx     
```

Integrating code quality tools (Knip + Prettier) into CI/CD helps:

### 🧹 **Knip Benefits:**
- ✅ **Prevent code bloat** - Catch unused code before it accumulates
- ✅ **Improve build performance** - Smaller bundles, faster builds
- ✅ **Maintain code quality** - Enforce clean architecture
- ✅ **Reduce maintenance burden** - Less code to maintain
- ✅ **Track progress** - Monitor cleanup efforts over time

### 💅 **Prettier Benefits:**
- ✅ **Consistent formatting** - Eliminate style debates and merge conflicts
- ✅ **Automatic fixes** - Format code on commit or in CI
- ✅ **Team productivity** - Focus on logic, not formatting
- ✅ **Code review efficiency** - No formatting distractions
- ✅ **Professional appearance** - Clean, consistent codebase

## Prerequisites

- [x] Next.js 15 project with TypeScript ✅
- [x] Existing GitHub Actions workflow ✅ 
- [x] pnpm package manager ✅
- [x] Basic understanding of CI/CD concepts

## Quick Start (5 minutes)

### 1. Install Tools

```bash
# Install Knip for unused code detection
pnpm add -D knip

# Install Prettier for code formatting (if not already installed)
pnpm add -D prettier

# Optional: Install format checker
pnpm add -D prettier-plugin-tailwindcss
```

### 2. Add Package.json Scripts

```json
{
  "scripts": {
    "knip": "knip",
    "knip:fix": "knip --fix",
    "knip:production": "knip --production",
    "knip:ci": "knip --reporter json --outputFile knip-report.json",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:staged": "prettier --write --cache",
    "quality:check": "pnpm format:check && pnpm lint && pnpm type-check && pnpm knip"
  }
}
```

### 3. Test Locally

```bash
# Check current formatting
pnpm format:check

# Auto-format all files
pnpm format

# Check unused code issues
pnpm knip

# Auto-fix safe unused code issues
pnpm knip:fix

# Run full quality check
pnpm quality:check
```

### 4. Add to Existing GitHub Actions

Add these steps to your `.github/workflows/ci.yml`:

```yaml
- name: Check code formatting
  run: pnpm format:check

- name: Check for unused code
  run: pnpm knip --reporter compact
```

## Knip Configuration

### Analysis of Current Issues

Based on our Knip results, here's how to prioritize cleanup:

**🟢 Safe to Remove (High Priority)**
- **Index files**: Many `index.ts` files are unused - these are safe to delete
- **Validation infrastructure**: Complete validation system was built but never integrated
- **Lazy loading components**: Infrastructure ready but not implemented  
- **Performance benchmarks**: Keep these for development (add to ignore)

**🟡 Evaluate Carefully (Medium Priority)**  
- **Database optimization classes**: `ConnectionHealthMonitor`, `ConnectionOptimizer` - future performance features
- **User actions**: `deleteContentAction`, `bulkUpdateProgressAction` - might be needed later
- **Store slices**: Zustand architecture partially implemented

**🔴 Fix Immediately (Low Effort, High Impact)**
- **Duplicate exports**: 13 components with both named and default exports
- **Missing postcss dependency**: Add to package.json  
- **tailwindcss marked unused**: False positive - should be in dependencies, not devDependencies

### Recommended Configuration

Create `knip.json` in your project root:

```json
{
  "entry": [
    "app/**/*.tsx",
    "app/**/*.ts",
    "lib/auth.ts",
    "lib/db/index.ts",
    "middleware.ts",
    "next.config.ts",
    "tailwind.config.ts"
  ],
  "project": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "ignore": [
    "lib/performance/**",
    "clear-database.ts",
    "test/**",
    "**/.*"
  ],
  "ignoreDependencies": [
    "autocannon",
    "lighthouse"
  ],
  "ignoreBinaries": [
    "tsx"
  ],
  "include": [
    "files",
    "dependencies",
    "devDependencies", 
    "exports",
    "types"
  ],
  "exclude": [
    "classMembers",
    "enumMembers"
  ]
}
```

### Configuration Explained

| Option | Purpose | Our Setting |
|--------|---------|-------------|
| `entry` | Files that serve as application entry points | App Router pages, auth, db config |
| `project` | All files to analyze | All TypeScript files |
| `ignore` | Files to skip completely | Performance benchmarks, dev tools |
| `ignoreDependencies` | Dependencies to not report as unused | Testing/perf tools we want to keep |
| `include` | Types of issues to report | Focus on files, deps, exports |
| `exclude` | Types of issues to ignore | Skip class/enum members (noisy) |

## Prettier Configuration

### Check Current Setup

First, verify your current Prettier setup:

```bash
# Check if Prettier config exists
ls -la .prettierrc* prettier.config.*

# Check current formatting status
pnpm format:check
```

### Recommended Prettier Configuration

Create `.prettierrc.json` in your project root:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 80,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Prettier Ignore Configuration

Create `.prettierignore`:

```
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
dist/
build/

# Generated files
*.generated.*
*.min.*

# Logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Package manager files
pnpm-lock.yaml
package-lock.json
yarn.lock

# Database
*.db
*.sqlite

# Environment files
.env*
!.env.example
```

### Format Integration Options

**Option 1: Format on CI (Check Only)**
```yaml
- name: Check code formatting
  run: pnpm format:check
```

**Option 2: Auto-format in CI (For Development Branches)**
```yaml
- name: Auto-format code
  if: github.ref != 'refs/heads/main'
  run: |
    pnpm format
    if git diff --quiet; then
      echo "No formatting changes needed"
    else
      echo "::warning::Code was auto-formatted"
      git config --local user.email "action@github.com"
      git config --local user.name "GitHub Action"
      git add .
      git commit -m "style: auto-format code with Prettier"
      git push
    fi

- name: Check formatting (Main Branch)
  if: github.ref == 'refs/heads/main' 
  run: pnpm format:check
```

**Option 3: Format Check with Suggestions**
```yaml
- name: Check formatting and suggest fixes
  run: |
    if ! pnpm format:check; then
      echo "::error::Code formatting issues found"
      echo "::notice::Run 'pnpm format' locally to fix formatting"
      echo "::notice::Or enable auto-formatting in development branches"
      exit 1
    fi
```

## GitHub Actions Integration

### Option 1: Warning Mode (Recommended Start)

Add to your existing workflow after the lint step:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Lint
        run: pnpm lint
        
      - name: Type check
        run: pnpm type-check
        
      - name: Check for unused code (Warning)
        run: |
          echo "::group::Knip Analysis"
          pnpm knip --reporter compact || echo "::warning::Unused code found - see output above"
          echo "::endgroup::"
        continue-on-error: true
        
      - name: Test
        run: pnpm test
        
      - name: Build
        run: pnpm build
```

### Option 2: Enforcing Mode (After Initial Cleanup)

```yaml
      - name: Check for unused code (Enforcing)
        run: pnpm knip --reporter compact
```

### Option 3: Conditional Enforcement

```yaml
      - name: Check for unused code
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "Running strict Knip check on main branch"
            pnpm knip --reporter compact
          else
            echo "Running Knip check with warnings on PR"
            pnpm knip --reporter compact || echo "::warning::Unused code found"
          fi
        continue-on-error: ${{ github.ref != 'refs/heads/main' }}
```

## Workflow Strategies

### Strategy 1: Gradual Adoption (Recommended)

**Week 1-2: Assessment**
```yaml
- name: Knip Assessment
  run: |
    pnpm knip --reporter json > knip-report.json
    echo "::notice::Knip found $(cat knip-report.json | jq '.issues | length') issues"
  continue-on-error: true
```

**Week 3-4: Warning Mode**
```yaml
- name: Knip Warning Mode  
  run: pnpm knip --reporter compact || echo "::warning::Clean up unused code"
  continue-on-error: true
```

**Week 5+: Enforcement**
```yaml
- name: Knip Enforcement
  run: pnpm knip --reporter compact
```

### Strategy 2: Selective Enforcement

Focus on specific issue types:

```yaml
- name: Check unused dependencies
  run: pnpm knip --dependencies --reporter compact

- name: Check unused files  
  run: pnpm knip --files --reporter compact

- name: Check unused exports (warning only)
  run: pnpm knip --exports --reporter compact || true
  continue-on-error: true
```

### Strategy 3: Auto-fix in CI

```yaml
- name: Auto-fix unused code
  run: |
    pnpm knip --fix
    if git diff --quiet; then
      echo "No changes needed"
    else
      echo "::warning::Knip made auto-fixes - review changes"
      git status
    fi
```

## Performance Optimization

### Caching Strategy

Add caching to speed up Knip runs:

```yaml
- name: Cache Knip
  uses: actions/cache@v4
  with:
    path: |
      ~/.cache/knip
      node_modules/.cache/knip
    key: knip-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('knip.json') }}
    restore-keys: |
      knip-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}-
      knip-${{ runner.os }}-
```

### Parallel Execution

Run Knip in parallel with other checks:

```yaml
jobs:
  code-quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        check: ['lint', 'type-check', 'knip']
    steps:
      - uses: actions/checkout@v4
      - name: Setup and run ${{ matrix.check }}
        run: |
          case ${{ matrix.check }} in
            lint) pnpm lint ;;
            type-check) pnpm type-check ;;
            knip) pnpm knip --reporter compact ;;
          esac
```

## Monitoring & Reporting

### Generate Reports

```yaml
- name: Generate Knip Report
  run: |
    pnpm knip --reporter json > knip-report.json
    pnpm knip --reporter compact > knip-summary.txt
    
- name: Upload Knip Reports
  uses: actions/upload-artifact@v4
  with:
    name: knip-reports
    path: |
      knip-report.json
      knip-summary.txt
```

### Track Progress Over Time

```yaml
- name: Track Knip Progress
  run: |
    ISSUES_COUNT=$(pnpm knip --reporter json | jq '.issues | length')
    echo "unused-code-issues=$ISSUES_COUNT" >> $GITHUB_OUTPUT
    
    # Store in GitHub environment for tracking
    echo "KNIP_ISSUES_COUNT=$ISSUES_COUNT" >> $GITHUB_ENV
```

### Comment on PRs

```yaml
- name: Comment Knip Results on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const report = JSON.parse(fs.readFileSync('knip-report.json', 'utf8'));
      const issueCount = report.issues.length;
      
      const body = `## 🔍 Knip Analysis Results
      
      Found **${issueCount}** unused code issues:
      
      - Unused files: ${report.issues.filter(i => i.type === 'files').length}
      - Unused exports: ${report.issues.filter(i => i.type === 'exports').length}  
      - Unused dependencies: ${report.issues.filter(i => i.type === 'dependencies').length}
      
      ${issueCount > 0 ? '⚠️ Consider running `pnpm knip --fix` to auto-resolve some issues.' : '✅ No unused code found!'}
      `;
      
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: body
      });
```

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Too many unused exports"

**Solution**: Start with warnings only, clean up gradually

```json
{
  "include": ["files", "dependencies"],
  "exclude": ["exports", "types"]
}
```

#### Issue: "Performance benchmarks marked as unused"

**Solution**: Add to ignore patterns

```json
{
  "ignore": [
    "lib/performance/**",
    "**/*.bench.ts",
    "**/*.perf.ts"
  ]
}
```

#### Issue: "Test files causing false positives"

**Solution**: Configure test handling

```json
{
  "ignore": ["**/*.test.ts", "**/*.spec.ts", "test/**"]
}
```

#### Issue: "Knip is too slow"

**Solutions**:
1. Add caching (see Performance Optimization)
2. Limit scope: `pnpm knip --dependencies --files` 
3. Use incremental checking for PRs

#### Issue: "False positives with dynamic imports"

**Solution**: Configure entry points properly

```json
{
  "entry": [
    "app/**/*.tsx",
    "lib/dynamic/**/*.ts"
  ]
}
```

### Debug Mode

Enable debug output:

```yaml
- name: Debug Knip Issues
  if: failure()
  run: |
    pnpm knip --debug > knip-debug.log
    cat knip-debug.log
```

## Maintenance & Best Practices

### Weekly Cleanup Routine

Add a scheduled workflow:

```yaml
name: Weekly Code Cleanup

on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 9 AM
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Auto-fix unused code
        run: pnpm knip --fix
        
      - name: Create cleanup PR
        if: success()
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: automated code cleanup with Knip'
          title: 'Weekly code cleanup'
          body: |
            Automated cleanup of unused code detected by Knip.
            
            This PR was created automatically and should be reviewed before merging.
          branch: automated/knip-cleanup
```

### Team Guidelines

**For Developers**:
1. Run `pnpm knip` before committing large changes
2. Use `pnpm knip --fix` for safe auto-fixes
3. Add `@public` JSDoc tags for intentionally unused exports

**For Code Reviews**:
1. Check if new code introduces unused exports
2. Verify that removed code won't break dynamic imports
3. Consider if "unused" code is actually needed for future features

### Configuration Evolution

As your codebase matures:

```json
{
  "// Phase 1": "Start with files and dependencies only",
  "include": ["files", "dependencies"],
  
  "// Phase 2": "Add exports after initial cleanup", 
  "include": ["files", "dependencies", "exports"],
  
  "// Phase 3": "Add types and strict checking",
  "include": ["files", "dependencies", "exports", "types", "classMembers"]
}
```

### Success Metrics

Track these metrics over time:
- Total unused code issues
- Bundle size reduction
- Build time improvements  
- Developer productivity (less time debugging unused imports)

---

## 🚀 Ready to Deploy?

### Immediate Actions (Next 30 minutes)

1. **Install Knip**: `pnpm add -D knip`
2. **Fix critical issues**:
   ```bash
   # Add missing dependency
   pnpm add -D postcss
   
   # Move tailwindcss to dependencies if used in production
   # (Check if it's actually needed at runtime)
   ```
3. **Add scripts to package.json** (copy from Quick Start)
4. **Test locally**: `pnpm knip`
5. **Add warning mode to CI** (copy Option 1 from GitHub Actions)

### Quick Wins (Next 2 hours)

**Remove unused index files:**
```bash
# These are safe to delete based on Knip analysis
rm components/content/index.ts
rm components/forms/index.ts  
rm components/lazy/index.ts
rm lib/hooks/index.ts
rm lib/validation/index.ts
rm stores/index.ts
```

**Fix duplicate exports (choose one pattern):**
```bash
# Option 1: Keep named exports (recommended)
pnpm knip --fix

# Option 2: Manual cleanup - remove either named or default exports
```

**Address validation system:**
```bash
# Decision needed: integrate or remove?
# Remove if not planning to use soon:
rm -rf lib/validation/
rm components/forms/ValidatedForm.tsx
rm components/forms/ValidationErrorDisplay.tsx
```

### Week 1 Goals

- [x] Knip running in CI with warnings
- [ ] Initial cleanup of obvious unused files
- [ ] Team familiar with Knip workflow
- [ ] Configuration tuned for your codebase

### Month 1 Goals  

- [ ] Enforcing mode enabled
- [ ] Automated cleanup workflow
- [ ] Progress tracking implemented
- [ ] Team adoption complete

---

*This guide was created using Claude Code with Context7 documentation and sequential thinking to provide comprehensive, actionable steps for integrating Knip into your CI/CD pipeline.*