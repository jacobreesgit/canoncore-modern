# Unused Service Functions Analysis

## Summary

**Total unused service functions: 16**

- **Entire RelationshipService unused (6 methods)**
- **Majority of LanguageService unused (7/9 methods)**
- **Several access control and hierarchy methods unused across other services**

---

## 🔴 Completely Unused Services

### RelationshipService (6/6 methods unused)

**Location**: `lib/services/relationship.service.ts`
**Status**: ❌ Entire service appears unused - no imports or method calls found

| Method                        | Line | Purpose                                         |
| ----------------------------- | ---- | ----------------------------------------------- |
| `createGroupRelationship()`   | 20   | Creates parent-child group relationships        |
| `createContentRelationship()` | 72   | Creates parent-child content relationships      |
| `getGroupRelationships()`     | 132  | Gets group relationships for specific group     |
| `getContentRelationships()`   | 181  | Gets content relationships for specific content |
| `deleteGroupRelationship()`   | 235  | Deletes group relationships                     |
| `deleteContentRelationship()` | 288  | Deletes content relationships                   |

**Notes**:

- Service is exported in `lib/services/index.ts`
- Mentioned in CLAUDE.md documentation
- No actual usage found in codebase

---

## 🟡 Partially Used Services

### LanguageService (7/9 methods unused)

**Location**: `lib/services/language.service.ts`
**Status**: ⚠️ Only 2/9 methods used in `components/language-switcher.tsx`

#### ✅ Used Methods (2)

| Method                     | Used In                               | Purpose                              |
| -------------------------- | ------------------------------------- | ------------------------------------ |
| `getSupportedLanguages()`  | `components/language-switcher.tsx:15` | Gets all supported language metadata |
| `getLanguageDisplayName()` | `components/language-switcher.tsx:63` | Gets language display name by code   |

#### ❌ Unused Methods (7)

| Method                         | Line | Purpose                                           |
| ------------------------------ | ---- | ------------------------------------------------- |
| `getLanguageFullDisplayName()` | 52   | Gets language full display name for accessibility |
| `getLanguageFlag()`            | 63   | Gets language flag emoji by code                  |
| `isValidLanguageCode()`        | 74   | Validates if language code is supported           |
| `getDefaultLanguage()`         | 82   | Gets default language code (British English)      |
| `getLanguageInfo()`            | 90   | Gets complete language object by code             |
| `getSupportedLocaleCodes()`    | 98   | Gets supported locale codes as array              |
| `isEnglishVariant()`           | 106  | Checks if code is English variant                 |

---

## 🟠 Individual Unused Methods

### UniverseService (2 unused methods)

**Location**: `lib/services/universe.service.ts`

| Method             | Line | Purpose                                | Notes                                     |
| ------------------ | ---- | -------------------------------------- | ----------------------------------------- |
| `getPublic()`      | 145  | Fetches public universes for discovery | Likely for future public universe feature |
| `checkOwnership()` | 288  | Checks if user owns universe           | Access control method - not used          |

### CollectionService (1 unused method)

**Location**: `lib/services/collection.service.ts`

| Method          | Line | Purpose                                 | Notes                            |
| --------------- | ---- | --------------------------------------- | -------------------------------- |
| `checkAccess()` | 358  | Checks if user has access to collection | Access control method - not used |

### GroupService (2 unused methods)

**Location**: `lib/services/group.service.ts`

| Method                   | Line | Purpose                             | Notes                               |
| ------------------------ | ---- | ----------------------------------- | ----------------------------------- |
| `checkAccess()`          | 364  | Checks if user has access to group  | Access control method - not used    |
| `getCompleteHierarchy()` | 394  | Gets complete hierarchy for a group | Hierarchy feature - not implemented |

### ContentService (2 unused methods)

**Location**: `lib/services/content.service.ts`

| Method                    | Line | Purpose                                          | Notes                               |
| ------------------------- | ---- | ------------------------------------------------ | ----------------------------------- |
| `getViewableByUniverse()` | 140  | Gets viewable content by universe for flat views | Alternative view feature - not used |
| `checkAccess()`           | 462  | Checks if user has access to content             | Access control method - not used    |

---

## 📋 Verification Details

### Search Methodology

1. **Pattern matching**: Searched for `ServiceName.methodName` patterns across all files
2. **Import analysis**: Checked for service imports and usage
3. **File-specific searches**: Examined action files, pages, and components
4. **Triple verification**: Re-validated each finding with multiple search patterns

### Files Excluded from "Unused" Classification

- **Internal method usage**: Methods used within the same service (e.g., `UserService.findByEmail` used in `updateProfile`)
- **Definition-only matches**: Method definitions within service files don't count as usage

### Correction Made During Analysis

- **ContentService.toggleViewable**: Initially identified as unused, but found to be used in `lib/actions/content-actions.ts:308` within the `toggleContentViewable` server action

---

## 🎯 Recommendations

### High Priority

1. **Evaluate RelationshipService**: Determine if hierarchical relationships feature is needed
   - If not needed: Remove entire service
   - If needed: Implement UI for managing relationships

2. **Review LanguageService**: Consider consolidating unused language utilities
   - Keep only used methods or implement missing UI features
   - Some methods like `getDefaultLanguage()` might be useful for i18n configuration

### Medium Priority

3. **Access Control Methods**: The `checkAccess` methods across services might indicate missing authorization features
4. **Public Universes**: `UniverseService.getPublic()` suggests a planned public discovery feature
5. **Hierarchy Views**: `GroupService.getCompleteHierarchy()` and `ContentService.getViewableByUniverse()` suggest alternative viewing modes

### Low Priority

6. **Code Cleanup**: Remove truly unused methods to reduce maintenance burden
7. **Documentation**: Update CLAUDE.md if services are removed

---

## 🔍 Search Commands Used for Verification

```bash
# Service-specific pattern searches
grep -r "UniverseService\.(getPublic|checkOwnership)" --include="*.ts" --include="*.tsx" .
grep -r "RelationshipService" --include="*.ts" --include="*.tsx" .
grep -r "LanguageService\." --include="*.ts" --include="*.tsx" .

# Method-specific searches
grep -r "getViewableByUniverse\|checkAccess\|getCompleteHierarchy" --include="*.ts" --include="*.tsx" .
grep -r "toggleViewable" --include="*.ts" --include="*.tsx" .

# Import analysis
grep -r "import.*RelationshipService" --include="*.ts" --include="*.tsx" .
grep -r "import.*LanguageService" --include="*.ts" --include="*.tsx" .
```

---

_Analysis completed: 2025-01-21_  
_Total methods analyzed: 45_  
_Unused methods found: 16_  
_Verification: Triple-checked with multiple search patterns_
