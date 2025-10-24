/**
 * 에러 상태 컴포넌트
 */

'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

export const ErrorState = ({
  title = '오류가 발생했습니다',
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && (
          <p className="mt-2 text-muted-foreground">{message}</p>
        )}
      </div>
      {onRetry && <Button onClick={onRetry}>다시 시도</Button>}
    </div>
  )
}
