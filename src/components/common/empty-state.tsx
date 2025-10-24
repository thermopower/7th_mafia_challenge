/**
 * 빈 상태 컴포넌트
 */

'use client'

import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type EmptyStateProps = {
  title?: string
  message?: string
  actionLabel?: string
  actionHref?: string
}

export const EmptyState = ({
  title = '아직 내역이 없습니다',
  message,
  actionLabel,
  actionHref,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && (
          <p className="mt-2 text-muted-foreground">{message}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}
