import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfilesList } from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';

describe('Profile Service', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  describe('getProfilesList', () => {
    it('should return empty list when user has no profiles', async () => {
      const mockUser = { id: 'user-uuid-123', subscription_tier: 'free' };

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockClient.from = fromMock as any;

      const result = await getProfilesList(mockClient, 'clerk_user_123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.profiles).toHaveLength(0);
        expect(result.data.total).toBe(0);
        expect(result.data.canAddMore).toBe(true);
      }
    });

    it('should set canAddMore to false for free users with 5 profiles', async () => {
      const mockUser = { id: 'user-uuid-123', subscription_tier: 'free' };
      const mockProfiles = Array.from({ length: 5 }, (_, i) => ({
        id: `profile-${i}`,
        user_id: 'user-uuid-123',
        name: `사용자${i}`,
        gender: 'male',
        birth_date: '1990-01-01',
        birth_time: null,
        is_lunar: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
      }));

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockProfiles,
                    error: null,
                    count: 5,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockClient.from = fromMock as any;

      const result = await getProfilesList(mockClient, 'clerk_user_123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.total).toBe(5);
        expect(result.data.canAddMore).toBe(false);
      }
    });

    it('should set canAddMore to true for pro users regardless of count', async () => {
      const mockUser = { id: 'user-uuid-123', subscription_tier: 'pro' };
      const mockProfiles = Array.from({ length: 10 }, (_, i) => ({
        id: `profile-${i}`,
        user_id: 'user-uuid-123',
        name: `사용자${i}`,
        gender: 'male',
        birth_date: '1990-01-01',
        birth_time: null,
        is_lunar: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
      }));

      const fromMock = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
              }),
            }),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockProfiles,
                    error: null,
                    count: 10,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockClient.from = fromMock as any;

      const result = await getProfilesList(mockClient, 'clerk_user_123');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.total).toBe(10);
        expect(result.data.canAddMore).toBe(true); // Pro users can always add more
      }
    });
  });
});
