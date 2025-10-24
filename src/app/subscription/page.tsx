'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SubscriptionStatusCard } from '@/features/subscription/components/subscription-status-card';
import { PlanComparisonTable } from '@/features/subscription/components/plan-comparison-table';
import { CancelSubscriptionModal } from '@/features/subscription/components/cancel-subscription-modal';
import { ReactivateSubscriptionModal } from '@/features/subscription/components/reactivate-subscription-modal';
import { PaymentHistoryTable } from '@/features/subscription/components/payment-history-table';
import { useSubscriptionStatus } from '@/features/subscription/hooks/use-subscription-status';

export default function SubscriptionPage() {
  const { data: subscription } = useSubscriptionStatus();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">구독 관리</h1>
        <p className="text-muted-foreground mt-2">
          구독 상태를 확인하고 플랜을 관리하세요.
        </p>
      </div>

      <SubscriptionStatusCard />

      {subscription && (
        <div className="flex gap-4">
          {subscription.plan === 'free' && (
            <Button size="lg" className="w-full md:w-auto">
              Pro로 업그레이드
            </Button>
          )}

          {subscription.plan === 'pro' && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowCancelModal(true)}
            >
              구독 취소
            </Button>
          )}

          {subscription.plan === 'pending_cancel' && (
            <Button
              size="lg"
              onClick={() => setShowReactivateModal(true)}
            >
              구독 재활성화
            </Button>
          )}
        </div>
      )}

      <PlanComparisonTable />

      <PaymentHistoryTable />

      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        nextBillingDate={subscription?.nextBillingDate || null}
      />

      <ReactivateSubscriptionModal
        open={showReactivateModal}
        onOpenChange={setShowReactivateModal}
      />
    </div>
  );
}
