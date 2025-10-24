'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI 기반 정확한 분석',
    description: 'Google Gemini Pro를 사용하여 사주팔자를 정밀하게 해석합니다. 구조화된 JSON 결과로 일관된 품질을 보장합니다.',
  },
  {
    icon: Users,
    title: '편리한 프로필 관리',
    description: '가족, 친구 등 자주 보는 사람의 정보를 저장하고, 빠르게 재분석할 수 있습니다.',
  },
  {
    icon: CreditCard,
    title: '합리적인 구독 모델',
    description: '무료로 3회 체험 후, Pro 구독으로 월 10회 고품질 분석을 받을 수 있습니다.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            SuperNext의 강점
          </h2>
          <p className="text-lg text-gray-600">
            AI 기술과 전통 명리학의 만남
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-2 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
