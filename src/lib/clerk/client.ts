/**
 * Clerk 클라이언트 유틸리티 (Client Component용)
 * 브라우저 환경에서 사용자 정보 조회 및 헬퍼 함수 제공
 */

'use client'

import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/nextjs'

// Clerk hooks 재노출
export { useClerkUser as useUser, useClerkAuth as useAuth }

/**
 * 사용자의 구독 플랜 조회
 */
export const getUserPlan = (
  user: ReturnType<typeof useClerkUser>['user']
): 'free' | 'pro' | 'pending_cancel' => {
  return (user?.publicMetadata?.plan as any) ?? 'free'
}

/**
 * 사용자의 잔여 크레딧 조회
 */
export const getUserCredits = (
  user: ReturnType<typeof useClerkUser>['user']
): number => {
  return (user?.publicMetadata?.credits as any) ?? 0
}
