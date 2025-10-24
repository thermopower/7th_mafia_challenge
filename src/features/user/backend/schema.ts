import { z } from 'zod';

// ===== 사용자 구독 정보 응답 스키마 =====

export const UserQuotaResponseSchema = z.object({
  plan: z.enum(['free', 'pro', 'pending_cancel']),
  remainingAnalyses: z.number().int(),
});

export type UserQuotaResponse = z.infer<typeof UserQuotaResponseSchema>;
