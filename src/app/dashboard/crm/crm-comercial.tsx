'use client';

import { useEffect, useState, KeyboardEvent, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Star, 
  Users,
  LayoutGrid,
  List,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil
} from 'lucide-react';
import { 
  getCrmBoards, 
  getCrmBoardDetails, 
  createCrmBoard, 
  updateCrmBoard,
  createCrmColumn,
  createCrmLead,
  moveCrmLead,
  deleteCrmLead,
  deleteCrmColumn,
  updateColumnOrder
} from '@/app/actions/crm';
import LeadDrawer from '@/components/crm/lead-drawer';
import { formatDistanceToNow, isPast, isToday, addDays, parseISO } from 'date-fns';
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
  email?: string;
  source?: string;
  series?: string;
  tags?: string;
  description?: string;
  temperature: string;
  dueDate?: string;
  lastContact?: Date;
  order: number;
}

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null;
  const date = parseISO(dueDate);
  if (isPast(date) && !isToday(date)) return 'atrasado';
  if (isToday(date) || (date <= addDays(new Date(), 2))) return 'vencendo';
  return 'no-prazo';
};

const getDueDateColor = (status: string | null) => {
  switch (status) {
    case 'atrasado': return 'bg-red-100 text-red-700 border border-red-200';
    case 'vencendo': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    default: return 'bg-green-100 text-green-700 border border-green-200';
  }
};

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
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'boards' | 'kanban'>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'boards' | 'kanban'>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Inline edit state
  const [addingLeadToColumn, setAddingLeadToColumn] = useState<string | null>(null);
  const [newLeadName, setNewLeadName] = useState('');
  const newLeadInputRef = useRef<HTMLInputElement>(null);

  // Lead Drawer state
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Column collapse state
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  // Column drag state
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadBoards();
  }, []);

  useEffect(() => {
    if (addingLeadToColumn && newLeadInputRef.current) {
      newLeadInputRef.current.focus();
    }
  }, [addingLeadToColumn]);

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
    const name = columnName.trim();
    if (!name) return;

    setLoading(true);
    const result = await createCrmColumn({ 
      name, 
      boardId: selectedBoard.id, 
      order: selectedBoard.columns.length 
    });
    if (result.success) {
      toast.success("Coluna criada!");
      setColumnName('');
      setIsAddingColumn(false);
      handleSelectBoard(selectedBoard);
    }
    setLoading(false);
  };

  const submitNewLead = async (columnId: string) => {
    if (!newLeadName.trim()) {
      setAddingLeadToColumn(null);
      return;
    }

    const tempName = newLeadName;
    setNewLeadName('');
    setAddingLeadToColumn(null);
    setLoading(true);

    const result = await createCrmLead({ 
      name: tempName, 
      columnId, 
      order: selectedBoard.columns.find((c: any) => c.id === columnId)?.leads.length || 0,
      temperature: 'frio'
    });
    
    if (result.success) {
      handleSelectBoard(selectedBoard);
    } else {
      toast.error("Erro ao criar lead");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, columnId: string) => {
    if (e.key === 'Enter') {
      submitNewLead(columnId);
    } else if (e.key === 'Escape') {
      setAddingLeadToColumn(null);
      setNewLeadName('');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    setLoading(true);
    const result = await deleteCrmLead(leadId);
    if (result.success) {
      toast.success("Lead excluído.");
      handleSelectBoard(selectedBoard);
    } else {
      toast.error("Erro ao excluir lead.");
    }
    setLoading(false);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta coluna e todos os seus leads?")) return;
    setLoading(true);
    const result = await deleteCrmColumn(columnId);
    if (result.success) {
      toast.success("Coluna excluída.");
      handleSelectBoard(selectedBoard);
    } else {
      toast.error("Erro ao excluir coluna.");
    }
    setLoading(false);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic UI update
    const newBoard = { ...selectedBoard };
    const sourceColIndex = newBoard.columns.findIndex((c: any) => c.id === source.droppableId);
    const destColIndex = newBoard.columns.findIndex((c: any) => c.id === destination.droppableId);

    const sourceCol = newBoard.columns[sourceColIndex];
    const destCol = newBoard.columns[destColIndex];

    const [movedLead] = sourceCol.leads.splice(source.index, 1);
    destCol.leads.splice(destination.index, 0, movedLead);

    // Update order values locally for rendering
    destCol.leads.forEach((lead: any, index: number) => {
      lead.order = index;
    });

    setSelectedBoard(newBoard);

    // Persist to backend
    const moveResult = await moveCrmLead(draggableId, destination.droppableId, destination.index);
    if (!moveResult.success) {
      toast.error("Falha ao mover lead. Recarregando...");
      handleSelectBoard(selectedBoard); // Reload original state from db
    }
  };

  const toggleFavorite = async (boardId: string, current: boolean) => {
    const result = await updateCrmBoard(boardId, { isFavorite: !current });
    if (result.success) {
      loadBoards();
    }
  };

  const toggleCollapseColumn = (columnId: string) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const handleColumnDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumnId || !selectedBoard) return;

    const newColumns = [...selectedBoard.columns];
    const draggedIndex = newColumns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = newColumns.findIndex(c => c.id === targetColumnId);

    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    newColumns.forEach((col, index) => {
      col.order = index;
    });

    setSelectedBoard({ ...selectedBoard, columns: newColumns });
    setDraggedColumnId(null);

    updateColumnOrder(newColumns.map(c => c.id)).catch(console.error);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
  };

  const filteredBoards = boards.filter(board => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = showFavoritesOnly ? board.isFavorite : true;
    return matchesSearch && matchesFavorite;
  });

  if (!isMounted) return null;

  if (loading && viewMode === 'boards') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${viewMode === 'kanban' ? 'h-[calc(100vh-120px)]' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {viewMode === 'kanban' ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => setViewMode('boards')} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center text-sm text-slate-500 gap-2 mb-1">
                <span className="hover:text-slate-900 cursor-pointer" onClick={() => setViewMode('boards')}>CRM Comercial</span>
                <ChevronRight className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 truncate max-w-[300px]">
                {selectedBoard?.name}
              </h1>
            </>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-slate-900">CRM Comercial</h1>
              <p className="text-sm text-slate-500">Gestão de leads e funil de vendas</p>
            </div>
          )}
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
          <Button variant="outline" size="sm" className={viewMode === 'kanban' ? 'bg-slate-100' : ''} onClick={() => {
             if (selectedBoard) setViewMode('kanban');
             else if (boards.length > 0) handleSelectBoard(boards[0]);
          }}>
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

      {/* Kanban View Trello-Style */}
      {viewMode === 'kanban' && selectedBoard && (
        <div className="flex-1 overflow-x-auto pb-4 bg-slate-100 -mx-6 px-6 pt-4 rounded-xl shadow-inner">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {selectedBoard.columns.map((column: any) => {
                const isCollapsed = collapsedColumns.has(column.id);
                const isDragging = draggedColumnId === column.id;
                return (
                <div 
                  key={column.id} 
                  className={`w-[300px] flex-shrink-0 bg-slate-200/60 rounded-xl flex flex-col max-h-full transition-all duration-200 ${isDragging ? 'opacity-50 scale-95 ring-2 ring-primary' : ''}`}
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, column.id)}
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, column.id)}
                  onDragEnd={handleColumnDragEnd}
                >
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-3 group/header">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover/header:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />
                      <div className={`w-3 h-3 rounded-full ${column.color || 'bg-slate-400'}`} />
                      <span className="font-semibold text-slate-800 text-sm">{column.name}</span>
                      {!isCollapsed && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{column.leads.length}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-slate-400 hover:text-slate-700 opacity-0 group-hover/header:opacity-100 transition-opacity"
                        onClick={() => toggleCollapseColumn(column.id)}
                      >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-300/50">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleCollapseColumn(column.id)}>
                            {isCollapsed ? 'Expandir' : 'Colapsar'} Lista
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteColumn(column.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir Lista
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Droppable Area for Leads */}
                  {!isCollapsed && (
                    <>
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className={`flex-1 overflow-y-auto px-2 min-h-[50px] space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/80 rounded-lg' : ''}`}
                        >
                        {column.leads.map((lead: any, index: number) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="group relative"
                              >
                                <Card 
                                  className={`hover:border-primary/50 transition-all cursor-pointer ${snapshot.isDragging ? 'rotate-2 shadow-xl' : 'shadow-sm'}`}
                                  onClick={() => { setSelectedLead(lead); setDrawerOpen(true); }}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="font-medium text-sm text-slate-800 leading-snug">{lead.name}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 -mr-1 text-slate-400 hover:text-primary"
                                            onClick={() => { setSelectedLead(lead); setDrawerOpen(true); }}
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Button>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-slate-400 hover:text-slate-700">
                                                <MoreHorizontal className="h-3 w-3" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                              <DropdownMenuItem onClick={() => { setSelectedLead(lead); setDrawerOpen(true); }} className="text-primary">
                                                <Edit2 className="mr-2 h-4 w-4" /> Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between flex-wrap gap-1">
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {lead.source && (
                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                              {lead.source}
                                            </span>
                                          )}
                                          {lead.email && (
                                            <span className="text-[10px] text-slate-400 flex items-center">
                                              <Mail className="h-3 w-3 mr-0.5" />
                                              {lead.email.split('@')[0]}
                                            </span>
                                          )}
                                        </div>
                                        <Badge className={`text-[9px] h-4 px-1.5 ${getTemperatureColor(lead.temperature)}`}>
                                          {getTemperatureLabel(lead.temperature)}
                                        </Badge>
                                      </div>

                                      {/* Tags */}
                                      {lead.tags && JSON.parse(lead.tags).length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {JSON.parse(lead.tags).slice(0, 3).map((tag: string, i: number) => (
                                            <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                              {tag}
                                            </span>
                                          ))}
                                          {JSON.parse(lead.tags).length > 3 && (
                                            <span className="text-[9px] text-slate-400">+{JSON.parse(lead.tags).length - 3}</span>
                                          )}
                                        </div>
                                      )}

                                      {/* Due Date */}
                                      {lead.dueDate && (
                                        <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${getDueDateColor(getDueDateStatus(lead.dueDate))}`}>
                                          <Calendar className="h-3 w-3" />
                                          {format(parseISO(lead.dueDate), 'dd/MM', { locale: ptBR })}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Inline Lead Creation or Add Button */}
                    <div className="p-2">
                    {addingLeadToColumn === column.id ? (
                      <div className="space-y-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                        <Input
                          ref={newLeadInputRef}
                          value={newLeadName}
                          onChange={(e) => setNewLeadName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, column.id)}
                          placeholder="Insira o título para este cartão..."
                          className="h-auto py-1.5 text-sm border-none shadow-none focus-visible:ring-0 px-1"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => submitNewLead(column.id)} className="h-8">Adicionar cartão</Button>
                          <Button size="icon" variant="ghost" onClick={() => { setAddingLeadToColumn(null); setNewLeadName(''); }} className="h-8 w-8 text-slate-500">
                            <Plus className="h-5 w-5 rotate-45" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-500 hover:text-slate-800 hover:bg-slate-300/50 h-9"
                        onClick={() => setAddingLeadToColumn(column.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar um cartão
                      </Button>
)}
                    </div>
                    </>
                  )}
                </div>
              )})}
               
               {/* Add New Column */}
               <div className="w-[300px] flex-shrink-0">
                 {isAddingColumn ? (
                   <div className="flex space-x-2 items-center">
                     <input
                       type="text"
                       value={columnName}
                       onChange={(e) => setColumnName(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           handleCreateColumn();
                         } else if (e.key === 'Escape') {
                           e.preventDefault();
                           setColumnName('');
                           setIsAddingColumn(false);
                         }
                       }}
                       className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                       placeholder="Nome da lista..."
                       autoFocus
                     />
                     <Button 
                       variant="ghost"
                       className="h-10 px-4 rounded-r-xl border-slate-300 bg-slate-200/50 hover:bg-slate-200"
                       onClick={handleCreateColumn}
                     >
                       Salvar
                     </Button>
                   </div>
                 ) : (
                   <Button 
                     variant="ghost" 
                     className="w-full justify-start text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-xl h-12 font-medium"
                     onClick={() => setIsAddingColumn(true)}
                   >
                     <Plus className="h-4 w-4 mr-2" />
                      Adicionar lista
                   </Button>
                 )}
               </div>
            </div>
          </DragDropContext>
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
    {/* Lead Drawer */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedLead(null); }}
        onSave={(updatedLead) => {
          if (selectedBoard) {
            const newBoard = { ...selectedBoard };
            newBoard.columns = newBoard.columns.map((col: any) => ({
              ...col,
              leads: col.leads.map((lead: any) => 
                lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead
              )
            }));
            setSelectedBoard(newBoard);
          }
          setDrawerOpen(false);
          setSelectedLead(null);
        }}
      />
    </div>
  );
}