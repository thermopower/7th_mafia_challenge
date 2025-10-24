/**
 * 분석 관련 서비스 레이어
 * Supabase 접근 및 비즈니스 로직
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnalysisCreateInput } from './schema'
import { AnalysisCreateError, ERROR_CODES, ERROR_MESSAGES } from './error'
import { calculateSaju } from '@/lib/saju/calculate'
import { lunarToSolar } from '@/lib/date/lunar'
import { generateAnalysis } from '@/lib/gemini/client'
import { createAnalysisPrompt } from '@/lib/gemini/prompts'
import type { AppLogger } from '@/backend/middleware/logger'
import type { AppConfig } from '@/backend/config'

/**
 * 사용자 잔여 횟수 조회
 */
export const getUserQuotaService = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('remaining_analyses, subscription_tier')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error) {
    throw new AnalysisCreateError(ERROR_CODES.USER_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND])
  }

  return {
    remaining: user.remaining_analyses as number,
    tier: user.subscription_tier as 'free' | 'pro',
  }
}

/**
 * 분석 생성 서비스
 */
export const createAnalysisService = async (
  supabase: SupabaseClient,
  logger: AppLogger,
  config: AppConfig,
  userId: string,
  input: AnalysisCreateInput
): Promise<string> => {
  // 1. 사용자 정보 조회 및 잔여 횟수 확인
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (userError) {
    logger.error('Failed to fetch user', userError)
    throw new AnalysisCreateError(ERROR_CODES.USER_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND])
  }

  if ((user.remaining_analyses as number) <= 0) {
    throw new AnalysisCreateError(ERROR_CODES.INSUFFICIENT_QUOTA, ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_QUOTA])
  }

  // 2. 음력 → 양력 변환 (필요시)
  let birthDate = new Date(input.birthDate)
  if (input.isLunar) {
    try {
      birthDate = lunarToSolar(birthDate)
    } catch (error) {
      logger.error('Failed to convert lunar to solar', error)
      throw new AnalysisCreateError(ERROR_CODES.INVALID_LUNAR_DATE, ERROR_MESSAGES[ERROR_CODES.INVALID_LUNAR_DATE])
    }
  }

  // 3. 사주팔자 계산
  const sajuData = calculateSaju(birthDate, input.birthTime, input.isLunar)

  // 4. AI 모델 선택
  const model = (user.subscription_tier as string) === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'

  // 5. 프롬프트 생성 및 AI 호출
  const prompt = createAnalysisPrompt(input.name, input.gender, sajuData, input.analysisType)

  let analysisResult
  try {
    analysisResult = await generateAnalysis(prompt, model)
  } catch (error) {
    logger.error('AI API call failed', error)
    throw new AnalysisCreateError(ERROR_CODES.AI_API_ERROR, ERROR_MESSAGES[ERROR_CODES.AI_API_ERROR])
  }

  // 6. 트랜잭션: 분석 저장 + 횟수 차감 + (선택) 프로필 저장
  // 분석 결과 저장
  const { data: analysis, error: insertError } = await supabase
    .from('user_analyses')
    .insert({
      user_id: user.id as string,
      name: input.name,
      gender: input.gender,
      birth_date: birthDate.toISOString().split('T')[0],
      birth_time: input.birthTime || null,
      is_lunar: input.isLunar,
      analysis_type: input.analysisType,
      model_used: model,
      result_json: analysisResult,
    })
    .select('id')
    .single()

  if (insertError) {
    logger.error('Failed to insert analysis', insertError)
    throw new AnalysisCreateError(ERROR_CODES.INTERNAL_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR])
  }

  // 7. 잔여 횟수 차감
  const { error: updateError } = await supabase
    .from('users')
    .update({ remaining_analyses: (user.remaining_analyses as number) - 1 })
    .eq('id', user.id as string)

  if (updateError) {
    logger.error('Failed to update user credits', updateError)
    // 이미 분석은 저장되었으므로 롤백이 필요하지만, 현재는 단순히 로깅만
    // 실제로는 Postgres 트랜잭션을 사용해야 함
  }

  // 8. 프로필 저장 (선택)
  if (input.saveAsProfile) {
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: user.id as string,
      name: input.name,
      gender: input.gender,
      birth_date: birthDate.toISOString().split('T')[0],
      birth_time: input.birthTime || null,
      is_lunar: input.isLunar,
    })

    if (profileError) {
      // 프로필 저장 실패는 무시 (중복 등)
      logger.warn('Failed to save profile', profileError)
    }
  }

  return analysis.id as string
}
