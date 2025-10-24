/**
 * 새 분석하기 페이지
 * 사용자가 새로운 사주 분석을 생성하기 위한 데이터 입력 페이지
 */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewAnalysisForm } from '@/features/analyze/components/new-analysis-form'
import { ProfileSelector } from '@/features/analyze/components/profile-selector'
import { QuotaBadge } from '@/features/analyze/components/quota-badge'
import { QuotaWarningModal } from '@/features/analyze/components/quota-warning-modal'
import { useUserQuota } from '@/features/analyze/hooks/use-user-quota'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function NewAnalysisPage() {
  const { data: quota, isLoading } = useUserQuota()

  if (isLoading) {
    return <LoadingSpinner message="사용자 정보를 불러오는 중..." />
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">새 분석하기</h1>
        <QuotaBadge remaining={quota?.remaining ?? 0} tier={quota?.tier ?? 'free'} />
      </div>

      <QuotaWarningModal remaining={quota?.remaining ?? 0} tier={quota?.tier ?? 'free'} />

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">새로 입력하기</TabsTrigger>
          <TabsTrigger value="load">프로필 불러오기</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <NewAnalysisForm />
        </TabsContent>

        <TabsContent value="load" className="mt-6">
          <ProfileSelector />
        </TabsContent>
      </Tabs>
    </div>
  )
}
