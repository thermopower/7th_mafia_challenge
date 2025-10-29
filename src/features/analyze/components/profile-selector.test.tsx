import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/utils/test-helpers';
import { ProfileSelector } from './profile-selector';
import * as useProfilesListHook from '@/features/profile/hooks/use-profiles-list';

vi.mock('@/features/profile/hooks/use-profiles-list');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockProfiles = {
  profiles: [
    {
      id: 'profile-1',
      name: '홍길동',
      gender: 'male',
      birthDate: '1990-01-01',
      isLunar: false,
      birthTime: '10:00',
      userId: 'user-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'profile-2',
      name: '김철수',
      gender: 'male',
      birthDate: '1985-05-15',
      isLunar: true,
      birthTime: null,
      userId: 'user-1',
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ],
};

describe('ProfileSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile list', () => {
    // Arrange
    vi.spyOn(useProfilesListHook, 'useProfilesList').mockReturnValue({
      data: mockProfiles,
      isLoading: false,
    } as any);

    // Act
    renderWithProviders(<ProfileSelector />);

    // Assert
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText(/남성.*1990-01-01/)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    // Arrange
    vi.spyOn(useProfilesListHook, 'useProfilesList').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    // Act
    renderWithProviders(<ProfileSelector />);

    // Assert
    expect(screen.getByText(/프로필 목록을 불러오는 중/i)).toBeInTheDocument();
  });

  it('should show empty state when no profiles exist', () => {
    // Arrange
    vi.spyOn(useProfilesListHook, 'useProfilesList').mockReturnValue({
      data: { profiles: [] },
      isLoading: false,
    } as any);

    // Act
    renderWithProviders(<ProfileSelector />);

    // Assert
    expect(screen.getByText('저장된 프로필이 없습니다')).toBeInTheDocument();
    expect(screen.getByText(/새로 입력하기 탭에서/)).toBeInTheDocument();
  });
});
