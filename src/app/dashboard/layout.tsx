
'use client';

import React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { usePathname } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname === '/dashboard/chat';

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
      <ResizablePanel
        defaultSize={20}
        collapsedSize={4}
        collapsible={true}
        minSize={15}
        maxSize={25}
        className={cn("hidden md:block transition-all duration-300 ease-in-out", "min-w-[50px] md:min-w-[220px] lg:min-w-[280px]")}
      >
        <div className="h-full border-r bg-sidebar">
          <AppSidebar />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden md:flex" />
      <ResizablePanel defaultSize={80}>
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
