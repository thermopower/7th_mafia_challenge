/**
 * 분석 중 로딩 화면 컴포넌트
 */

'use client'

import { Loader2 } from 'lucide-react'

export function AnalysisLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-primary/50"
            style={{ animationDirection: 'reverse' }}
          />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold">운명을 해석하고 있습니다...</h3>
        <p className="mt-2 text-muted-foreground">AI가 사주를 분석 중입니다. 잠시만 기다려주세요.</p>
        <p className="mt-4 text-sm text-muted-foreground">예상 소요 시간: 10~30초</p>
      </div>
    </div>
  )
}
