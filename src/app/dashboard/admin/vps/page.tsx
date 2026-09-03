import { Metadata } from "next";
import { VpsDashboardClient } from "./vps-client";

export const metadata: Metadata = {
  title: "Monitoramento da VPS | Plataforma Senra",
  description: "Monitoramento em tempo real do servidor",
};

export default function VpsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Servidor VPS</h2>
      </div>
      <VpsDashboardClient />
    </div>
  );
}
