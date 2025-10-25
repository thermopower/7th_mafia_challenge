'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

import type { AnalysisDetailResponse } from '../backend/schema'

interface AnalysisDetailHeaderProps {
  analysis: AnalysisDetailResponse['analysis']
}

const ANALYSIS_TYPE_LABELS = {
  monthly: '월간 운세',
  yearly: '신년 운세',
  lifetime: '평생 운세',
}

export function AnalysisDetailHeader({ analysis }: AnalysisDetailHeaderProps) {
  const birthDateStr = format(new Date(analysis.birthDate), 'yyyy년 M월 d일', {
    locale: ko,
  })
  const createdAtStr = format(new Date(analysis.createdAt), 'yyyy년 M월 d일', {
    locale: ko,
  })

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{analysis.name}님의 사주 분석</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                {birthDateStr} ({analysis.isLunar ? '음력' : '양력'})
              </span>
              {analysis.birthTime && <span>| {analysis.birthTime}</span>}
              {!analysis.birthTime && (
                <span className="text-xs">
                  (시간 미입력 - 정오 기준)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {ANALYSIS_TYPE_LABELS[analysis.analysisType]}
              </Badge>
              <Badge variant="outline">
                {analysis.modelUsed.includes('pro') ? 'Pro 모델' : 'Flash 모델'}
              </Badge>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>분석일: {createdAtStr}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
