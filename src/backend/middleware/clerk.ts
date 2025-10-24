/**
 * Clerk 인증 미들웨어
 * JWT 토큰 검증 및 사용자 정보 주입
 */

import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
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

    try {
      const authHeader = c.req.header('Authorization')
      console.log('[Clerk Middleware] Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'missing')

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const secretKey = process.env.CLERK_SECRET_KEY

        if (!secretKey) {
          console.error('[Clerk Middleware] CLERK_SECRET_KEY is not configured')
          await next()
          return
        }

        try {
          const payload = await verifyToken(token, {
            secretKey,
          })

          console.log('[Clerk Middleware] Token verified, userId:', payload.sub)

          if (payload.sub) {
            c.set('userId', payload.sub)
          }
        } catch (error) {
          console.warn('[Clerk Middleware] Invalid Clerk token:', error)
        }
      } else {
        console.warn('[Clerk Middleware] No Bearer token found in Authorization header')
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
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
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

    const token = authHeader.substring(7)
    const secretKey = process.env.CLERK_SECRET_KEY

    if (!secretKey) {
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

    try {
      const payload = await verifyToken(token, {
        secretKey,
      })

      if (!payload.sub) {
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

      c.set('userId', payload.sub)
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
