import { Hono } from 'hono'
import type { AppEnv } from '@/backend/hono/context'
import { generateAnalysisPDF } from './service'
import { respond } from '@/backend/http/response'

export function registerPDFRoutes(app: Hono<AppEnv>) {
  // PDF 생성
  app.post('/api/analysis/:id/pdf', async (c) => {
    const { id } = c.req.param()
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

    const result = await generateAnalysisPDF(supabase, user.id, id)

    if (!result.ok) {
      return respond(c, result)
    }

    // PDF Blob 반환
    return new Response(result.data.pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="analysis-${id}.pdf"`,
      },
    })
  })
}
