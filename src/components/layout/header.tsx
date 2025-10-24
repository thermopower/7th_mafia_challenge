/**
 * 공통 헤더 컴포넌트
 */

'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          SuperNext
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:underline">
            분석 목록
          </Link>
          <Link href="/analyze/new" className="hover:underline">
            새 분석하기
          </Link>
          <Link href="/subscription" className="hover:underline">
            구독 관리
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </div>
    </header>
  )
}
