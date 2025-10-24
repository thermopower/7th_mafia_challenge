'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateShareLink } from '@/features/share/hooks/use-create-share-link'
import { useKakaoShare } from '@/features/share/hooks/use-kakao-share'
import { useToast } from '@/hooks/use-toast'
import { Copy, MessageCircle } from 'lucide-react'

interface ShareModalProps {
  analysisId: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ analysisId, isOpen, onClose }: ShareModalProps) {
  const { mutate: createShareLink, isPending } = useCreateShareLink()
  const { shareToKakao } = useKakaoShare()
  const { toast } = useToast()
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const handleGenerateLink = () => {
    createShareLink(analysisId, {
      onSuccess: (data) => {
        setShareUrl(data.shareUrl)
      },
    })
  }

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: '링크 복사 완료',
        description: '공유 링크가 클립보드에 복사되었습니다.',
      })
    }
  }

  const handleKakaoShare = () => {
    if (!shareUrl) return
    shareToKakao(shareUrl, '사주 분석 결과')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>분석 결과 공유하기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!shareUrl && (
            <Button
              onClick={handleGenerateLink}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? '링크 생성 중...' : '공유 링크 생성'}
            </Button>
          )}
          {shareUrl && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-muted"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleKakaoShare} className="w-full" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                카카오톡으로 공유
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
