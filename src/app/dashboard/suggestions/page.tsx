
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getMockUser, suggestions as initialSuggestions, users } from '@/lib/data';
import { User, UserRole, Suggestion } from '@/lib/types';
import { Bug, Lightbulb, Send, Check, X, Archive, Filter, Trash2, RotateCcw, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


const SUGGESTIONS_STORAGE_KEY = 'suggestionsList';


const statusLabels: Record<Suggestion['status'], string> = {
  received: 'Enviada',
  rejected: 'Rejeitada',
  implemented: 'Implementada',
};

const statusVariants: Record<Suggestion['status'], 'default' | 'destructive' | 'secondary'> = {
  received: 'default',
  rejected: 'destructive',
  implemented: 'secondary',
};

const statusColors: Record<Suggestion['status'], string> = {
  received: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  implemented: 'bg-green-100 text-green-800',
};


const SuggestionForm = ({ user, onNewSuggestion, onCancel }: { user: User, onNewSuggestion: (newSuggestion: Suggestion) => void, onCancel: () => void }) => {
  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo vazio',
        description: 'Por favor, descreva sua sugestão ou o erro encontrado.',
      });
      return;
    }
    
    const newSuggestion: Suggestion = {
      id: `sug-${Date.now()}`,
      submittedBy: user.name,
      userRole: user.role,
      type,
      content,
      status: 'received',
      timestamp: new Date(),
    };
    
    onNewSuggestion(newSuggestion);
    
    toast({
      title: 'Feedback Enviado!',
      description: 'Obrigado por sua contribuição para melhorarmos a plataforma.',
    });
    setContent('');
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Enviar Feedback</CardTitle>
          <CardDescription>
            Encontrou um problema ou tem uma ideia para melhorar a plataforma?
            Nos conte!
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Feedback</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as 'bug' | 'suggestion')}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggestion">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    <span>Sugestão de Melhoria</span>
                  </div>
                </SelectItem>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <span>Relatar um Erro</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Descrição</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva sua sugestão ou o problema em detalhes..."
              rows={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
           <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            <Send className="mr-2" />
            Enviar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const UserSuggestionsHistory = ({ user, allSuggestions }: { user: User; allSuggestions: Suggestion[] }) => {
  const mySuggestions = useMemo(() => {
    return allSuggestions
      .filter(s => s.submittedBy === user.name) // Simple name check for prototype
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [user, allSuggestions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Histórico de Feedback</CardTitle>
        <CardDescription>Acompanhe o status das suas sugestões e reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead className="w-[150px] text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mySuggestions.length > 0 ? (
              mySuggestions.map(suggestion => (
                <TableRow key={suggestion.id}>
                  <TableCell className="max-w-xs truncate">{suggestion.content}</TableCell>
                  <TableCell className="text-muted-foreground">{format(suggestion.timestamp, 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                     <Badge
                        variant={statusVariants[suggestion.status]}
                        className={cn('justify-end', statusColors[suggestion.status])}
                      >
                        {statusLabels[suggestion.status]}
                      </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Você ainda não enviou nenhum feedback.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


const UserSuggestionsView = ({ user, suggestions, onNewSuggestion, isFormVisible, setIsFormVisible }: { user: User, suggestions: Suggestion[], onNewSuggestion: (s: Suggestion) => void, isFormVisible: boolean, setIsFormVisible: (v: boolean) => void }) => {

  const handleNewSuggestionWithHide = (newSuggestion: Suggestion) => {
    onNewSuggestion(newSuggestion);
    setIsFormVisible(false);
  }

  return (
    <div className="grid gap-6">
      {isFormVisible && (
        <SuggestionForm 
            user={user} 
            onNewSuggestion={handleNewSuggestionWithHide}
            onCancel={() => setIsFormVisible(false)} 
        />
      )}
      <UserSuggestionsHistory user={user} allSuggestions={suggestions} />
    </div>
  );
};


const AdminSuggestionsView = () => {
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [filter, setFilter] = useState<Suggestion['status'] | 'all'>('all');
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  
  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    student: 'Aluno',
    teacher: 'Professor',
  };
  
  useEffect(() => {
    const updateSuggestions = () => {
        const storedSuggestions = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
        if (storedSuggestions) {
          const parsedSuggestions = JSON.parse(storedSuggestions).map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp),
            evaluationDate: s.evaluationDate ? new Date(s.evaluationDate) : undefined,
          }));
          setAllSuggestions(parsedSuggestions);
        } else {
          setAllSuggestions(initialSuggestions);
        }
    };
    updateSuggestions();
    window.addEventListener('storage', updateSuggestions);
    return () => window.removeEventListener('storage', updateSuggestions);
  }, []);

  const handleUpdateStatus = (id: Suggestion['id'], newStatus: Suggestion['status']) => {
    const isReverting = newStatus === 'received';
    const updatedSuggestions = allSuggestions.map(s => 
        s.id === id ? { ...s, status: newStatus, evaluationDate: isReverting ? undefined : new Date() } : s
    );
    setAllSuggestions(updatedSuggestions);
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updatedSuggestions));
    window.dispatchEvent(new Event('storage'));

    const statusText = {
        implemented: "Implementada",
        rejected: "Rejeitada",
        received: "Movida para Caixa de Entrada"
    }

    toast({
        title: `Sugestão ${statusText[newStatus]}`,
        description: "O status da sugestão foi atualizado.",
    });
  };

  const handleDeleteClick = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
  };
  
  const handleConfirmDelete = () => {
    if (!suggestionToDelete) return;

    const updatedSuggestions = allSuggestions.filter(s => s.id !== suggestionToDelete.id);
    setAllSuggestions(updatedSuggestions);
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updatedSuggestions));
    window.dispatchEvent(new Event('storage'));

    toast({
      variant: 'destructive',
      title: 'Sugestão Excluída',
      description: 'A sugestão foi removida permanentemente.',
    });
    setSuggestionToDelete(null);
  };


  const incomingSuggestions = useMemo(() => {
    return allSuggestions.filter(s => s.status === 'received').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allSuggestions]);

  const processedSuggestions = useMemo(() => {
    const filtered = allSuggestions.filter(
      (s) => s.status === 'implemented' || s.status === 'rejected'
    );
    if (filter === 'all' || filter === 'received') {
      return filtered.sort((a,b) => (b.evaluationDate || 0).valueOf() - (a.evaluationDate || 0).valueOf());
    }
    return filtered.filter((s) => s.status === filter).sort((a,b) => (b.evaluationDate || 0).valueOf() - (a.evaluationDate || 0).valueOf());
  }, [filter, allSuggestions]);


  return (
    <>
    <div className="grid gap-6">
       <Card>
          <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                      <CardTitle>Sugestões - Caixa de Entrada</CardTitle>
                      <CardDescription>
                      Novas sugestões e reports de usuários aguardando avaliação.
                      </CardDescription>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Enviado por</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px]">Data de Envio</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingSuggestions.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{suggestion.submittedBy} ({roleLabels[suggestion.userRole] || suggestion.userRole})</TableCell>
                    <TableCell className="max-w-xs truncate">{suggestion.content}</TableCell>
                     <TableCell className="text-muted-foreground">
                      {format(new Date(suggestion.timestamp), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Marcar como Implementada" onClick={() => handleUpdateStatus(suggestion.id, 'implemented')}>
                              <Check className="h-4 w-4 text-green-600"/>
                            </Button>
                            <Button variant="ghost" size="icon" title="Marcar como Rejeitada" onClick={() => handleUpdateStatus(suggestion.id, 'rejected')}>
                              <X className="h-4 w-4 text-red-600"/>
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
                 {incomingSuggestions.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Nenhuma sugestão nova na caixa de entrada.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Histórico de Sugestões</CardTitle>
              <CardDescription>
                Sugestões que já foram implementadas ou rejeitadas.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="implemented">Implementadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Enviado por</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[110px]">Data de Envio</TableHead>
                <TableHead className="w-[120px]">Data da Avaliação</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedSuggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="font-medium">
                    {suggestion.submittedBy} ({roleLabels[suggestion.userRole] || suggestion.userRole})
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {suggestion.content}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(suggestion.timestamp), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {suggestion.evaluationDate
                      ? format(suggestion.evaluationDate, 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={statusVariants[suggestion.status]}
                      className={cn(statusColors[suggestion.status])}
                    >
                      {statusLabels[suggestion.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Mover para Caixa de Entrada" onClick={() => handleUpdateStatus(suggestion.id, 'received')}>
                            <RotateCcw className="h-4 w-4 text-blue-600"/>
                        </Button>
                        <Button variant="ghost" size="icon" title="Excluir Permanentemente" onClick={() => handleDeleteClick(suggestion)}>
                            <Trash2 className="h-4 w-4 text-red-600"/>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {processedSuggestions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Nenhuma sugestão no histórico com o filtro selecionado.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={!!suggestionToDelete} onOpenChange={() => setSuggestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A sugestão será excluída permanentemente e não poderá ser recuperada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


export default function SuggestionsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const updateSuggestions = () => {
    const storedSuggestions = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (storedSuggestions) {
        const parsed = JSON.parse(storedSuggestions).map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }));
        setSuggestions(parsed);
    } else {
        setSuggestions(initialSuggestions);
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setCurrentUser(getMockUser(role));
    }
    
    updateSuggestions();

    window.addEventListener('storage', updateSuggestions);
    return () => window.removeEventListener('storage', updateSuggestions);

  }, []);

  const handleNewSuggestion = (newSuggestion: Suggestion) => {
    const updatedSuggestions = [newSuggestion, ...suggestions];
    setSuggestions(updatedSuggestions);
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updatedSuggestions));
    window.dispatchEvent(new Event('storage'));
  };

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Sugestões e Feedback
        </h1>
         {currentUser.role !== 'admin' && !isFormVisible && (
          <Button onClick={() => setIsFormVisible(true)} className="bg-sidebar text-sidebar-foreground hover:bg-brand-yellow hover:text-black">
              <Plus className="mr-2"/>
              Nova Sugestão
          </Button>
        )}
      </div>
      {currentUser.role === 'admin' ? (
        <AdminSuggestionsView />
      ) : (
        <UserSuggestionsView 
            user={currentUser} 
            suggestions={suggestions} 
            onNewSuggestion={handleNewSuggestion}
            isFormVisible={isFormVisible}
            setIsFormVisible={setIsFormVisible} 
        />
      )}
    </div>
  );
}
