/**
 * 결제 승인 Service Layer
 * 빌링키 발급, 첫 결제 실행, DB 트랜잭션 처리
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppLogger } from '@/backend/hono/context'
import { issueBillingKey, chargeBilling, deleteBillingKey } from '@/lib/payments/toss'
import type { ConfirmPaymentResponse } from './schema'
import { PaymentError } from './error'

type ConfirmPaymentServiceParams = {
  supabase: SupabaseClient
  logger: AppLogger
  userId: string
  authKey: string
  customerKey: string
  orderId: string
}

/**
 * 결제 승인 서비스
 * 1. 중복 처리 방지
 * 2. 빌링키 발급
 * 3. 첫 결제 실행
 * 4. DB 트랜잭션 (users + payment_history)
 * 5. Clerk 메타데이터 업데이트
 */
export async function confirmPaymentService(
  params: ConfirmPaymentServiceParams
): Promise<ConfirmPaymentResponse> {
  const { supabase, logger, userId, authKey, customerKey, orderId } = params

  // 1. 주문 조회 및 중복 처리 방지
  const { data: existingPayment, error: paymentError } = await supabase
    .from('payment_history')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (paymentError && paymentError.code !== 'PGRST116') {
    logger.error('주문 조회 실패', { error: paymentError })
    throw new PaymentError('DB_UPDATE_FAILED', '주문 조회에 실패했습니다')
  }

  if (existingPayment && existingPayment.status === 'done') {
    logger.info('이미 처리된 주문', { orderId })

    // 이미 처리된 경우 현재 구독 정보 반환
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_tier, remaining_analyses, next_billing_date')
      .eq('id', userId)
      .single()

    if (userError) {
      logger.error('사용자 조회 실패', { error: userError })
      throw new PaymentError('DB_UPDATE_FAILED', '사용자 정보 조회에 실패했습니다')
    }

    return {
      success: true,
      subscriptionTier: user?.subscription_tier || 'free',
      remainingAnalyses: user?.remaining_analyses || 0,
      nextBillingDate: user?.next_billing_date || '',
    }
  }

  // 2. 토스페이먼츠 빌링키 발급
  logger.info('빌링키 발급 시작', { authKey, customerKey })

  let billingKeyResponse
  try {
    billingKeyResponse = await issueBillingKey({ authKey, customerKey })
  } catch (error) {
    logger.error('빌링키 발급 실패', { error })
    throw new PaymentError('BILLING_KEY_ISSUE_FAILED', '빌링키 발급에 실패했습니다')
  }

  const billingKey = billingKeyResponse.billingKey

  if (!billingKey) {
    throw new PaymentError('BILLING_KEY_ISSUE_FAILED', '빌링키가 발급되지 않았습니다')
  }

  logger.info('빌링키 발급 성공', { billingKey })

  try {
    // 3. 첫 결제 실행
    logger.info('첫 결제 실행 시작', { billingKey, orderId })

    const paymentResponse = await chargeBilling({
      billingKey,
      orderId,
      orderName: 'SuperNext Pro 구독',
      amount: 10000,
      customerKey,
    })

    if (paymentResponse.status !== 'DONE') {
      throw new PaymentError('FIRST_PAYMENT_FAILED', '결제가 완료되지 않았습니다')
    }

    logger.info('첫 결제 성공', { paymentKey: paymentResponse.paymentKey })

    // 4. DB 트랜잭션 처리
    const nextBillingDate = new Date()
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

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
      .eq('id', userId)

    if (userUpdateError) {
      logger.error('사용자 구독 정보 업데이트 실패', { error: userUpdateError })
      throw new PaymentError('DB_UPDATE_FAILED', '사용자 구독 정보 업데이트에 실패했습니다')
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
      })

    if (paymentHistoryError) {
      logger.error('결제 내역 저장 실패', { error: paymentHistoryError })
      throw new PaymentError('DB_UPDATE_FAILED', '결제 내역 저장에 실패했습니다')
    }

    logger.info('결제 승인 완료', { userId, orderId })

    return {
      success: true,
      subscriptionTier: 'pro',
      remainingAnalyses: 10,
      nextBillingDate: nextBillingDate.toISOString(),
    }
  } catch (error) {
    // 첫 결제 실패 시 빌링키 삭제
    logger.error('결제 실패, 빌링키 삭제 시작', { billingKey })

    try {
      await deleteBillingKey(billingKey)
      logger.info('빌링키 삭제 완료', { billingKey })
    } catch (deleteError) {
      logger.error('빌링키 삭제 실패', { error: deleteError })
    }

    throw error
  }
}
