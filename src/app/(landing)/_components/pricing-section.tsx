'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: '무료',
    price: '₩0',
    period: '영구',
    badge: null,
    features: [
      '최초 3회 분석',
      'gemini-2.5-flash 모델',
      '프로필 최대 5개',
      'PDF 다운로드',
    ],
    cta: '무료로 시작하기',
    ctaHref: '/signup',
    variant: 'outline' as const,
  },
  {
    name: 'Pro',
    price: '₩10,000',
    period: '월',
    badge: '추천',
    features: [
      '월 10회 분석',
      'gemini-2.5-pro 모델',
      '무제한 프로필',
      'PDF 다운로드',
      '우선 고객지원',
    ],
    cta: 'Pro 구독하기',
    ctaHref: '/subscription',
    variant: 'default' as const,
  },
]

export function PricingSection() {
  return (
    <section className="bg-gradient-to-br from-gray-50 to-indigo-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            요금제 안내
          </h2>
          <p className="text-lg text-gray-600">
            지금 무료로 시작하고, 원할 때 Pro로 업그레이드하세요
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-2 transition-all ${
                plan.badge
                  ? 'border-indigo-600 shadow-xl'
                  : 'border-gray-200 hover:shadow-lg'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 px-4 py-1 text-white">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600"> / {plan.period}</span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button asChild variant={plan.variant} size="lg" className="w-full">
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          사용하지 않은 횟수는 다음 달로 이월되지 않습니다
        </p>
      </div>
    </section>
  )
}
