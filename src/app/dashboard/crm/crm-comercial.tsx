'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Star, 
  Users,
  LayoutGrid,
  List,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { 
  getCrmBoards, 
  getCrmBoardDetails, 
  createCrmBoard, 
  updateCrmBoard,
  createCrmColumn,
  createCrmLead
} from '@/app/actions/crm';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Board {
  id: string;
  name: string;
  coverColor: string;
  leadCount: number;
  members: number;
  isFavorite: boolean;
  updatedAt: Date;
}

interface Column {
  id: string;
  name: string;
  color: string;
  leads: LeadCard[];
}

interface LeadCard {
  id: string;
  name: string;
  phone?: string;
  source?: string;
  series?: string;
  tags?: string;
  temperature: string;
  lastContact?: Date;
}

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
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    const result = await getCrmBoards();
    if (result.success && result.data) {
      setBoards(result.data as any);
    } else {
      toast.error(result.error || "Erro ao carregar quadros");
    }
    setLoading(false);
  };

  const handleSelectBoard = async (board: Board) => {
    setLoading(true);
    const result = await getCrmBoardDetails(board.id);
    if (result.success && result.data) {
      setSelectedBoard(result.data);
      setViewMode('kanban');
    } else {
      toast.error(result.error || "Erro ao carregar detalhes do quadro");
    }
    setLoading(false);
  };

  const handleCreateBoard = async () => {
    const name = prompt("Nome do novo quadro:");
    if (!name) return;

    setLoading(true);
    const result = await createCrmBoard({ name });
    if (result.success) {
      toast.success("Quadro criado com sucesso!");
      loadBoards();
    } else {
      toast.error(result.error || "Erro ao criar quadro");
    }
    setLoading(false);
  };

  const handleCreateColumn = async () => {
    if (!selectedBoard) return;
    const name = prompt("Nome da nova coluna:");
    if (!name) return;

    setLoading(true);
    const result = await createCrmColumn({ 
      name, 
      boardId: selectedBoard.id, 
      order: selectedBoard.columns.length 
    });
    if (result.success) {
      toast.success("Coluna criada!");
      handleSelectBoard(selectedBoard);
    }
    setLoading(false);
  };

  const handleCreateLead = async (columnId: string) => {
    const name = prompt("Nome do lead:");
    if (!name) return;

    setLoading(true);
    const result = await createCrmLead({ 
      name, 
      columnId, 
      order: 0,
      temperature: 'frio'
    });
    if (result.success) {
      toast.success("Lead criado!");
      handleSelectBoard(selectedBoard);
    }
    setLoading(false);
  };

  const toggleFavorite = async (boardId: string, current: boolean) => {
    const result = await updateCrmBoard(boardId, { isFavorite: !current });
    if (result.success) {
      loadBoards();
    }
  };

  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = showFavoritesOnly ? board.isFavorite : true;
    return matchesSearch && matchesFavorite;
  });

  if (loading && viewMode === 'boards') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {viewMode === 'kanban' && (
            <Button variant="ghost" size="icon" onClick={() => setViewMode('boards')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {viewMode === 'boards' ? 'CRM Comercial' : selectedBoard?.name}
            </h1>
            <p className="text-sm text-slate-500">
              {viewMode === 'boards' ? 'Gestão de leads e funil de vendas' : 'Visualização em Kanban'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'boards' && (
            <Button variant="outline" size="sm" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
              <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          )}
          <Button variant="outline" size="sm" className={viewMode === 'boards' ? 'bg-slate-100' : ''} onClick={() => setViewMode('boards')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className={viewMode === 'kanban' ? 'bg-slate-100' : ''} onClick={() => setViewMode('kanban')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {viewMode === 'boards' && (
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
          <Button onClick={handleCreateBoard}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Quadro
          </Button>
        </div>
      )}

      {/* Boards View */}
      {viewMode === 'boards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map((board) => (
            <Card 
              key={board.id} 
              className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              onClick={() => handleSelectBoard(board)}
            >
              <div className={`h-24 ${board.coverColor || 'bg-slate-200'} relative`}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(board.id, board.isFavorite);
                  }}
                  className="absolute top-3 right-3 p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`h-5 w-5 ${board.isFavorite ? 'fill-white text-white' : 'text-white/50'}`} />
                </button>
              </div>
              <CardContent className="p-4">
                <CardTitle className="text-base font-semibold mb-3">{board.name}</CardTitle>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {board.leadCount}
                    </span>
                  </div>
                  <span>{formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true, locale: ptBR })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* New Board Card */}
          <Card onClick={handleCreateBoard} className="cursor-pointer hover:bg-slate-50 border-dashed border-2 border-slate-200 hover:border-slate-300 transition-all">
            <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[140px]">
              <Plus className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Criar novo quadro</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && selectedBoard && (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
          <div className="flex gap-4">
            {selectedBoard.columns.map((column: any) => (
              <div key={column.id} className="w-[300px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color || 'bg-slate-400'}`} />
                    <span className="font-medium text-slate-900">{column.name}</span>
                    <Badge variant="secondary" className="text-xs">{column.leads.length}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {column.leads.map((lead: any) => (
                    <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-sm text-slate-900">{lead.name}</span>
                            <Badge className={`text-[10px] h-4 ${getTemperatureColor(lead.temperature)}`}>
                              {getTemperatureLabel(lead.temperature)}
                            </Badge>
                          </div>
                          {lead.phone && <p className="text-xs text-slate-500">{lead.phone}</p>}
                          {lead.source && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>Origem:</span>
                              <span className="font-medium">{lead.source}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-500 hover:text-slate-900 h-9"
                    onClick={() => handleCreateLead(column.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar lead
                  </Button>
                </div>
              </div>
            ))}
            <div className="w-[300px] flex-shrink-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-500 border-dashed border-2 border-slate-200 hover:border-slate-300 rounded-xl h-12"
                onClick={handleCreateColumn}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar coluna
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {viewMode === 'boards' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Total de Leads</p>
              <p className="text-2xl font-bold text-slate-900">
                {boards.reduce((acc, b) => acc + b.leadCount, 0)}
              </p>
            </CardContent>
          </Card>
          {/* Outros cards de estatísticas poderiam ser dinâmicos também */}
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">-- %</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Fechados este mês</p>
              <p className="text-2xl font-bold text-slate-900">--</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Quadros Ativos</p>
              <p className="text-2xl font-bold text-orange-600">{boards.length}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}