import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { confirmPayment } from '@/lib/payments/toss';
import { createServiceClient } from '@/backend/supabase/client';

/**
 * GET /api/billing/issue
 * 토스페이먼츠 결제 성공 후 리다이렉트
 * paymentKey를 받아서 결제를 승인하고 구독 정보 업데이트
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const { searchParams } = new URL(req.url);
    const paymentKey = searchParams.get('paymentKey');
    const customerKey = searchParams.get('customerKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !customerKey || !orderId || !amount) {
      console.error('필수 파라미터 누락:', { paymentKey, customerKey, orderId, amount });
      return NextResponse.redirect(
        new URL('/checkout?error=missing_parameters', req.url)
      );
    }

    // 1. 결제 승인
    console.log('결제 승인 시작:', { paymentKey, orderId, amount });
    const paymentResponse = await confirmPayment({
      paymentKey,
      orderId,
      amount: parseInt(amount),
    });

    if (!paymentResponse || paymentResponse.status !== 'DONE') {
      console.error('결제 승인 실패:', paymentResponse);
      return NextResponse.redirect(
        new URL('/checkout?error=payment_confirmation_failed', req.url)
      );
    }

    console.log('결제 승인 성공:', paymentResponse);

    // 2. Supabase 업데이트
    const supabase = createServiceClient({
      url: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // 카드 정보를 빌링키로 저장 (paymentResponse에서 card 정보 추출)
    const cardInfo = paymentResponse.card;

    // 사용자 구독 정보 업데이트
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'pro',
        remaining_analyses: 10,
        billing_key: cardInfo?.issuerCode || paymentKey, // 카드 발급사 코드를 빌링키로 사용
        subscription_start_date: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    if (userUpdateError) {
      console.error('사용자 구독 정보 업데이트 실패:', userUpdateError);
      // 결제는 성공했으므로 계속 진행
    }

    // 결제 내역 저장
    const { error: paymentHistoryError } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        order_id: orderId,
        payment_key: paymentKey,
        amount: 10000,
        status: 'done',
        method: paymentResponse.method || 'CARD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (paymentHistoryError) {
      console.error('결제 내역 저장 실패:', paymentHistoryError);
      // 결제는 성공했으므로 계속 진행
    }

    // 3. 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/subscription?success=true', req.url));
  } catch (error) {
    console.error('결제 처리 중 오류:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=payment_failed', req.url)
    );
  }
}
