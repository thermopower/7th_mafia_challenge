/**
 * Clerk 인증 미들웨어
 * JWT 토큰 검증 및 사용자 정보 주입
 */

import { createMiddleware } from 'hono/factory'
import { auth } from '@clerk/nextjs/server'
import type { AppEnv } from '@/backend/hono/context'

/**
 * Clerk 인증 미들웨어 (선택적)
 * 요청 헤더에서 Clerk 사용자 정보를 추출하고 컨텍스트에 주입
 * 인증되지 않은 요청도 허용하며, userId가 없으면 undefined로 설정
 */
export const withClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    try {
      const { userId } = await auth()

      if (userId) {
        // 사용자 ID를 컨텍스트에 주입
        c.set('userId', userId)
      }
    } catch (error) {
      // 인증 실패 시에도 계속 진행 (optional auth)
      console.warn('Clerk auth failed:', error)
    }

    await next()
  })
}

/**
 * Clerk 인증 미들웨어 (필수)
 * 인증되지 않은 요청은 401 에러 반환
 */
export const requireClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const { userId } = await auth()

    if (!userId) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다',
          },
        },
        401
      )
    }

    // 사용자 ID를 컨텍스트에 주입
    c.set('userId', userId)

    await next()
  })
}

/**
 * Clerk 사용자 ID 추출 헬퍼
 */
export const getClerkId = (c: any): string => {
  const userId = c.get('userId')
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID not found in context')
  }
  return userId
}
