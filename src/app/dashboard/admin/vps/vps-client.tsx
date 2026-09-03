"use client";

import { useEffect, useState, useCallback } from "react";
import { getVpsStats, clearServerCache } from "@/app/actions/vps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Server, HardDrive, Cpu, Activity, Database, CheckCircle2, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VpsDashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    const res = await getVpsStats();
    if (res.success) {
      setStats(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    // Poll every 50 seconds as requested
    const interval = setInterval(fetchStats, 50000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleClearCache = async () => {
    setClearing(true);
    const res = await clearServerCache();
    if (res.success) {
      toast({
        title: "Sucesso!",
        description: res.message,
      });
      // Force immediate refresh
      fetchStats();
    } else {
      toast({
        title: "Erro",
        description: res.error || "Erro ao limpar cache.",
        variant: "destructive",
      });
    }
    setClearing(false);
  };

  const formatGb = (mb: number) => (mb / 1024).toFixed(2) + " GB";

  if (loading && !stats) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
        Não foi possível carregar os dados da VPS.
      </div>
    );
  }

  const memoryColor = stats.memory.percentage > 80 ? "bg-red-500" : stats.memory.percentage > 60 ? "bg-amber-500" : "bg-emerald-500";
  const cpuColor = stats.cpu.percentage > 80 ? "bg-red-500" : stats.cpu.percentage > 60 ? "bg-amber-500" : "bg-emerald-500";
  const diskColor = stats.disk.percentage > 85 ? "bg-red-500" : stats.disk.percentage > 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Atualizado a cada 50 segundos. Tempo online: <span className="font-medium text-foreground">{stats.uptimeDays} dias</span>
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearCache} disabled={clearing}>
            <Trash2 className="mr-2 h-4 w-4" />
            {clearing ? "Limpando..." : "Limpar Cache"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* MEMORY CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memória RAM</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memory.percentage}%</div>
            <p className="text-xs text-muted-foreground mb-4 mt-1">
              {formatGb(stats.memory.used)} / {formatGb(stats.memory.total)}
            </p>
            <Progress value={stats.memory.percentage} className="h-2" indicatorColor={memoryColor} />
          </CardContent>
        </Card>

        {/* CPU CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processamento (CPU)</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpu.percentage}%</div>
            <p className="text-xs text-muted-foreground mb-4 mt-1 truncate" title={stats.cpu.model}>
              {stats.cpu.cores} vCores - {stats.cpu.model}
            </p>
            <Progress value={stats.cpu.percentage} className="h-2" indicatorColor={cpuColor} />
          </CardContent>
        </Card>

        {/* DISK CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armazenamento (Disco)</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.disk.total > 0 ? (
              <>
                <div className="text-2xl font-bold">{stats.disk.percentage}%</div>
                <p className="text-xs text-muted-foreground mb-4 mt-1">
                  {formatGb(stats.disk.used)} / {formatGb(stats.disk.total)}
                </p>
                <Progress value={stats.disk.percentage} className="h-2" indicatorColor={diskColor} />
              </>
            ) : (
              <div className="flex h-[80px] items-center justify-center text-sm text-muted-foreground">
                Informação não disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold tracking-tight mt-8 mb-4">Status dos Serviços</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <div className={`p-2 rounded-full ${stats.services.webserver === "online" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base">Next.js (Servidor Web)</CardTitle>
              <CardDescription>Plataforma Senra App</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Badge variant={stats.services.webserver === "online" ? "default" : "destructive"} className={stats.services.webserver === "online" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
              {stats.services.webserver === "online" ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Online</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" /> Offline</>
              )}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <div className={`p-2 rounded-full ${stats.services.database === "online" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}>
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base">PostgreSQL (Banco de Dados)</CardTitle>
              <CardDescription>Conexão Principal</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Badge variant={stats.services.database === "online" ? "default" : "destructive"} className={stats.services.database === "online" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
              {stats.services.database === "online" ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Online e Conectado</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" /> Falha na Conexão</>
              )}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
