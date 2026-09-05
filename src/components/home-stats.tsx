export default function HomeStats() {
  const stats = [
    { value: '+700', label: 'Aulas Realizadas' },
    { value: '94%', label: 'Taxa de Satisfação' },
    { value: '4.9/5', label: 'Avaliação no Google' },
    { value: '< 10 min', label: 'Tempo Médio de Suporte' }
  ];

  return (
    <section className="bg-[#0f172a] py-[59px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-row justify-between md:justify-around items-start md:items-center gap-2 md:gap-10 text-center max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className={`flex flex-col items-center justify-center flex-1 ${stat.value === '94%' ? 'hidden md:flex' : ''}`}>
              <span className="text-2xl md:text-5xl lg:text-[56px] font-black text-[#FFC107] mb-1 md:mb-2 tracking-tight drop-shadow-md">
                {stat.value}
              </span>
              <span className="text-[9px] sm:text-xs md:text-base text-slate-300 font-medium leading-tight px-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
