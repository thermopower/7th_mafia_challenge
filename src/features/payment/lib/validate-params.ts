/**
 * 결제 성공 페이지 쿼리 파라미터 검증
 */

import { z } from 'zod'

export const paymentSuccessParamsSchema = z.object({
  authKey: z.string().min(1, 'authKey가 필요합니다'),
  customerKey: z.string().min(1, 'customerKey가 필요합니다'),
  orderId: z.string().min(1, 'orderId가 필요합니다'),
})

export type PaymentSuccessParams = z.infer<typeof paymentSuccessParamsSchema>

export function validatePaymentSuccessParams(
  params: Record<string, string | null>
): PaymentSuccessParams {
  return paymentSuccessParamsSchema.parse({
    authKey: params.authKey,
    customerKey: params.customerKey,
    orderId: params.orderId,
  })
}
