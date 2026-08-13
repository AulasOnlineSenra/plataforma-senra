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

export async function getHeatmapData(periodDays: number, pageUrl?: string) {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - periodDays);

    const rawVisits = await prisma.pageVisit.findMany({
      where: {
        createdAt: {
          gte: fromDate,
        },
      },
    });

    const excludedPaths = [
      'dashboard/students',
      'dashboard/notifications',
      'dashboard/crm',
      'dashboard/heatmap',
      'dashboard/admin/packages',
      'dashboard/marketing',
      'dashboard/admin/settings',
      'dashboard/suggestions',
      'dashboard/my-subjects',
      'dashboard/admin/ai',
      'blog/new',
      'dashboard/packages',
      'dashboard/teachers',
      'dashboard/checkout',
      'dashboard/financeiro',
      'dashboard/blog',
      'dashboard/simulados',
      'minha-conta',
      'dashboard/cronograma',
      'dashboard/chat',
      'dashboard/minhas-aulas',
      'dashboard/profile'
    ];
    
    const allVisits = rawVisits.filter(v => !excludedPaths.some(path => v.url.includes(path)));

    const urlStats: Record<string, { views: number; totalTime: number }> = {};
    allVisits.forEach((v) => {
      if (!urlStats[v.url]) urlStats[v.url] = { views: 0, totalTime: 0 };
      urlStats[v.url].views += 1;
      urlStats[v.url].totalTime += v.timeSpent;
    });

    const pagesData = Object.keys(urlStats).map((url) => {
      const stat = urlStats[url];
      const avgTimeSeconds = Math.round(stat.totalTime / stat.views);
      const minutes = Math.floor(avgTimeSeconds / 60);
      const seconds = avgTimeSeconds % 60;
      const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return {
        url,
        views: stat.views,
        time: timeFormatted,
        bounce: '0%', 
      };
    }).sort((a, b) => b.views - a.views).slice(0, 50);

    const visits = pageUrl && pageUrl !== 'all' ? allVisits.filter(v => v.url === pageUrl) : allVisits;

    const sourceCounts: Record<string, number> = {};
    let mobileCount = 0;
    let desktopCount = 0;
    const dailyData: Record<string, { pageviews: number }> = {};

    for (let i = periodDays; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dailyData[dateStr] = { pageviews: 0 };
    }

    visits.forEach((v) => {
      if (v.device === 'Mobile') {
        mobileCount += 1;
      } else {
        desktopCount += 1;
      }

      const src = v.source && v.source.trim() !== '' ? v.source : 'Direto/Orgânico';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      const vDate = new Date(v.createdAt);
      const dateStr = `${vDate.getDate().toString().padStart(2, '0')}/${(vDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dailyData[dateStr]) {
        dailyData[dateStr].pageviews += 1;
      }
    });

    const sourcesDistribution = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalVisits = mobileCount + desktopCount;
    const uniqueUsers = new Set(visits.map(v => v.userId).filter(Boolean)).size;

    const mobilePercent = totalVisits > 0 ? Math.round((mobileCount / totalVisits) * 100) : 0;
    const desktopPercent = totalVisits > 0 ? Math.round((desktopCount / totalVisits) * 100) : 0;

    const devicesData = [
      { name: 'Mobile', value: mobilePercent, color: '#3b82f6' },
      { name: 'Desktop', value: desktopPercent, color: '#10b981' },
    ];

    const monthlyData = Object.keys(dailyData).map(k => ({ name: k, pageviews: dailyData[k].pageviews }));

    const uniqueUserIds = [...new Set(visits.map(v => v.userId).filter(Boolean))] as string[];
    let statesDistribution: { state: string, count: number }[] = [];
    if (uniqueUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: uniqueUserIds } },
        select: { state: true }
      });
      const stateCounts: Record<string, number> = {};
      users.forEach(u => {
        const state = u.state && u.state.trim() !== '' ? u.state : 'Não Informado';
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      });
      statesDistribution = Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);
    }

    return { 
      success: true, 
      data: { 
        pages: pagesData, 
        devices: devicesData, 
        monthly: monthlyData, 
        totalViews: totalVisits, 
        uniqueUsers: uniqueUsers, 
        states: statesDistribution, 
        sources: sourcesDistribution 
      } 
    };
  } catch (error: any) {
    console.error('Error fetching heatmap data:', error);
    return { success: false, error: error.message || 'Falha ao carregar analytics' };
  }
}