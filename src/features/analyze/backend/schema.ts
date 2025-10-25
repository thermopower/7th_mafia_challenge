import { z } from 'zod'

/**
 * 새 분석 생성 요청 스키마
 */
export const analysisCreateSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이내로 입력해주세요'),
  gender: z.enum(['male', 'female'], { required_error: '성별을 선택해주세요' }),
  birthDate: z.string().min(1, '생년월일을 입력해주세요'),
  birthTime: z.string().optional(),
  isLunar: z.boolean().default(false),
  analysisType: z.enum(['monthly', 'yearly', 'lifetime'], {
    required_error: '분석 종류를 선택해주세요',
  }),
  saveAsProfile: z.boolean().default(false),
})

export type AnalysisCreateInput = z.infer<typeof analysisCreateSchema>

/**
 * 분석 생성 응답 스키마
 */
export const analysisResponseSchema = z.object({
  id: z.string().uuid(),
})

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>

/**
 * 분석 상세 조회 응답 스키마
 */
export const analysisDetailResponseSchema = z.object({
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
})

export type AnalysisDetailResponse = z.infer<typeof analysisDetailResponseSchema>

/**
 * 관련 분석 조회 응답 스키마
 */
export const relatedAnalysesResponseSchema = z.object({
  analyses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      analysisType: z.enum(['monthly', 'yearly', 'lifetime']),
      modelUsed: z.string(),
      createdAt: z.string(),
    })
  ),
})

export type RelatedAnalysesResponse = z.infer<typeof relatedAnalysesResponseSchema>
