'use client';

import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface ProfileEmptyStateProps {
  onAddClick: () => void;
}

export function ProfileEmptyState({ onAddClick }: ProfileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <UserPlus className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">저장된 프로필이 없습니다</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        자주 보는 사람의 정보를 프로필로 저장하여
        <br />
        다음 분석 시 빠르게 정보를 불러올 수 있습니다
      </p>
      <Button onClick={onAddClick}>
        <UserPlus className="w-4 h-4 mr-2" />
        첫 프로필 추가하기
      </Button>
    </div>
  );
}
