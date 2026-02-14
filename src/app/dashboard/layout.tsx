import React from 'react';
import { DashboardClientLayout } from '@/components/dashboard-client-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientLayout>
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        {children}
      </div>
    </DashboardClientLayout>
  );
}
