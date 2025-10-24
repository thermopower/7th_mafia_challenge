/**
 * Supabase 인증 Middleware
 * 보호된 라우트에 대한 인증 확인
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 인증이 필요한 라우트 패턴
const protectedRoutes = [
  '/dashboard',
  '/analyze',
  '/subscription',
  '/profiles',
  '/payments',
  '/my-account',
]

// 인증 관련 공개 라우트
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 보호된 라우트인지 확인
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // API 라우트는 Hono 미들웨어에서 처리
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // 보호된 라우트가 아니면 통과
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 보호된 라우트인데 인증되지 않은 경우
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 인증 라우트인데 이미 인증된 경우
  if (isAuthRoute && user) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    const redirectUrl = new URL(redirect || '/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Next.js 정적 파일 제외
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API 라우트 포함
    '/(api|trpc)(.*)',
  ],
}
