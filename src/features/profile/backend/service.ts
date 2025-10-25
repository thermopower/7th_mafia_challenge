import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ProfileTableRowSchema,
  ProfileResponseSchema,
  type ProfileResponse,
  type ProfileRow,
  type CreateProfileRequest,
  type UpdateProfileRequest,
  type ProfilesListResponse,
} from './schema';
import { profileErrorCodes, type ProfileServiceError } from './error';

const PROFILE_TABLE = 'user_profiles';

// Row를 Response로 변환
const mapRowToResponse = (row: ProfileRow): ProfileResponse => ({
  id: row.id,
  name: row.name,
  gender: row.gender,
  birthDate: row.birth_date,
  birthTime: row.birth_time,
  isLunar: row.is_lunar,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// 1. 프로필 목록 조회
export const getProfilesList = async (
  client: SupabaseClient,
  clerkId: string,
): Promise<HandlerResult<ProfilesListResponse, ProfileServiceError, unknown>> => {
  // clerk_id로 UUID user_id 조회
  const { data: userData, error: userError } = await client
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !userData) {
    return failure(500, profileErrorCodes.fetchError, userError?.message || 'User not found');
  }

  const userUuid = userData.id;
  const isPro = userData.subscription_tier === 'pro';

  // 프로필 목록 조회
  const { data, error, count } = await client
    .from(PROFILE_TABLE)
    .select('*', { count: 'exact' })
    .eq('user_id', userUuid)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, profileErrorCodes.fetchError, error.message);
  }

  // 검증
  const profiles: ProfileResponse[] = [];
  for (const row of data || []) {
    const rowParse = ProfileTableRowSchema.safeParse(row);
    if (!rowParse.success) continue;

    const mapped = mapRowToResponse(rowParse.data);
    const parsed = ProfileResponseSchema.safeParse(mapped);
    if (parsed.success) {
      profiles.push(parsed.data);
    }
  }

  const total = count || 0;
  const canAddMore = isPro || total < 5;

  return success({ profiles, total, canAddMore });
};

