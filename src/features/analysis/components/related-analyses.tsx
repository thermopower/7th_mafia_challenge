'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import type { RelatedAnalysesResponse } from '../backend/schema'

interface RelatedAnalysesProps {
  analyses: RelatedAnalysesResponse['analyses']
}

const ANALYSIS_TYPE_LABELS = {
  monthly: '월간 운세',
  yearly: '신년 운세',
  lifetime: '평생 운세',
}

export function RelatedAnalyses({ analyses }: RelatedAnalysesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">관련 분석</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {analyses.map((analysis) => (
          <Link key={analysis.id} href={`/analyze/${analysis.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">{analysis.name}님</h3>
                  <Badge variant="secondary">
                    {ANALYSIS_TYPE_LABELS[analysis.analysisType]}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(analysis.createdAt), 'yyyy년 M월 d일', {
                      locale: ko,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
