'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfileForm } from './profile-form';
import type { Profile, ProfileFormData } from '../types';

interface AddProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProfileFormData) => void;
  isSubmitting?: boolean;
}

export function AddProfileModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 프로필 추가</DialogTitle>
          <DialogDescription>
            자주 보는 사람의 정보를 저장하세요
          </DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSubmit: (data: ProfileFormData) => void;
  isSubmitting?: boolean;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSubmit,
  isSubmitting,
}: EditProfileModalProps) {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogDescription>
            {profile.name}님의 정보를 수정하세요
          </DialogDescription>
        </DialogHeader>
        <ProfileForm
          defaultValues={profile}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  profile,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!profile) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile.name}님의 프로필이 삭제됩니다.
            <br />
            기존 분석 내역은 유지됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
