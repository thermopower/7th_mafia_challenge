import { vi } from 'vitest';

export const createMockAuthContext = (userId = 'test-user-id') => ({
  userId,
  sessionId: 'test-session-id',
  orgId: null,
  getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
});

// Hono 컨텍스트에서 사용
export const mockClerkAuth = (userId?: string) => {
  return createMockAuthContext(userId);
};
