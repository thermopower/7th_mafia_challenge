/**
 * 결제 관련 DTO 재노출
 * Backend 스키마를 프론트엔드에서 재사용
 */

export type {
  ConfirmPaymentInput,
  ConfirmPaymentResponse,
} from '../backend/schema'

export { confirmPaymentResponseSchema } from '../backend/schema'
