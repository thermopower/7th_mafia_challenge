/**
 * Google Gemini AI 클라이언트
 * Gemini API 초기화 및 구조화 출력 호출
 */

import { GoogleGenAI, Type } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

/**
 * AI 분석 결과 타입
 */
export type AnalysisResult = {
  general: string // 총운
  wealth: string // 재물운
  love: string // 애정운
  health: string // 건강운
  job: string // 직업운
}

/**
 * AI 분석 결과 JSON 스키마
 */
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    general: {
      type: Type.STRING,
      description: '총운 (200자 이상)',
    },
    wealth: {
      type: Type.STRING,
      description: '재물운 (200자 이상)',
    },
    love: {
      type: Type.STRING,
      description: '애정운 (200자 이상)',
    },
    health: {
      type: Type.STRING,
      description: '건강운 (200자 이상)',
    },
    job: {
      type: Type.STRING,
      description: '직업운 (200자 이상)',
    },
  },
  required: ['general', 'wealth', 'love', 'health', 'job'],
  propertyOrdering: ['general', 'wealth', 'love', 'health', 'job'],
}

/**
 * AI 분석 생성 함수
 * @param prompt - 분석 프롬프트
 * @param model - 사용할 AI 모델 (기본값: gemini-2.5-flash)
 * @returns 구조화된 분석 결과
 */
export const generateAnalysis = async (
  prompt: string,
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' = 'gemini-2.5-flash'
): Promise<AnalysisResult> => {
  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: analysisSchema,
    },
  })

  return JSON.parse(res.text)
}
