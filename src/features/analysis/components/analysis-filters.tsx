'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { AnalysisListQuery } from '@/features/analysis/lib/dto';
import { ANALYSIS_TYPE_OPTIONS } from '@/features/analysis/lib/constants';

type AnalysisFiltersProps = {
  filters: AnalysisListQuery;
  onUpdateFilters: (updates: Partial<AnalysisListQuery>) => void;
  onClearFilters: () => void;
};

export const AnalysisFilters = ({
  filters,
  onUpdateFilters,
  onClearFilters,
}: AnalysisFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFilters({ search: searchInput || undefined });
  };

  const hasActiveFilters = Boolean(filters.search || filters.analysisType);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* 검색창 */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <Input
            placeholder="이름으로 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* 분석 종류 필터 */}
        <Select
          value={filters.analysisType || 'all'}
          onValueChange={(value) =>
            onUpdateFilters({
              analysisType: value === 'all' ? undefined : (value as AnalysisListQuery['analysisType']),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="분석 종류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {ANALYSIS_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 활성 필터 태그 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              {filters.search}
              <button
                onClick={() => {
                  setSearchInput('');
                  onUpdateFilters({ search: undefined });
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.analysisType && (
            <Badge variant="secondary" className="gap-1">
              {ANALYSIS_TYPE_OPTIONS.find((o) => o.value === filters.analysisType)?.label}
              <button onClick={() => onUpdateFilters({ analysisType: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            전체 해제
          </Button>
        </div>
      )}
    </div>
  );
};
