
'use client';

import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { useResizablePanel } from '@/components/resizable-panel-provider';
import { cn } from '@/lib/utils';

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, toggleCollapse } = useResizablePanel();

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen w-full"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
    >
      <ResizablePanel
        defaultSize={20}
        collapsedSize={4}
        collapsible={true}
        minSize={15}
        maxSize={20}
        className={cn(
          'hidden md:block transition-all duration-300 ease-in-out min-w-[50px]',
          !isCollapsed && 'md:min-w-[220px] lg:min-w-[280px]'
        )}
      >
        <div className="h-full border-r bg-sidebar">
          <AppSidebar isCollapsed={isCollapsed} />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={80}>
        <div className="flex flex-col h-screen">
          <Header isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
