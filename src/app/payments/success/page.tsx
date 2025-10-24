/**
 * 결제 성공 페이지
 * 토스페이먼츠 결제 완료 후 리다이렉트되는 페이지
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ErrorState } from '@/components/common/error-state'
import { useConfirmPayment } from '@/features/payment/hooks/use-confirm-payment'
import { validatePaymentSuccessParams } from '@/features/payment/lib/validate-params'
import { CheckCircle2 } from 'lucide-react'

type PageStatus = 'processing' | 'success' | 'error'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PageStatus>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { mutate: confirmPayment, isPending } = useConfirmPayment()

  useEffect(() => {
    // 쿼리 파라미터 파싱 및 검증
    const params = {
      authKey: searchParams.get('authKey'),
      customerKey: searchParams.get('customerKey'),
      orderId: searchParams.get('orderId'),
    }

    try {
      const validatedParams = validatePaymentSuccessParams(params)

      // 결제 승인 요청
      confirmPayment(validatedParams, {
        onSuccess: () => {
          setStatus('success')
          // 3초 후 대시보드로 리다이렉트
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        },
        onError: (error: unknown) => {
          setStatus('error')
          const message =
            error && typeof error === 'object' && 'message' in error
              ? String(error.message)
              : '결제 처리 중 오류가 발생했습니다.'
          setErrorMessage(message)
        },
      })
    } catch (validationError) {
      setStatus('error')
      setErrorMessage('결제 정보가 올바르지 않습니다.')
    }
  }, [searchParams, confirmPayment, router])

  // 처리 중 로딩 화면
  if (status === 'processing' || isPending) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <LoadingSpinner message="결제를 처리하고 있습니다..." />
      </div>
    )
  }

  // 성공 화면
  if (status === 'success') {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Pro 구독이 활성화되었습니다!
          </h1>
          <p className="mt-2 text-muted-foreground">
            이제 월 10회의 고급 AI 분석을 이용하실 수 있습니다.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            잠시 후 대시보드로 이동합니다...
          </p>
        </div>
      </div>
    )
  }

  // 오류 화면
  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center">
      <ErrorState
        title="결제 처리 실패"
        message={errorMessage}
        onRetry={() => {
          setStatus('processing')
          setErrorMessage('')
          window.location.reload()
        }}
      />
    </div>
  )
}
