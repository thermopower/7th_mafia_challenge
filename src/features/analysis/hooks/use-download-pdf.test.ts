import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDownloadPDF } from './use-download-pdf';
import * as generatePdf from '../lib/generate-pdf';
import { toast } from 'sonner';

// 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../lib/generate-pdf', () => ({
  generateAnalysisPDF: vi.fn(),
}));

describe('useDownloadPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate PDF successfully', async () => {
    // Arrange
    const mockData = {
      name: '홍길동',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      analysisType: 'monthly' as const,
      resultJson: {
        general: '전체 운세',
        wealth: '재물운',
        love: '애정운',
        health: '건강운',
        job: '직업운',
      },
    };

    vi.spyOn(generatePdf, 'generateAnalysisPDF').mockResolvedValue(undefined);

    // Act
    const { result } = renderHook(() => useDownloadPDF());

    expect(result.current.isGenerating).toBe(false);

    // PDF 다운로드 실행
    await act(async () => {
      await result.current.downloadPDF(mockData, 'analysis-123');
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(generatePdf.generateAnalysisPDF).toHaveBeenCalledWith(
      mockData,
      'analysis-123'
    );
    expect(toast.success).toHaveBeenCalledWith('PDF 다운로드가 완료되었습니다');
  });

  it('should handle PDF generation error', async () => {
    // Arrange: PDF 생성 실패
    const mockData = {
      name: '김철수',
      gender: 'male' as const,
      birthDate: '1990-01-01',
      analysisType: 'yearly' as const,
      resultJson: {
        general: '전체 운세',
        wealth: '재물운',
        love: '애정운',
        health: '건강운',
        job: '직업운',
      },
    };

    const mockError = new Error('PDF generation failed');
    vi.spyOn(generatePdf, 'generateAnalysisPDF').mockRejectedValue(mockError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useDownloadPDF());

    await act(async () => {
      await result.current.downloadPDF(mockData, 'analysis-456');
    });

    // Assert
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith('PDF 생성에 실패했습니다');
    expect(consoleErrorSpy).toHaveBeenCalledWith('PDF 생성 오류:', mockError);

    consoleErrorSpy.mockRestore();
  });

  it('should toggle isGenerating state during PDF generation', async () => {
    // Arrange
    const mockData = {
      name: '이영희',
      gender: 'female' as const,
      birthDate: '1990-01-01',
      analysisType: 'lifetime' as const,
      resultJson: {
        general: '전체 운세',
        wealth: '재물운',
        love: '애정운',
        health: '건강운',
        job: '직업운',
      },
    };

    let resolveGeneration: () => void;
    const generationPromise = new Promise<void>((resolve) => {
      resolveGeneration = resolve;
    });

    vi.spyOn(generatePdf, 'generateAnalysisPDF').mockReturnValue(generationPromise);

    // Act
    const { result } = renderHook(() => useDownloadPDF());

    expect(result.current.isGenerating).toBe(false);

    // PDF 생성 시작
    act(() => {
      result.current.downloadPDF(mockData, 'analysis-789');
    });

    // Assert: 생성 중 상태
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });

    // 생성 완료
    act(() => {
      resolveGeneration!();
    });

    // Assert: 생성 완료 후 상태
    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });
});
