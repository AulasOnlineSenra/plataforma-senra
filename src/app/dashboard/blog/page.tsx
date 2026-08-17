'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, MoreHorizontal, 
  PanelLeftClose, PanelLeftOpen, ArrowRight, CheckCircle2, 
  Undo2, Globe, ExternalLink, Settings, Lightbulb, RefreshCw, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBlogPosts, deletePost, updatePostStatus, createDraftFromIdea } from '@/app/actions/blog';
import { getReferenceBlogs, addReferenceBlog, removeReferenceBlog, fetchExternalIdeas } from '@/app/actions/reference-blogs';

type PostStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string | null;
  tags: string;
  published: boolean;
  status: PostStatus;
  referenceUrl: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  slug?: string | null;
};

type ExternalIdea = {
  id: string;
  title: string;
  source: string;
  link: string;
};

type ReferenceBlog = {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [externalIdeas, setExternalIdeas] = useState<ExternalIdea[]>([]);
  const [referenceBlogs, setReferenceBlogs] = useState<ReferenceBlog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newBlogName, setNewBlogName] = useState('');
  const [newBlogUrl, setNewBlogUrl] = useState('');
  const [newBlogFeed, setNewBlogFeed] = useState('');
  const [isAddingBlog, setIsAddingBlog] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    loadIdeas();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const result = await getBlogPosts();
    if (result.success && result.data) {
      setPosts(result.data as BlogPost[]);
    }
    setIsLoading(false);
  };

  const loadIdeas = async () => {
    setIsFetchingIdeas(true);
    const result = await fetchExternalIdeas();
    if (result.success && result.data) {
      setExternalIdeas(result.data);
    }
    setIsFetchingIdeas(false);
  };

  const loadReferenceBlogs = async () => {
    const result = await getReferenceBlogs();
    if (result.success && result.data) {
      setReferenceBlogs(result.data);
    }
  };

  // Carrega a lista de blogs ao abrir as configurações
  useEffect(() => {
    if (isSettingsOpen) {
      loadReferenceBlogs();
    }
  }, [isSettingsOpen]);

  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogName || !newBlogFeed) return;
    setIsAddingBlog(true);
    const result = await addReferenceBlog(newBlogName, newBlogUrl, newBlogFeed);
    if (result.success) {
      toast({ title: 'Adicionado', description: 'Blog adicionado ao rastreador.' });
      setNewBlogName('');
      setNewBlogUrl('');
      setNewBlogFeed('');
      loadReferenceBlogs();
      loadIdeas(); // Recarrega ideias com o novo blog
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsAddingBlog(false);
  };

  const handleRemoveBlog = async (id: string) => {
    const result = await removeReferenceBlog(id);
    if (result.success) {
      toast({ title: 'Removido', description: 'Blog removido do rastreador.' });
      loadReferenceBlogs();
      loadIdeas();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deletePost(deleteId);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Artigo deletado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
      loadPosts();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setDeleteId(null);
  };

  const handleStatusChange = async (id: string, newStatus: PostStatus) => {
    const result = await updatePostStatus(id, newStatus);
    if (result.success) {
      toast({ title: 'Atualizado', description: `Status alterado para ${newStatus}.`, className: 'bg-emerald-600 text-white border-none' });
      loadPosts();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  const handleCreateFromIdea = async (title: string, referenceUrl?: string) => {
    setIsAddingIdea(true);
    const result = await createDraftFromIdea(title, referenceUrl);
    if (result.success) {
      toast({ title: 'Ideia Adicionada!', description: 'O rascunho foi criado na coluna de Redação.', className: 'bg-emerald-600 text-white border-none' });
      setNewIdeaTitle('');
      loadPosts();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsAddingIdea(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const drafts = posts.filter(p => p.status === 'DRAFT' || (!p.status && !p.published));
  const reviews = posts.filter(p => p.status === 'REVIEW');
  const published = posts.filter(p => p.status === 'PUBLISHED' || (!p.status && p.published));

  const PostCard = ({ post }: { post: BlogPost }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {post.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDeleteId(post.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          Por {post.author} • {formatDate(post.createdAt)}
        </p>

        {post.referenceUrl && (
           <a href={post.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-3 hover:bg-slate-200 transition-colors">
             <ExternalLink className="w-3 h-3" /> Link Original
           </a>
        )}

        <div className="flex gap-2">
          {/* BOTÕES PARA REDAÇÃO */}
          {(post.status === 'DRAFT' || (!post.status && !post.published)) && (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Pencil className="w-3 h-3 mr-1" /> Escrever
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'REVIEW')} 
                variant="default" size="sm" className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700"
              >
                Revisão <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </>
          )}

          {/* BOTÕES PARA REVISÃO */}
          {post.status === 'REVIEW' && (
            <>
              <Button 
                onClick={() => handleStatusChange(post.id, 'DRAFT')} 
                variant="outline" size="sm" className="flex-1 text-xs h-8" title="Devolver para Redação"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Eye className="w-3 h-3 mr-1" /> Ler
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'PUBLISHED')} 
                variant="default" size="sm" className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Publicar
              </Button>
            </>
          )}

          {/* BOTÕES PARA PUBLICADO */}
          {(post.status === 'PUBLISHED' || (!post.status && post.published)) && (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8" title="Ver no site">
                <Link href={`/blog/${post.slug || post.id}`} target="_blank">
                  <Globe className="w-3 h-3 mr-1" /> Site
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs h-8">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'REVIEW')} 
                variant="outline" size="sm" className="text-xs h-8 text-amber-600 hover:text-amber-700" title="Despublicar"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden bg-slate-50 rounded-xl border">
      
      {/* PAINEL ESQUERDO: PESQUISA & PAUTA (Retrátil) */}
      <div 
        className={`bg-white border-r transition-all duration-300 flex flex-col shrink-0 ${
          isSidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden border-none'
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Pesquisa & Pauta
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={loadIdeas} disabled={isFetchingIdeas} className="h-8 w-8 text-muted-foreground" title="Atualizar Feeds">
              <RefreshCw className={`w-4 h-4 ${isFetchingIdeas ? 'animate-spin text-amber-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 text-muted-foreground" title="Configurar Referências">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-b bg-slate-50/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); if (newIdeaTitle) handleCreateFromIdea(newIdeaTitle); }}
            className="flex gap-2"
          >
            <Input 
              placeholder="Digite uma nova ideia..." 
              className="h-8 text-xs" 
              value={newIdeaTitle}
              onChange={(e) => setNewIdeaTitle(e.target.value)}
              disabled={isAddingIdea}
            />
            <Button type="submit" size="sm" className="h-8 px-3" disabled={!newIdeaTitle || isAddingIdea}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="text-xs text-muted-foreground font-medium mb-3">Ideias de Concorrentes (RSS)</div>
          
          {isFetchingIdeas && externalIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Buscando pautas...</span>
            </div>
          ) : externalIdeas.length === 0 ? (
            <div className="text-center text-xs text-slate-400 p-6 border-2 border-dashed border-slate-100 rounded-xl">
              Nenhuma pauta encontrada.<br/>
              Adicione blogs nas configurações.
            </div>
          ) : (
            <div className="space-y-3">
              {externalIdeas.map((idea) => (
                <div key={idea.id} className="group flex gap-2 items-start p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <a href={idea.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-800 leading-snug mb-1 hover:text-amber-600 block line-clamp-3">
                      {idea.title}
                    </a>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" /> {idea.source}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleCreateFromIdea(idea.title, idea.link)}
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-amber-600 transition-all shrink-0 bg-white shadow-sm border border-slate-200"
                    title="Transformar em Pauta"
                    disabled={isAddingIdea}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* PAINEL DIREITO: O PIPELINE KANBAN */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header do Pipeline */}
        <div className="h-16 border-b bg-white flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-8 w-8 text-slate-600"
              title={isSidebarOpen ? "Recolher Painel" : "Abrir Pesquisa & Pauta"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
            <div>
              <h1 className="font-bold text-lg font-headline flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-brand-yellow" />
                Pipeline de Conteúdo
              </h1>
            </div>
          </div>
          <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800">
            <Link href="/dashboard/blog/new">
              <Plus className="h-4 w-4 mr-2" /> Novo Artigo
            </Link>
          </Button>
        </div>

        {/* Colunas do Kanban */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full p-6 gap-6 min-w-[900px]">
            
            {/* Coluna 1: Redação */}
            <div className="flex-1 flex flex-col max-w-[400px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  Redação
                </h3>
                <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{drafts.length}</span>
              </div>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                {isLoading ? (
                  <div className="text-center text-sm text-muted-foreground p-4">Carregando...</div>
                ) : drafts.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Nenhum rascunho.</div>
                ) : (
                  drafts.map(post => <PostCard key={post.id} post={post} />)
                )}
              </ScrollArea>
            </div>

            {/* Coluna 2: Revisão */}
            <div className="flex-1 flex flex-col max-w-[400px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Revisão & Edição
                </h3>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{reviews.length}</span>
              </div>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                {reviews.length === 0 && !isLoading ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Nada em revisão.</div>
                ) : (
                  reviews.map(post => <PostCard key={post.id} post={post} />)
                )}
              </ScrollArea>
            </div>

            {/* Coluna 3: Publicação */}
            <div className="flex-1 flex flex-col max-w-[400px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Publicados
                </h3>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{published.length}</span>
              </div>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                {published.length === 0 && !isLoading ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Nenhum publicado.</div>
                ) : (
                  published.map(post => <PostCard key={post.id} post={post} />)
                )}
              </ScrollArea>
            </div>

          </div>
        </div>

      </div>

      {/* Modal Confirmar Exclusão de Artigo */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este artigo permanentemente?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Deletar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração de Referências (RSS) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              Blogs de Referência
            </DialogTitle>
            <DialogDescription>
              Adicione blogs concorrentes ou parceiros para puxar os títulos mais recentes (via RSS).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <form onSubmit={handleAddBlog} className="flex gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="grid gap-2 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Blog</label>
                <Input placeholder="Ex: Guia do Estudante" value={newBlogName} onChange={e => setNewBlogName(e.target.value)} required />
              </div>
              <div className="grid gap-2 flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Link do Feed (RSS/XML)</label>
                <Input placeholder="Ex: site.com/feed" value={newBlogFeed} onChange={e => setNewBlogFeed(e.target.value)} required />
              </div>
              <Button type="submit" disabled={isAddingBlog || !newBlogName || !newBlogFeed}>
                {isAddingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </form>

            <ScrollArea className="h-64 border rounded-xl">
              <div className="divide-y">
                {referenceBlogs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">Nenhum blog cadastrado.</div>
                ) : (
                  referenceBlogs.map(blog => (
                    <div key={blog.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-sm">{blog.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{blog.feedUrl}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveBlog(blog.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
