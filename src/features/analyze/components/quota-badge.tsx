/**
 * 잔여 횟수 배지 컴포넌트
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

type QuotaBadgeProps = {
  remaining: number
  tier: 'free' | 'pro'
}

export function QuotaBadge({ remaining, tier }: QuotaBadgeProps) {
  const getVariant = () => {
    if (remaining === 0) return 'destructive'
    if (remaining <= 3) return 'secondary'
    return 'default'
  }

  return (
    <Badge variant={getVariant()} className="flex items-center gap-2">
      <Sparkles className="h-4 w-4" />
      남은 분석 {remaining}회
      {tier === 'pro' && ' (Pro)'}
    </Badge>
  )
}
