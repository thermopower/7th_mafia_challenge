import { Hono } from 'hono'
import type { AppEnv } from '@/backend/hono/context'
import { createShareToken } from './service'
import { respond } from '@/backend/http/response'

export function registerShareRoutes(app: Hono<AppEnv>) {
  // 공유 링크 생성
  app.post('/api/share/:analysisId', async (c) => {
    const { analysisId } = c.req.param()
    const tempUserId = 'temp-user-id' // TODO: Clerk 미들웨어로 대체

    const result = await createShareToken(
      c.get('supabase'),
      tempUserId,
      analysisId
    )
    return respond(c, result)
  })
}
