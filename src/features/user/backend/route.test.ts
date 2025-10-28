import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerUserRoutes } from './route';
import * as service from './service';
import { testRequest } from '@/__tests__/utils/test-helpers';
import { createMockSupabaseClient } from '@/__tests__/utils/mock-supabase';

describe('User Routes', () => {
  let app: Hono<AppEnv>;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    app = new Hono<AppEnv>();
    mockSupabase = createMockSupabaseClient();

    // Mock context
    app.use('*', async (c, next) => {
      c.set('userId', 'test-user-123');
      c.set('supabase', mockSupabase as any);
      c.set('logger', console as any);
      c.set('config', {} as any);
      await next();
    });

    registerUserRoutes(app);
  });

  describe('GET /api/user/quota', () => {
    it('should return user quota successfully', async () => {
      vi.spyOn(service, 'getUserQuota').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          plan: 'pro',
          remainingAnalyses: 50,
        },
      });

      const res = await testRequest(app, '/api/user/quota');

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.plan).toBe('pro');
      expect(json.remainingAnalyses).toBe(50);
    });

    it('should return 401 when user is not authenticated', async () => {
      const noAuthApp = new Hono<AppEnv>();

      // Mock context without userId
      noAuthApp.use('*', async (c, next) => {
        c.set('userId', null as any);
        c.set('supabase', mockSupabase as any);
        c.set('logger', console as any);
        c.set('config', {} as any);
        await next();
      });

      registerUserRoutes(noAuthApp);

      const res = await testRequest(noAuthApp, '/api/user/quota');

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.message).toContain('인증');
    });

    it('should call getUserQuota service with correct parameters', async () => {
      const getUserQuotaSpy = vi.spyOn(service, 'getUserQuota').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          plan: 'free',
          remainingAnalyses: 5,
        },
      });

      await testRequest(app, '/api/user/quota');

      expect(getUserQuotaSpy).toHaveBeenCalledWith(mockSupabase, 'test-user-123');
    });
  });
});
