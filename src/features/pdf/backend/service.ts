import type { SupabaseClient } from '@supabase/supabase-js'
import { success, failure } from '@/backend/http/response'
import { PDF_ERRORS } from './error'
import jsPDF from 'jspdf'

export async function generateAnalysisPDF(
  supabase: SupabaseClient,
  userId: string,
  analysisId: string
) {
  // 분석 데이터 조회
  const { data, error } = await supabase
    .from('user_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return failure(PDF_ERRORS.ANALYSIS_NOT_FOUND, 404)
  }

  try {
    // PDF 생성
    const doc = new jsPDF()
    const result = data.result_json as {
      general: string
      wealth: string
      love: string
      health: string
      job: string
    }

    // 헤더
    doc.setFontSize(20)
    doc.text(`${data.name}님의 사주 분석`, 20, 20)

    doc.setFontSize(12)
    doc.text(
      `생년월일: ${data.birth_date} (${data.is_lunar ? '음력' : '양력'})`,
      20,
      30
    )

    // 결과 내용
    let yPosition = 50
    const categories = [
      { key: 'general', label: '총운', emoji: '🌟' },
      { key: 'wealth', label: '재물운', emoji: '💰' },
      { key: 'love', label: '애정운', emoji: '💕' },
      { key: 'health', label: '건강운', emoji: '🏥' },
      { key: 'job', label: '직업운', emoji: '💼' },
    ] as const

    categories.forEach((cat) => {
      doc.setFontSize(16)
      doc.text(`${cat.emoji} ${cat.label}`, 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      const lines = doc.splitTextToSize(result[cat.key], 170)
      doc.text(lines, 20, yPosition)
      yPosition += lines.length * 5 + 10

      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
    })

    const pdfBlob = doc.output('blob')
    return success({ pdfBlob })
  } catch (err) {
    return failure(PDF_ERRORS.GENERATION_FAILED, 500)
  }
}
