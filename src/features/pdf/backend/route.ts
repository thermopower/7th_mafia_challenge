import { Hono } from 'hono'
import type { AppEnv } from '@/backend/hono/context'
import { generateAnalysisPDF } from './service'
import { respond } from '@/backend/http/response'

export function registerPDFRoutes(app: Hono<AppEnv>) {
  // PDF 생성
  app.post('/api/analysis/:id/pdf', async (c) => {
    const { id } = c.req.param()
    const tempUserId = 'temp-user-id' // TODO: Clerk 미들웨어로 대체

    const result = await generateAnalysisPDF(c.get('supabase'), tempUserId, id)

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
