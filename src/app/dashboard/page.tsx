'use client';

import { Suspense } from 'react';
import DashboardPageContent from '@/modules/dashboard/components/DashboardPageContent/DageboardPageContent';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
