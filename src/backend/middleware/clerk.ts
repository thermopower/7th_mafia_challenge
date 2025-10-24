/**
 * Clerk 인증 미들웨어
 * JWT 토큰 검증 및 사용자 정보 주입
 */

import { createMiddleware } from 'hono/factory'
import { createClerkClient } from '@clerk/backend'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from '@/backend/hono/context'

/**
 * Clerk 인증 미들웨어 (선택적)
 * Authorization 헤더에서 JWT 토큰을 검증하고 사용자 ID를 주입
 * 인증되지 않은 요청도 허용
 */
export const withClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const path = c.req.path
    console.log('[Clerk Middleware] Processing request:', path)

    const secretKey = process.env.CLERK_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    if (!secretKey || !publishableKey) {
      console.error('[Clerk Middleware] Clerk keys not configured')
      await next()
      return
    }

    try {
      // 1. Authorization 헤더에서 토큰 확인
      let token = c.req.header('Authorization')?.replace('Bearer ', '')
      console.log('[Clerk Middleware] Authorization header token:', token ? 'present' : 'missing')

      // 2. __session 쿠키에서 토큰 확인 (same-origin 요청)
      if (!token) {
        token = getCookie(c, '__session')
        console.log('[Clerk Middleware] __session cookie token:', token ? 'present' : 'missing')
      }

      if (!token) {
        console.warn('[Clerk Middleware] No token found in Authorization header or __session cookie')
        await next()
        return
      }

      // Clerk Backend SDK로 토큰 검증
      const clerkClient = createClerkClient({ secretKey, publishableKey })

      try {
        const { sub: userId } = await clerkClient.verifyToken(token, {
          // authorizedParties: [process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY],
        })

        console.log('[Clerk Middleware] Token verified, userId:', userId)

        if (userId) {
          c.set('userId', userId)
        }
      } catch (error) {
        console.warn('[Clerk Middleware] Token verification failed:', error)
      }
    } catch (error) {
      console.warn('[Clerk Middleware] Clerk auth failed:', error)
    }

    const userId = c.get('userId')
    console.log('[Clerk Middleware] userId set in context:', userId || 'not set')

    await next()
  })
}

/**
 * Clerk 인증 미들웨어 (필수)
 * 인증되지 않은 요청은 401 에러 반환
 */
export const requireClerkAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const secretKey = process.env.CLERK_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

    if (!secretKey || !publishableKey) {
      return c.json(
        {
          error: {
            code: 'SERVER_ERROR',
            message: '서버 설정 오류',
          },
        },
        500
      )
    }

    // Authorization 헤더 또는 __session 쿠키에서 토큰 추출
    let token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      token = getCookie(c, '__session')
    }

    if (!token) {
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

    try {
      const clerkClient = createClerkClient({ secretKey, publishableKey })
      const { sub: userId } = await clerkClient.verifyToken(token)

      if (!userId) {
        return c.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: '유효하지 않은 토큰입니다',
            },
          },
          401
        )
      }

      c.set('userId', userId)
      await next()
    } catch (error) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '토큰 검증에 실패했습니다',
          },
        },
        401
      )
    }
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
