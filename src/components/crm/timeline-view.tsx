'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LeadDrawer from '@/components/crm/lead-drawer';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  CalendarDays,
  Filter,
  ChevronDown
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ZoomLevel = 'day' | 'week' | 'month';

interface TimelineLead {
  id: string;
  name: string;
  columnName: string;
  columnColor: string;
  temperature: string;
  dueDate?: string;
  createdAt: Date;
}

interface TimelineViewProps {
  board: {
    id: string;
    name: string;
    columns: {
      id: string;
      name: string;
      color: string;
      leads: {
        id: string;
        name: string;
        temperature: string;
        dueDate?: string;
        createdAt: Date;
      }[];
    }[];
  };
  onRefresh: () => void;
}

const TEMP_COLORS: Record<string, string> = {
  "frio": "#94a3b8",
  "morno": "#facc15",
  "quente": "#f97316",
  "muito-quente": "#ef4444",
};

const TEMP_LABELS: Record<string, string> = {
  "frio": "F",
  "morno": "M",
  "quente": "Q",
  "muito-quente": "MQ",
};

export default function TimelineView({ board, onRefresh }: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    if (zoom === 'day') return addDays(now, -7);
    if (zoom === 'week') return addWeeks(now, -4);
    return addMonths(now, -2);
  });
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterTemp, setFilterTemp] = useState<string | null>(null);

  const allLeads = useMemo(() => {
    let leads: TimelineLead[] = [];
    board.columns.forEach(col => {
      col.leads.forEach(lead => {
        leads.push({
          id: lead.id,
          name: lead.name,
          columnName: col.name,
          columnColor: col.color || '#64748b',
          temperature: lead.temperature,
          dueDate: lead.dueDate,
          createdAt: new Date(lead.createdAt),
        });
      });
    });
    
    if (filterColumn) {
      leads = leads.filter(l => {
        const col = board.columns.find(c => c.name === l.columnName);
        return col?.id === filterColumn;
      });
    }
    
    if (filterTemp) {
      leads = leads.filter(l => l.temperature === filterTemp);
    }
    
    return leads.sort((a, b) => a.name.localeCompare(b.name));
  }, [board, filterColumn, filterTemp]);

  const timeUnits = useMemo(() => {
    const units: Date[] = [];
    const now = new Date();
    const range = zoom === 'day' ? 30 : zoom === 'week' ? 84 : 180;
    
    let current = new Date(startDate);
    for (let i = 0; i < range; i++) {
      if (zoom === 'day') {
        units.push(addDays(startDate, i));
        current = addDays(current, 1);
      } else if (zoom === 'week') {
        units.push(addWeeks(startDate, i));
        current = addWeeks(current, 1);
      } else {
        units.push(addMonths(startDate, i));
        current = addMonths(current, 1);
      }
    }
    
    return units;
  }, [zoom, startDate]);

  const getBarStyle = (lead: TimelineLead) => {
    const now = new Date();
    let startOffset = differenceInDays(now, startDate);
    let width = zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30;
    
    if (lead.createdAt < startDate) {
      startOffset = 0;
    } else {
      startOffset = differenceInDays(lead.createdAt, startDate);
      if (startOffset < 0) startOffset = 0;
    }
    
    if (lead.dueDate) {
      const dueDate = new Date(lead.dueDate);
      const endOffset = differenceInDays(dueDate, startDate);
      width = Math.max(endOffset - startOffset, zoom === 'day' ? 1 : 7);
    }
    
    return {
      left: `${(startOffset / timeUnits.length) * 100}%`,
      width: `${(width / timeUnits.length) * 100}%`,
      backgroundColor: TEMP_COLORS[lead.temperature] || '#94a3b8',
    };
  };

  const todayIndex = differenceInDays(new Date(), startDate);
  const todayPosition = `${(todayIndex / timeUnits.length) * 100}%`;

  const navigate = (direction: 'prev' | 'next') => {
    const offset = zoom === 'day' ? -14 : zoom === 'week' ? -4 : -2;
    setStartDate(new Date(startDate.getTime() + (direction === 'next' ? -offset : offset) * 24 * 60 * 60 * 1000 * (zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30)));
  };

  const formatDate = (date: Date) => {
    if (zoom === 'day') return format(date, 'dd');
    if (zoom === 'week') return format(date, 'dd/MM');
    return format(date, 'MMM', { locale: ptBR });
  };

  const formatMonth = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };

  const monthGroups = useMemo(() => {
    const groups: { label: string; start: number; span: number }[] = [];
    let currentMonth = '';
    let startIdx = 0;
    let count = 0;
    
    timeUnits.forEach((date, idx) => {
      const month = formatMonth(date);
      if (month !== currentMonth) {
        if (currentMonth) {
          groups.push({ label: currentMonth, start: startIdx, span: count });
        }
        currentMonth = month;
        startIdx = idx;
        count = 1;
      } else {
        count++;
      }
    });
    
    if (currentMonth) {
      groups.push({ label: currentMonth, start: startIdx, span: count });
    }
    
    return groups;
  }, [timeUnits]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
            {zoom === 'day' ? 'Visão diária' : zoom === 'week' ? 'Visão semanal' : 'Visão mensal'}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Coluna
                {filterColumn && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">1</Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterColumn(null)}>
                Todas as colunas
              </DropdownMenuItem>
              {board.columns.map(col => (
                <DropdownMenuItem key={col.id} onClick={() => setFilterColumn(col.id)}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color || 'bg-slate-400'}`} />
                    {col.name}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Temp
                {filterTemp && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">1</Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterTemp(null)}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterTemp('frio')}>Frio</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterTemp('morno')}>Morno</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterTemp('quente')}>Quente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterTemp('muito-quente')}>Muito Quente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {zoom === 'day' ? 'Dia' : zoom === 'week' ? 'Semana' : 'Mês'}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setZoom('day')}>Diário</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom('week')}>Semanal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom('month')}>Mensal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline */}
      {allLeads.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Nenhum lead encontrado para exibir na timeline
        </div>
      ) : (
        <Card className="flex-1 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Month headers */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-48 shrink-0 p-2 text-xs font-medium text-slate-600 border-r border-slate-200">
                  Lead
                </div>
                <div className="flex-1 flex">
                  {monthGroups.map((group, idx) => (
                    <div 
                      key={idx}
                      className="text-center text-xs font-medium text-slate-600 py-2 border-r border-slate-100 last:border-r-0"
                      style={{ width: `${(group.span / timeUnits.length) * 100}%`, minWidth: '60px' }}
                    >
                      {group.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date headers */}
              <div className="flex border-b border-slate-200">
                <div className="w-48 shrink-0 p-2 text-[10px] text-slate-400 border-r border-slate-200">
                  Coluna
                </div>
                <div className="flex-1 flex relative">
                  {/* Today indicator */}
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                    style={{ left: todayPosition }}
                  />
                  {timeUnits.map((date, idx) => (
                    <div 
                      key={idx}
                      className="text-[10px] text-slate-400 py-1 text-center border-r border-slate-100 last:border-r-0"
                      style={{ width: `${100 / timeUnits.length}%`, minWidth: zoom === 'day' ? '20px' : '40px' }}
                    >
                      {formatDate(date)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lead rows */}
              <div className="divide-y divide-slate-100">
                {allLeads.map((lead) => (
                  <div key={lead.id} className="flex hover:bg-slate-50/50 transition-colors">
                    <div className="w-48 shrink-0 p-2 border-r border-slate-200">
                      <div 
                        className="font-medium text-sm text-slate-900 cursor-pointer hover:text-primary truncate"
                        onClick={() => {
                          setSelectedLead(lead);
                          setDrawerOpen(true);
                        }}
                      >
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: lead.columnColor }}
                        />
                        <span className="text-[10px] text-slate-400 truncate">{lead.columnName}</span>
                        <Badge 
                          className="text-[8px] h-4 px-1 ml-auto"
                          style={{ 
                            backgroundColor: `${TEMP_COLORS[lead.temperature]}20`,
                            color: TEMP_COLORS[lead.temperature]
                          }}
                        >
                          {TEMP_LABELS[lead.temperature]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 relative py-2 px-1">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {timeUnits.map((_, idx) => (
                          <div key={idx} className="flex-1 border-r border-slate-50 last:border-r-0" />
                        ))}
                      </div>
                      {/* Today indicator line */}
                      <div 
                        className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                        style={{ left: todayPosition }}
                      />
                      {/* Bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md cursor-pointer hover:brightness-110 transition-all shadow-sm z-20"
                        style={getBarStyle(lead)}
                        onClick={() => {
                          setSelectedLead(lead);
                          setDrawerOpen(true);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <LeadDrawer
        lead={selectedLead}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedLead(null); }}
        onSave={(updatedLead) => {
          setDrawerOpen(false);
          setSelectedLead(null);
          onRefresh();
        }}
      />
    </div>
  );
}