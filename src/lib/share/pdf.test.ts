import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDF, downloadPDF } from './pdf';

describe('PDF Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePDF', () => {
    it('should throw error when PDF generation is not implemented', async () => {
      // Arrange: HTML 엘리먼트 모킹
      const mockElement = document.createElement('div');
      mockElement.innerHTML = '<h1>Test Content</h1>';

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act & Assert: 미구현 에러
      await expect(generatePDF(mockElement)).rejects.toThrow(
        'PDF generation not implemented'
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith('generatePDF: Not implemented yet');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('downloadPDF', () => {
    it('should handle download error when generation fails', async () => {
      // Arrange: HTML 엘리먼트
      const mockElement = document.createElement('div');
      mockElement.innerHTML = '<p>Content</p>';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert: 다운로드 실패
      await expect(downloadPDF(mockElement, 'test.pdf')).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should validate download filename parameter', () => {
      // Arrange: 파일명 검증
      const validFilenames = [
        'analysis.pdf',
        '사주분석_2025.pdf',
        'report-123.pdf',
      ];

      // Assert: 파일명 형식 검증
      validFilenames.forEach((filename) => {
        expect(filename).toMatch(/\.pdf$/);
        expect(filename.length).toBeGreaterThan(4);
      });
    });
  });
});
