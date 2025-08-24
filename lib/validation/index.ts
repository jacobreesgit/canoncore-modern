/**
 * Validation exports
 */

// Schemas
export {
  emailSchema,
  passwordSchema,
  nameSchema,
  urlSchema,
  descriptionSchema,
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  changePasswordSchema,
  universeSchema,
  universeUpdateSchema,
  contentSchema,
  contentUpdateSchema,
  progressUpdateSchema,
  searchSchema,
  contactSchema,
  fileUploadSchema,
  bulkDeleteSchema,
} from './schemas'

// Types
export type {
  UserRegistration,
  UserLogin,
  UserProfileUpdate,
  ChangePassword,
  Universe,
  UniverseUpdate,
  Content,
  ContentUpdate,
  ProgressUpdate,
  Search,
  Contact,
  FileUpload,
  BulkDelete,
} from './schemas'

// Validation utilities
export {
  validateFormData,
  validateFormDataObject,
  validateField,
  useFormValidation,
  withValidation,
  validateAsync,
  getFirstError,
} from './form-validation'

export type { ValidationResult } from './form-validation'
