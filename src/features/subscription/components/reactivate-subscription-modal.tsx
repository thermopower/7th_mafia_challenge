'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReactivateSubscription } from '@/features/subscription/hooks/use-reactivate-subscription';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

interface ReactivateSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReactivateSubscriptionModal = ({
  open,
  onOpenChange,
}: ReactivateSubscriptionModalProps) => {
  const { mutate: reactivateSubscription, isPending } = useReactivateSubscription();
  const { toast } = useToast();

  const handleConfirm = () => {
    reactivateSubscription(undefined, {
      onSuccess: () => {
        toast({
          title: '구독 재활성화 완료',
          description: 'Pro 구독이 다시 활성화되었습니다.',
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: '재활성화 실패',
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            구독을 재활성화하시겠습니까?
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-4">
            <p>구독을 재활성화하시면:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>즉시 Pro 혜택이 복원됩니다.</li>
              <li>다음 결제일에 자동 결제가 진행됩니다.</li>
              <li>월 10회 분석 횟수가 유지됩니다.</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? '처리 중...' : '재활성화'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
