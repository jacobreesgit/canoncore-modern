# CanonCore Implementation Plan

## Overview
Comprehensive implementation plan for completing the CanonCore application using Context7 best practices and sequential thinking.

## Current State Analysis

### ✅ What Exists and is Functional
1. **Database Schema** - Complete four-tier hierarchy (Users → Universes → Collections → Groups → Content)
2. **Authentication Backend** - NextAuth.js with JWT strategy configured
3. **Dashboard** - Functional dashboard showing user universes with create functionality
4. **Universe Detail Pages** - Complete hierarchy display with tree navigation
5. **Tree Component** - Advanced drag & drop, reordering, navigation using @headless-tree/react
6. **Create Forms** - Universe, Collection, and Group creation implemented
7. **Services & Actions** - Full backend CRUD operations for all entities
8. **API Routes** - NextAuth.js API endpoints configured

### ❌ What's Missing
1. **Homepage** - Still default Next.js template (critical blocker)
2. **Authentication UI** - No sign-in/sign-up pages
3. **Content Creation** - Forms for adding content items within groups
4. **Error Pages** - Custom authentication error handling
5. **Loading States** - User feedback during operations

## Phase 1: Authentication Implementation (Priority 1)

### 1.1 Homepage Replacement
**Context7 Best Practice**: Use proper authentication flow with session checks

```typescript
// app/page.tsx implementation
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'

export default async function HomePage() {
  const session = await auth()
  
  if (session?.user?.id) {
    redirect('/dashboard')
  }
  
  return <SignInForm />
}
```

### 1.2 Sign-In Page Implementation
**Following Context7 NextAuth.js best practices**:

**File**: `app/signin/page.tsx`
```typescript
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export default async function SignInPage(props: {
  searchParams: { callbackUrl?: string, error?: string }
}) {
  const session = await auth()
  
  if (session?.user?.id) {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to CanonCore</h2>
          <p className="text-muted-foreground">
            Organize your content universes
          </p>
        </div>
        
        {props.searchParams.error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            Authentication failed. Please try again.
          </div>
        )}
        
        <form
          action={async (formData) => {
            "use server"
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: props.searchParams?.callbackUrl ?? "/dashboard",
              })
            } catch (error) {
              if (error instanceof AuthError) {
                return redirect(`/signin?error=${error.type}`)
              }
              throw error
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md"
            >
              Sign In
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <a href="/signup" className="text-primary hover:underline">
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 1.3 Sign-Up Page Implementation
**File**: `app/signup/page.tsx`
```typescript
// Similar structure to sign-in but with registration logic
// Include password confirmation, validation, and user creation
```

### 1.4 Update Auth Configuration
**File**: `auth.ts` (enhance existing configuration)
```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) return null
        
        // Implement user lookup and password verification
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email)
        })
        
        if (!user || !user.passwordHash) return null
        
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          user.passwordHash
        )
        
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
    })
  ],
  pages: {
    signIn: '/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    }
  }
})
```

## Phase 2: Content Creation Implementation

### 2.1 Content Creation Forms
**File**: `app/universes/[id]/collections/[collectionId]/groups/[groupId]/create-content/page.tsx`

Following the existing pattern of Collection and Group creation forms.

### 2.2 Content Detail Pages
**File**: `app/universes/[id]/collections/[collectionId]/groups/[groupId]/content/[contentId]/page.tsx`

Display individual content items with editing capabilities.

### 2.3 Enhanced Tree Component
Update existing tree component to handle content creation directly within the tree interface.

## Phase 3: Playwright MCP Testing Strategy

### 3.1 MCP Tool Validation Framework

**Objective**: Create comprehensive tests FOR the MCP Playwright tools themselves, not using them to test our app.

#### 3.1.1 Core MCP Function Testing
```javascript
// Test each MCP Playwright function systematically:
- mcp__playwright-mcp__browser_navigate
- mcp__playwright-mcp__browser_snapshot  
- mcp__playwright-mcp__browser_click
- mcp__playwright-mcp__browser_type
- mcp__playwright-mcp__browser_take_screenshot
- mcp__playwright-mcp__browser_fill_form
- mcp__playwright-mcp__browser_wait_for
- mcp__playwright-mcp__browser_hover
- mcp__playwright-mcp__browser_drag
```

#### 3.1.2 Test Scenarios Structure
```markdown
For each MCP tool function:
1. **Basic Functionality Test** - Does it work as expected?
2. **Error Handling Test** - How does it handle invalid inputs?
3. **Edge Cases Test** - Boundary conditions and extreme inputs
4. **Performance Test** - Response times and reliability
5. **Integration Test** - How well does it work with other MCP functions?
```

#### 3.1.3 Demo Universe Test Case
**Use the Doctor Who universe creation as the comprehensive test scenario**:

```markdown
Test Workflow:
1. Navigate to CanonCore homepage (test browser_navigate)
2. Take initial screenshot (test browser_take_screenshot)  
3. Fill sign-in form (test browser_fill_form)
4. Click sign-in button (test browser_click)
5. Wait for dashboard load (test browser_wait_for)
6. Navigate to create universe (test browser_navigate)
7. Type universe details (test browser_type)
8. Create "Doctor Who" universe
9. Add Collections: "Classic Who", "New Who", "Spin-offs"
10. Add Groups within Collections
11. Test drag & drop functionality (test browser_drag)
12. Take final screenshot (test browser_take_screenshot)
13. Capture page snapshot (test browser_snapshot)
```

### 3.2 MCP Tool Quality Assurance
```markdown
**Test Documentation Structure**:
- Function signature and parameters
- Expected behavior description
- Test results and screenshots
- Performance metrics
- Error cases encountered
- Recommendations for improvement
```

## Phase 4: Demo Universe Creation

### 4.1 Doctor Who Universe Structure
**Following the four-tier architecture**:

```
🌌 Doctor Who Universe
├── 📁 Classic Who (1963-1996)
│   ├── 👥 First Doctor Era
│   │   ├── 📺 An Unearthly Child
│   │   ├── 📺 The Daleks  
│   │   └── 📺 The Edge of Destruction
│   ├── 👥 Second Doctor Era
│   └── 👥 Third Doctor Era
├── 📁 New Who (2005-present)
│   ├── 👥 Ninth Doctor Era
│   ├── 👥 Tenth Doctor Era
│   └── 👥 Eleventh Doctor Era
└── 📁 Spin-offs
    ├── 👥 Torchwood
    └── 👥 Sarah Jane Adventures
