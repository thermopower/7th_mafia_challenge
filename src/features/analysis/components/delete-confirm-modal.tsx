'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteAnalysis } from '../hooks/use-delete-analysis'
import { useToast } from '@/hooks/use-toast'

interface DeleteConfirmModalProps {
  analysisId: string
  isOpen: boolean
  onClose: () => void
}

export function DeleteConfirmModal({
  analysisId,
  isOpen,
  onClose,
}: DeleteConfirmModalProps) {
  const { mutate: deleteAnalysis, isPending } = useDeleteAnalysis()
  const { toast } = useToast()

  const handleDelete = () => {
    deleteAnalysis(analysisId, {
      onSuccess: () => {
        toast({
          title: '분석이 삭제되었습니다',
          description: '대시보드로 이동합니다.',
        })
        onClose()
      },
      onError: () => {
        toast({
          title: '삭제 실패',
          description: '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제된 분석은 복구할 수 없습니다.
            <br />
            관련 프로필 및 다른 분석 내역은 유지됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
