import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('Clipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should copy text to clipboard successfully', async () => {
    // Arrange: navigator.clipboard 모킹
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Act: 클립보드 복사
    const result = await copyToClipboard('https://example.com/share/abc123');

    // Assert: 성공 확인
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('https://example.com/share/abc123');
  });

  it('should handle clipboard write failure', async () => {
    // Arrange: clipboard 에러
    const mockError = new Error('Clipboard write failed');
    const mockWriteText = vi.fn().mockRejectedValue(mockError);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act: 클립보드 복사 실패
    const result = await copyToClipboard('test text');

    // Assert: 실패 확인
    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to copy to clipboard:',
      mockError
    );

    consoleErrorSpy.mockRestore();
  });

  it('should copy long text successfully', async () => {
    // Arrange
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    const longText = 'a'.repeat(1000);

    // Act: 긴 텍스트 복사
    const result = await copyToClipboard(longText);

    // Assert: 성공 확인
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith(longText);
  });

  it('should handle empty string', async () => {
    // Arrange
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Act: 빈 문자열 복사
    const result = await copyToClipboard('');

    // Assert: 성공 확인
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('');
  });
});
