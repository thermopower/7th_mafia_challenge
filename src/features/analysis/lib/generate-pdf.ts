/**
 * HTML을 PDF로 변환하는 유틸리티
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

import type { AnalysisDetailResponse } from '../backend/schema'

export interface AnalysisPDFData {
  name: string
  birthDate: string
  birthTime: string | null
  isLunar: boolean
  analysisType: string
  result: AnalysisDetailResponse['result']
}

/**
 * HTML 요소를 PDF로 변환
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    // HTML을 Canvas로 변환
    const canvas = await html2canvas(element, {
      scale: 2, // 고해상도
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Canvas를 이미지로 변환
    const imgData = canvas.toDataURL('image/png')

    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // 첫 페이지에 이미지 추가
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 여러 페이지가 필요한 경우 페이지 추가
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // PDF 다운로드
    pdf.save(filename)
  } catch (error) {
    console.error('PDF 생성 중 오류:', error)
    throw new Error('PDF 생성에 실패했습니다.')
  }
}

/**
 * 분석 데이터로부터 HTML 요소 생성 및 PDF 변환
 */
export async function generateAnalysisPDF(
  data: AnalysisPDFData,
  analysisId: string
): Promise<void> {
  // 임시 컨테이너 생성
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  container.style.padding = '20mm'
  container.style.backgroundColor = '#ffffff'
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif'

  // HTML 콘텐츠 생성
  const analysisTypeLabels = {
    monthly: '월간 운세',
    yearly: '신년 운세',
    lifetime: '평생 운세',
  }

  container.innerHTML = `
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
        ${data.name}님의 사주 분석
      </h1>
      <p style="font-size: 14px; color: #666; margin-bottom: 5px;">
        생년월일: ${data.birthDate} (${data.isLunar ? '음력' : '양력'})
      </p>
      ${data.birthTime ? `<p style="font-size: 14px; color: #666; margin-bottom: 5px;">태어난 시간: ${data.birthTime}</p>` : ''}
      <p style="font-size: 14px; color: #666;">
        분석 종류: ${analysisTypeLabels[data.analysisType as keyof typeof analysisTypeLabels] || data.analysisType}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
        🌟 총운
      </h2>
      <p style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #444;">
        ${data.result.general}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
        💰 재물운
      </h2>
      <p style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #444;">
        ${data.result.wealth}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
        💕 애정운
      </h2>
      <p style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #444;">
        ${data.result.love}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
        🏥 건강운
      </h2>
      <p style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #444;">
        ${data.result.health}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">
        💼 직업운
      </h2>
      <p style="font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #444;">
        ${data.result.job}
      </p>
    </div>
  `

  document.body.appendChild(container)

  try {
    await generatePDFFromElement(container, `analysis-${analysisId}.pdf`)
  } finally {
    // 임시 요소 제거
    document.body.removeChild(container)
  }
}
