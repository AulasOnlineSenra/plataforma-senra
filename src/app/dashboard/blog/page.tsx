'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBlogPosts, deletePost, togglePublishPost } from '@/app/actions/blog';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string | null;
  tags: string;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const result = await getBlogPosts();
    if (result.success && result.data) {
      setPosts(result.data);
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deletePost(deleteId);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Post deletado com sucesso.', className: 'bg-emerald-600 text-white border-none' });
      loadPosts();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setDeleteId(null);
  };

  const handleTogglePublish = async (id: string) => {
    const result = await togglePublishPost(id);
    if (result.success) {
      toast({ title: 'Sucesso', description: 'Status de publicação alterado.', className: 'bg-emerald-600 text-white border-none' });
      loadPosts();
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Blog
          </h1>
          <p className="text-muted-foreground">Gerencie os artigos do blog da plataforma.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/blog/new">
            <Plus className="h-4 w-4" />
            Novo Artigo
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar com Meses */}
        <div className="w-full lg:w-[calc(25%-50px)] shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Arquivos</CardTitle>
              <CardDescription className="text-xs">
                {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
              ) : posts.length === 0 ? (
                <div className="text-sm text-muted-foreground">Vazio</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {Object.keys(
                    posts.reduce((acc, post) => {
                      const m = new Date(post.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      acc[m] = true;
                      return acc;
                    }, {} as Record<string, boolean>)
                  ).map((month) => (
                    <a
                      key={month}
                      href={`#month-${month.replace(/\s/g, '-')}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1.5 rounded-md transition-colors capitalize"
                    >
                      {month}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Artigos */}
        <div className="w-full lg:w-[calc(75%+50px)] space-y-6 flex-grow">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                Carregando artigos...
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Newspaper className="h-12 w-12 opacity-30" />
                <p>Nenhum artigo encontrado.</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/dashboard/blog/new">Criar primeiro artigo</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(
              posts.reduce((acc, post) => {
                const month = new Date(post.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                if (!acc[month]) acc[month] = [];
                acc[month].push(post);
                return acc;
              }, {} as Record<string, typeof posts>)
            ).map(([month, monthPosts]) => (
              <div key={month} id={`month-${month.replace(/\s/g, '-')}`} className="scroll-mt-6">
                <h2 className="text-lg font-bold capitalize mb-3 text-foreground/80 pl-1">{month}</h2>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left bg-muted/20">
                            <th className="pb-3 pt-4 px-4 font-medium text-muted-foreground">Título</th>
                            <th className="pb-3 pt-4 px-4 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                            <th className="pb-3 pt-4 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="pb-3 pt-4 px-4 font-medium text-muted-foreground">Visitas</th>
                            <th className="pb-3 pt-4 px-4 font-medium text-muted-foreground text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthPosts.map((post) => (
                            <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 max-w-[200px] sm:max-w-[300px]">
                                <div className="flex flex-col">
                                  <Link 
                                    href={`/dashboard/blog/edit/${post.id}`}
                                    className="font-medium truncate hover:text-brand-yellow transition-colors block"
                                    title={post.title}
                                  >
                                    {post.title}
                                  </Link>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {post.author}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">{formatDate(post.createdAt)}</td>
                              <td className="py-3 px-4">
                                {(() => {
                                  const isScheduled = post.published && new Date(post.createdAt) > new Date();
                                  return (
                                    <Badge
                                      variant={isScheduled ? 'outline' : post.published ? 'default' : 'secondary'}
                                      className={isScheduled ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200' : post.published ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}
                                    >
                                      {isScheduled ? 'Programado' : post.published ? 'Publicado' : 'Rascunho'}
                                    </Badge>
                                  );
                                })()}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Eye className="w-3 h-3 opacity-50" />
                                  {post.views || 0}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Abrir menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleTogglePublish(post.id)}>
                                      {post.published ? (
                                        <><EyeOff className="mr-2 h-4 w-4" />Despublicar</>
                                      ) : (
                                        <><Eye className="mr-2 h-4 w-4" />Publicar</>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/blog/edit/${post.id}`}>
                                        <Pencil className="mr-2 h-4 w-4" />Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => setDeleteId(post.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />Deletar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este artigo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Deletar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
