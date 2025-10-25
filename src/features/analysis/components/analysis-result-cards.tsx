'use client'

import { FortuneCard } from './fortune-card'
import { FORTUNE_CONFIG, FORTUNE_ORDER } from '../constants/fortune'
import type { AnalysisDetailResponse } from '../backend/schema'

interface AnalysisResultCardsProps {
  result: AnalysisDetailResponse['result']
}

export function AnalysisResultCards({ result }: AnalysisResultCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {FORTUNE_ORDER.map((type) => (
        <FortuneCard
          key={type}
          type={type}
          emoji={FORTUNE_CONFIG[type].emoji}
          label={FORTUNE_CONFIG[type].label}
          content={result[type]}
        />
      ))}
    </div>
  )
}
