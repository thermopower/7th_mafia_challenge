'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePaymentHistory } from '@/features/subscription/hooks/use-payment-history';
import { PAYMENT_STATUS_LABELS } from '@/features/subscription/constants/plans';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const statusVariants = {
  pending: 'secondary',
  done: 'default',
  canceled: 'outline',
  failed: 'destructive',
} as const;

export const PaymentHistoryTable = () => {
  const { data, isLoading, error } = usePaymentHistory();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">결제 내역을 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">결제 내역이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>결제 내역 (최근 12개월)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문번호</TableHead>
              <TableHead>결제일</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>결제수단</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono text-xs">{payment.orderId}</TableCell>
                <TableCell>
                  {format(new Date(payment.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₩{payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>{payment.method || '-'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[payment.status]}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
