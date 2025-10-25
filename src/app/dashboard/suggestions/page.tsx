
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
import { Bug, Lightbulb, Send, Check, X, Archive, Filter } from 'lucide-react';
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

const SuggestionForm = ({ user, onNewSuggestion }: { user: User, onNewSuggestion: (newSuggestion: Suggestion) => void }) => {
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
        <CardFooter>
          <Button type="submit" className="ml-auto">
            <Send className="mr-2" />
            Enviar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const AdminSuggestionsView = () => {
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [filter, setFilter] = useState<Suggestion['status'] | 'all'>('all');
  const { toast } = useToast();

  const handleUpdateStatus = (id: Suggestion['id'], newStatus: 'implemented' | 'rejected') => {
    setAllSuggestions(prev => 
        prev.map(s => s.id === id ? { ...s, status: newStatus, evaluationDate: new Date() } : s)
    );
    toast({
        title: `Sugestão ${newStatus === 'implemented' ? 'Implementada' : 'Rejeitada'}`,
        description: "O status da sugestão foi atualizado.",
    });
  };

  const incomingSuggestions = useMemo(() => {
    return allSuggestions.filter(s => s.status === 'received');
  }, [allSuggestions]);

  const processedSuggestions = useMemo(() => {
    const filtered = allSuggestions.filter(
      (s) => s.status === 'implemented' || s.status === 'rejected'
    );
    if (filter === 'all' || filter === 'received') {
      return filtered;
    }
    return filtered.filter((s) => s.status === filter);
  }, [filter, allSuggestions]);


  const statusLabels: Record<Suggestion['status'], string> = {
    received: 'Recebida',
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


  return (
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
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingSuggestions.map(suggestion => (
                  <TableRow key={suggestion.id}>
                    <TableCell className="font-medium">{suggestion.submittedBy} ({suggestion.userRole})</TableCell>
                    <TableCell className="max-w-xs truncate">{suggestion.content}</TableCell>
                     <TableCell className="text-muted-foreground">
                      {format(suggestion.timestamp, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant={statusVariants[suggestion.status]} className={statusColors[suggestion.status]}>
                        {statusLabels[suggestion.status]}
                      </Badge>
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
                <TableHead className="w-[120px]">Data de Envio</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[150px] text-right">Data da Avaliação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedSuggestions.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="font-medium">
                    {suggestion.submittedBy} ({suggestion.userRole})
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {suggestion.content}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(suggestion.timestamp, 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={statusVariants[suggestion.status]}
                      className={statusColors[suggestion.status]}
                    >
                      {statusLabels[suggestion.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {suggestion.evaluationDate
                      ? format(suggestion.evaluationDate, 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {processedSuggestions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhuma sugestão no histórico com o filtro selecionado.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};


export default function SuggestionsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  useEffect(() => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    if (role) {
      setCurrentUser(getMockUser(role));
    }
  }, []);

  const handleNewSuggestion = (newSuggestion: Suggestion) => {
    setSuggestions(prev => [newSuggestion, ...prev]);
  };

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Sugestões e Feedback
        </h1>
      </div>
      {currentUser.role === 'admin' ? (
        <AdminSuggestionsView />
      ) : (
        <SuggestionForm user={currentUser} onNewSuggestion={handleNewSuggestion} />
      )}
    </div>
  );
}
