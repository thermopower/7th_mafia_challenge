import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AppEnv } from '@/backend/hono/context'
import {
  getAnalysisDetail,
  getRelatedAnalyses,
  deleteAnalysis,
  getAnalysesList,
  deleteAnalysisById
} from './service'
import { respond, failure } from '@/backend/http/response'
import { AnalysisListQuerySchema, DeleteAnalysisParamsSchema } from './schema'

export function registerAnalysisRoutes(app: Hono<AppEnv>) {
  // 대시보드: 목록 조회
  app.get('/api/analysis/list', async (c) => {
    const userId = c.get('userId') // Clerk 인증 미들웨어에서 주입

    if (!userId) {
      return c.json({ error: { message: '인증이 필요합니다' } }, 401);
    }

    const query = c.req.query()

    const parsedQuery = AnalysisListQuerySchema.safeParse(query)
    if (!parsedQuery.success) {
      return respond(
        c,
        failure(400, 'INVALID_QUERY', 'Invalid query parameters', parsedQuery.error.format())
      )
    }

    const supabase = c.get('supabase')
    const result = await getAnalysesList(supabase, userId, parsedQuery.data)

    return respond(c, result)
  })

  // 분석 상세 조회
  app.get('/api/analysis/:id', async (c) => {
    const { id } = c.req.param()
    const userId = c.get('userId') // Clerk 인증 미들웨어에서 주입

    if (!userId) {
      return c.json({ error: { message: '인증이 필요합니다' } }, 401);
    }

    const result = await getAnalysisDetail(c.get('supabase'), userId, id)
    return respond(c, result)
  })

  // 관련 분석 조회
  app.get(
    '/api/analysis/:id/related',
    zValidator('query', z.object({
      limit: z.string().optional().default('3'),
    })),
    async (c) => {
      const { id } = c.req.param()
      const { limit } = c.req.valid('query')
      const userId = c.get('userId')

      if (!userId) {
        return c.json({ error: { message: '인증이 필요합니다' } }, 401);
      }

      const result = await getRelatedAnalyses(
        c.get('supabase'),
        userId,
        id,
        parseInt(limit, 10)
      )
      return respond(c, result)
    }
  )

  // 분석 삭제 (대시보드용 - 타입 안전)
  app.delete('/api/analysis/:id', async (c) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: { message: '인증이 필요합니다' } }, 401);
    }

    const parsedParams = DeleteAnalysisParamsSchema.safeParse({
      id: c.req.param('id'),
    })

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, 'INVALID_PARAMS', 'Invalid analysis ID', parsedParams.error.format())
      )
    }

    const supabase = c.get('supabase')
    const result = await deleteAnalysisById(supabase, userId, parsedParams.data.id)

    return respond(c, result)
  })
}
