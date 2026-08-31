'use client';

import { useEffect, useState } from 'react';
import { getBlogKpis } from '@/app/actions/blog';
import { FileText, CheckCircle2, Clock, Image, TrendingUp, ExternalLink, Award } from 'lucide-react';

type KpiData = {
  draft: number;
  review: number;
  images: number;
  published: number;
  publishedLast30: number;
  refRanking: { id: string; name: string; url: string; usageCount: number }[];
};

const TIER_COLORS = [
  { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200' },
];

export function BlogKpis() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogKpis().then(res => {
      if (res.success && res.data) setKpis(res.data as KpiData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mt-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-100 mb-4" />
        <div className="h-56 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!kpis) return null;

  const total = kpis.draft + kpis.review + kpis.images + kpis.published;
  const publishedPct = total > 0 ? Math.round((kpis.published / total) * 100) : 0;
  const maxUsage = Math.max(...kpis.refRanking.map(r => r.usageCount), 1);

  const statCards = [
    { label: 'Rascunhos',    value: kpis.draft,         icon: FileText,    color: 'text-slate-500',  bg: 'bg-slate-100' },
    { label: 'Em Revisão',   value: kpis.review,        icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Imagens',      value: kpis.images,        icon: Image,       color: 'text-fuchsia-600',bg: 'bg-fuchsia-50' },
    { label: 'Publicados',   value: kpis.published,     icon: CheckCircle2,color: 'text-emerald-600',bg: 'bg-emerald-50' },
    { label: 'Pub. (30d)',   value: kpis.publishedLast30,icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Taxa Public.', value: `${publishedPct}%`, icon: Award,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="flex flex-col gap-5 mt-4 pb-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statCards.map(s => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-slate-100 bg-white shadow-sm"
          >
            <div className={`rounded-xl p-2 ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[10px] font-semibold text-slate-400 text-center leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Reference Blog Ranking */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Ranking de Fontes de Referência</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quais fontes mais inspiraram artigos publicados</p>
          </div>
        </div>

        {kpis.refRanking.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Nenhuma fonte de referência cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {kpis.refRanking.map((ref, i) => {
              const tier = TIER_COLORS[Math.min(i, TIER_COLORS.length - 1)];
              const pct = maxUsage > 0 ? Math.round((ref.usageCount / maxUsage) * 100) : 0;
              return (
                <div key={ref.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  {/* Position badge */}
                  <span className="w-6 text-center text-xs font-black text-slate-400 shrink-0">
                    {i + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800 truncate">{ref.name}</span>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${tier.bar}`}
                        style={{ width: `${Math.max(pct, ref.usageCount > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Count badge */}
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                    {ref.usageCount} {ref.usageCount === 1 ? 'uso' : 'usos'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
