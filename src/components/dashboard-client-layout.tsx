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
import { safeLocalStorage } from "@/lib/safe-storage";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleCollapse } = useResizablePanel();
  const pathname = usePathname();
  const router = useRouter();

  const allowedByRole = useMemo(() => {
    const role = safeLocalStorage.getItem("userRole") as UserRole | null;
    if (!role) return false;
    const allowedItems = [...navItems, ...adminNavItems].filter((item) =>
      item.roles.includes(role),
    );
    return (
      allowedItems.some((item) => pathname.startsWith(item.href)) ||
      pathname === "/dashboard"
    );
  }, [pathname]);

  // Verifica se o professor está com status 'pending' e tenta acessar outra rota
  const isPendingTeacherBlocked = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("currentUser");
      if (!stored) return false;
      const user = JSON.parse(stored);
      return (
        user?.role === "teacher" &&
        user?.status === "pending" &&
        pathname !== "/dashboard/profile"
      );
    } catch {
      return false;
    }
  }, [pathname]);

  useEffect(() => {
    const role = safeLocalStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
      return;
    }
    // Professor pendente só pode acessar a página de perfil
    if (isPendingTeacherBlocked) {
      router.replace("/dashboard/profile");
      return;
    }
    if (!allowedByRole) {
      router.push("/dashboard");
    }
  }, [allowedByRole, isPendingTeacherBlocked, router]);

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
