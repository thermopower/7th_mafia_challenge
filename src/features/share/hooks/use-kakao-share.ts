'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao: any
  }
}

export function useKakaoShare() {
  useEffect(() => {
    if (!window.Kakao) {
      const script = document.createElement('script')
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        if (!window.Kakao.isInitialized()) {
          const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
          if (kakaoKey) {
            window.Kakao.init(kakaoKey)
          }
        }
      }
    }
  }, [])

  const shareToKakao = (url: string, title: string) => {
    if (!window.Kakao) {
      console.error('Kakao SDK not loaded')
      return
    }

    window.Kakao.Link.sendDefault({
      objectType: 'feed',
      content: {
        title: `${title}`,
        description: '운명의 해석을 확인해보세요',
        imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
      buttons: [
        {
          title: '분석 결과 보기',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      ],
    })
  }

  return { shareToKakao }
}
