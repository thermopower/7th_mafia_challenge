'use client';

import { AnalysisList } from '@/features/analysis/components/analysis-list';
import { QuotaBadge } from '@/features/user/components/quota-badge';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <PageHeader
        title="분석 목록"
        description="저장된 사주 분석을 확인하고 관리하세요"
        showBackButton={false}
      >
        <QuotaBadge />
        <Button asChild>
          <Link href="/analyze/new">
            <Plus className="mr-2 h-4 w-4" />
            새 분석하기
          </Link>
        </Button>
      </PageHeader>

      <AnalysisList />
    </div>
  );
}
