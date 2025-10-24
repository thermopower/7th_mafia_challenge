/**
 * 분석 생성 관련 에러 클래스
 */
export class AnalysisCreateError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'AnalysisCreateError'
  }
}

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',
  AI_API_ERROR: 'AI_API_ERROR',
  INVALID_LUNAR_DATE: 'INVALID_LUNAR_DATE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

/**
 * 에러 메시지 맵
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.INSUFFICIENT_QUOTA]: '잔여 횟수가 부족합니다',
  [ERROR_CODES.AI_API_ERROR]: 'AI 분석 중 오류가 발생했습니다',
  [ERROR_CODES.INVALID_LUNAR_DATE]: '유효하지 않은 음력 날짜입니다',
  [ERROR_CODES.USER_NOT_FOUND]: '사용자 정보를 찾을 수 없습니다',
  [ERROR_CODES.INTERNAL_ERROR]: '분석 생성에 실패했습니다',
} as const
