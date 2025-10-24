/**
 * 분석 관련 Hono 라우터
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analysisCreateSchema } from './schema'
import { createAnalysisService, getUserQuotaService } from './service'
import { withAuth, getUserId } from '@/backend/middleware/auth'
import type { AppEnv } from '@/backend/hono/context'
import { ERROR_CODES } from './error'

export const analyzeRoutes = new Hono<AppEnv>()

/**
 * 잔여 횟수 조회
 * GET /api/user/quota
 */
analyzeRoutes.get('/user/quota', withAuth(), async (c) => {
  const supabase = c.get('supabase')
  const logger = c.get('logger')
  const userId = getUserId(c)

  try {
    const quota = await getUserQuotaService(supabase, userId)
    return c.json(quota)
  } catch (error: any) {
    logger.error('Failed to fetch user quota', error)
    return c.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || '잔여 횟수 조회에 실패했습니다',
        },
      },
      500
    )
  }
})

/**
 * 분석 생성
 * POST /api/analysis/create
 */
analyzeRoutes.post('/analysis/create', withAuth(), zValidator('json', analysisCreateSchema), async (c) => {
  const supabase = c.get('supabase')
  const logger = c.get('logger')
  const config = c.get('config')
  const userId = getUserId(c)

  const input = c.req.valid('json')

  try {
    const analysisId = await createAnalysisService(supabase, logger, config, userId, input)
    return c.json({ id: analysisId }, 201)
  } catch (error: any) {
    logger.error('Failed to create analysis', error)

    if (error.code === ERROR_CODES.INSUFFICIENT_QUOTA) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        400
      )
    }

    if (error.code === ERROR_CODES.AI_API_ERROR) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        503
      )
    }

    if (error.code === ERROR_CODES.INVALID_LUNAR_DATE) {
      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        400
      )
    }

    return c.json(
      {
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: '분석 생성에 실패했습니다',
        },
      },
      500
    )
  }
})

/**
 * Hono 앱에 라우터 등록
 */
export const registerAnalyzeRoutes = (app: Hono<AppEnv>) => {
  app.route('/api', analyzeRoutes)
}
