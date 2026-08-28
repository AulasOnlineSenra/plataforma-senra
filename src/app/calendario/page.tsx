'use client';

import { useEffect, useState, useMemo } from 'react';
import { getVestibularesWithEvents } from '@/app/actions/vestibulares';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, CalendarDays, List, ExternalLink, MapPin, Building2, BookOpen, Loader2 } from 'lucide-react';

export default function CalendarioVestibularesPage() {
  const [vestibulares, setVestibulares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');

  // Modal State
  const [selectedVestibular, setSelectedVestibular] = useState<any | null>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getVestibularesWithEvents();
      if (res.success && res.data) {
        setVestibulares(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Format Helpers
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const getEventIcon = (type: string) => {
    if (type.includes('INSCRI') || type.includes('Inscri')) return '📝';
    if (type.includes('PAG') || type.includes('Pag')) return '💰';
    if (type.includes('PROVA') || type.includes('Prova')) return '🧑‍🎓';
    if (type.includes('RESUL') || type.includes('Resul')) return '📋';
    if (type.includes('MAT') || type.includes('Mat')) return '🎓';
    return '📅';
  };
  const getEventColor = (type: string) => {
    if (type.includes('INSCRI') || type.includes('Inscri')) return 'bg-emerald-100 text-emerald-700';
    if (type.includes('PAG') || type.includes('Pag')) return 'bg-amber-100 text-amber-700';
    if (type.includes('PROVA') || type.includes('Prova')) return 'bg-rose-100 text-rose-700';
    if (type.includes('RESUL') || type.includes('Resul')) return 'bg-blue-100 text-blue-700';
    if (type.includes('MAT') || type.includes('Mat')) return 'bg-purple-100 text-purple-700';
    return 'bg-slate-100 text-slate-700';
  };

  // Extract all unique filters
  const institutions = useMemo(() => Array.from(new Set(vestibulares.map(v => v.institution))), [vestibulares]);
  const types = useMemo(() => Array.from(new Set(vestibulares.map(v => v.type))), [vestibulares]);
  const states = useMemo(() => Array.from(new Set(vestibulares.map(v => v.state))), [vestibulares]);
  const eventTypes = useMemo(() => {
    const ets = new Set<string>();
    vestibulares.forEach(v => v.events.forEach((e: any) => ets.add(e.type)));
    return Array.from(ets);
  }, [vestibulares]);

  // Derived Flat Events for List / Calendar mapping
  const allEvents = useMemo(() => {
    const list: any[] = [];
    vestibulares.forEach(v => {
      v.events.forEach((e: any) => {
        list.push({ ...e, vestibular: v });
      });
    });
    return list.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
  }, [vestibulares]);

  // Apply Filters to Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (search) {
        const s = search.toLowerCase();
        if (!e.vestibular.name.toLowerCase().includes(s) && !e.vestibular.institution.toLowerCase().includes(s)) {
          return false;
        }
      }
      if (filterInstitution !== 'all' && e.vestibular.institution !== filterInstitution) return false;
      if (filterType !== 'all' && e.vestibular.type !== filterType) return false;
      if (filterState !== 'all' && e.vestibular.state !== filterState) return false;
      if (filterEventType !== 'all' && e.type !== filterEventType) return false;
      
      // In List View, only show upcoming events
      if (viewMode === 'list' && new Date(e.dateStart) < new Date(new Date().setHours(0,0,0,0))) {
        return false;
      }
      
      return true;
    });
  }, [allEvents, search, filterInstitution, filterType, filterState, filterEventType, viewMode]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-headline mb-4 tracking-tight">
            Calendário de Vestibulares
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-10">
            Consulte as principais datas de inscrições, provas, resultados e matrículas dos processos seletivos mais importantes do Brasil.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex items-center">
            <Search className="w-6 h-6 text-slate-400 ml-3 mr-2" />
            <input 
              type="text" 
              placeholder="Busque por vestibular, instituição ou estado..."
              className="flex-1 bg-transparent border-none text-slate-800 text-lg focus:outline-none focus:ring-0 h-12"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
        
        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-wrap items-center gap-3">
          <Select value={filterInstitution} onValueChange={setFilterInstitution}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl">
              <SelectValue placeholder="Instituição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Instituições</SelectItem>
              {institutions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o Brasil</SelectItem>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterEventType} onValueChange={setFilterEventType}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl">
              <SelectValue placeholder="Tipo de Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Datas</SelectItem>
              {eventTypes.map(et => <SelectItem key={et} value={et}>{et}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex-1"></div>

          {/* Toggle View */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              className={`rounded-lg h-8 px-3 ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" /> Lista
            </Button>
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              className={`rounded-lg h-8 px-3 ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="w-4 h-4 mr-2" /> Calendário
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p className="font-medium">Carregando calendário...</p>
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              Próximas datas importantes
            </h2>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum evento futuro encontrado com os filtros atuais.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredEvents.slice(0, 30).map((ev: any) => (
                  <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center min-w-[70px]">
                      <span className="block text-xs font-bold text-slate-400 uppercase">
                        {new Date(ev.dateStart).toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="block text-2xl font-black text-slate-800">
                        {new Date(ev.dateStart).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {ev.vestibular.institution}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getEventColor(ev.type)} uppercase`}>
                          {ev.type}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight mb-2">
                        {ev.vestibular.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.vestibular.state}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {ev.vestibular.type}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full rounded-xl"
                        onClick={() => setSelectedVestibular(ev.vestibular)}
                      >
                        Ver Detalhes do Processo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {!loading && viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              >
                &larr; Mês Anterior
              </Button>
              <h2 className="font-bold text-lg uppercase tracking-wide">
                {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              >
                Próximo Mês &rarr;
              </Button>
            </div>
            
            <div className="grid grid-cols-7 border-b border-slate-100 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[120px]">
              {Array.from({ length: 42 }).map((_, i) => {
                const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                day.setDate(day.getDate() - day.getDay() + i);
                
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                
                // Find events for this day
                const dayEvents = filteredEvents.filter(e => new Date(e.dateStart).toDateString() === day.toDateString());

                // Se passou dos 35 dias (5 semanas) e a última semana é de outro mês, escondemos
                if (i >= 35 && !isCurrentMonth) return null;

                return (
                  <div key={i} className={`border-r border-b p-2 flex flex-col transition-colors ${!isCurrentMonth ? 'bg-slate-50 opacity-50' : 'bg-white hover:bg-slate-50'}`}>
                    <span className={`text-sm font-semibold mb-2 inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-700'}`}>
                      {day.getDate()}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                      {dayEvents.map((ev: any) => (
                        <button 
                          key={ev.id}
                          onClick={() => setSelectedVestibular(ev.vestibular)}
                          className={`w-full text-left text-[10px] font-bold px-1.5 py-1 rounded-md truncate transition-transform hover:scale-[1.02] ${getEventColor(ev.type)}`}
                          title={`${ev.vestibular.institution}: ${ev.type}`}
                        >
                          {getEventIcon(ev.type)} {ev.vestibular.institution}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vestibular Detail Modal */}
      <Dialog open={!!selectedVestibular} onOpenChange={(open) => !open && setSelectedVestibular(null)}>
        <DialogContent className="max-w-md w-full rounded-2xl">
          {selectedVestibular && (
            <>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                    {selectedVestibular.institution}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                    {selectedVestibular.type}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-black">{selectedVestibular.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" /> Estado: {selectedVestibular.state}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Datas Importantes</h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {selectedVestibular.events.map((ev: any, idx: number) => (
                      <div key={ev.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-slate-200 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 md:ml-auto md:mr-auto">
                          <span className="text-[10px]">{getEventIcon(ev.type)}</span>
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-100 bg-white shadow-sm ml-4 md:ml-0 group-even:md:mr-4 group-odd:md:ml-4 text-left group-odd:md:text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${getEventColor(ev.type).split(' ')[1]}`}>
                            {ev.type}
                          </span>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">
                            {formatDate(ev.dateStart)} {ev.dateEnd ? `→ ${formatDate(ev.dateEnd)}` : ''}
                          </p>
                          {ev.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedVestibular.officialSite && (
                  <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 h-12 text-md shadow-lg shadow-emerald-500/20">
                    <a href={selectedVestibular.officialSite} target="_blank" rel="noopener noreferrer">
                      Ir para o Site Oficial <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
