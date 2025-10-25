'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/page-header';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { ErrorState } from '@/components/common/error-state';
import { UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfilesList } from '@/features/profile/hooks/use-profiles-list';
import { useCreateProfile } from '@/features/profile/hooks/use-create-profile';
import { useUpdateProfile } from '@/features/profile/hooks/use-update-profile';
import { useDeleteProfile } from '@/features/profile/hooks/use-delete-profile';
import { ProfileCard } from '@/features/profile/components/profile-card';
import { ProfileEmptyState } from '@/features/profile/components/profile-empty-state';
import {
  AddProfileModal,
  EditProfileModal,
  DeleteConfirmModal,
} from '@/features/profile/components/profile-modals';
import type { Profile, ProfileFormData } from '@/features/profile/types';

export default function ProfilesPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const { data, isLoading, error, refetch } = useProfilesList();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();

  const handleAddClick = () => {
    if (data && !data.canAddMore) {
      return;
    }
    setAddModalOpen(true);
  };

  const handleAddSubmit = (formData: ProfileFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setAddModalOpen(false);
      },
    });
  };

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditModalOpen(true);
  };

  const handleEditSubmit = (formData: ProfileFormData) => {
    if (!selectedProfile) return;
    updateMutation.mutate(
      { id: selectedProfile.id, data: formData },
      {
        onSuccess: () => {
          setEditModalOpen(false);
          setSelectedProfile(null);
        },
      },
    );
  };

  const handleDelete = (profile: Profile) => {
    setSelectedProfile(profile);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedProfile) return;
    deleteMutation.mutate(selectedProfile.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setSelectedProfile(null);
      },
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="프로필 목록을 불러오는 중..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="프로필 목록을 불러오지 못했습니다"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  const profiles = data?.profiles || [];
  const canAddMore = data?.canAddMore ?? true;

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="프로필 관리"
        description="자주 보는 사람의 정보를 저장하세요"
        showBackButton={false}
      >
        {profiles.length > 0 && (
          <Button onClick={handleAddClick} disabled={!canAddMore}>
            <UserPlus className="w-4 h-4 mr-2" />
            프로필 추가
          </Button>
        )}
      </PageHeader>

      {!canAddMore && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            무료 플랜은 최대 5개의 프로필만 저장할 수 있습니다.
            Pro로 업그레이드하여 무제한 프로필을 이용하세요.
          </AlertDescription>
        </Alert>
      )}

      {profiles.length === 0 ? (
        <ProfileEmptyState onAddClick={handleAddClick} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddProfileModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={handleAddSubmit}
        isSubmitting={createMutation.isPending}
      />

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={selectedProfile}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        profile={selectedProfile}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
