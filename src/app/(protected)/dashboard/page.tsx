'use client';

import { AnalysisList } from '@/features/analysis/components/analysis-list';
import { QuotaBadge } from '@/features/user/components/quota-badge';
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">분석 목록</h1>
          <p className="mt-2 text-muted-foreground">
            저장된 사주 분석을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-4">
          <QuotaBadge />
          <Button asChild>
            <Link href="/analyze/new">
              <Plus className="mr-2 h-4 w-4" />
              새 분석하기
            </Link>
          </Button>
        </div>
      </header>

      <AnalysisList />
    </div>
  );
}
