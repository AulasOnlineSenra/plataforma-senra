'use client';

import dynamic from 'next/dynamic';

const HeatmapContent = dynamic(() => import('./heatmap-content'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-96">
      <div className="text-slate-500 animate-pulse">Carregando painel de Heatmap...</div>
    </div>
  ),
});

export default function Page() {
  return <HeatmapContent />;
}
