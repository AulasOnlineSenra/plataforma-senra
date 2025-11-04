import React from 'react';
import { DashboardClientLayout } from '@/components/dashboard-client-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientLayout>
      <div className="w-full max-w-7xl mx-auto">
        {children}
      </div>
    </DashboardClientLayout>
  );
}
