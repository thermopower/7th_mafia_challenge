/**
 * 클립보드 복사 기능
 */

/**
 * 클립보드에 텍스트 복사
 * @returns 성공 여부
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
