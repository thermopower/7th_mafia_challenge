/**
 * PDF 생성 기능
 *
 * ⚠️ 주의: 현재는 더미 구현입니다.
 * 실제 서비스에서는 다음 중 하나를 사용해야 합니다:
 * 1. jsPDF + html2canvas
 * 2. html2pdf.js
 * 3. Puppeteer (서버 사이드)
 * 4. react-pdf
 */

/**
 * HTML 엘리먼트를 PDF로 변환
 *
 * TODO: 실제 PDF 생성 로직 구현 필요
 * 추천 라이브러리: jsPDF, html2pdf.js
 */
export const generatePDF = async (element: HTMLElement): Promise<Blob> => {
  // TODO: PDF 생성 로직 구현
  // 예시:
  // import html2pdf from 'html2pdf.js'
  // const pdf = await html2pdf().from(element).output('blob')
  // return pdf

  console.warn('generatePDF: Not implemented yet')
  throw new Error('PDF generation not implemented')
}

/**
 * PDF 다운로드
 */
export const downloadPDF = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    const blob = await generatePDF(element)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download PDF:', error)
    throw error
  }
}
