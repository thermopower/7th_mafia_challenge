import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerSubscriptionRoutes } from './route';
import * as service from './service';
import { testRequest } from '@/__tests__/utils/test-helpers';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';
import { createMockSubscriptionStatus, createMockPaymentHistory } from '@/__tests__/utils/mock-factories';

describe('Subscription Routes', () => {
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
      c.set('userId', 'test-clerk-id');
      c.set('supabase', mockSupabase as any);
      c.set('logger', mockLogger);
      c.set('config', {} as any);
      await next();
    });

    registerSubscriptionRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/subscription/status', () => {
    it('should return 200 with subscription status when successful', async () => {
      // Arrange
      const mockStatus = createMockSubscriptionStatus({
        subscription_tier: 'pro',
        remaining_analyses: 10,
      });

      vi.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({
        ok: true,
        status: 200,
        data: mockStatus,
      });

      // Act
      const res = await testRequest(app, '/api/subscription/status');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.subscription_tier).toBe('pro');
      expect(json.remaining_analyses).toBe(10);
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      vi.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({
        ok: false,
        status: 404,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });

      // Act
      const res = await testRequest(app, '/api/subscription/status');

      // Assert
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: 인증되지 않은 앱
      const noAuthApp = new Hono<AppEnv>();
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', undefined as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', mockLogger);
        c.set('config', {} as any);
        await next();
      });
      registerSubscriptionRoutes(noAuthApp);

      // Act
      const res = await testRequest(noAuthApp, '/api/subscription/status');

      // Assert
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/subscription/cancel', () => {
    it('should return 200 when cancellation successful', async () => {
      // Arrange
      vi.spyOn(service, 'cancelSubscription').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          message: 'Subscription cancelled successfully',
          cancelAtPeriodEnd: true,
        },
      });

      // Act
      const res = await testRequest(app, '/api/subscription/cancel', {
        method: 'POST',
      });

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('cancelled');
      expect(json.cancelAtPeriodEnd).toBe(true);
    });

    it('should return 400 when subscription already cancelled', async () => {
      // Arrange
      vi.spyOn(service, 'cancelSubscription').mockResolvedValue({
        ok: false,
        status: 400,
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'Subscription is already cancelled',
        },
      });

      // Act
      const res = await testRequest(app, '/api/subscription/cancel', {
        method: 'POST',
      });

      // Assert
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('ALREADY_CANCELLED');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: 인증되지 않은 앱
      const noAuthApp = new Hono<AppEnv>();
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', undefined as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', mockLogger);
        c.set('config', {} as any);
        await next();
      });
      registerSubscriptionRoutes(noAuthApp);

      // Act
      const res = await testRequest(noAuthApp, '/api/subscription/cancel', {
        method: 'POST',
      });

      // Assert
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/reactivate', () => {
    it('should return 200 when reactivation successful', async () => {
      // Arrange
      vi.spyOn(service, 'reactivateSubscription').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          message: 'Subscription reactivated successfully',
          cancelAtPeriodEnd: false,
        },
      });

      // Act
      const res = await testRequest(app, '/api/subscription/reactivate', {
        method: 'POST',
      });

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('reactivated');
      expect(json.cancelAtPeriodEnd).toBe(false);
    });

    it('should return 400 when subscription is not scheduled for cancellation', async () => {
      // Arrange
      vi.spyOn(service, 'reactivateSubscription').mockResolvedValue({
        ok: false,
        status: 400,
        error: {
          code: 'NOT_SCHEDULED_FOR_CANCEL',
          message: 'Subscription is not scheduled for cancellation',
        },
      });

      // Act
      const res = await testRequest(app, '/api/subscription/reactivate', {
        method: 'POST',
      });

      // Assert
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('NOT_SCHEDULED_FOR_CANCEL');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should return 200 with payment history when successful', async () => {
      // Arrange
      const mockHistory = [
        createMockPaymentHistory({ amount: 10000, status: 'done' }),
        createMockPaymentHistory({ amount: 10000, status: 'done' }),
      ];

      vi.spyOn(service, 'getPaymentHistory').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          payments: mockHistory,
          total: 2,
        },
      });

      // Act
      const res = await testRequest(app, '/api/payments/history');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.payments).toHaveLength(2);
      expect(json.total).toBe(2);
    });

    it('should return 200 with empty array when no payment history', async () => {
      // Arrange
      vi.spyOn(service, 'getPaymentHistory').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          payments: [],
          total: 0,
        },
      });

      // Act
      const res = await testRequest(app, '/api/payments/history');

      // Assert
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.payments).toHaveLength(0);
      expect(json.total).toBe(0);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: 인증되지 않은 앱
      const noAuthApp = new Hono<AppEnv>();
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', undefined as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', mockLogger);
        c.set('config', {} as any);
        await next();
      });
      registerSubscriptionRoutes(noAuthApp);

      // Act
      const res = await testRequest(noAuthApp, '/api/payments/history');

      // Assert
      expect(res.status).toBe(401);
    });
  });
});
