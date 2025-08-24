import { lazy } from 'react'

/**
 * Lazily loaded components for code splitting and performance optimization
 */

// Profile components - loaded only when user accesses profile pages
export const LazyProfileEditForm = lazy(() =>
  import('@/components/profile/ProfileEditForm').then(module => ({
    default: module.ProfileEditForm,
  }))
)

export const LazyProfileDisplay = lazy(() =>
  import('@/components/profile/ProfileDisplay').then(module => ({
    default: module.ProfileDisplay,
  }))
)

// Content components - heavy components loaded on demand
export const LazyUniverseCard = lazy(() =>
  import('@/components/content/UniverseCard').then(module => ({
    default: module.UniverseCard,
  }))
)

// Interactive components
export const LazySearchBar = lazy(() =>
  import('@/components/interactive/SearchBar').then(module => ({
    default: module.SearchBar,
  }))
)

// Form components - loaded when forms are needed
export const LazyFormComponents = {
  FormInput: lazy(() =>
    import('@/components/forms/FormInput').then(module => ({
      default: module.FormInput,
    }))
  ),
  FormTextarea: lazy(() =>
    import('@/components/forms/FormTextarea').then(module => ({
      default: module.FormTextarea,
    }))
  ),
  FormSelect: lazy(() =>
    import('@/components/forms/FormSelect').then(module => ({
      default: module.FormSelect,
    }))
  ),
  FormURLInput: lazy(() =>
    import('@/components/forms/FormURLInput').then(module => ({
      default: module.FormURLInput,
    }))
  ),
}
