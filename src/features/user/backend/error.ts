export const userErrorCodes = {
  fetchError: 'USER_FETCH_ERROR',
  notFound: 'USER_NOT_FOUND',
} as const;

export type UserServiceError =
  (typeof userErrorCodes)[keyof typeof userErrorCodes];
