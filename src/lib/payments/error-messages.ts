/**
 * 토스페이먼츠 에러 코드를 사용자 친화적인 메시지로 변환하는 유틸리티
 *
 * @see https://docs.tosspayments.com/reference#error-codes
 */

/**
 * 토스페이먼츠 에러 코드와 사용자 친화적 메시지 매핑
 */
export const TOSS_ERROR_MESSAGES: Record<string, string> = {
  USER_CANCEL: '결제를 취소하셨습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 다른 카드로 시도해주세요.',
  EXCEED_MAX_AUTH_COUNT: '본인인증 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  EXCEED_MAX_CARD_LIMIT: '카드 한도를 초과했습니다. 다른 카드로 시도해주세요.',
  INVALID_CARD_EXPIRATION: '카드 유효기간이 만료되었습니다. 다른 카드를 사용해주세요.',
  INVALID_STOPPED_CARD: '정지된 카드입니다. 카드사에 문의하거나 다른 카드를 사용해주세요.',
  FAILED_CARD_PAYMENT: '카드 결제에 실패했습니다. 카드 정보를 확인해주세요.',
}

/**
 * 에러 코드를 사용자 친화적인 메시지로 변환
 *
 * @param code - 토스페이먼츠 에러 코드
 * @param message - 토스페이먼츠가 제공한 원본 에러 메시지
 * @returns 사용자 친화적인 에러 메시지
 *
 * @example
 * getPaymentErrorMessage('USER_CANCEL') // '결제를 취소하셨습니다.'
 * getPaymentErrorMessage('UNKNOWN_ERROR', '알 수 없는 오류') // '알 수 없는 오류'
 * getPaymentErrorMessage() // '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
 */
export const getPaymentErrorMessage = (
  code?: string | null,
  message?: string | null
): string => {
  if (code && TOSS_ERROR_MESSAGES[code]) {
    return TOSS_ERROR_MESSAGES[code]
  }
  return message || '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
