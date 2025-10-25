export const profileErrorCodes = {
  fetchError: 'PROFILE_FETCH_ERROR',
  notFound: 'PROFILE_NOT_FOUND',
  validationError: 'PROFILE_VALIDATION_ERROR',
  createError: 'PROFILE_CREATE_ERROR',
  updateError: 'PROFILE_UPDATE_ERROR',
  deleteError: 'PROFILE_DELETE_ERROR',
  unauthorized: 'PROFILE_UNAUTHORIZED',
  limitExceeded: 'PROFILE_LIMIT_EXCEEDED',
  duplicateProfile: 'PROFILE_DUPLICATE',
} as const;

export type ProfileServiceError = (typeof profileErrorCodes)[keyof typeof profileErrorCodes];
