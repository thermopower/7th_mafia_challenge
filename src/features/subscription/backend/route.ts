import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  getPaymentHistory,
} from './service';
import {
  subscriptionErrorCodes,
  type SubscriptionServiceError,
} from './error';

export const registerSubscriptionRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/subscription/status
   * 현재 사용자의 구독 상태 조회
   */
  app.get('/api/subscription/status', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    // TODO: Clerk auth middleware에서 userId 추출
    const userId = c.get('userId') as string | undefined;

    if (!userId) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'User not authenticated'),
      );
    }

    const result = await getSubscriptionStatus(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SubscriptionServiceError, unknown>;

      if (errorResult.error.code === subscriptionErrorCodes.fetchError) {
        logger.error('Failed to fetch subscription status', errorResult.error.message);
      }
    }

    return respond(c, result);
  });

  /**
   * POST /api/subscription/cancel
   * 구독 취소 (취소 예정 상태로 전환)
   */
  app.post('/api/subscription/cancel', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId') as string | undefined;

    if (!userId) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'User not authenticated'),
      );
    }

    const result = await cancelSubscription(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SubscriptionServiceError, unknown>;

      if (errorResult.error.code === subscriptionErrorCodes.updateError) {
        logger.error('Failed to cancel subscription', errorResult.error.message);
      }
    }

    return respond(c, result);
  });

  /**
   * POST /api/subscription/reactivate
   * 구독 재활성화
   */
  app.post('/api/subscription/reactivate', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId') as string | undefined;

    if (!userId) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'User not authenticated'),
      );
    }

    const result = await reactivateSubscription(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SubscriptionServiceError, unknown>;

      if (errorResult.error.code === subscriptionErrorCodes.updateError) {
        logger.error('Failed to reactivate subscription', errorResult.error.message);
      }
    }

    return respond(c, result);
  });

  /**
   * GET /api/payments/history
   * 결제 내역 조회 (최근 12개월)
   */
  app.get('/api/payments/history', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId') as string | undefined;

    if (!userId) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'User not authenticated'),
      );
    }

    const result = await getPaymentHistory(supabase, userId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SubscriptionServiceError, unknown>;

      if (errorResult.error.code === subscriptionErrorCodes.fetchError) {
        logger.error('Failed to fetch payment history', errorResult.error.message);
      }
    }

    return respond(c, result);
  });
};
