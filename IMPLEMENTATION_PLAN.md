## Phase 1: Group Sub-Hierarchies Implementation

### 1.1 RelationshipService Integration

**Objective**: Enable Groups to have sub-Groups within Collections, supporting complex organizational structures like "Season Arc → Story Arc → Episode Arc".

**Status**: ❌ **Service implemented but not integrated - requires backend connection**

**Current Issue**: RelationshipService exists with correct methods but:
- No imports found in GroupService  
- No server actions connect to RelationshipService methods
- No UI components use relationship functionality
- Database tables exist but are unused

**Available Methods**: 
- Group relationship methods ready: `createGroupRelationship()`, `getGroupRelationships()`, `deleteGroupRelationship()`
- Content relationship methods removed to avoid over-engineering  
- Database schema already supports `groupRelationships` table

**Integration Required**:
- Connect GroupService to RelationshipService methods
- Create server actions for relationship management
- Update GroupTree component for hierarchical display
- Add validation for circular references and depth limits

### 1.2 GroupService Enhancements

**File**: `lib/services/group.service.ts`

Add hierarchy support methods:

```typescript
// New methods for hierarchy support
static async getWithHierarchy(groupId: string, userId: string): Promise<GroupTreeData>
static async moveToParent(groupId: string, parentId: string, userId: string): Promise<ServiceResult<void>>
static async getAncestors(groupId: string, userId: string): Promise<ServiceResult<Group[]>>
static async getDescendants(groupId: string, userId: string): Promise<ServiceResult<Group[]>>
```

### 1.3 Server Actions for Group Hierarchies

**File**: `lib/actions/group-actions.ts`

Add new server actions:

```typescript
export async function createSubGroup(formData: FormData): Promise<ActionResult>
export async function moveGroupToParent(
  formData: FormData
): Promise<ActionResult>
export async function removeGroupFromParent(
  formData: FormData
): Promise<ActionResult>
```

### 1.4 UI Component Updates

**File**: `components/tree/group-tree.tsx`

Extend GroupTree component:

```typescript
export interface GroupTreeProps extends TreeProps {
  enableHierarchy: boolean // Toggle between flat and hierarchical view
  onCreateSubGroup?: (parentId: string, groupData: NewGroup) => Promise<void>
  onMoveToParent?: (groupId: string, newParentId: string) => Promise<void>
  onRemoveFromParent?: (groupId: string) => Promise<void>
}
```

### 1.5 Example Implementation

**Doctor Who Collection: "Series 4" with Group Hierarchies**:

```
├── Group: "Main Season"
│   ├── Sub-Group: "Donna Arc"
│   │   ├── Content: "Partners in Crime"
│   │   └── Content: "The Fires of Pompeii"
│   └── Sub-Group: "Shadow Proclamation Arc"
│       ├── Content: "The Stolen Earth"
│       └── Content: "Journey's End"
└── Group: "Specials"
    └── Sub-Group: "Between Series Arc"
        ├── Content: "The Next Doctor"
        └── Content: "Planet of the Dead"
```

## Phase 2: Content Creation Implementation

### 2.1 Content Creation Forms

**File**: `app/universes/[id]/collections/[collectionId]/groups/[groupId]/create-content/page.tsx`

Following the existing pattern of Collection and Group creation forms.

### 2.2 Content Detail Pages

**File**: `app/universes/[id]/collections/[collectionId]/groups/[groupId]/content/[contentId]/page.tsx`

Display individual content items with editing capabilities.

### 2.3 Collection Edit Implementation

**Objective**: Implement collection editing functionality following architectural principles.

**Backend Status**: ✅ Complete
- `CollectionService.update()` method exists
- `updateCollection()` server action exists with validation
- Follows same patterns as universe implementation

**Frontend Implementation Required**:
- Create `app/[locale]/universes/[id]/collections/[collectionId]/edit/page.tsx`
- Create `app/[locale]/universes/[id]/collections/[collectionId]/edit/collection-edit-form.tsx`
- Follow identical patterns to universe edit implementation

## Phase 3: Error Handling & Polish

### 3.1 Error Pages

- Custom 404 page
- Authentication error page
- Server error page
- Loading states

### 3.2 Performance Optimization

**Implementation Tasks**:
- Optimistic UI updates for better user experience  
- Error boundaries for React component resilience
- Database query optimization for tree operations
- Bundle size optimization and code splitting

**Context7 Research Required**:
- "React error boundary patterns" for robust error handling
- "Next.js production deployment best practices" for optimization
- "database query optimization techniques" for performance

**Success Criteria**:
- ✅ All error cases handled gracefully
- ✅ Loading states provide clear user feedback
- ✅ Application performs well with large datasets
- ✅ Production deployment ready
- ✅ Security vulnerabilities addressed

