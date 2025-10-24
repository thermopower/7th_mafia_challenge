/**
 * 공통 헤더 컴포넌트
 */

'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const Header = () => {
  const { isSignedIn, isLoaded } = useUser()

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          SuperNext
        </Link>

        {isLoaded && (
          <nav className="flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                >
                  분석 목록
                </Link>
                <Link
                  href="/analyze/new"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                >
                  새 분석하기
                </Link>
                <Link
                  href="/subscription"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                >
                  구독 관리
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