```

### 4.2 Implementation Steps
1. **Create Universe**: "Doctor Who" with full description
2. **Create Collections**: Classic, New, Spin-offs with chronological ordering
3. **Create Groups**: Doctor eras, show categories
4. **Create Content**: Individual episodes/specials with metadata
5. **Test Tree Functionality**: Drag & drop reordering, navigation
6. **Document Process**: Screenshots and workflow documentation

## Phase 5: Error Handling & Polish

### 5.1 Error Pages
- Custom 404 page
- Authentication error page  
- Server error page
- Loading states

### 5.2 Performance Optimization
- Loading indicators
- Optimistic UI updates
- Error boundaries

## Implementation Priority Order

### Week 1: Critical Authentication
1. ✅ Fix NextAuth.js JWT strategy (COMPLETED)
2. 🔄 Replace default homepage with authentication flow
3. 🔄 Create sign-in page following Context7 best practices
4. 🔄 Create sign-up page with registration logic
5. 🔄 Test authentication flow end-to-end

### Week 2: Content Management
1. Create content creation forms
2. Implement content detail pages
3. Enhance tree component for content management
4. Test CRUD operations

### Week 3: MCP Testing Framework
1. Design MCP tool testing framework
2. Implement systematic tests for each MCP function
3. Create Doctor Who demo universe as test case
4. Document MCP tool capabilities and limitations

### Week 4: Polish & Documentation
1. Implement error handling
2. Add loading states
3. Performance optimization
4. Comprehensive documentation
5. Final testing and validation

## Success Metrics

### Authentication Flow
- [ ] Users can sign up with email/password
- [ ] Users can sign in and are redirected to dashboard
- [ ] Unauthenticated users are redirected to sign-in
- [ ] Session management works correctly

### Content Management
- [ ] Complete four-tier hierarchy creation works
- [ ] Tree component handles all interactions
- [ ] Drag & drop reordering functions
- [ ] Content creation and editing works

### MCP Tool Validation
- [ ] All MCP Playwright functions tested systematically
- [ ] Demo universe creation workflow documented
- [ ] Performance metrics captured
- [ ] Error cases documented
- [ ] Recommendations provided

### Demo Universe
- [ ] Doctor Who universe created with full hierarchy
- [ ] All content types represented
- [ ] Tree navigation fully functional
- [ ] Screenshots and documentation complete

## Notes

This plan follows Context7 best practices by:
1. **Using proven patterns** from NextAuth.js documentation
2. **Sequential implementation** with clear priorities
3. **Comprehensive testing** strategy for MCP tools
4. **Real-world example** with Doctor Who universe
5. **Documentation-driven** development approach

The implementation emphasizes security, user experience, and maintainability while providing thorough validation of the MCP Playwright toolset.