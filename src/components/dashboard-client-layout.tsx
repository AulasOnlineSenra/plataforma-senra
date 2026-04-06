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

  // Controle dinâmico do scroll global (apenas para o Dashboard)
  useEffect(() => {
    // Salva o estado original
    const originalOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHeight = document.documentElement.style.height;
    const originalBodyHeight = document.body.style.height;

    // Trava o scroll global para o Dashboard
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";

    // Cleanup: restaura o scroll original ao sair do dashboard (ex: ir para o blog)
    return () => {
      document.documentElement.style.overflow = originalOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.height = originalHeight;
      document.body.style.height = originalBodyHeight;
    };
  }, []);

  return (
    <div className="dashboard-layout h-full w-full overflow-hidden">
      {/* Sidebar fixa à esquerda */}
      <aside className="fixed left-0 top-0 hidden h-full w-[15%] min-w-[180px] border-r bg-sidebar md:block">
        <AppSidebar />
      </aside>
      {/* Conteúdo principal com offset e scroll próprio */}
      <div className="flex h-full min-w-0 flex-1 flex-row md:ml-[15%]">
        <div className="flex h-full w-full flex-col">
          <Header isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
          <PendingProfileBanner />
          <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden bg-background px-4 pb-4 pt-1.5 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-[15px]">
            {children}
          </main>
        </div>
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
