/**
 * Clerk 인증 Middleware
 * 보호된 라우트에 대한 인증 확인
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 인증이 필요한 라우트 패턴
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analyze(.*)',
  '/subscription(.*)',
  '/profiles(.*)',
  '/payments(.*)',
  '/my-account(.*)',
])

// Public 라우트 (웹훅 등)
const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // 웹훅 등 Public 라우트는 인증 건너뛰기
  if (isPublicRoute(req)) {
    return
  }

  // 보호된 라우트에 접근 시 인증 필요
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Next.js 정적 파일 제외
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API 라우트 포함
    '/(api|trpc)(.*)',
  ],
}
