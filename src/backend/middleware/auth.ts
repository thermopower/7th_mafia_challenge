/**
 * Supabase 인증 미들웨어
 * JWT 토큰 검증 및 사용자 정보 주입
 */

import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import type { AppEnv, AppContext } from '@/backend/hono/context'

/**
 * Supabase 인증 미들웨어
 * 요청 쿠키에서 Supabase 세션을 확인하고 사용자 ID를 컨텍스트에 주입
 */
export const withAuth = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const supabase = c.get('supabase')

    // 쿠키에서 액세스 토큰 추출
    const accessToken =
      getCookie(c, 'sb-access-token') ||
      getCookie(c, 'sb-localhost-auth-token') ||
      c.req.header('Authorization')?.replace('Bearer ', '')

    if (!accessToken) {
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
      // 액세스 토큰으로 사용자 정보 조회
      const { data, error } = await supabase.auth.getUser(accessToken)

      if (error || !data.user) {
        return c.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: '유효하지 않은 인증 정보입니다',
            },
          },
          401
        )
      }

      // 사용자 ID를 컨텍스트에 주입
      c.set('userId', data.user.id)

      await next()
    } catch (error) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '인증 확인에 실패했습니다',
          },
        },
        401
      )
    }
  })
}

/**
 * 사용자 ID 추출 헬퍼
 */
export const getUserId = (c: AppContext): string => {
  const userId = c.get('userId')
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID not found in context')
  }
  return userId
}
