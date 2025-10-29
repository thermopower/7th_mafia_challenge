import { faker } from '@faker-js/faker';

export const createMockUser = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  clerk_id: `user_${faker.string.alphanumeric(16)}`,
  remaining_analyses: 5,
  subscription_tier: 'free',
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

export const createMockAnalysis = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  pdf_url: faker.internet.url(),
  status: 'completed' as const,
  result: {
    summary: faker.lorem.paragraph(),
    keywords: [faker.lorem.word(), faker.lorem.word()],
  },
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockSubscription = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  plan: 'premium' as const,
  status: 'active' as const,
  billing_key: faker.string.alphanumeric(32),
  started_at: faker.date.past().toISOString(),
  expires_at: faker.date.future().toISOString(),
  ...overrides,
});

// 사주 분석 결과 팩토리
export const createMockUserAnalysis = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  name: faker.person.fullName(),
  gender: faker.helpers.arrayElement(['male', 'female'] as const),
  birth_date: '1990-01-01',
  birth_time: '12:00',
  is_lunar: false,
  analysis_type: 'comprehensive',
  model_used: 'gemini-2.5-flash',
  result_json: {
    general: faker.lorem.paragraph(),
    wealth: faker.lorem.paragraph(),
    love: faker.lorem.paragraph(),
    health: faker.lorem.paragraph(),
    job: faker.lorem.paragraph(),
  },
  created_at: faker.date.recent().toISOString(),
  deleted_at: null,
  ...overrides,
});

// 분석 생성 요청 팩토리
export const createMockAnalysisRequest = (overrides: Record<string, any> = {}) => ({
  name: faker.person.fullName(),
  gender: faker.helpers.arrayElement(['male', 'female'] as const),
  birthDate: '1990-01-01',
  birthTime: '12:00',
  isLunar: false,
  analysisType: 'comprehensive',
  saveAsProfile: false,
  ...overrides,
});

// AI 응답 팩토리
export const createMockGeminiResponse = (overrides: Record<string, any> = {}) => ({
  general: '전반적인 운세가 좋습니다.',
  wealth: '재물운이 상승하고 있습니다.',
  love: '애정운이 안정적입니다.',
  health: '건강에 유의하세요.',
  job: '직업운이 좋습니다.',
  ...overrides,
});

// 결제 내역 팩토리
export const createMockPaymentHistory = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  order_id: `order_${faker.string.alphanumeric(16)}`,
  payment_key: `payment_${faker.string.alphanumeric(32)}`,
  amount: 10000,
  status: 'done',
  method: 'billing',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// 구독 정보 팩토리
export const createMockSubscriptionStatus = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  subscription_tier: 'pro',
  remaining_analyses: 10,
  next_billing_date: faker.date.future().toISOString(),
  subscription_start_date: faker.date.past().toISOString(),
  cancel_at_period_end: false,
  billing_key: faker.string.alphanumeric(32),
  ...overrides,
});

// 토스페이먼츠 빌링키 응답 팩토리
export const createMockBillingKeyResponse = (overrides: Record<string, any> = {}) => ({
  billingKey: `billing_${faker.string.alphanumeric(32)}`,
  customerKey: `customer_${faker.string.alphanumeric(16)}`,
  authenticatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

// 토스페이먼츠 결제 응답 팩토리
export const createMockPaymentResponse = (overrides: Record<string, any> = {}) => ({
  paymentKey: `payment_${faker.string.alphanumeric(32)}`,
  orderId: `order_${faker.string.alphanumeric(16)}`,
  status: 'DONE',
  method: 'billing',
  totalAmount: 10000,
  approvedAt: faker.date.recent().toISOString(),
  ...overrides,
});
