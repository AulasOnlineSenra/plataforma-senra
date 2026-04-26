'use client';

export default function MapaOrbit() {
  return (
    <div className="relative w-full overflow-hidden py-16 md:py-24 bg-slate-900">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">
            Nossa Metodologia
          </p>
          <h3 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6">
            MAPA
          </h3>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 bg-slate-800/60 px-5 py-3 rounded-full border border-amber-500/30">
              <span className="text-xl text-amber-400 font-black">M</span>
              <span className="text-slate-300 font-medium">Mapear</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 px-5 py-3 rounded-full border border-amber-500/30">
              <span className="text-xl text-amber-400 font-black">A</span>
              <span className="text-slate-300 font-medium">Aprender</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 px-5 py-3 rounded-full border border-amber-500/30">
              <span className="text-xl text-amber-400 font-black">P</span>
              <span className="text-slate-300 font-medium">Praticar</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 px-5 py-3 rounded-full border border-amber-500/30">
              <span className="text-xl text-amber-400 font-black">A</span>
              <span className="text-slate-300 font-medium">Aperfeiçoar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}