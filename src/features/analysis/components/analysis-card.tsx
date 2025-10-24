'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AnalysisListItem } from '@/features/analysis/lib/dto';
import { ANALYSIS_TYPE_LABELS, MODEL_LABELS } from '@/features/analysis/lib/constants';

type AnalysisCardProps = {
  analysis: AnalysisListItem;
  onDelete: (id: string) => void;
};

export const AnalysisCard = ({ analysis, onDelete }: AnalysisCardProps) => {
  return (
    <Card className="group relative transition-shadow hover:shadow-lg">
      <Link href={`/analyze/${analysis.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold">{analysis.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                onDelete(analysis.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {ANALYSIS_TYPE_LABELS[analysis.analysisType]}
            </Badge>
            <Badge variant="outline">
              {MODEL_LABELS[analysis.modelUsed]}
            </Badge>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {format(new Date(analysis.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
          </p>
        </CardFooter>
      </Link>
    </Card>
  );
};
