import { z } from 'zod';

// ===== 요청 스키마 =====

export const AnalysisListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  analysisType: z.enum(['monthly', 'yearly', 'lifetime']).optional(),
  sortBy: z.enum(['created_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type AnalysisListQuery = z.infer<typeof AnalysisListQuerySchema>;

// ===== 응답 스키마 =====

export const AnalysisListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  analysisType: z.enum(['monthly', 'yearly', 'lifetime']),
  modelUsed: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']),
  createdAt: z.string(),
});

export const AnalysisListResponseSchema = z.object({
  analyses: z.array(AnalysisListItemSchema),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type AnalysisListItem = z.infer<typeof AnalysisListItemSchema>;
export type AnalysisListResponse = z.infer<typeof AnalysisListResponseSchema>;

// ===== 분석 상세 조회 응답 =====

export const AnalysisDetailResponseSchema = z.object({
  analysis: z.object({
    id: z.string(),
    name: z.string(),
    gender: z.enum(['male', 'female']),
    birthDate: z.string(),
    birthTime: z.string().nullable(),
    isLunar: z.boolean(),
    analysisType: z.enum(['monthly', 'yearly', 'lifetime']),
    modelUsed: z.string(),
    createdAt: z.string(),
  }),
  result: z.object({
    general: z.string(),
    wealth: z.string(),
    love: z.string(),
    health: z.string(),
    job: z.string(),
  }),
});

export type AnalysisDetailResponse = z.infer<typeof AnalysisDetailResponseSchema>;

// ===== 관련 분석 조회 응답 =====

export const RelatedAnalysesResponseSchema = z.object({
  analyses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      analysisType: z.enum(['monthly', 'yearly', 'lifetime']),
      modelUsed: z.string(),
      createdAt: z.string(),
    })
  ),
});

export type RelatedAnalysesResponse = z.infer<typeof RelatedAnalysesResponseSchema>;

// ===== 삭제 요청 =====

export const DeleteAnalysisParamsSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteAnalysisParams = z.infer<typeof DeleteAnalysisParamsSchema>;
