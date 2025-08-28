# Headless Tree Documentation Reference

This document provides quick reference to the Headless Tree library documentation available in this project.

## Documentation Files

### Primary Documentation

- **`llms-full.txt`** - Complete Headless Tree documentation (6,459 lines)
  - Comprehensive feature documentation
  - Implementation examples
  - Best practices and performance tips
  - API reference for all features

- **`headless-tree-docs.txt`** - Table of contents and quick reference (smaller file)
  - Overview of available features
  - Quick navigation to specific topics

### Online Documentation

- **Official Docs**: [headless-tree.lukasbach.com](https://headless-tree.lukasbach.com/)
- **GitHub Repository**: [github.com/lukasbach/headless-tree](https://github.com/lukasbach/headless-tree)

## Currently Used Features

Our Tree component (`components/content/Tree.tsx`) currently uses:

- ✅ `syncDataLoaderFeature` - Synchronous data loading from PostgreSQL database
- ✅ `propMemoizationFeature` - Performance optimization for re-renders
- ✅ `selectionFeature` - Multi-select with Ctrl/Shift keys (tested and working)
- ✅ `hotkeysCoreFeature` - Keyboard navigation with arrow keys, Enter, etc. (tested and working)
- ✅ `searchFeature` - Built-in tree search with highlighting (tested and working)
- ✅ Basic expand/collapse functionality with visual feedback
- ✅ Custom styling and theming with focus/selection states
- ✅ Progress tracking integration per content item
- ✅ Favorites integration with interactive buttons
- ✅ Link navigation to content detail pages
- ✅ Parent-child hierarchy rendering with proper indentation
- ✅ React key compliance (no console warnings)

## Available Features for Future Implementation

### Medium Priority Features

- 🔄 `dragAndDropFeature` - Drag and drop reordering
- 🔄 `keyboardDragAndDropFeature` - Accessible drag and drop
- ☑️ `checkboxesFeature` - Bulk selection and operations

### Component Architecture Approach

- 📋 **ContentGrid Component** - Card display with general search filtering
- 🌳 **ContentTree Component** - Hierarchical display with tree-specific search features
- 🔀 **ContentDisplay Component** - Composition root managing view mode switching

### Advanced Features

- ⚡ `buildProxiedInstance` - Memory optimization for large trees
- 📏 Virtualization - For trees with 1000+ items
- 🎨 `renamingFeature` - Inline content renaming
- 🔄 `asyncDataLoaderFeature` - Asynchronous data loading

## Feature Implementation Examples

### Adding Selection Support

```typescript
// Add to features array in Tree.tsx
import { selectionFeature } from '@headless-tree/core'

features: [
  syncDataLoaderFeature,
  selectionFeature, // Enable multi-select
  hotkeysCoreFeature, // Enable keyboard nav
]
```

### Adding Keyboard Navigation

```typescript
// Tree component will automatically support:
// - Arrow keys for navigation
// - Enter to expand/collapse
// - Space for selection
// - Ctrl/Shift for multi-select
```

### Adding Drag & Drop

```typescript
import {
  dragAndDropFeature,
  keyboardDragAndDropFeature,
  createOnDropHandler
} from '@headless-tree/core'

// In tree configuration:
const tree = useTree({
  // ... other config
  canReorder: true,
  indent: 20,
  onDrop: createOnDropHandler((item, newChildren) => {
    // Update your data source
    // Call server action to persist changes
  }),
  features: [
    syncDataLoaderFeature,
    selectionFeature,
    hotkeysCoreFeature,
    dragAndDropFeature,
    keyboardDragAndDropFeature,
  ],
})

// In render:
<div style={tree.getDragLineStyle()} className="dragline" />
```

## Performance Considerations

### For Large Trees (500+ items)

- Add `propMemoizationFeature`
- Consider `buildProxiedInstance`
- Implement virtualization with libraries like `@tanstack/react-virtual`

### Memory Optimization

```typescript
import { buildProxiedInstance } from '@headless-tree/core'

const tree = useTree({
  // ... other config
  instanceBuilder: buildProxiedInstance, // Reduces memory usage
})
```

## Component Composition Best Practices

### Search Interface Patterns

**✅ Recommended**: Separate components for different display modes with specialized search implementations.

```typescript
// ContentDisplay.tsx - Composition root
function ContentDisplay({ content, viewMode }) {
  return (
    <div>
      {viewMode === 'grid' ? (
        <ContentGrid content={content} />
      ) : (
        <ContentTree content={content} />
      )}
    </div>
  );
}

// ContentGrid.tsx - Cards with general search
function ContentGrid({ content }) {
  const [searchText, setSearchText] = useState('');
  const filteredContent = filterContent(content, searchText);

  return (
    <>
      <SearchInput value={searchText} onChange={setSearchText} />
      <GridView content={filteredContent} />
    </>
  );
}

// ContentTree.tsx - Tree with headless-tree search
function ContentTree({ content }) {
  const tree = useTree({
    features: [
      syncDataLoaderFeature,
      searchFeature,    // Built-in tree search with highlighting
      selectionFeature,
      hotkeysCoreFeature,
    ],
  });

  return <TreeView tree={tree} />;
}
```

### Why This Pattern Works

**React Best Practices Alignment:**

- **Component Composition** - Following React's composition over inheritance principle
- **Single Responsibility** - Each component has one clear purpose
- **Specialized Search** - Grid uses general filtering, Tree uses hierarchical search
- **Performance** - Each search implementation optimized for its display type

**Benefits:**

- ✅ Maintainable: Changes to grid don't affect tree
- ✅ Reusable: Components work independently
- ✅ User Experience: Tree search highlights within hierarchy
- ✅ Feature Independence: Enhance each component separately

### Built-in Tree Search Implementation

```typescript
// Add searchFeature for tree-specific search capabilities
import { searchFeature } from '@headless-tree/core'

const tree = useTree({
  features: [
    syncDataLoaderFeature,
    searchFeature, // Enables tree search
    selectionFeature,
    hotkeysCoreFeature,
  ],
})

// Access search state and results
const searchResults = tree.getSearchResults()
const hasActiveSearch = tree.hasActiveSearch()
const searchQuery = tree.getSearchQuery()

// Search automatically highlights matches in tree rendering
```

## Accessibility Features

Headless Tree provides excellent accessibility support:

- ARIA attributes automatically applied
- Keyboard navigation built-in
- Screen reader support
- Focus management
- High contrast support

## Integration with CanonCore

### Content Management Integration

- Tree integrates with content service
- Progress tracking per user
- Favorites integration
- Universe-specific content trees

### State Management

- Works with Zustand stores
- Server state from Next.js Server Components
- Optimistic updates for better UX

## Testing Progress & Results

### ✅ Completed Testing (August 2025)

**Core Integration Tests:**

- **Database Hierarchy Loading**: ✅ syncDataLoaderFeature successfully loads PostgreSQL data via Drizzle ORM
- **Parent-Child Relationships**: ✅ "Phase one" → "The Original Series" hierarchy renders with proper indentation
- **Expand/Collapse**: ✅ Interactive chevron arrows with smooth state transitions
- **Progress Tracking**: ✅ Individual progress bars display accurate percentages per content item
- **Favorites Integration**: ✅ Interactive heart buttons integrated with Zustand store
- **Link Navigation**: ✅ Clicking tree items navigates to correct `/content/[id]` routes
- **React Compliance**: ✅ All key warnings resolved with proper unique keys
- **Performance**: ✅ propMemoizationFeature prevents unnecessary re-renders
- **Visual Feedback**: ✅ Focus/selected states working with custom CSS styling

**Real Content Test Data:**

- Universe: "Star Trek Universe"
- Parent: "Phase one" (organizational content)
- Child: "The Original Series" (organizational content with description)
- Database: 2 content items, 1 parent-child relationship verified via scan-db

### ✅ Completed User Interaction Testing

**User Interaction Features (Tested and Working):**

- **Selection**: Multi-select via Ctrl+click, Shift+click range selection ✅
- **Keyboard Navigation**: Arrow keys, Enter, Space, Tab navigation ✅
- **Search**: Built-in filtering with highlighting ✅

### 🚨 Known Issues

**Content Page Integration Issue:**

- **Problem**: React key warnings occur when adding content via individual content detail pages (`/content/[id]`)
- **Root Cause**: Content creation workflow from content pages creates key conflicts (not from universe tree)
- **Status**: Universe-level tree works perfectly; issue isolated to content detail page navigation
- **Priority**: Medium - affects content creation UX but doesn't break core functionality
- **Solution**: Implement proper state management for content detail page tree instances

## Development Workflow

1. **Read Documentation**: Reference `llms-full.txt` for specific features
2. **Test Features**: Use local development environment with real content data
3. **Check Accessibility**: Test keyboard navigation and screen readers
4. **Performance Test**: Monitor with large content trees (500+ items)
5. **Server Integration**: Update server actions for data persistence

## Troubleshooting

### Common Issues

- **Expansion arrows not working**: Check event propagation (`e.stopPropagation()`)
- **Performance issues**: Add `propMemoizationFeature`
- **Keyboard nav not working**: Ensure `hotkeysCoreFeature` is included
- **Drag & drop issues**: Verify `indent` is set and `onDrop` handler is implemented

### Debugging

- Use browser dev tools to inspect tree state
- Check console for Headless Tree warnings
- Verify feature order in configuration array

## References

For detailed implementation examples and advanced usage, see:

- `llms-full.txt` - Lines 1-6459 for complete documentation
- Official demos: [headless-tree.lukasbach.com/demos](https://headless-tree.lukasbach.com/demos)
- Storybook examples in the documentation
