export const PLANS = {
  FREE: {
    name: '무료',
    monthlyAnalyses: 3,
    model: 'gemini-2.5-flash',
    price: 0,
    features: [
      '최초 3회 분석',
      '기본 AI 모델 (Flash)',
      '프로필 저장 (최대 5개)',
    ],
  },
  PRO: {
    name: 'Pro',
    monthlyAnalyses: 10,
    model: 'gemini-2.5-pro',
    price: 10000,
    features: [
      '월 10회 분석',
      '고급 AI 모델 (Pro)',
      '무제한 프로필 저장',
      'PDF 다운로드',
      '카카오톡 공유',
    ],
  },
} as const;

export const PLAN_STATUS_LABELS = {
  free: '무료 사용자',
  pro: 'Pro 사용자',
  pending_cancel: '취소 예정',
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: '대기 중',
  done: '완료',
  canceled: '취소됨',
  failed: '실패',
} as const;
