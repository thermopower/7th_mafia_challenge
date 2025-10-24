/**
 * 로딩 스피너 컴포넌트
 */

'use client'

import { Loader2 } from 'lucide-react'

type LoadingSpinnerProps = {
  message?: string
}

export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      {message && <p className="text-muted-foreground">{message}</p>}
    </div>
  )
}