## Phase 5: Future Features Implementation

### 5.1 Public Universe Discovery

**Objective**: Implement `UniverseService.getPublic()` to enable public universe browsing and discovery.

**Features**:
- Public universe listing with search and filtering
- Public universe detail pages for non-owners
- Discovery feed with popular/featured universes
- Public API endpoints for universe discovery

**Implementation**:

```typescript
// Enhanced UniverseService methods
static async getPublic(options?: {
  search?: string
  limit?: number
  offset?: number
  featured?: boolean
}): Promise<ServiceResult<Universe[]>>

static async getPublicById(
  universeId: string
): Promise<ServiceResult<PublicUniverseData>>

static async togglePublicVisibility(
  universeId: string, 
  userId: string
): Promise<ServiceResult<Universe>>
```

**UI Components**:
- Public universe discovery page (`/discover`)
- Public universe detail view (read-only)
- Universe visibility toggle in settings

### 5.2 Advanced Hierarchy Views

**Objective**: Implement `GroupService.getCompleteHierarchy()` for comprehensive hierarchy visualization.

**Features**:
- Complete group hierarchy tree with all descendants
- Hierarchical breadcrumb navigation
- Expandable/collapsible tree views
- Hierarchy depth indicators and statistics

**Implementation**:

```typescript
// Enhanced GroupService methods  
static async getCompleteHierarchy(
  groupId: string,
  userId: string
): Promise<ServiceResult<GroupHierarchyTree>>

static async getHierarchyStats(
  groupId: string,
  userId: string  
): Promise<ServiceResult<HierarchyStats>>

interface GroupHierarchyTree {
  group: Group
  children: GroupHierarchyTree[]
  depth: number
  totalDescendants: number
}
```

**UI Components**:
- Advanced hierarchy tree component
- Hierarchy statistics dashboard
- Depth-based visual indicators

### 5.3 Alternative Content Views

**Objective**: Implement `ContentService.getViewableByUniverse()` for flat content organization views.

**Features**:
- Flat content listing across entire universe
- Content filtering by type, viewability, and progress
- Timeline/chronological content views
- Content search across hierarchy boundaries

**Implementation**:

```typescript
// Enhanced ContentService methods
static async getViewableByUniverse(
  universeId: string,
  userId: string,
  options?: {
    includeNonViewable?: boolean
    sortBy?: 'created' | 'order' | 'name'
    filterByType?: string
  }
): Promise<ServiceResult<ContentItem[]>>

static async getContentTimeline(
  universeId: string,
  userId: string
): Promise<ServiceResult<TimelineContent[]>>

interface TimelineContent extends ContentItem {
  hierarchyPath: string[]
  collectionName: string
  groupName: string
}
```

**UI Components**:
- Flat content listing page
- Timeline view component  
- Advanced content search and filtering

### 5.4 Success Criteria

**Public Universe Discovery**:
- ✅ Public universes discoverable without authentication
- ✅ Search and filtering work effectively
- ✅ Privacy controls function properly
- ✅ Performance optimized for public access

**Advanced Hierarchy Views**:
- ✅ Complete hierarchy trees load efficiently
- ✅ Visual hierarchy representation is intuitive
- ✅ Navigation between hierarchy levels is seamless
- ✅ Statistics provide useful organizational insights

**Alternative Content Views**:
- ✅ Flat content views provide useful organization alternatives
- ✅ Timeline views enable chronological content consumption
- ✅ Search functionality works across entire universes
- ✅ Performance remains optimal with large content libraries

**Overall Integration**:
- ✅ All future features integrate seamlessly with existing architecture
- ✅ No performance degradation to core functionality
- ✅ Consistent UI/UX patterns across all new features
- ✅ Comprehensive testing coverage for new functionality

## Phase 6: Access Control & Security Implementation

### 6.1 Authentication & Authorization Framework

**Objective**: Implement comprehensive access control system using NextAuth.js patterns and role-based authorization.

**Security Architecture**:
- Middleware-based route protection with NextAuth.js `withAuth`
- Service-layer authorization checks for all CRUD operations
- Role-based access control (RBAC) with user roles and permissions
- Resource ownership validation across the four-tier hierarchy

### 6.2 Service-Layer Access Control Methods

**Implementation of the 4 access control methods identified as unused but critical for security:**

#### UniverseService.checkOwnership()

```typescript
static async checkOwnership(
  universeId: string, 
  userId: string
): Promise<ServiceResult<boolean>> {
  // Verify user owns the universe
  // Used by all universe operations and downstream checks
}

static async checkPublicAccess(
  universeId: string
): Promise<ServiceResult<boolean>> {
  // Check if universe is publicly accessible
  // Used for public universe discovery features
}
```

#### CollectionService.checkAccess()

