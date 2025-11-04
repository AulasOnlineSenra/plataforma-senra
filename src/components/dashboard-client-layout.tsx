
'use client';

import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { useResizablePanel, ResizablePanelProvider } from '@/components/resizable-panel-provider';
import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleCollapse } = useResizablePanel();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-sidebar md:block">
            <AppSidebar />
        </div>
        <div className="flex flex-col">
            <Header isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
                {children}
            </main>
        </div>
    </div>
  );
}

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ResizablePanelProvider>
  );
}
