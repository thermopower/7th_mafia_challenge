'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { loadTossPayments, TossPaymentsPayment } from '@tosspayments/tosspayments-sdk';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { PLANS } from '@/features/subscription/constants/plans';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [payment, setPayment] = useState<TossPaymentsPayment | null>(null);

  useEffect(() => {
    if (!clientKey) {
      console.error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    loadTossPayments(clientKey)
      .then((tossPayments) => {
        // 결제창 생성
        const paymentInstance = tossPayments.payment({
          customerKey: user?.id || 'ANONYMOUS',
        });
        setPayment(paymentInstance);
      })
      .catch((error) => {
        console.error('토스페이먼츠 SDK 로드 실패:', error);
      });
  }, [user?.id]);

  const handlePayment = async () => {
    if (!user || !payment) {
      return;
    }

    setIsLoading(true);

    try {
      const orderId = `order-${user.id}-${Date.now()}`;
      const customerKey = user.id;

      // 토스페이먼츠 결제창 호출
      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: 10000,
        },
        orderId: orderId,
        orderName: 'SuperNext Pro 구독',
        successUrl: `${window.location.origin}/api/billing/issue?customerKey=${customerKey}&orderId=${orderId}`,
        failUrl: `${window.location.origin}/checkout?error=payment_failed`,
        customerEmail: user.emailAddresses[0]?.emailAddress,
        customerName: user.fullName || user.emailAddresses[0]?.emailAddress || '사용자',
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto py-16 text-center">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
        <Button
          onClick={() => router.push('/sign-in')}
          className="mt-4"
        >
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 space-y-8">
      <PageHeader
        title="Pro 플랜 구독"
        description="안전한 결제를 위해 토스페이먼츠를 사용합니다"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{PLANS.PRO.name}</CardTitle>
          <CardDescription>
            <span className="text-3xl font-bold text-foreground">
              ₩{PLANS.PRO.price.toLocaleString()}
            </span>
            <span className="text-muted-foreground ml-2">/월</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {PLANS.PRO.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>플랜</span>
                <span className="font-medium">Pro</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>결제 주기</span>
                <span className="font-medium">월간</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>합계</span>
                <span>₩{PLANS.PRO.price.toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading || !payment}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '카드 등록 및 구독하기'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              결제는 매월 자동으로 청구됩니다. 언제든지 구독을 취소할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>결제 관련 문의사항이 있으신가요?</p>
        <Button variant="link" className="h-auto p-0">
          고객 지원 센터
        </Button>
      </div>
    </div>
  );
}
