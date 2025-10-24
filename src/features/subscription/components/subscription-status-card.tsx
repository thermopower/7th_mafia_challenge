'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscriptionStatus } from '@/features/subscription/hooks/use-subscription-status';
import { PLAN_STATUS_LABELS, PLANS } from '@/features/subscription/constants/plans';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const SubscriptionStatusCard = () => {
  const { data, isLoading, error } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구독 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구독 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">구독 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const planConfig = data.plan === 'pro' || data.plan === 'pending_cancel' ? PLANS.PRO : PLANS.FREE;
  const progressPercent = (data.remainingAnalyses / planConfig.monthlyAnalyses) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>현재 플랜</CardTitle>
          <Badge variant={data.plan === 'pro' ? 'default' : data.plan === 'pending_cancel' ? 'destructive' : 'secondary'}>
            {PLAN_STATUS_LABELS[data.plan]}
          </Badge>
        </div>
        <CardDescription>{planConfig.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>남은 분석 횟수</span>
            <span className="font-medium">
              {data.remainingAnalyses} / {planConfig.monthlyAnalyses}회
            </span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {data.nextBillingDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {data.plan === 'pending_cancel' ? '만료 예정일' : '다음 결제일'}
            </span>
            <span className="font-medium">
              {format(new Date(data.nextBillingDate), 'yyyy년 MM월 dd일', { locale: ko })}
            </span>
          </div>
        )}

        {data.subscriptionStartDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">구독 시작일</span>
            <span className="font-medium">
              {format(new Date(data.subscriptionStartDate), 'yyyy년 MM월 dd일', { locale: ko })}
            </span>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">사용 AI 모델</span>
            <span className="font-medium">{planConfig.model}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
