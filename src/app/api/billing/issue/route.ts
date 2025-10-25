import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { issueBillingKey, chargeBilling } from '@/lib/payments/toss';
import { createServiceClient } from '@/backend/supabase/client';

/**
 * GET /api/billing/issue
 * 토스페이먼츠 빌링 인증 성공 후 리다이렉트
 * authKey를 받아서 billingKey를 발급하고 첫 결제를 실행
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const { searchParams } = new URL(req.url);
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const orderId = searchParams.get('orderId');

    if (!authKey || !customerKey || !orderId) {
      console.error('필수 파라미터 누락:', { authKey, customerKey, orderId });
      return NextResponse.redirect(
        new URL('/checkout?error=missing_parameters', req.url)
      );
    }

    // 1. 빌링키 발급
    console.log('빌링키 발급 시작:', { authKey, customerKey });
    const billingKeyResponse = await issueBillingKey({ authKey, customerKey });
    const billingKey = billingKeyResponse.billingKey;

    if (!billingKey) {
      console.error('빌링키 발급 실패:', billingKeyResponse);
      return NextResponse.redirect(
        new URL('/checkout?error=billing_key_issue_failed', req.url)
      );
    }

    console.log('빌링키 발급 성공:', billingKey);

    // 2. 첫 결제 실행
    console.log('첫 결제 실행 시작:', { billingKey, orderId });
    const paymentResponse = await chargeBilling({
      billingKey,
      orderId,
      orderName: 'SuperNext Pro 구독',
      amount: 10000,
      customerKey,
    });

    if (paymentResponse.status !== 'DONE') {
      console.error('첫 결제 실패:', paymentResponse);
      return NextResponse.redirect(
        new URL('/checkout?error=first_payment_failed', req.url)
      );
    }

    console.log('첫 결제 성공:', paymentResponse.paymentKey);

    // 3. Supabase 업데이트
    const supabase = createServiceClient({
      url: process.env.SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // 사용자 구독 정보 업데이트
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'pro',
        remaining_analyses: 10,
        billing_key: billingKey,
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
        payment_key: paymentResponse.paymentKey,
        amount: 10000,
        status: 'done',
        method: paymentResponse.method || 'billing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (paymentHistoryError) {
      console.error('결제 내역 저장 실패:', paymentHistoryError);
      // 결제는 성공했으므로 계속 진행
    }

    // 4. 성공 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/subscription?success=true', req.url));
  } catch (error) {
    console.error('빌링 발급 처리 중 오류:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=billing_issue_failed', req.url)
    );
  }
}
