import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { UserQuotaResponse } from './schema';
import { userErrorCodes, type UserServiceError } from './error';

export const getUserQuota = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<UserQuotaResponse, UserServiceError, unknown>> => {
  const { data, error } = await client
    .from('users')
    .select('subscription_tier, remaining_analyses')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return failure(500, userErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, userErrorCodes.notFound, 'User not found');
  }

  return success({
    plan: data.subscription_tier,
    remainingAnalyses: data.remaining_analyses,
  });
};
