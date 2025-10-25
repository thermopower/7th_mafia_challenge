import type { SupabaseClient } from '@supabase/supabase-js'
import { success, failure } from '@/backend/http/response'
import { SHARE_ERRORS } from './error'

export async function createShareToken(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string
) {
  // 분석 소유권 확인
  const { data: analysis } = await supabase
    .from('user_analyses')
    .select('id')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (!analysis) {
    return failure(404, SHARE_ERRORS.ANALYSIS_NOT_FOUND, 'Analysis not found')
  }

  // UUID 기반 토큰 생성
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7일 후 만료

  const { error } = await supabase.from('share_tokens').insert({
    analysis_id: analysisId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    return failure(500, SHARE_ERRORS.DATABASE_ERROR, 'Failed to create share token')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const shareUrl = `${baseUrl}/share/${token}`

  return success({ shareUrl, token })
}
