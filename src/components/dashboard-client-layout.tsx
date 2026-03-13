"use client";

import React from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import {
  useResizablePanel,
  ResizablePanelProvider,
} from "@/components/resizable-panel-provider";
import { cn } from "@/lib/utils";
import { navItems, adminNavItems } from "@/lib/navigation";
import type { UserRole } from "@/lib/types";
import { PendingProfileBanner } from "@/components/pending-profile-banner";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleCollapse } = useResizablePanel();
  const pathname = usePathname();
  const router = useRouter();

  const allowedByRole = useMemo(() => {
    const role = (
      typeof window !== "undefined" ? localStorage.getItem("userRole") : null
    ) as UserRole | null;
    if (!role) return false;
    const allowedItems = [...navItems, ...adminNavItems].filter((item) =>
      item.roles.includes(role),
    );
    return (
      allowedItems.some((item) => pathname.startsWith(item.href)) ||
      pathname === "/dashboard"
    );
  }, [pathname]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
      return;
    }
    if (!allowedByRole) {
      router.push("/dashboard");
    }
  }, [allowedByRole, router]);

  return (
    <div className="grid min-h-screen w-full overflow-x-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar md:block">
        <AppSidebar />
      </div>
      <div className="flex min-w-0 flex-col">
        <Header isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        <PendingProfileBanner />
        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto bg-background p-4 lg:gap-6 lg:p-6">
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
