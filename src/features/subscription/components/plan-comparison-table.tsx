'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { PLANS } from '@/features/subscription/constants/plans';

export const PlanComparisonTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>요금제 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{PLANS.FREE.name}</h3>
              <p className="text-3xl font-bold mt-2">₩0</p>
            </div>
            <ul className="space-y-2">
              {PLANS.FREE.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
              추천
            </div>
            <div>
              <h3 className="text-lg font-semibold">{PLANS.PRO.name}</h3>
              <p className="text-3xl font-bold mt-2">
                ₩{PLANS.PRO.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/월</span>
              </p>
            </div>
            <ul className="space-y-2">
              {PLANS.PRO.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
