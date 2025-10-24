'use client';

import { Badge } from '@/components/ui/badge';
import { useUserQuota } from '@/features/user/hooks/use-user-quota';
import { Loader2 } from 'lucide-react';

export const QuotaBadge = () => {
  const { data, isLoading } = useUserQuota();

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!data) return null;

  const variant = data.remainingAnalyses <= 3 ? 'destructive' : 'secondary';

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>
        남은 횟수: {data.remainingAnalyses}회
      </Badge>
      <Badge variant="outline">
        {data.plan === 'pro' ? 'Pro' : '무료'}
      </Badge>
    </div>
  );
};