```typescript  
static async checkAccess(
  collectionId: string, 
  userId: string,
  permission: 'read' | 'write' | 'delete' = 'read'
): Promise<ServiceResult<boolean>> {
  // Verify user has access to collection via universe ownership
  // Support different permission levels
}
```

#### GroupService.checkAccess()

```typescript
static async checkAccess(
  groupId: string,
  userId: string,
  permission: 'read' | 'write' | 'delete' = 'read'
): Promise<ServiceResult<boolean>> {
  // Verify access via collection → universe ownership chain
  // Handle hierarchical group relationships
}
```

#### ContentService.checkAccess()

```typescript
static async checkAccess(
  contentId: string,
  userId: string, 
  permission: 'read' | 'write' | 'delete' = 'read'
): Promise<ServiceResult<boolean>> {
  // Verify access via group → collection → universe ownership chain
  // Consider content visibility settings
}
```

### 7.3 Middleware & Route Protection

**Implementation using NextAuth.js best practices:**

```typescript
// middleware.ts enhancement
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Custom middleware logic for protected routes
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Route-specific authorization logic
        const { pathname } = req.nextUrl
        
        // Public routes
        if (pathname.startsWith('/discover')) return true
        
        // Protected routes require authentication
        if (pathname.startsWith('/dashboard')) return !!token
        if (pathname.startsWith('/universes')) return !!token
        
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/universes/:path*', '/discover/:path*']
}
```

### 7.4 Server Action Authorization

**Integration with existing server actions:**

```typescript
// Enhanced server action pattern
export async function updateUniverse(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required' }
  }
  
  const universeId = formData.get('id') as string
  
  // Access control check
  const accessCheck = await UniverseService.checkOwnership(universeId, session.user.id)
  if (!accessCheck.success) {
    return { success: false, error: 'Access denied' }
  }
  
  // Proceed with update logic...
}
```

### 7.5 Client-Side Protection Patterns

**UI component authorization:**

```typescript
// Protected component wrapper
async function UniverseActions({ universeId }: { universeId: string }) {
  const session = await auth()
  if (!session?.user?.id) return null
  
  const hasAccess = await UniverseService.checkOwnership(universeId, session.user.id)
  if (!hasAccess.success) return null
  
  return (
    <div>
      <EditButton universeId={universeId} />
      <DeleteButton universeId={universeId} />
    </div>
  )
}
```

### 7.6 Security Validation & Testing

**Comprehensive security coverage:**

- **Authentication Flow Testing**: Sign-in/out, session management, token validation
- **Authorization Testing**: Role-based access, ownership checks, permission boundaries  
- **Cross-User Access Prevention**: Ensure users cannot access others' content
- **Public/Private Content Boundaries**: Validate public universe access controls
- **API Endpoint Security**: Protect all server actions and API routes
- **Middleware Effectiveness**: Test route protection across all protected paths

### 7.7 Performance Considerations

**Efficient access control implementation:**

- **Caching Strategy**: Cache ownership/permission checks to reduce database queries
- **Batch Permission Checks**: Validate multiple resources in single queries where possible
- **Middleware Optimization**: Minimize performance impact of authorization checks
- **Database Indexing**: Ensure efficient queries for ownership verification

### 7.8 Success Criteria

**Security Implementation**:
- ✅ All 4 access control methods implemented and tested
- ✅ No unauthorized access possible across any tier of the hierarchy
- ✅ Public universe access works correctly with proper boundaries
- ✅ All server actions protected with authorization checks
- ✅ Middleware provides comprehensive route protection

**Performance & UX**:
- ✅ Authorization checks do not significantly impact response times
- ✅ Proper error handling and user feedback for access denied scenarios
- ✅ Graceful degradation for public vs authenticated user experiences

**Testing Coverage**:
- ✅ Comprehensive security test suite covering all access patterns
- ✅ Cross-user access prevention verified across all content types
- ✅ Public/private boundary testing complete
- ✅ Authentication flow edge cases handled properly

**Integration**:
- ✅ Access control integrates seamlessly with existing service architecture
- ✅ No breaking changes to existing functionality
- ✅ Consistent authorization patterns across all tiers
- ✅ Security measures documented and maintainable

- [ ] Remove 7 unused LanguageService methods as specified
- [ ] Update service exports and imports accordingly
- [ ] Run type-check to ensure no broken references

**Access Control Methods** (Now properly planned in Phase 7: Access Control & Security):
- [ ] Implement `UniverseService.checkOwnership()` - universe access control
- [ ] Implement `CollectionService.checkAccess()` - collection access control  
- [ ] Implement `GroupService.checkAccess()` - group access control
- [ ] Implement `ContentService.checkAccess()` - content access control

**Note**: Other preserved methods are now properly planned in Phase 6: Future Features Implementation

## Success Metrics

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
