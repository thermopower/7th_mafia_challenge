/**
 * 공통 헤더 컴포넌트
 */

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

export const Header = () => {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, refresh } = useCurrentUser()

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      await refresh()
      toast.success('로그아웃되었습니다')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('로그아웃에 실패했습니다')
      console.error('Sign out error:', error)
    }
  }

  const getUserInitial = () => {
    if (!user?.email) return 'U'
    return user.email.charAt(0).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          SuperNext
        </Link>

        {!isLoading && (
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getUserInitial()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">내 계정</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
