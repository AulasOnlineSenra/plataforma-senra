'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Clock,
  MousePointerClick,
  Map,
  Smartphone,
  Monitor,
  Loader2,
} from 'lucide-react';
import { getHeatmapData } from '@/app/actions/analytics';

export default function HeatmapContent() {
  const [periodo, setPeriodo] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    pages: any[];
    devices: any[];
    monthly: any[];
    totalViews: number;
  }>({
    pages: [],
    devices: [
      { name: 'Mobile', value: 0, color: '#3b82f6' },
      { name: 'Desktop', value: 100, color: '#10b981' },
    ],
    monthly: [{ name: 'Atual', usuarios: 0, pageviews: 0 }],
    totalViews: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      let days = 30;
      if (periodo === '7d') days = 7;
      else if (periodo === '12m') days = 365;

      const result = await getHeatmapData(days);
      if (result.success && result.data) {
        setAnalyticsData(result.data);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [periodo]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="font-headline text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Map className="h-6 w-6 text-amber-600" />
            </div>
            Mapa de Calor &amp; Analytics
          </h1>
          <p className="mt-1 text-slate-500 max-w-2xl">
            Acompanhe o tráfego da plataforma, páginas mais acessadas e o comportamento dos usuários.{' '}
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">
              Dados Reais
            </span>
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner w-max">
          {['7d', '30d', '12m'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                periodo === p
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '12 meses'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Usuários Ativos</p>
                <p className="text-4xl font-bold text-slate-900">{loading ? '—' : analyticsData.totalViews}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-400">Monitoramento ativo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tempo Médio</p>
                <p className="text-4xl font-bold text-slate-900">
                  {loading ? '—' : analyticsData.pages[0]?.time || '00:00'}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-400">Página mais acessada</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pageviews</p>
                <p className="text-4xl font-bold text-slate-900">{loading ? '—' : analyticsData.totalViews}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <MousePointerClick className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-400">Total de views</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area Chart */}
        <Card className="col-span-1 lg:col-span-2 rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Crescimento de Tráfego</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    name="Pageviews"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Split */}
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Acessos por Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 h-[300px] justify-center">
              {analyticsData.devices.map((device) => (
                <div key={device.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${device.color}20`, color: device.color }}
                      >
                        {device.name === 'Mobile' ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Monitor className="h-5 w-5" />
                        )}
                      </div>
                      <span className="font-bold text-slate-700">{device.name}</span>
                    </div>
                    <span className="font-bold text-lg" style={{ color: device.color }}>
                      {device.value}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${device.value}%`, backgroundColor: device.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Ranking */}
      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-indigo-500" />
            Páginas Mais Acessadas
          </CardTitle>
        </CardHeader>
        <div className="overflow-auto max-h-[400px] relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Página (URL)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Visualizações</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Tempo Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Carregando dados...
                  </td>
                </tr>
              ) : analyticsData.pages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    Ainda não há dados coletados para este período. Navegue pela plataforma para começar a registrar!
                  </td>
                </tr>
              ) : (
                analyticsData.pages.map((page, index) => {
                  const maxViews = analyticsData.pages[0].views;
                  const percent = (page.views / maxViews) * 100;
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 font-medium text-slate-800 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 w-5 font-mono text-xs">{index + 1}.</span>
                          {page.url}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-bold text-slate-700">{page.views.toLocaleString()}</span>
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full group-hover:bg-amber-500 transition-colors"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-600 text-sm">{page.time}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
