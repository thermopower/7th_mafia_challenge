/**
 * AI 프롬프트 템플릿
 * 분석 종류별 구조화된 프롬프트 생성
 */

import type { SajuData, AnalysisType } from '@/types'

/**
 * 분석 종류 레이블
 */
const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  monthly: '월간 운세',
  yearly: '신년 운세',
  lifetime: '평생 운세',
}

/**
 * AI 분석 프롬프트 생성
 *
 * @param name - 대상 이름
 * @param gender - 성별
 * @param sajuData - 사주팔자 데이터
 * @param analysisType - 분석 종류
 * @returns 구조화된 프롬프트
 */
export const createAnalysisPrompt = (
  name: string,
  gender: 'male' | 'female',
  sajuData: SajuData,
  analysisType: AnalysisType
): string => {
  const genderLabel = gender === 'male' ? '남성' : '여성'
  const typeLabel = ANALYSIS_TYPE_LABELS[analysisType]

  return `
당신은 전문 사주 명리학자입니다. 아래 사주 데이터를 바탕으로 ${typeLabel}를 분석해주세요.

**대상 정보**
- 이름: ${name}
- 성별: ${genderLabel}

**사주팔자**
- 년주: ${sajuData.year.cheongan}${sajuData.year.jiji}
- 월주: ${sajuData.month.cheongan}${sajuData.month.jiji}
- 일주: ${sajuData.day.cheongan}${sajuData.day.jiji}
- 시주: ${sajuData.hour.cheongan}${sajuData.hour.jiji}

**십신**: ${sajuData.sipsin.join(', ')}
**대운**: ${sajuData.daeun.join(', ')}

**요청 사항**
각 항목을 200자 이상 한국어로 작성하세요. 구체적이고 긍정적인 조언을 포함하며, JSON 형식으로만 반환하세요.

- general: 전반적인 운세 (총운)
- wealth: 재물운
- love: 애정운
- health: 건강운
- job: 직업운

**주의**: JSON 외의 다른 텍스트는 포함하지 마세요.
`.trim()
}
