'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, MoreHorizontal, 
  PanelLeftClose, PanelLeftOpen, ArrowRight, CheckCircle2, 
  Undo2, Globe, ExternalLink, Settings, Lightbulb, RefreshCw, Loader2, Check, Clock, Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBlogPosts, deletePost, updatePostStatus, createDraftFromIdea, getDashboardKanbanPosts, getDashboardPublishedPaginated } from '@/app/actions/blog';
import { getReferenceBlogs, addReferenceBlog, removeReferenceBlog, fetchExternalIdeas } from '@/app/actions/reference-blogs';
import { BlogKpis } from '@/components/blog/blog-kpis';

type PostStatus = 'DRAFT' | 'REVIEW' | 'IMAGES' | 'PUBLISHED';

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
  pubDate: number;
};

type ReferenceBlog = {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
};

export default function BlogAdminPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [published, setPublished] = useState<any[]>([]);
  const [hasMorePublished, setHasMorePublished] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [externalIdeas, setExternalIdeas] = useState<ExternalIdea[]>([]);
  const [referenceBlogs, setReferenceBlogs] = useState<ReferenceBlog[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  
  // Specific Loading states
  const [addingIdeaId, setAddingIdeaId] = useState<string | null>(null);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newBlogName, setNewBlogName] = useState('');
  const [newBlogUrl, setNewBlogUrl] = useState('');
  const [newBlogFeed, setNewBlogFeed] = useState('');
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [maxDays, setMaxDays] = useState<number>(3); // 3 days default

  const { toast } = useToast();

  useEffect(() => {
    const savedMaxDays = localStorage.getItem('blog_radar_max_days');
    if (savedMaxDays) {
      setMaxDays(Number(savedMaxDays));
    }
    loadPosts();
  }, []);

  useEffect(() => {
    loadIdeas(maxDays);
  }, [maxDays]);

  const handleMaxDaysChange = (val: string) => {
    const num = Number(val);
    setMaxDays(num);
    localStorage.setItem('blog_radar_max_days', num.toString());
  };

  const loadPosts = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    const kanbanResult = await getDashboardKanbanPosts();
    if (kanbanResult.success && kanbanResult.data) {
      setDrafts(kanbanResult.data.drafts);
      setReviews(kanbanResult.data.reviews);
      setImages(kanbanResult.data.images || []);
    }
    const publishedResult = await getDashboardPublishedPaginated(0, 8);
    if (publishedResult.success && publishedResult.data) {
      setPublished(publishedResult.data);
      setHasMorePublished(publishedResult.data.length === 8);
    }
    if (showLoadingState) setIsLoading(false);
  };

  const loadMorePublished = async () => {
    if (isLoadingMore || !hasMorePublished) return;
    setIsLoadingMore(true);
    const result = await getDashboardPublishedPaginated(published.length, 8);
    if (result.success && result.data) {
      setPublished(prev => [...prev, ...result.data]);
      setHasMorePublished(result.data.length === 8);
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePublished && !isLoadingMore) {
          loadMorePublished();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMorePublished, isLoadingMore, published.length]);

  const loadIdeas = async (days: number) => {
    setIsFetchingIdeas(true);
    const result = await fetchExternalIdeas(days === 0 ? undefined : days);
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
      loadIdeas(maxDays);
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
      loadIdeas(maxDays);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deletePost(deleteId);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Artigo deletado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
      loadPosts(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setDeleteId(null);
  };

  const handleStatusChange = async (id: string, newStatus: PostStatus) => {
    const result = await updatePostStatus(id, newStatus);
    if (result.success) {
      toast({ title: 'Atualizado', description: `Status alterado para ${newStatus}.`, className: 'bg-emerald-600 text-white border-none' });
      loadPosts(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  const handleCreateFromIdea = async (title: string, referenceUrl?: string, ideaId?: string) => {
    if (ideaId) setAddingIdeaId(ideaId);
    const result = await createDraftFromIdea(title, referenceUrl);
    if (result.success) {
      toast({ title: 'Ideia Adicionada!', description: 'O rascunho foi criado na coluna de Redação.', className: 'bg-emerald-600 text-white border-none' });
      setNewIdeaTitle('');
      loadPosts(false); // Atualiza os posts de forma natural sem tela de loading total
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setAddingIdeaId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isIdeaAdded = (link: string) => drafts.some(p => p.referenceUrl === link) || reviews.some(p => p.referenceUrl === link) || published.some(p => p.referenceUrl === link);

  const PostCard = ({ post }: { post: any }) => {
    const isScheduled = post.published && new Date(post.createdAt) > new Date();
    
    const handleCopyLink = (slugOrId: string) => {
      const url = `${window.location.origin}/blog/${slugOrId}`;
      navigator.clipboard.writeText(url);
      toast({ title: 'Copiado!', description: 'Link copiado.', className: 'bg-emerald-600 text-white border-none' });
    };
    
    return (
    <Card className="mb-3 hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-start gap-2">
            {isScheduled && <Clock className="w-4 h-4 text-[#f5b000] shrink-0" title="Publicação Agendada" />}
            <h3 className="font-semibold text-xs line-clamp-2 leading-tight">
              {post.title}
            </h3>
          </div>
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
        
        <p className="text-[10px] text-muted-foreground mb-4">
          Por {post.author} • {formatDate(post.createdAt)}
        </p>

        {post.referenceUrl && (
           <a href={post.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[8px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md mb-3 hover:bg-slate-200 transition-colors">
             <ExternalLink className="w-3 h-3" /> Link Original
           </a>
        )}

        <div className="flex gap-2">
          {/* BOTÕES PARA REDAÇÃO */}
          {(post.status === 'DRAFT' || (!post.status && !post.published)) && (
            <>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[8px] h-[27px]">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Pencil className="w-3 h-3 mr-1" /> Escrever
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'REVIEW')} 
                variant="default" size="sm" className="flex-1 text-[8px] h-[27px] bg-blue-600 hover:bg-blue-700"
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
                variant="outline" size="sm" className="flex-1 text-[8px] h-[27px]" title="Devolver para Redação"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[8px] h-[27px]">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Eye className="w-3 h-3 mr-1" /> Ler
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'IMAGES')} 
                variant="outline" size="sm" className="flex-1 text-[8px] h-[27px] text-fuchsia-600 hover:bg-fuchsia-50 hover:text-fuchsia-700" title="Enviar para Imagens"
              >
                Imagens <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </>
          )}

          {/* BOTÕES PARA IMAGENS */}
          {post.status === 'IMAGES' && (
            <>
              <Button 
                onClick={() => handleStatusChange(post.id, 'REVIEW')} 
                variant="outline" size="sm" className="flex-1 text-[8px] h-[27px]" title="Devolver para Revisão"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[8px] h-[27px]">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Eye className="w-3 h-3 mr-1" /> Ler
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'PUBLISHED')} 
                variant="default" size="sm" className="flex-1 text-[10px] h-[27px] bg-emerald-600 hover:bg-emerald-700 px-2"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Publicar
              </Button>
            </>
          )}

          {/* BOTÕES PARA PUBLICADO */}
          {(post.status === 'PUBLISHED' || (!post.status && post.published)) && (
            <>
              <Button onClick={() => handleCopyLink(post.slug || post.id)} variant="outline" size="sm" className="flex-1 text-[6px] h-[27px] px-0 max-w-[28px]" title="Copiar Link">
                <Copy className="w-3 h-3" />
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[6px] h-[27px]">
                <Link href={`/blog/${post.slug || post.id}`} target="_blank">
                  <Globe className="w-3 h-3 mr-1" /> Site
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 text-[6px] h-[27px]">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Link>
              </Button>
              <Button 
                onClick={() => handleStatusChange(post.id, 'REVIEW')} 
                variant="outline" size="sm" className="flex-1 text-[6px] h-[27px] text-amber-600 hover:text-amber-700 px-0 max-w-[28px]" title="Ocultar"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="flex flex-col bg-slate-50 rounded-xl border overflow-hidden">
      <div className="flex overflow-hidden" style={{minHeight: '1000px', height: 'calc(100vh - 3.5rem)'}}>
      
      {/* PAINEL ESQUERDO: PESQUISA & PAUTA (Retrátil) */}
      <div 
        className={`bg-white border-r transition-all duration-300 flex flex-col shrink-0 ${
          isSidebarOpen ? 'w-[235px]' : 'w-0 opacity-0 overflow-hidden border-none'
        }`}
      >
        <div className="py-3 px-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Pesquisa & Pauta
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => loadIdeas(maxDays)} disabled={isFetchingIdeas} className="h-8 w-8 text-muted-foreground" title="Atualizar Feeds">
              <RefreshCw className={`w-4 h-4 ${isFetchingIdeas ? 'animate-spin text-amber-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 text-muted-foreground" title="Configurar Referências">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-3 border-b bg-slate-50/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); if (newIdeaTitle) handleCreateFromIdea(newIdeaTitle, undefined, 'manual'); }}
            className="flex gap-2"
          >
            <Input 
              placeholder="Digite uma nova ideia..." 
              className="h-8 text-xs" 
              value={newIdeaTitle}
              onChange={(e) => setNewIdeaTitle(e.target.value)}
              disabled={addingIdeaId === 'manual'}
            />
            <Button type="submit" size="sm" className="h-8 px-3" disabled={!newIdeaTitle || addingIdeaId === 'manual'}>
              {addingIdeaId === 'manual' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        <ScrollArea className="flex-1 p-3 [&_[data-radix-scroll-area-scrollbar]]:!hidden">
          <div className="text-xs text-muted-foreground font-medium mb-3">Ideias de Concorrentes (RSS)</div>
          
          {isFetchingIdeas && externalIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Buscando pautas...</span>
            </div>
          ) : externalIdeas.length === 0 ? (
            <div className="text-center text-xs text-slate-400 p-6 border-2 border-dashed border-slate-100 rounded-xl">
              Nenhuma pauta encontrada.<br/>
              Adicione blogs nas configurações ou aumente o período de busca.
            </div>
          ) : (
            <div className="space-y-3">
              {externalIdeas.map((idea) => {
                const added = isIdeaAdded(idea.link);
                const isAdding = addingIdeaId === idea.id;

                return (
                  <div 
                    key={idea.id} 
                    className={`group flex gap-2 items-start p-3 rounded-lg border transition-colors ${
                      added 
                        ? 'border-amber-400 bg-amber-50/70' 
                        : 'bg-slate-50 border-slate-100 hover:border-amber-200 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <a href={idea.link} target="_blank" rel="noopener noreferrer" className={`text-xs font-semibold leading-snug mb-1 hover:text-amber-600 block line-clamp-3 ${added ? 'text-amber-900' : 'text-slate-800'}`}>
                        {idea.title}
                      </a>
                      <p className={`text-[10px] flex items-center flex-wrap gap-x-2 mt-1 ${added ? 'text-amber-700/70' : 'text-slate-400'}`}>
                        <span>
                          {idea.pubDate ? new Date(idea.pubDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                        </span>
                        <span className="opacity-50">•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <ExternalLink className="w-3 h-3" /> {idea.source}
                        </span>
                      </p>
                    </div>
                    <Button 
                      onClick={() => !added && handleCreateFromIdea(idea.title, idea.link, idea.id)}
                      variant={added ? "default" : "ghost"}
                      size="icon" 
                      className={`h-6 w-6 shrink-0 shadow-sm transition-all ${
                        added 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                          : 'bg-white border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-amber-600 group-hover:border-amber-300'
                      }`}
                      title={added ? "Já adicionado" : "Transformar em Pauta"}
                      disabled={added || isAdding}
                    >
                      {isAdding ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                );
              })}
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
          <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
            <Link href="/dashboard/blog/new">
              <Plus className="h-4 w-4 mr-2" /> Novo Artigo
            </Link>
          </Button>
        </div>

        {/* Colunas do Kanban */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex h-full p-6 gap-6 min-w-[700px]">
            
            {/* Coluna 1: Redação */}
            <div className="flex-1 flex flex-col max-w-[370px]">
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
            <div className="flex-1 flex flex-col max-w-[370px]">
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

            {/* Coluna 3: Imagens */}
            <div className="flex-1 flex flex-col max-w-[370px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                  Imagens
                </h3>
                <span className="text-xs font-semibold bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">{images.length}</span>
              </div>
              <ScrollArea className="flex-1 pr-4 -mr-4">
                {images.length === 0 && !isLoading ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Nada para adicionar imagens.</div>
                ) : (
                  images.map(post => <PostCard key={post.id} post={post} />)
                )}
              </ScrollArea>
            </div>

            {/* Coluna 4: Publicação */}
            <div className="flex-1 flex flex-col max-w-[340px]">
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
                  <>
                    {published.map(post => <PostCard key={post.id} post={post} />)}
                    
                    {/* Elemento observador para scroll infinito */}
                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
                      {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                      {!hasMorePublished && published.length > 0 && <span className="text-xs text-slate-400">Fim da lista</span>}
                    </div>
                  </>
                )}
              </ScrollArea>
            </div>

          </div>
        </div>

        {/* SEGUNDA DOBRA: KPIs DO BLOG */}
        <div className="shrink-0 border-t bg-slate-50 px-6 overflow-y-auto" style={{maxHeight: '380px'}}>
          <div className="py-3 flex items-center gap-2">
            <span className="font-bold text-sm text-slate-700">📊 Painel de Desempenho</span>
            <span className="text-xs text-slate-400">— dados em tempo real do blog</span>
          </div>
          <BlogKpis />
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
              Configurações do Motor de Pesquisa
            </DialogTitle>
            <DialogDescription>
              Adicione blogs concorrentes ou parceiros e ajuste o período de busca.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Período de Busca */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Período de Busca</h4>
                <p className="text-xs text-slate-500">Filtrar ideias de acordo com a data de publicação original.</p>
              </div>
              <Select value={maxDays.toString()} onValueChange={handleMaxDaysChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Últimas 24 horas</SelectItem>
                  <SelectItem value="3">Últimos 3 dias</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Último mês</SelectItem>
                  <SelectItem value="0">Qualquer data (Todos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
