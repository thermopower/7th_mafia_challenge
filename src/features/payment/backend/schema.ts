/**
 * 결제 관련 Zod 스키마
 * 요청/응답 검증을 위한 타입 정의
 */

import { z } from 'zod'

/**
 * 결제 승인 요청 스키마
 */
export const confirmPaymentSchema = z.object({
  authKey: z.string().min(1, 'authKey가 필요합니다'),
  customerKey: z.string().min(1, 'customerKey가 필요합니다'),
  orderId: z.string().min(1, 'orderId가 필요합니다'),
})

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>

/**
 * 결제 승인 응답 스키마
 */
export const confirmPaymentResponseSchema = z.object({
  success: z.boolean(),
  subscriptionTier: z.enum(['free', 'pro', 'pending_cancel']),
  remainingAnalyses: z.number(),
  nextBillingDate: z.string(),
})

export type ConfirmPaymentResponse = z.infer<typeof confirmPaymentResponseSchema>
