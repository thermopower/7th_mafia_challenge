/**
 * 공통 타입 정의
 * 데이터베이스 스키마와 일치하는 TypeScript 타입
 */

/**
 * 사용자
 */
export type User = {
  id: string
  clerkId: string
  email: string | null
  subscriptionTier: 'free' | 'pro' | 'pending_cancel'
  remainingAnalyses: number
  billingKey: string | null
  subscriptionStartDate: string | null
  nextBillingDate: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * 대상 인물 프로필
 */
export type UserProfile = {
  id: string
  userId: string
  name: string
  gender: 'male' | 'female'
  birthDate: string
  birthTime: string | null
  isLunar: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * 분석 종류
 */
export type AnalysisType = 'monthly' | 'yearly' | 'lifetime'

/**
 * AI 모델
 */
export type AIModel = 'gemini-2.5-flash' | 'gemini-2.5-pro'

/**
 * 분석 결과 JSON 구조
 */
export type AnalysisResultJson = {
  general: string // 총운
  wealth: string // 재물운
  love: string // 애정운
  health: string // 건강운
  job: string // 직업운
}

/**
 * 사주 분석 내역
 */
export type Analysis = {
  id: string
  userId: string
  profileId: string | null
  name: string
  gender: 'male' | 'female'
  birthDate: string
  birthTime: string | null
  isLunar: boolean
  analysisType: AnalysisType
  modelUsed: AIModel
  resultJson: AnalysisResultJson
  createdAt: string
  deletedAt: string | null
}

/**
 * 결제 상태
 */
export type PaymentStatus = 'pending' | 'done' | 'canceled' | 'failed'

/**
 * 결제 수단
 */
export type PaymentMethod = 'card' | 'virtualAccount' | 'billing'

/**
 * 결제 내역
 */
export type Payment = {
  id: string
  userId: string
  orderId: string
  paymentKey: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod | null
  createdAt: string
  updatedAt: string
}

/**
 * 공유 토큰
 */
export type ShareToken = {
  id: string
  analysisId: string
  token: string
  expiresAt: string
  createdAt: string
}

/**
 * 사주팔자 데이터 구조 (만세력)
 */
export type SajuPillar = {
  cheongan: string // 천간
  jiji: string // 지지
}

export type SajuData = {
  year: SajuPillar
  month: SajuPillar
  day: SajuPillar
  hour: SajuPillar
  sipsin: string[] // 십신
  daeun: string[] // 대운
}
