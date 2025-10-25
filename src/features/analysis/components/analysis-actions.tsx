'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2, Trash2 } from 'lucide-react'
import { ShareModal } from './share-modal'
import { DeleteConfirmModal } from './delete-confirm-modal'
import { useDownloadPDF } from '../hooks/use-download-pdf'
import type { AnalysisDetailResponse } from '../backend/schema'

interface AnalysisActionsProps {
  analysisId: string
  analysis: AnalysisDetailResponse['analysis']
  result: AnalysisDetailResponse['result']
}

export function AnalysisActions({ analysisId, analysis, result }: AnalysisActionsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { downloadPDF, isGenerating } = useDownloadPDF()

  const handlePDFDownload = () => {
    downloadPDF(
      {
        name: analysis.name,
        birthDate: analysis.birthDate,
        birthTime: analysis.birthTime,
        isLunar: analysis.isLunar,
        analysisType: analysis.analysisType,
        result,
      },
      analysisId
    )
  }

  return (
    <>
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={handlePDFDownload}
          disabled={isGenerating}
        >
          <Download className="mr-2 h-4 w-4" />
          {isGenerating ? 'PDF 생성 중...' : 'PDF로 저장'}
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
