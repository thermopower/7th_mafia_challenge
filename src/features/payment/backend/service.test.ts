import { describe, it, expect, vi, beforeEach } from 'vitest';
import { confirmPaymentService } from './service';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import {
  createMockUser,
  createMockPaymentHistory,
  createMockBillingKeyResponse,
  createMockPaymentResponse,
} from '@/__tests__/utils/mock-factories';
import { PaymentError } from './error';

// 토스페이먼츠 API 모킹
vi.mock('@/lib/payments/toss', () => ({
  issueBillingKey: vi.fn(),
  chargeBilling: vi.fn(),
  deleteBillingKey: vi.fn(),
}));

describe('Payment Service', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockLogger: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('confirmPaymentService', () => {
    it('should complete payment successfully with new order', async () => {
      // Arrange
      const mockUser = createMockUser({
        clerk_id: 'user-123',
        subscription_tier: 'free',
      });
      const mockBillingKey = createMockBillingKeyResponse();
      const mockPayment = createMockPaymentResponse();

      // payment_history 조회: 없음 (새 주문)
      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // 데이터 없음
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          } as any;
        }
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
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      // 토스페이먼츠 API 모킹
      const { issueBillingKey, chargeBilling } = await import(
        '@/lib/payments/toss'
      );
      vi.mocked(issueBillingKey).mockResolvedValue(mockBillingKey);
      vi.mocked(chargeBilling).mockResolvedValue(mockPayment);

      // Act
      const result = await confirmPaymentService({
        supabase: mockSupabase,
        logger: mockLogger,
        userId: 'user-123',
        authKey: 'auth-key',
        customerKey: 'customer-key',
        orderId: 'order-123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.subscriptionTier).toBe('pro');
      expect(result.remainingAnalyses).toBe(10);
      expect(issueBillingKey).toHaveBeenCalledWith({
        authKey: 'auth-key',
        customerKey: 'customer-key',
      });
      expect(chargeBilling).toHaveBeenCalledWith({
        billingKey: mockBillingKey.billingKey,
        orderId: 'order-123',
        orderName: 'SuperNext Pro 구독',
        amount: 10000,
        customerKey: 'customer-key',
      });
    });

    it('should return existing subscription when order already processed', async () => {
      // Arrange: 이미 처리된 주문
      const existingPayment = createMockPaymentHistory({
        order_id: 'order-123',
        status: 'done',
      });
      const mockUser = createMockUser({
        subscription_tier: 'pro',
        remaining_analyses: 10,
        next_billing_date: '2025-12-01',
      });

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: existingPayment,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
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
        return {} as any;
      });

      // Act
      const result = await confirmPaymentService({
        supabase: mockSupabase,
        logger: mockLogger,
        userId: 'user-123',
        authKey: 'auth-key',
        customerKey: 'customer-key',
        orderId: 'order-123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.subscriptionTier).toBe('pro');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '이미 처리된 주문',
        expect.any(Object)
      );
    });

    it('should throw error when billing key issuance fails', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      const { issueBillingKey } = await import('@/lib/payments/toss');
      vi.mocked(issueBillingKey).mockRejectedValue(
        new Error('Billing key API failed')
      );

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);

      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toMatchObject({
        code: 'BILLING_KEY_ISSUE_FAILED',
      });
    });

    it('should throw error when billing key is empty', async () => {
      // Arrange
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      const { issueBillingKey } = await import('@/lib/payments/toss');
      vi.mocked(issueBillingKey).mockResolvedValue({
        billingKey: '',
        customerKey: 'customer-key',
        authenticatedAt: new Date().toISOString(),
      });

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);
    });

    it('should throw error and delete billing key when first payment fails', async () => {
      // Arrange
      const mockBillingKey = createMockBillingKeyResponse();

      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      const { issueBillingKey, chargeBilling, deleteBillingKey } =
        await import('@/lib/payments/toss');
      vi.mocked(issueBillingKey).mockResolvedValue(mockBillingKey);
      vi.mocked(chargeBilling).mockResolvedValue({
        ...createMockPaymentResponse(),
        status: 'FAILED', // 결제 실패
      });
      vi.mocked(deleteBillingKey).mockResolvedValue(undefined);

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);

      // 빌링키 삭제 확인
      expect(deleteBillingKey).toHaveBeenCalledWith(mockBillingKey.billingKey);
    });

    it('should throw error when user update fails', async () => {
      // Arrange
      const mockBillingKey = createMockBillingKeyResponse();
      const mockPayment = createMockPaymentResponse();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          } as any;
        }
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Update failed' },
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { issueBillingKey, chargeBilling } = await import(
        '@/lib/payments/toss'
      );
      vi.mocked(issueBillingKey).mockResolvedValue(mockBillingKey);
      vi.mocked(chargeBilling).mockResolvedValue(mockPayment);

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);

      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toMatchObject({
        code: 'DB_UPDATE_FAILED',
      });
    });

    it('should throw error when payment history insert fails', async () => {
      // Arrange
      const mockBillingKey = createMockBillingKeyResponse();
      const mockPayment = createMockPaymentResponse();

      vi.spyOn(mockSupabase, 'from').mockImplementation((table: string) => {
        if (table === 'payment_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({
              error: { message: 'Insert failed' },
            }),
          } as any;
        }
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { issueBillingKey, chargeBilling } = await import(
        '@/lib/payments/toss'
      );
      vi.mocked(issueBillingKey).mockResolvedValue(mockBillingKey);
      vi.mocked(chargeBilling).mockResolvedValue(mockPayment);

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);
    });

    it('should handle payment history query error gracefully', async () => {
      // Arrange: DB 에러 (PGRST116이 아닌 다른 에러)
      vi.spyOn(mockSupabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'CONNECTION_ERROR', message: 'DB connection failed' },
            }),
          }),
        }),
      } as any);

      // Act & Assert
      await expect(
        confirmPaymentService({
          supabase: mockSupabase,
          logger: mockLogger,
          userId: 'user-123',
          authKey: 'auth-key',
          customerKey: 'customer-key',
          orderId: 'order-123',
        })
      ).rejects.toThrow(PaymentError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        '주문 조회 실패',
        expect.any(Object)
      );
    });
  });
});
