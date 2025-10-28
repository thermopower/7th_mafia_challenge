import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserQuota } from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';

describe('User Service', () => {
  describe('getUserQuota', () => {
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      mockClient = createMockSupabaseClient();
    });

    it('should return user quota when user exists', async () => {
      const mockData = {
        subscription_tier: 'pro' as const,
        remaining_analyses: 50,
      };

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      } as any);

      const result = await getUserQuota(mockClient, 'user_123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.plan).toBe('pro');
        expect(result.data.remainingAnalyses).toBe(50);
      }
    });

    it('should handle free tier users correctly', async () => {
      const mockData = {
        subscription_tier: 'free' as const,
        remaining_analyses: 5,
      };

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      } as any);

      const result = await getUserQuota(mockClient, 'user_free');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.plan).toBe('free');
        expect(result.data.remainingAnalyses).toBe(5);
      }
    });

    it('should handle pending_cancel tier users correctly', async () => {
      const mockData = {
        subscription_tier: 'pending_cancel' as const,
        remaining_analyses: 10,
      };

      vi.spyOn(mockClient, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      } as any);

      const result = await getUserQuota(mockClient, 'user_pending');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.plan).toBe('pending_cancel');
        expect(result.data.remainingAnalyses).toBe(10);
      }
    });
  });
});
