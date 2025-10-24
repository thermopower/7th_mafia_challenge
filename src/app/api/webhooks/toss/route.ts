/**
 * 토스페이먼츠 Webhook 핸들러
 * 결제 이벤트 수신 및 DB 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/backend/supabase/client'
import { getPayment } from '@/lib/payments/toss'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const event = await req.json()
  const supabase = createClient()

  try {
    switch (event.eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, orderId, status } = event.data

        // 토스페이먼츠 조회 API로 교차 검증
        const payment = await getPayment(paymentKey)

        // payment_history 업데이트
        await supabase
          .from('payment_history')
          .update({
            status: payment.status,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId)

        console.info(`Payment status changed: ${orderId} -> ${payment.status}`)
        break
      }

      case 'DEPOSIT_CALLBACK': {
        // 가상계좌 입금 완료 이벤트
        const { secret, orderId, status } = event

        // secret 검증 (가상계좌 전용)
        const { data: payment } = await supabase
          .from('payment_history')
          .select('*')
          .eq('order_id', orderId)
          .single()

        if (!payment) {
          console.error(`Payment not found: ${orderId}`)
          return NextResponse.json({ ok: false }, { status: 404 })
        }

        // TODO: secret 일치 확인 로직 추가
        // (가상계좌 생성 시 저장한 secret과 비교)

        if (status === 'DONE') {
          await supabase
            .from('payment_history')
            .update({
              status: 'done',
              updated_at: new Date().toISOString(),
            })
            .eq('order_id', orderId)

          console.info(`Virtual account payment completed: ${orderId}`)
        }

        break
      }

      default:
        console.warn(`Unhandled Toss webhook event type: ${event.eventType}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Toss webhook processing error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
