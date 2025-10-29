import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerPaymentRoutes } from './route';
import * as service from './service';
import { testRequest } from '@/__tests__/utils/test-helpers';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import { PaymentError } from './error';

describe('Payment Routes', () => {
  let app: Hono<AppEnv>;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockLogger: any;

  beforeEach(() => {
    app = new Hono<AppEnv>();
    mockSupabase = createMockSupabaseClient();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    // Mock context
    app.use('*', async (c, next) => {
      c.set('supabase', mockSupabase as any);
      c.set('logger', mockLogger);
      c.set('config', {} as any);
      await next();
    });

    registerPaymentRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/payments/confirm', () => {
    it('should return 200 when payment confirmation successful', async () => {
      // Arrange
      const mockPaymentRequest = {
        authKey: 'test-auth-key',
        customerKey: 'customer-123',
        orderId: 'order-123',
      };

      const mockPaymentResult = {
        success: true,
        subscriptionTier: 'pro',
        remainingAnalyses: 10,
        nextBillingDate: '2025-12-01',
      };

      vi.spyOn(service, 'confirmPaymentService').mockResolvedValue(mockPaymentResult);

      // Act
      const res = await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.subscriptionTier).toBe('pro');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '결제 승인 시작',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '결제 승인 완료',
        expect.any(Object)
      );
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const invalidRequest = {
        authKey: 'test-auth-key',
        // customerKey 누락
        orderId: 'order-123',
      };

      // Act
      const res = await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      // Assert
      expect(res.status).toBe(400);
    });

    it('should return 400 when payment service throws PaymentError', async () => {
      // Arrange
      const mockPaymentRequest = {
        authKey: 'test-auth-key',
        customerKey: 'customer-123',
        orderId: 'order-123',
      };

      const paymentError = new PaymentError(
        'PAYMENT_FAILED',
        'Payment processing failed'
      );
      vi.spyOn(service, 'confirmPaymentService').mockRejectedValue(paymentError);

      // Act
      const res = await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      // Assert
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('PAYMENT_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '결제 승인 실패 (PaymentError)',
        expect.any(Object)
      );
    });

    it('should return 500 when unknown error occurs', async () => {
      // Arrange
      const mockPaymentRequest = {
        authKey: 'test-auth-key',
        customerKey: 'customer-123',
        orderId: 'order-123',
      };

      const unknownError = new Error('Unexpected error');
      vi.spyOn(service, 'confirmPaymentService').mockRejectedValue(unknownError);

      // Act
      const res = await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      // Assert
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('PAYMENT_CONFIRMATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '결제 승인 실패 (Unknown)',
        expect.any(Object)
      );
    });

    it('should return 400 when customerKey is empty', async () => {
      // Arrange
      const mockPaymentRequest = {
        authKey: 'test-auth-key',
        customerKey: '',
        orderId: 'order-123',
      };

      // Act
      const res = await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      // Assert: Zod validation will fail for empty string
      expect(res.status).toBe(400);
    });

    it('should call payment service with correct parameters', async () => {
      // Arrange
      const mockPaymentRequest = {
        authKey: 'test-auth-key',
        customerKey: 'customer-123',
        orderId: 'order-123',
      };

      const mockPaymentResult = {
        success: true,
        subscriptionTier: 'pro',
        remainingAnalyses: 10,
        nextBillingDate: '2025-12-01',
      };

      const confirmPaymentSpy = vi
        .spyOn(service, 'confirmPaymentService')
        .mockResolvedValue(mockPaymentResult);

      // Act
      await testRequest(app, '/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockPaymentRequest),
      });

      // Assert
      expect(confirmPaymentSpy).toHaveBeenCalledWith({
        supabase: mockSupabase,
        logger: mockLogger,
        userId: 'customer-123',
        authKey: 'test-auth-key',
        customerKey: 'customer-123',
        orderId: 'order-123',
      });
    });
  });
});
