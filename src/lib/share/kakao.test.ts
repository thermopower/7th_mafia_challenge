import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initKakao, shareToKakao } from './kakao';

describe('Kakao Share', () => {
  beforeEach(() => {
    // window.Kakao 모킹
    (global as any).window = {
      Kakao: {
        isInitialized: vi.fn().mockReturnValue(false),
        init: vi.fn(),
        Link: {
          sendDefault: vi.fn(),
        },
      },
    };

    process.env.NEXT_PUBLIC_KAKAO_JS_KEY = 'test-kakao-key';
  });

  afterEach(() => {
    delete (global as any).window;
    vi.clearAllMocks();
  });

  describe('initKakao', () => {
    it('should initialize Kakao SDK with API key', () => {
      // Arrange
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Act: 초기화
      initKakao();

      // Assert: init 호출 확인
      expect(window.Kakao.init).toHaveBeenCalledWith('test-kakao-key');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Kakao SDK initialized');

      consoleInfoSpy.mockRestore();
    });

    it('should not initialize if already initialized', () => {
      // Arrange: 이미 초기화됨
      window.Kakao.isInitialized = vi.fn().mockReturnValue(true);

      // Act: 초기화 시도
      initKakao();

      // Assert: init 호출 안됨
      expect(window.Kakao.init).not.toHaveBeenCalled();
    });

    it('should warn if API key is missing', () => {
      // Arrange: API 키 없음
      delete process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act: 초기화 시도
      initKakao();

      // Assert: 경고 메시지
      expect(consoleWarnSpy).toHaveBeenCalledWith('NEXT_PUBLIC_KAKAO_JS_KEY not found');
      expect(window.Kakao.init).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('shareToKakao', () => {
    it('should share content with valid parameters', () => {
      // Arrange: SDK 초기화됨
      window.Kakao.isInitialized = vi.fn().mockReturnValue(true);

      const params = {
        title: '2025년 1월 운세',
        description: '홍길동님의 월간 운세입니다.',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com/share/abc123',
      };

      // Act: 카카오톡 공유
      shareToKakao(params);

      // Assert: sendDefault 호출 확인
      expect(window.Kakao.Link.sendDefault).toHaveBeenCalledWith({
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
      });
    });

    it('should log error if SDK not initialized', () => {
      // Arrange: SDK 미초기화
      window.Kakao.isInitialized = vi.fn().mockReturnValue(false);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const params = {
        title: '운세 공유',
        description: '설명',
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: 'https://example.com/share',
      };

      // Act: 공유 시도
      shareToKakao(params);

      // Assert: 에러 로그
      expect(consoleErrorSpy).toHaveBeenCalledWith('Kakao SDK not initialized');
      expect(window.Kakao.Link.sendDefault).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
