import { faker } from '@faker-js/faker';

export const createMockUser = (overrides: Record<string, any> = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  clerk_id: `user_${faker.string.alphanumeric(16)}`,
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
