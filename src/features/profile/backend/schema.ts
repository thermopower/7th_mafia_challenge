import { z } from 'zod';

// 테이블 Row 스키마
export const ProfileTableRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  gender: z.enum(['male', 'female']),
  birth_date: z.string(),
  birth_time: z.string().nullable(),
  is_lunar: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

export type ProfileRow = z.infer<typeof ProfileTableRowSchema>;

// API 응답 스키마
export const ProfileResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string(),
  birthTime: z.string().nullable(),
  isLunar: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

// 프로필 생성 요청 스키마
export const CreateProfileRequestSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이내로 입력해주세요'),
  gender: z.enum(['male', 'female'], { required_error: '성별을 선택해주세요' }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  isLunar: z.boolean().default(false),
});

export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;

// 프로필 수정 요청 스키마
export const UpdateProfileRequestSchema = CreateProfileRequestSchema.partial();
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// 프로필 목록 응답 스키마
export const ProfilesListResponseSchema = z.object({
  profiles: z.array(ProfileResponseSchema),
  total: z.number(),
  canAddMore: z.boolean(),
});

export type ProfilesListResponse = z.infer<typeof ProfilesListResponseSchema>;
