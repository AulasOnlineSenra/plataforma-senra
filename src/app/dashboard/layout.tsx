
'use client';

import React, { useEffect } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResizablePanel } from '@/components/resizable-panel-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname === '/dashboard/chat';
  const { isDragging, setIsDragging, sidebarWidth, setSidebarWidth, handleMouseDown } = useResizablePanel();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setSidebarWidth(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setSidebarWidth, setIsDragging]);

  return (
    <div
      className={cn("grid min-h-screen w-full", isDragging && "cursor-col-resize")}
      style={{
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
      }}
    >
      <div className="hidden border-r bg-sidebar md:flex relative">
        <AppSidebar />
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-10"
        />
      </div>
      <div className="flex flex-col">
        <Header />
        <main className={cn(
          "flex flex-1 flex-col",
          !isChatPage && "gap-4 p-4 lg:gap-6 lg:p-6 bg-background"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
