/**
 * 횟수 부족 알림 모달 컴포넌트
 */

'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

type QuotaWarningModalProps = {
  remaining: number
  tier: 'free' | 'pro'
}

export function QuotaWarningModal({ remaining, tier }: QuotaWarningModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 0회: Pro 구독 필요
    if (remaining === 0) {
      setOpen(true)
    }
    // 1-3회: 알림만 표시
    else if (remaining > 0 && remaining <= 3) {
      setOpen(true)
    }
  }, [remaining])

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  if (remaining === 0) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>더 이상 무료 분석 횟수가 없습니다</AlertDialogTitle>
            <AlertDialogDescription>
              Pro 요금제로 업그레이드하여 월 10회의 고품질 분석을 이용하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/dashboard')}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgrade}>Pro로 업그레이드</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>남은 분석 횟수가 {remaining}회입니다</AlertDialogTitle>
          <AlertDialogDescription>
            {tier === 'free'
              ? 'Pro로 업그레이드하여 더 많은 분석을 이용하세요.'
              : '다음 결제일에 10회로 초기화됩니다.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setOpen(false)}>확인</AlertDialogAction>
          {tier === 'free' && <AlertDialogAction onClick={handleUpgrade}>Pro 보기</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
