export const subscriptionErrorCodes = {
  fetchError: 'SUBSCRIPTION_FETCH_ERROR',
  notFound: 'SUBSCRIPTION_NOT_FOUND',
  validationError: 'SUBSCRIPTION_VALIDATION_ERROR',
  alreadyCanceled: 'SUBSCRIPTION_ALREADY_CANCELED',
  alreadyActive: 'SUBSCRIPTION_ALREADY_ACTIVE',
  cannotReactivateExpired: 'SUBSCRIPTION_CANNOT_REACTIVATE_EXPIRED',
  updateError: 'SUBSCRIPTION_UPDATE_ERROR',
} as const;

export type SubscriptionErrorCode = typeof subscriptionErrorCodes[keyof typeof subscriptionErrorCodes];

export type SubscriptionServiceError = {
  code: SubscriptionErrorCode;
  message: string;
};
