/**
 * 분석 관련 Hono 라우터
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { analysisCreateSchema } from './schema'
import { createAnalysisService } from './service'
import type { AppEnv } from '@/backend/hono/context'
import { ERROR_CODES } from './error'

export const analyzeRoutes = new Hono<AppEnv>()

// NOTE: /user/quota 라우트는 src/features/user/backend/route.ts 로 이동되었습니다
// Clerk 인증을 사용하는 통합 엔드포인트를 사용하세요

/**
 * 분석 생성
 * POST /api/analysis/create
 */
analyzeRoutes.post('/analysis/create', zValidator('json', analysisCreateSchema), async (c) => {
  const supabase = c.get('supabase')
  const logger = c.get('logger')
  const config = c.get('config')
  const userId = c.get('userId') // Clerk 인증 미들웨어에서 주입

  if (!userId) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다',
        },
      },
      401
    )
  }

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
