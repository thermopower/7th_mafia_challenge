import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { ShareModal } from './share-modal';
import * as useCreateShareLinkHook from '@/features/share/hooks/use-create-share-link';
import * as useKakaoShareHook from '@/features/share/hooks/use-kakao-share';

vi.mock('@/features/share/hooks/use-create-share-link');
vi.mock('@/features/share/hooks/use-kakao-share');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ShareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useKakaoShareHook, 'useKakaoShare').mockReturnValue({
      shareToKakao: vi.fn(),
    } as any);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it('should open and close modal correctly', () => {
    // Arrange
    const mockOnClose = vi.fn();
    vi.spyOn(useCreateShareLinkHook, 'useCreateShareLink').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    // Act
    renderWithProviders(<ShareModal analysisId="test-123" isOpen={true} onClose={mockOnClose} />);

    // Assert
    expect(screen.getByText('분석 결과 공유하기')).toBeInTheDocument();
    expect(screen.getByText('공유 링크 생성')).toBeInTheDocument();
  });

  it('should generate share link when button clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockMutate = vi.fn((analysisId, options) => {
      if (options?.onSuccess) {
        options.onSuccess({ shareUrl: 'https://example.com/share/abc123' });
      }
    });

    vi.spyOn(useCreateShareLinkHook, 'useCreateShareLink').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    // Act
    renderWithProviders(<ShareModal analysisId="test-123" isOpen={true} onClose={vi.fn()} />);

    const generateButton = screen.getByText('공유 링크 생성');
    await user.click(generateButton);

    // Assert
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('test-123', expect.any(Object));
    });
  });

  it('should show share URL after generation', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockMutate = vi.fn((analysisId, options) => {
      if (options?.onSuccess) {
        options.onSuccess({ shareUrl: 'https://example.com/share/abc123' });
      }
    });

    vi.spyOn(useCreateShareLinkHook, 'useCreateShareLink').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    // Act
    renderWithProviders(<ShareModal analysisId="test-123" isOpen={true} onClose={vi.fn()} />);

    const generateButton = screen.getByText('공유 링크 생성');
    await user.click(generateButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/share/abc123')).toBeInTheDocument();
    });
  });
});
