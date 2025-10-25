import { Hono } from 'hono'
import type { AppEnv } from '@/backend/hono/context'
import { createShareToken } from './service'
import { respond } from '@/backend/http/response'

export function registerShareRoutes(app: Hono<AppEnv>) {
  // 공유 링크 생성
  app.post('/api/share/:analysisId', async (c) => {
    const { analysisId } = c.req.param()
    const userId = c.get('userId') // Clerk 인증 미들웨어에서 주입
    const supabase = c.get('supabase')

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

    // clerk_id로 UUID user_id 조회
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return c.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다',
          },
        },
        404
      )
    }

    const result = await createShareToken(supabase, user.id, analysisId)
    return respond(c, result)
  })
}
