/**
 * 분석 결과를 PDF로 다운로드하는 훅
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { generateAnalysisPDF, type AnalysisPDFData } from '../lib/generate-pdf'

export function useDownloadPDF() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPDF = async (data: AnalysisPDFData, analysisId: string) => {
    setIsGenerating(true)

    try {
      await generateAnalysisPDF(data, analysisId)
      toast.success('PDF 다운로드가 완료되었습니다')
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      toast.error('PDF 생성에 실패했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    downloadPDF,
    isGenerating,
  }
}
