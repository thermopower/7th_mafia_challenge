/**
 * 사주팔자 계산 유틸리티
 * 생년월일시를 사주팔자 데이터로 변환
 */

import type { SajuData } from '@/types'
import { format } from 'date-fns'

/**
 * 사주팔자 계산 함수
 *
 * ⚠️ 주의: 현재는 더미 데이터를 반환합니다.
 * 실제 서비스에서는 다음 중 하나를 사용해야 합니다:
 * 1. 검증된 외부 라이브러리 사용
 * 2. 전문가의 검증을 거친 만세력 알고리즘 구현
 * 3. 외부 만세력 API 연동
 *
 * @param birthDate - 생년월일
 * @param birthTime - 태어난 시간 (선택)
 * @param isLunar - 음력 여부
 * @returns 사주팔자 데이터
 */
export const calculateSaju = (
  birthDate: Date,
  birthTime?: string,
  isLunar: boolean = false
): SajuData => {
  // TODO: 실제 만세력 계산 로직 구현 필요
  // 외부 라이브러리 사용 또는 자체 알고리즘 구현

  // 임시 더미 데이터 (실제 구현 필요)
  return {
    year: { cheongan: '갑', jiji: '자' },
    month: { cheongan: '병', jiji: '인' },
    day: { cheongan: '무', jiji: '진' },
    hour: { cheongan: '경', jiji: '오' },
    sipsin: ['편관', '정재', '식신', '비견'],
    daeun: ['신유', '임술', '계해'],
  }
}

/**
 * 사주팔자 데이터를 문자열로 포맷
 * 프롬프트 생성 시 사용
 */
export const formatSajuData = (saju: SajuData): string => {
  return `
    년주: ${saju.year.cheongan}${saju.year.jiji}
    월주: ${saju.month.cheongan}${saju.month.jiji}
    일주: ${saju.day.cheongan}${saju.day.jiji}
    시주: ${saju.hour.cheongan}${saju.hour.jiji}
    십신: ${saju.sipsin.join(', ')}
    대운: ${saju.daeun.join(', ')}
  `.trim()
}
