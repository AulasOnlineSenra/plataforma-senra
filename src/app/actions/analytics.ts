"use server";

import prisma from "@/lib/prisma";

export interface CrmAnalytics {
  totalLeads: number;
  leadsByStage: { stage: string; count: number; color: string }[];
  temperatureDistribution: { temp: string; label: string; count: number; color: string }[];
  overdueLeads: { id: string; name: string; dueDate: string; column: string; temperature: string }[];
  leadsPerDay: { date: string; count: number }[];
  topSources: { source: string; count: number }[];
  conversionRate: number;
  newThisWeek: number;
  closedThisMonth: number;
}

export async function getCrmAnalytics(boardId?: string): Promise<{ success: boolean; data?: CrmAnalytics; error?: string }> {
  try {
    const boardsFilter = boardId ? { boardId } : {};

    const leads = await prisma.crmLead.findMany({
      where: boardId ? {
        column: { boardId }
      } : {},
      include: {
        column: {
          include: {
            board: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalLeads = leads.length;

    const leadsByStage = leads.reduce((acc, lead) => {
      const existing = acc.find(s => s.stage === lead.column.name);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ 
          stage: lead.column.name, 
          count: 1, 
          color: lead.column.color || "#64748b" 
        });
      }
      return acc;
    }, [] as { stage: string; count: number; color: string }[]);

    const temperatureMap: Record<string, { label: string; color: string }> = {
      "frio": { label: "Frio", color: "#94a3b8" },
      "morno": { label: "Morno", color: "#facc15" },
      "quente": { label: "Quente", color: "#f97316" },
      "muito-quente": { label: "Muito Quente", color: "#ef4444" },
    };

    const temperatureDistribution = Object.entries(temperatureMap).map(([temp, info]) => ({
      temp,
      label: info.label,
      color: info.color,
      count: leads.filter(l => l.temperature === temp).length
    }));

    const overdueLeads = leads
      .filter(lead => {
        if (!lead.dueDate) return false;
        if (["Fechado", "Perdido"].includes(lead.column.name)) return false;
        return new Date(lead.dueDate) < now;
      })
      .map(lead => ({
        id: lead.id,
        name: lead.name,
        dueDate: lead.dueDate!.toISOString(),
        column: lead.column.name,
        temperature: lead.temperature
      }));

    const leadsPerDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const count = leads.filter(l => {
        const leadDate = new Date(l.createdAt).toISOString().split("T")[0];
        return leadDate === dateStr;
      }).length;
      leadsPerDay.push({ date: dateStr, count });
    }

    const sourceCounts: Record<string, number> = {};
    leads.forEach(lead => {
      const source = lead.source || "Sem origem";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));

    const closedLeads = leads.filter(l => l.column.name === "Fechado").length;
    const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;

    const newThisWeek = leads.filter(l => new Date(l.createdAt) >= weekAgo).length;
    const closedThisMonth = leads.filter(l => 
      l.column.name === "Fechado" && new Date(l.updatedAt) >= monthStart
    ).length;

    return {
      success: true,
      data: {
        totalLeads,
        leadsByStage,
        temperatureDistribution,
        overdueLeads,
        leadsPerDay,
        topSources,
        conversionRate,
        newThisWeek,
        closedThisMonth,
      }
    };
  } catch (error) {
    console.error("Erro ao buscar analytics:", error);
    return { success: false, error: "Falha ao carregar analytics." };
  }
}