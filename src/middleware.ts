/**
 * Clerk 인증 Middleware
 * 보호된 라우트에 대한 인증 확인
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 인증이 필요한 라우트 정의
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/analyze(.*)',
  '/subscription(.*)',
  '/profiles(.*)',
  '/payments(.*)',
  '/my-account(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // 보호된 라우트에 접근 시 인증 필수
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
