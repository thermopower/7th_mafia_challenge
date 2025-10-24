'use client'

import { use } from 'react'
import { useAnalysisDetail } from '@/features/analysis/hooks/use-analysis-detail'
import { useRelatedAnalyses } from '@/features/analysis/hooks/use-related-analyses'
import { AnalysisDetailHeader } from '@/features/analysis/components/analysis-detail-header'
import { AnalysisResultCards } from '@/features/analysis/components/analysis-result-cards'
import { AnalysisActions } from '@/features/analysis/components/analysis-actions'
import { RelatedAnalyses } from '@/features/analysis/components/related-analyses'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AnalysisDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = use(props.params)
  const router = useRouter()
  const { data, isLoading, error } = useAnalysisDetail(params.id)
  const { data: relatedData } = useRelatedAnalyses(params.id)

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">분석을 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-4">
          존재하지 않거나 접근 권한이 없는 분석입니다.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          대시보드로 이동
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container py-8 space-y-8">
      <AnalysisDetailHeader analysis={data.analysis} />
      <AnalysisResultCards result={data.result} />
      <AnalysisActions analysisId={params.id} />
      {relatedData?.analyses && relatedData.analyses.length > 0 && (
        <RelatedAnalyses analyses={relatedData.analyses} />
      )}
    </div>
  )
}
