'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FortuneType } from '../lib/types'

interface FortuneCardProps {
  type: FortuneType
  emoji: string
  label: string
  content: string
}

export function FortuneCard({ emoji, label, content }: FortuneCardProps) {
  const [isExpanded, setIsExpanded] = useState(content.length <= 300)

  const displayContent =
    isExpanded || content.length <= 300
      ? content
      : content.slice(0, 300) + '...'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {displayContent}
        </p>
        {content.length > 300 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                더 보기
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
