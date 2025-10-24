/**
 * 카카오톡 공유 기능
 */

'use client'

declare global {
  interface Window {
    Kakao: any
  }
}

/**
 * 카카오 SDK 초기화
 */
export const initKakao = () => {
  if (typeof window === 'undefined') return
  if (window.Kakao?.isInitialized()) return

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
  if (!key) {
    console.warn('NEXT_PUBLIC_KAKAO_JS_KEY not found')
    return
  }

  window.Kakao.init(key)
  console.info('Kakao SDK initialized')
}

/**
 * 카카오톡 공유 파라미터
 */
export type ShareToKakaoParams = {
  title: string
  description: string
  imageUrl: string
  linkUrl: string
}

/**
 * 카카오톡 공유
 */
export const shareToKakao = (params: ShareToKakaoParams) => {
  if (!window.Kakao?.isInitialized()) {
    console.error('Kakao SDK not initialized')
    return
  }

  window.Kakao.Link.sendDefault({
    objectType: 'feed',
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl,
      link: {
        mobileWebUrl: params.linkUrl,
        webUrl: params.linkUrl,
      },
    },
  })
}
