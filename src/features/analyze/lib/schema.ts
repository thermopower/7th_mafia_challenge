/**
 * 클라이언트 측 폼 검증 스키마
 */

import { z } from 'zod'

/**
 * 분석 입력 폼 스키마
 */
export const analysisInputSchema = z.object({
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

export type AnalysisInput = z.infer<typeof analysisInputSchema>
