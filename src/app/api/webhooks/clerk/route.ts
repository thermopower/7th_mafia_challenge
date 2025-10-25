/**
 * Clerk Webhook 핸들러
 * Clerk 이벤트 수신 및 Supabase 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { createServiceClient } from '@/backend/supabase/client'
import { getAppConfig } from '@/backend/config'

export const runtime = 'nodejs'

// GET 요청 핸들러 (엔드포인트 확인용)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Clerk webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log('='.repeat(80))
  console.log(`[Clerk Webhook] ${timestamp} - WEBHOOK REQUEST RECEIVED`)
  console.log('='.repeat(80))
  console.log('[Clerk Webhook] Request URL:', req.url)
  console.log('[Clerk Webhook] Request Method:', req.method)
  console.log('[Clerk Webhook] Headers:', Object.fromEntries(req.headers))

  // Webhook 검증
  let evt: any

  try {
    console.log('[Clerk Webhook] Attempting to verify webhook...')
    evt = await verifyWebhook(req)
    console.log('[Clerk Webhook] Verification successful, event type:', evt.type)
  } catch (err) {
    console.error('[Clerk Webhook] Verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const config = getAppConfig()
  const supabase = createServiceClient({
    url: config.supabase.url,
    serviceRoleKey: config.supabase.serviceRoleKey,
  })

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, email_addresses } = evt.data
        const email = email_addresses?.[0]?.email_address ?? null

        console.log('[Clerk Webhook] Processing user.created event:', { id, email })

        const { data, error } = await supabase.from('users').insert({
          clerk_id: id,
          email: email,
          subscription_tier: 'free',
          remaining_analyses: 3,
        })

        if (error) {
          console.error('[Clerk Webhook] ❌ DB insert failed:', {
            clerkId: id,
            email: email,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            errorCode: error.code,
          })
          return NextResponse.json(
            { error: 'Database insert failed', details: error.message },
            { status: 500 }
          )
        }

        console.log('[Clerk Webhook] ✅ User created successfully:', { id, email, data })
        break
      }

      case 'user.updated': {
        const { id, email_addresses } = evt.data
        const email = email_addresses?.[0]?.email_address ?? null

        await supabase
          .from('users')
          .update({ email: email })
          .eq('clerk_id', id)

        console.info(`User updated: ${id}`)
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('clerk_id', id)

        console.info(`User deleted (soft): ${id}`)
        break
      }

      default:
        console.warn(`Unhandled webhook event type: ${evt.type}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Clerk webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
