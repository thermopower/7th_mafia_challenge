import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SubscriptionStatusResponseSchema,
  UserSubscriptionRowSchema,
  type SubscriptionStatusResponse,
  type UserSubscriptionRow,
  type PaymentHistoryResponse,
} from './schema';
import {
  subscriptionErrorCodes,
  type SubscriptionServiceError,
} from './error';

const USERS_TABLE = 'users';

/**
 * 구독 상태 조회
 */
export const getSubscriptionStatus = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<SubscriptionStatusResponse, SubscriptionServiceError, unknown>> => {
  const { data, error } = await client
    .from(USERS_TABLE)
    .select('id, subscription_tier, remaining_analyses, next_billing_date, subscription_start_date, cancel_at_period_end, billing_key')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle<UserSubscriptionRow>();

  if (error) {
    return failure(500, subscriptionErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, subscriptionErrorCodes.notFound, 'User subscription not found');
  }

  const rowParse = UserSubscriptionRowSchema.safeParse(data);

  if (!rowParse.success) {
    return failure(
      500,
      subscriptionErrorCodes.validationError,
      'Subscription row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped: SubscriptionStatusResponse = {
    plan: rowParse.data.subscription_tier,
    remainingAnalyses: rowParse.data.remaining_analyses,
    nextBillingDate: rowParse.data.next_billing_date,
    subscriptionStartDate: rowParse.data.subscription_start_date,
    cancelAtPeriodEnd: rowParse.data.cancel_at_period_end,
  };

  const parsed = SubscriptionStatusResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      subscriptionErrorCodes.validationError,
      'Subscription response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 구독 취소 (취소 예정 상태로 전환)
 */
export const cancelSubscription = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<{ success: true }, SubscriptionServiceError, unknown>> => {
  const { data: currentUser, error: fetchError } = await client
    .from(USERS_TABLE)
    .select('subscription_tier, cancel_at_period_end')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return failure(500, subscriptionErrorCodes.fetchError, fetchError.message);
  }

  if (!currentUser) {
    return failure(404, subscriptionErrorCodes.notFound, 'User not found');
  }

  if (currentUser.subscription_tier !== 'pro') {
    return failure(400, subscriptionErrorCodes.alreadyCanceled, 'Subscription is not active');
  }

  if (currentUser.cancel_at_period_end) {
    return failure(400, subscriptionErrorCodes.alreadyCanceled, 'Subscription is already pending cancel');
  }

  const { error: updateError } = await client
    .from(USERS_TABLE)
    .update({
      subscription_tier: 'pending_cancel',
      cancel_at_period_end: true,
    })
    .eq('id', userId);

  if (updateError) {
    return failure(500, subscriptionErrorCodes.updateError, updateError.message);
  }

  return success({ success: true });
};

/**
 * 구독 재활성화 (취소 예정 → Pro로 복원)
 */
export const reactivateSubscription = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<{ success: true }, SubscriptionServiceError, unknown>> => {
  const { data: currentUser, error: fetchError } = await client
    .from(USERS_TABLE)
    .select('subscription_tier, cancel_at_period_end, next_billing_date, billing_key')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return failure(500, subscriptionErrorCodes.fetchError, fetchError.message);
  }

  if (!currentUser) {
    return failure(404, subscriptionErrorCodes.notFound, 'User not found');
  }

  if (currentUser.subscription_tier !== 'pending_cancel') {
    return failure(400, subscriptionErrorCodes.alreadyActive, 'Subscription is not pending cancel');
  }

  if (currentUser.next_billing_date) {
    const nextBillingDate = new Date(currentUser.next_billing_date);
    if (nextBillingDate < new Date()) {
      return failure(400, subscriptionErrorCodes.cannotReactivateExpired, 'Cannot reactivate expired subscription. Please subscribe again.');
    }
  }

  const { error: updateError } = await client
    .from(USERS_TABLE)
    .update({
      subscription_tier: 'pro',
      cancel_at_period_end: false,
    })
    .eq('id', userId);

  if (updateError) {
    return failure(500, subscriptionErrorCodes.updateError, updateError.message);
  }

  return success({ success: true });
};

/**
 * 결제 내역 조회 (최근 12개월)
 */
export const getPaymentHistory = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<PaymentHistoryResponse, SubscriptionServiceError, unknown>> => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data, error, count } = await client
    .from('payment_history')
    .select('id, order_id, amount, status, method, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, subscriptionErrorCodes.fetchError, error.message);
  }

  const items = (data || []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    amount: row.amount,
    status: row.status,
    method: row.method,
    createdAt: row.created_at,
  }));

  return success({
    items,
    total: count || 0,
  });
};
