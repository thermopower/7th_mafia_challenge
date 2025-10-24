import { XCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { getPaymentErrorMessage } from '@/lib/payments/error-messages'

/**
 * 메타데이터 설정
 * - noindex: 검색 엔진 노출 방지
 */
export const metadata: Metadata = {
  title: '결제 실패',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * 결제 실패 페이지 Props
 */
type PaymentFailPageProps = {
  searchParams: Promise<{
    code?: string
    message?: string
  }>
}

/**
 * 결제 실패 페이지
 *
 * 토스페이먼츠 결제 프로세스 중 실패 시 리다이렉트되는 페이지
 * - failUrl: https://yourdomain.com/payments/fail?code={에러코드}&message={에러메시지}
 * - 쿼리 파라미터로 전달된 에러 정보를 사용자 친화적인 메시지로 변환
 * - 재시도(구독 관리) 및 대시보드 복귀 버튼 제공
 *
 * @see https://docs.tosspayments.com/guides/payment/integration
 */
export default async function PaymentFailPage(props: PaymentFailPageProps) {
  const searchParams = await props.searchParams
  const { code, message } = searchParams

  const errorMessage = getPaymentErrorMessage(code, message)

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* 실패 아이콘 */}
          <XCircle className="h-16 w-16 text-destructive" aria-hidden="true" />

          {/* 제목 */}
          <h1 className="text-2xl font-bold">결제 실패</h1>

          {/* 에러 메시지 */}
          <p className="text-muted-foreground">{errorMessage}</p>

          {/* 액션 버튼 */}
          <div className="flex w-full flex-col gap-3">
            {/* 재시도 버튼 */}
            <Button asChild className="w-full">
              <Link href="/subscription">다시 시도하기</Link>
            </Button>

            {/* 대시보드 복귀 버튼 */}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">대시보드로 돌아가기</Link>
            </Button>
          </div>

          {/* 고객센터 안내 */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>문제가 계속되면 고객센터로 문의해주세요.</p>
            <p className="mt-1">
              이메일:{' '}
              <a
                href="mailto:support@supernext.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                support@supernext.com
              </a>
            </p>
          </div>

          {/* 개발 모드: 원본 에러 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (code || message) && (
            <details className="mt-4 w-full text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                디버그 정보 (개발 모드)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
                {JSON.stringify({ code, message }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
