import { z } from 'zod'

/**
 * 공유 링크 생성 응답 스키마
 */
export const createShareLinkResponseSchema = z.object({
  shareUrl: z.string(),
  token: z.string(),
})

export type CreateShareLinkResponse = z.infer<typeof createShareLinkResponseSchema>
