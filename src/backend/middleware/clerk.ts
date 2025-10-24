/**
 * Clerk 인증 미들웨어
 * JWT 토큰 검증 및 사용자 정보 주입
 */

import { createMiddleware } from 'hono/factory'
import { auth } from '@clerk/nextjs/server'
import type { AppEnv } from '@/backend/hono/context'

/**
 * Clerk 인증 미들웨어
 * 요청 헤더에서 Clerk 사용자 정보를 추출하고 컨텍스트에 주입
 */
export const withClerkAuth = () => {
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
    c.set('clerkId' as any, userId)

    await next()
  })
}

/**
 * Clerk 사용자 ID 추출 헬퍼
 */
export const getClerkId = (c: any): string => {
  const clerkId = c.get('clerkId')
  if (!clerkId || typeof clerkId !== 'string') {
    throw new Error('Clerk ID not found in context')
  }
  return clerkId
}
