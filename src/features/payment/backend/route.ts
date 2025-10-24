/**
 * 결제 관련 Hono Routes
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/backend/hono/context'
import { confirmPaymentSchema } from './schema'
import { confirmPaymentService } from './service'
import { success, failure, respond } from '@/backend/http/response'
import { PaymentError } from './error'

export const paymentRoutes = new Hono<AppEnv>()

/**
 * POST /api/payments/confirm
 * 결제 승인 처리
 */
paymentRoutes.post(
  '/api/payments/confirm',
  zValidator('json', confirmPaymentSchema),
  async (c) => {
    try {
      const body = c.req.valid('json')
      const supabase = c.get('supabase')
      const logger = c.get('logger')

      // Clerk 사용자 ID 가져오기
      // TODO: Clerk 인증 미들웨어에서 주입되어야 함
      // 임시로 body.customerKey를 userId로 사용
      const userId = body.customerKey

      if (!userId) {
        return respond(
          c,
          failure(401, 'UNAUTHORIZED', '인증되지 않은 사용자입니다')
        )
      }

      logger.info('결제 승인 시작', { userId, orderId: body.orderId })

      const result = await confirmPaymentService({
        supabase,
        logger,
        userId,
        authKey: body.authKey,
        customerKey: body.customerKey,
        orderId: body.orderId,
      })

      logger.info('결제 승인 완료', { userId, orderId: body.orderId })

      return respond(c, success(result, 200))
    } catch (error: unknown) {
      const logger = c.get('logger')

      if (error instanceof PaymentError) {
        logger.error('결제 승인 실패 (PaymentError)', {
          code: error.code,
          message: error.message,
        })

        return respond(c, failure(400, error.code, error.message))
      }

      logger.error('결제 승인 실패 (Unknown)', {
        error: error instanceof Error ? error.message : String(error),
      })

      return respond(
        c,
        failure(
          500,
          'PAYMENT_CONFIRMATION_FAILED',
          error instanceof Error ? error.message : '결제 승인에 실패했습니다'
        )
      )
    }
  }
)

/**
 * 라우트 등록 헬퍼
 */
export const registerPaymentRoutes = (app: Hono<AppEnv>) => {
  app.route('/', paymentRoutes)
}
