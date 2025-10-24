'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, User } from 'lucide-react';
import type { Profile } from '../types';
import { format } from 'date-fns';

interface ProfileCardProps {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

export function ProfileCard({ profile, onEdit, onDelete }: ProfileCardProps) {
  const genderLabel = profile.gender === 'male' ? '남성' : '여성';
  const calendarLabel = profile.isLunar ? '음력' : '양력';
  const formattedDate = format(new Date(profile.birthDate), 'yyyy년 MM월 dd일');

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <div className="text-sm text-muted-foreground space-y-1 mt-1">
                <p>{genderLabel}</p>
                <p>{formattedDate} ({calendarLabel})</p>
                {profile.birthTime && (
                  <p>태어난 시간: {profile.birthTime}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(profile)}
              aria-label="프로필 수정"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(profile)}
              aria-label="프로필 삭제"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
