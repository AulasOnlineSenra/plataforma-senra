'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Star, 
  GripVertical,
  Users,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';

interface Board {
  id: string;
  name: string;
  coverColor: string;
  leadCount: number;
  members: number;
  isFavorite: boolean;
  lastActivity: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  cards: LeadCard[];
}

interface LeadCard {
  id: string;
  name: string;
  phone: string;
  source: string;
  series: string;
  tags: string[];
  temperature: 'frio' | 'morno' | 'quente' | 'muito-quente';
  lastContact: string;
  avatar?: string;
}

const defaultBoards: Board[] = [
  { id: '1', name: 'CRM Vestibular Medicina', coverColor: 'bg-gradient-to-r from-purple-500 to-pink-500', leadCount: 45, members: 3, isFavorite: true, lastActivity: '2 min atrás' },
  { id: '2', name: 'Leads ENEM', coverColor: 'bg-gradient-to-r from-blue-500 to-cyan-500', leadCount: 32, members: 2, isFavorite: false, lastActivity: '1 hora atrás' },
  { id: '3', name: 'Leads Reforço Escolar', coverColor: 'bg-gradient-to-r from-green-500 to-emerald-500', leadCount: 28, members: 2, isFavorite: false, lastActivity: '3 horas atrás' },
  { id: '4', name: 'Pós-venda', coverColor: 'bg-gradient-to-r from-orange-500 to-amber-500', leadCount: 15, members: 1, isFavorite: true, lastActivity: '5 horas atrás' },
];

const defaultColumns: Column[] = [
  { id: 'col-1', name: 'Novo Lead', color: 'bg-slate-400', cards: [] },
  { id: 'col-2', name: 'Primeiro Contato', color: 'bg-blue-400', cards: [] },
  { id: 'col-3', name: 'Qualificação', color: 'bg-yellow-400', cards: [] },
  { id: 'col-4', name: 'Proposta Enviada', color: 'bg-orange-400', cards: [] },
  { id: 'col-5', name: 'Negociação', color: 'bg-purple-400', cards: [] },
  { id: 'col-6', name: 'Fechado', color: 'bg-green-400', cards: [] },
  { id: 'col-7', name: 'Perdido', color: 'bg-red-400', cards: [] },
];

const getTemperatureColor = (temp: string) => {
  switch (temp) {
    case 'frio': return 'bg-slate-200 text-slate-600';
    case 'morno': return 'bg-yellow-200 text-yellow-700';
    case 'quente': return 'bg-orange-200 text-orange-700';
    case 'muito-quente': return 'bg-red-200 text-red-700';
    default: return 'bg-slate-200 text-slate-600';
  }
};

const getTemperatureLabel = (temp: string) => {
  switch (temp) {
    case 'frio': return 'Frio';
    case 'morno': return 'Morno';
    case 'quente': return 'Quente';
    case 'muito-quente': return 'Muito Quente';
    default: return temp;
  }
};

export default function CrmComercial() {
  const [viewMode, setViewMode] = useState<'boards' | 'kanban'>('boards');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredBoards = defaultBoards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = showFavoritesOnly ? board.isFavorite : true;
    return matchesSearch && matchesFavorite;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM Comercial</h1>
          <p className="text-sm text-slate-500">Gestão de leads e funil de vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" className={viewMode === 'boards' ? 'bg-slate-100' : ''} onClick={() => setViewMode('boards')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className={viewMode === 'kanban' ? 'bg-slate-100' : ''} onClick={() => setViewMode('kanban')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Pesquisar quadros..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Quadro
        </Button>
      </div>

      {/* Boards View */}
      {viewMode === 'boards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map((board) => (
            <Card 
              key={board.id} 
              className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              onClick={() => setViewMode('kanban')}
            >
              <div className={`h-24 ${board.coverColor} relative`}>
                {board.isFavorite && (
                  <Star className="absolute top-3 right-3 h-5 w-5 fill-white text-white" />
                )}
              </div>
              <CardContent className="p-4">
                <CardTitle className="text-base font-semibold mb-3">{board.name}</CardTitle>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {board.leadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {board.members}
                    </span>
                  </div>
                  <span>{board.lastActivity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* New Board Card */}
          <Card className="cursor-pointer hover:bg-slate-50 border-dashed border-2 border-slate-200 hover:border-slate-300 transition-all">
            <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[140px]">
              <Plus className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Criar novo quadro</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <div className="flex gap-4">
            {defaultColumns.map((column) => (
              <div key={column.id} className="w-[300px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <span className="font-medium text-slate-900">{column.name}</span>
                    <Badge variant="secondary" className="text-xs">0</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <Card className="min-h-[200px]">
                  <CardContent className="p-3 space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar card
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
            <div className="w-[300px] flex-shrink-0">
              <Button variant="ghost" className="w-full justify-start text-slate-500">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar coluna
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total de Leads</p>
            <p className="text-2xl font-bold text-slate-900">120</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-green-600">23%</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Fechados este mês</p>
            <p className="text-2xl font-bold text-slate-900">15</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Leads Quentes</p>
            <p className="text-2xl font-bold text-orange-600">28</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}