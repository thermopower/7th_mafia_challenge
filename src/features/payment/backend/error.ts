/**
 * 결제 관련 에러 코드 및 에러 클래스
 */

export const PAYMENT_ERROR_CODES = {
  BILLING_KEY_ISSUE_FAILED: 'BILLING_KEY_ISSUE_FAILED',
  FIRST_PAYMENT_FAILED: 'FIRST_PAYMENT_FAILED',
  DB_UPDATE_FAILED: 'DB_UPDATE_FAILED',
  DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const

export type PaymentErrorCode = keyof typeof PAYMENT_ERROR_CODES

export class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}
