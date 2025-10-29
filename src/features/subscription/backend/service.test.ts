import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  getPaymentHistory,
} from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import {
  createMockUser,
  createMockSubscriptionStatus,
  createMockPaymentHistory,
} from '@/__tests__/utils/mock-factories';
import { subscriptionErrorCodes } from './error';

describe('Subscription Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status when user exists', async () => {
      // Arrange
      const mockUser = createMockSubscriptionStatus({
        subscription_tier: 'pro',
        remaining_analyses: 10,
        next_billing_date: '2025-12-01',
        subscription_start_date: '2025-01-01',
        cancel_at_period_end: false,
      });

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Act
      const result = await getSubscriptionStatus(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.plan).toBe('pro');
        expect(result.data.remainingAnalyses).toBe(10);
        expect(result.data.nextBillingDate).toBe('2025-12-01');
        expect(result.data.cancelAtPeriodEnd).toBe(false);
      }
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getSubscriptionStatus(
        mockSupabase,
        'non-existent-user'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
        expect(result.error.code).toBe(subscriptionErrorCodes.notFound);
      }
    });

    it('should handle database error gracefully', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Connection failed' },
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getSubscriptionStatus(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(500);
        expect(result.error.code).toBe(subscriptionErrorCodes.fetchError);
      }
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription successfully', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'pro',
        cancel_at_period_end: false,
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // Act
      const result = await cancelSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
      }
    });

    it('should return error when subscription is not active', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'free',
        cancel_at_period_end: false,
      };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await cancelSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(
          subscriptionErrorCodes.alreadyCanceled
        );
      }
    });

    it('should return error when subscription already pending cancel', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'pro',
        cancel_at_period_end: true,
      };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await cancelSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(
          subscriptionErrorCodes.alreadyCanceled
        );
      }
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate pending_cancel subscription successfully', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'pending_cancel',
        cancel_at_period_end: true,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
        billing_key: 'billing-key',
      };

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // Act
      const result = await reactivateSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
      }
    });

    it('should return error when subscription is not pending cancel', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'pro', // pending_cancel이 아님
        cancel_at_period_end: false,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billing_key: 'billing-key',
      };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await reactivateSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(subscriptionErrorCodes.alreadyActive);
      }
    });

    it('should return error when trying to reactivate expired subscription', async () => {
      // Arrange
      const mockUser = {
        subscription_tier: 'pending_cancel',
        cancel_at_period_end: true,
        next_billing_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전 (만료)
        billing_key: 'billing-key',
      };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockUser,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await reactivateSubscription(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe(
          subscriptionErrorCodes.cannotReactivateExpired
        );
      }
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history for user', async () => {
      // Arrange
      const mockUser = createMockUser({ id: 'user-uuid' });
      const mockPayments = [
        createMockPaymentHistory({ amount: 10000, status: 'done' }),
        createMockPaymentHistory({ amount: 10000, status: 'done' }),
      ];

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockPayments,
              error: null,
              count: 2,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getPaymentHistory(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.items[0].amount).toBe(10000);
      }
    });

    it('should return empty array when no payment history', async () => {
      // Arrange
      const mockUser = createMockUser({ id: 'user-uuid' });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getPaymentHistory(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.items).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });

    it('should return error when user not found', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'User not found' },
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getPaymentHistory(mockSupabase, 'non-existent');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(500);
        expect(result.error.code).toBe(subscriptionErrorCodes.fetchError);
      }
    });

    it('should handle database error when fetching payment history', async () => {
      // Arrange
      const mockUser = createMockUser({ id: 'user-uuid' });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUser,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
              count: null,
            }),
          } as any;
        }
        return {} as any;
      });

      // Act
      const result = await getPaymentHistory(mockSupabase, 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(500);
        expect(result.error.code).toBe(subscriptionErrorCodes.fetchError);
      }
    });
  });
});