// 2. 프로필 생성
export const createProfile = async (
  client: SupabaseClient,
  clerkId: string,
  data: CreateProfileRequest,
): Promise<HandlerResult<ProfileResponse, ProfileServiceError, unknown>> => {
  // clerk_id로 UUID user_id 조회
  const { data: userData, error: userError } = await client
    .from('users')
    .select('id, subscription_tier')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !userData) {
    return failure(500, profileErrorCodes.fetchError, userError?.message || 'User not found');
  }

  const userUuid = userData.id;
  const isPro = userData.subscription_tier === 'pro';

  const { count } = await client
    .from(PROFILE_TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userUuid)
    .is('deleted_at', null);

  if (!isPro && (count || 0) >= 5) {
    return failure(
      403,
      profileErrorCodes.limitExceeded,
      '무료 플랜은 최대 5개의 프로필만 저장할 수 있습니다',
    );
  }

  // 중복 확인 (이름 + 생년월일)
  const { data: duplicate } = await client
    .from(PROFILE_TABLE)
    .select('id')
    .eq('user_id', userUuid)
    .eq('name', data.name)
    .eq('birth_date', data.birthDate)
    .is('deleted_at', null)
    .maybeSingle();

  if (duplicate) {
    return failure(
      400,
      profileErrorCodes.duplicateProfile,
      '동일한 프로필이 이미 존재합니다',
    );
  }

  // 프로필 생성
  const { data: newProfile, error: insertError } = await client
    .from(PROFILE_TABLE)
    .insert({
      user_id: userUuid,
      name: data.name,
      gender: data.gender,
      birth_date: data.birthDate,
      birth_time: data.birthTime || null,
      is_lunar: data.isLunar,
    })
    .select()
    .single<ProfileRow>();

  if (insertError) {
    return failure(500, profileErrorCodes.createError, insertError.message);
  }

  const rowParse = ProfileTableRowSchema.safeParse(newProfile);
  if (!rowParse.success) {
    return failure(
      500,
      profileErrorCodes.validationError,
      'Profile row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = mapRowToResponse(rowParse.data);
  const parsed = ProfileResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      profileErrorCodes.validationError,
      'Profile payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 3. 프로필 수정
export const updateProfile = async (
  client: SupabaseClient,
  clerkId: string,
  profileId: string,
  data: UpdateProfileRequest,
): Promise<HandlerResult<ProfileResponse, ProfileServiceError, unknown>> => {
  // clerk_id로 UUID user_id 조회
  const { data: userData, error: userError } = await client
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !userData) {
    return failure(500, profileErrorCodes.fetchError, userError?.message || 'User not found');
  }

  const userUuid = userData.id;

  // 권한 확인
  const { data: existing, error: fetchError } = await client
    .from(PROFILE_TABLE)
    .select('user_id')
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return failure(500, profileErrorCodes.fetchError, fetchError.message);
  }

  if (!existing) {
    return failure(404, profileErrorCodes.notFound, '프로필을 찾을 수 없습니다');
  }

  if (existing.user_id !== userUuid) {
    return failure(403, profileErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 업데이트할 필드 구성
  const updateFields: Record<string, unknown> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.gender !== undefined) updateFields.gender = data.gender;
  if (data.birthDate !== undefined) updateFields.birth_date = data.birthDate;
  if (data.birthTime !== undefined) updateFields.birth_time = data.birthTime || null;
  if (data.isLunar !== undefined) updateFields.is_lunar = data.isLunar;

  // 변경사항 없으면 현재 데이터 반환
  if (Object.keys(updateFields).length === 0) {
    const { data: current } = await client
      .from(PROFILE_TABLE)
      .select('*')
      .eq('id', profileId)
      .single<ProfileRow>();

    if (current) {
      const rowParse = ProfileTableRowSchema.safeParse(current);
      if (rowParse.success) {
        const mapped = mapRowToResponse(rowParse.data);
        return success(mapped);
      }
    }
  }

  // 프로필 업데이트
  const { data: updated, error: updateError } = await client
    .from(PROFILE_TABLE)
    .update(updateFields)
    .eq('id', profileId)
    .select()
    .single<ProfileRow>();

  if (updateError) {
    return failure(500, profileErrorCodes.updateError, updateError.message);
  }

  const rowParse = ProfileTableRowSchema.safeParse(updated);
  if (!rowParse.success) {
    return failure(
      500,
      profileErrorCodes.validationError,
      'Profile row failed validation.',
      rowParse.error.format(),
    );
  }

  const mapped = mapRowToResponse(rowParse.data);
  const parsed = ProfileResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      profileErrorCodes.validationError,
      'Profile payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 4. 프로필 삭제
export const deleteProfile = async (
  client: SupabaseClient,
  clerkId: string,
  profileId: string,
): Promise<HandlerResult<{ success: true }, ProfileServiceError, unknown>> => {
  // clerk_id로 UUID user_id 조회
  const { data: userData, error: userError } = await client
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (userError || !userData) {
    return failure(500, profileErrorCodes.fetchError, userError?.message || 'User not found');
  }

  const userUuid = userData.id;

  // 권한 확인
  const { data: existing, error: fetchError } = await client
    .from(PROFILE_TABLE)
    .select('user_id')
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    return failure(500, profileErrorCodes.fetchError, fetchError.message);
  }

  if (!existing) {
    return failure(404, profileErrorCodes.notFound, '프로필을 찾을 수 없습니다');
  }

  if (existing.user_id !== userUuid) {
    return failure(403, profileErrorCodes.unauthorized, '권한이 없습니다');
  }

  // 소프트 삭제
  const { error: deleteError } = await client
    .from(PROFILE_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', profileId);

  if (deleteError) {
    return failure(500, profileErrorCodes.deleteError, deleteError.message);
  }

  return success({ success: true });
};
