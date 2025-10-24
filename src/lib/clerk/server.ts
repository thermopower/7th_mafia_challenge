/**
 * Clerk 서버 유틸리티 (Server Component/API용)
 * 서버 환경에서 사용자 정보 조회 및 메타데이터 업데이트
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

// Clerk 서버 API 재노출
export { auth, currentUser, clerkClient }

/**
 * 사용자 메타데이터 업데이트
 */
export const updateUserMetadata = async (
  userId: string,
  metadata: { plan?: string; credits?: number }
) => {
  const client = await clerkClient()
  return await client.users.updateUserMetadata(userId, {
    publicMetadata: metadata,
  })
}
