'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProfileFormData, Profile } from '../types';

const profileFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이내로 입력해주세요'),
  gender: z.enum(['male', 'female'], { required_error: '성별을 선택해주세요' }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  isLunar: z.boolean(),
});

interface ProfileFormProps {
  defaultValues?: Partial<Profile>;
  onSubmit: (data: ProfileFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProfileForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      gender: defaultValues?.gender || 'male',
      birthDate: defaultValues?.birthDate || '',
      birthTime: defaultValues?.birthTime || '',
      isLunar: defaultValues?.isLunar || false,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="이름을 입력하세요"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="gender">성별</Label>
        <Select
          value={form.watch('gender')}
          onValueChange={(value) => form.setValue('gender', value as 'male' | 'female')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">남성</SelectItem>
            <SelectItem value="female">여성</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.gender && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.gender.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="birthDate">생년월일</Label>
        <Input
          id="birthDate"
          type="date"
          {...form.register('birthDate')}
        />
        {form.formState.errors.birthDate && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.birthDate.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="birthTime">태어난 시간 (선택)</Label>
        <Input
          id="birthTime"
          type="time"
          {...form.register('birthTime')}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isLunar"
          checked={form.watch('isLunar')}
          onCheckedChange={(checked) => form.setValue('isLunar', checked === true)}
        />
        <Label htmlFor="isLunar">음력</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}
