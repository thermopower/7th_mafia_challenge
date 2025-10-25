/**
 * Clerk 사용자가 Supabase에 존재하는지 확인하고, 없으면 생성
 * Webhook이 누락된 경우 자동으로 사용자를 동기화
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLogger } from '@/backend/hono/context'

export const ensureUserExists = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  clerkId: string,
  email?: string | null
): Promise<{ id: string; clerk_id: string } | null> => {
  try {
    // 1. 기존 사용자 조회
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, clerk_id')
      .eq('clerk_id', clerkId)
      .maybeSingle()

    if (fetchError) {
      logger.error('[ensureUserExists] Failed to fetch user:', fetchError)
      return null
    }

    if (existingUser) {
      logger.info('[ensureUserExists] User already exists:', clerkId)
      return existingUser
    }

    // 2. 사용자가 없으면 생성 (webhook이 누락된 경우)
    logger.warn('[ensureUserExists] User not found, creating new user:', clerkId)

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email: email ?? null,
        subscription_tier: 'free',
        remaining_analyses: 3,
      })
      .select('id, clerk_id')
      .single()

    if (insertError) {
      logger.error('[ensureUserExists] Failed to create user:', insertError)
      return null
    }

    logger.info('[ensureUserExists] User created successfully:', newUser)
    return newUser
  } catch (error) {
    logger.error('[ensureUserExists] Unexpected error:', error)
    return null
  }
}
