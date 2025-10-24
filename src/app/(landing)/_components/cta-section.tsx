'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
            지금 바로 무료로 시작하세요
          </h2>

          <p className="mb-8 text-lg text-indigo-100 md:text-xl">
            회원가입 후 즉시 3회 무료 분석 제공
            <br />
            신용카드 등록 없이 시작할 수 있습니다
          </p>

          <Button
            asChild
            size="lg"
            variant="secondary"
            className="group gap-2"
          >
            <Link href="/signup">
              회원가입하기
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <p className="mt-6 text-sm text-indigo-200">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-white underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
