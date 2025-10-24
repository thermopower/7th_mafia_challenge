'use client'

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/remote/api-client'

export function useGeneratePDF() {
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await apiClient.post(
        `/api/analysis/${analysisId}/pdf`,
        {},
        { responseType: 'blob' }
      )

      // Blob을 다운로드로 트리거
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `analysis-${analysisId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
