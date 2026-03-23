import React from "react";
import { DashboardClientLayout } from "@/components/dashboard-client-layout";
import { ReferralNotificationProvider } from "@/components/referral-notification-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardClientLayout>
      <ReferralNotificationProvider />
      <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
    </DashboardClientLayout>
  );
}
