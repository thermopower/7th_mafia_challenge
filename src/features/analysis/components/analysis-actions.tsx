'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2, Trash2 } from 'lucide-react'
import { ShareModal } from './share-modal'
import { DeleteConfirmModal } from './delete-confirm-modal'
import { useGeneratePDF } from '../hooks/use-generate-pdf'
import { useToast } from '@/hooks/use-toast'

interface AnalysisActionsProps {
  analysisId: string
}

export function AnalysisActions({ analysisId }: AnalysisActionsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { mutate: generatePDF, isPending: isPDFGenerating } = useGeneratePDF()
  const { toast } = useToast()

  const handlePDFDownload = () => {
    generatePDF(analysisId, {
      onSuccess: () => {
        toast({
          title: 'PDF 다운로드 시작',
          description: '분석 결과를 PDF로 다운로드합니다.',
        })
      },
      onError: () => {
        toast({
          title: 'PDF 생성 실패',
          description: '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <>
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={handlePDFDownload}
          disabled={isPDFGenerating}
        >
          <Download className="mr-2 h-4 w-4" />
          {isPDFGenerating ? 'PDF 생성 중...' : 'PDF로 저장'}
        </Button>
        <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          공유하기
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsDeleteModalOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          삭제하기
        </Button>
      </div>

      <ShareModal
        analysisId={analysisId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <DeleteConfirmModal
        analysisId={analysisId}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  )
}
