'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCancelSubscription } from '@/features/subscription/hooks/use-cancel-subscription';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextBillingDate: string | null;
}

export const CancelSubscriptionModal = ({
  open,
  onOpenChange,
  nextBillingDate,
}: CancelSubscriptionModalProps) => {
  const { mutate: cancelSubscription, isPending } = useCancelSubscription();
  const { toast } = useToast();

  const handleConfirm = () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        toast({
          title: '구독 취소 예정',
          description: '다음 결제일까지 Pro 혜택이 유지됩니다.',
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: '구독 취소 실패',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            구독을 취소하시겠습니까?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-4 text-sm text-muted-foreground">
          <p>구독을 취소하시면 다음과 같이 처리됩니다:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              {nextBillingDate
                ? `${new Date(nextBillingDate).toLocaleDateString('ko-KR')}까지 Pro 혜택이 유지됩니다.`
                : '현재 기간 종료 시까지 Pro 혜택이 유지됩니다.'}
            </li>
            <li>이후 자동으로 무료 플랜으로 전환됩니다.</li>
            <li>남은 분석 횟수는 이월되지 않습니다.</li>
            <li>취소 철회는 만료 전까지 가능합니다.</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            돌아가기
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? '처리 중...' : '구독 취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
