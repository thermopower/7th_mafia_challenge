/**
 * 프로필 선택기 컴포넌트
 */

'use client'

import { useProfilesList } from '@/features/profile/hooks/use-profiles-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export function ProfileSelector() {
  const { data, isLoading } = useProfilesList()
  const router = useRouter()

  const handleSelectProfile = (profileId: string) => {
    // TODO: 프로필 정보를 폼에 자동 입력하는 로직
    // 현재는 간단히 쿼리 파라미터로 전달
    router.push(`/analyze/new?profileId=${profileId}`)
  }

  if (isLoading) {
    return <LoadingSpinner message="프로필 목록을 불러오는 중..." />
  }

  if (!data || !data.profiles || data.profiles.length === 0) {
    return (
      <EmptyState
        title="저장된 프로필이 없습니다"
        message="새로 입력하기 탭에서 정보를 입력하고 프로필로 저장해보세요"
        actionLabel="프로필 관리"
        actionHref="/profiles"
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.profiles.map((profile) => (
        <Card
          key={profile.id}
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => handleSelectProfile(profile.id)}
        >
          <CardHeader>
            <CardTitle>{profile.name}</CardTitle>
            <CardDescription>
              {profile.gender === 'male' ? '남성' : '여성'} • {format(new Date(profile.birthDate), 'yyyy-MM-dd')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {profile.isLunar ? '음력' : '양력'}
              {profile.birthTime && ` • ${profile.birthTime}`}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
