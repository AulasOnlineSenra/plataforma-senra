'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Calendar, Target, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getCrmAnalytics, CrmAnalytics } from '@/app/actions/analytics';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TEMP_COLORS: Record<string, string> = {
  "frio": "#94a3b8",
  "morno": "#facc15",
  "quente": "#f97316",
  "muito-quente": "#ef4444",
};

const TEMP_LABELS: Record<string, string> = {
  "frio": "Frio",
  "morno": "Morno",
  "quente": "Quente",
  "muito-quente": "Muito Quente",
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const result = await getCrmAnalytics();
    if (result.success && result.data) {
      setAnalytics(result.data);
    } else {
      setError(result.error || 'Erro ao carregar');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 text-slate-500">
        {error || 'Nenhum dado disponível'}
      </div>
    );
  }

  const chartConfig = {
    leads: { label: "Leads" },
    frio: { label: "Frio", color: TEMP_COLORS.frio },
    morno: { label: "Morno", color: TEMP_COLORS.morno },
    quente: { label: "Quente", color: TEMP_COLORS.quente },
    "muito-quente": { label: "Muito Quente", color: TEMP_COLORS["muito-quente"] },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total de Leads"
          value={analytics.totalLeads}
          icon={Users}
          trend={null}
          color="text-blue-600"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${analytics.conversionRate}%`}
          icon={Target}
          trend={analytics.conversionRate >= 20 ? 'up' : 'down'}
          color="text-green-600"
        />
        <KPICard
          title="Leads Atrasados"
          value={analytics.overdueLeads.length}
          icon={AlertTriangle}
          trend={analytics.overdueLeads.length > 0 ? 'up' : null}
          color={analytics.overdueLeads.length > 0 ? "text-red-600" : "text-slate-600"}
        />
        <KPICard
          title="Novos esta semana"
          value={analytics.newThisWeek}
          icon={Calendar}
          trend="up"
          color="text-purple-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={analytics.leadsByStage} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="stage" 
                  type="category" 
                  tick={{ fontSize: 12 }}
                  width={100}
                  tickLine={false}
                />
                <Bar 
                  dataKey="count" 
                  fill="var(--color-leads)" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Temperature Distribution */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Temperatura dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                <PieChart>
                  <Pie
                    data={analytics.temperatureDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="temp"
                  >
                    {analytics.temperatureDistribution.map((entry) => (
                      <Cell key={entry.temp} fill={TEMP_COLORS[entry.temp]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-2">
                {analytics.temperatureDistribution.map((item) => (
                  <div key={item.temp} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: TEMP_COLORS[item.temp] }}
                      />
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Velocity */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads criados (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <LineChart data={analytics.leadsPerDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(parseISO(val), 'dd')} 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar 
                  dataKey="count" 
                  fill="var(--color-leads)" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-leads)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Fontes</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topSources.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={analytics.topSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="source" 
                    type="category" 
                    tick={{ fontSize: 11 }}
                    width={80}
                    tickLine={false}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-leads)" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Sem dados de fontes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Leads */}
      {analytics.overdueLeads.length > 0 && (
        <Card className="rounded-xl border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Leads Atrasados ({analytics.overdueLeads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.overdueLeads.slice(0, 5).map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-2 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.column}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600 font-medium">
                      Venceu {format(parseISO(lead.dueDate), 'dd/MM', { locale: ptBR })}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      TEMP_COLORS[lead.temperature] ? '' : 'bg-slate-200 text-slate-600'
                    }`} style={{ 
                      backgroundColor: TEMP_COLORS[lead.temperature] ? `${TEMP_COLORS[lead.temperature]}20` : undefined,
                      color: TEMP_COLORS[lead.temperature] || undefined
                    }}>
                      {TEMP_LABELS[lead.temperature] || lead.temperature}
                    </span>
                  </div>
                </div>
              ))}
              {analytics.overdueLeads.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  + {analytics.overdueLeads.length - 5} leads atrasados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend: 'up' | 'down' | null;
  color: string;
}

function KPICard({ title, value, icon: Icon, trend, color }: KPICardProps) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-slate-100 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{trend === 'up' ? 'Bom sinal' : 'Atenção'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}