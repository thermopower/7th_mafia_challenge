'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            Google Gemini AI 기반
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            AI가 풀어주는
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              당신의 운명
            </span>
          </h1>

          <p className="mb-8 text-lg text-gray-600 md:text-xl">
            Google Gemini Pro를 활용한 정확한 사주 분석
            <br />
            총운, 재물운, 애정운, 건강운, 직업운을 한눈에
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                무료로 시작하기
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="#features">
                자세히 알아보기
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            회원가입 시 3회 무료 분석 제공
          </p>
        </div>
      </div>

      {/* 배경 데코레이션 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
    </section>
  )
}
