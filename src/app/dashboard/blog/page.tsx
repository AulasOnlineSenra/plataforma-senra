'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff, Newspaper } from 'lucide-react';
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

      <Card>
        <CardHeader>
          <CardTitle>Artigos</CardTitle>
          <CardDescription>
            {posts.length} {posts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Carregando artigos...
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Newspaper className="h-12 w-12 opacity-30" />
              <p>Nenhum artigo encontrado.</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/dashboard/blog/new">Criar primeiro artigo</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Título</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Autor</th>
                    <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Data</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4">
                        <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">{post.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px] sm:hidden">
                          {post.author} · {formatDate(post.createdAt)}
                        </p>
                      </td>
                      <td className="py-4 hidden sm:table-cell text-muted-foreground">{post.author}</td>
                      <td className="py-4 hidden md:table-cell text-muted-foreground">{formatDate(post.createdAt)}</td>
                      <td className="py-4">
                        <Badge variant={post.published ? 'default' : 'secondary'}
                          className={post.published ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : ''}>
                          {post.published ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublish(post.id)}
                            title={post.published ? 'Despublicar' : 'Publicar'}
                          >
                            {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button asChild variant="ghost" size="icon" title="Editar">
                            <Link href={`/dashboard/blog/edit/${post.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(post.id)}
                            title="Deletar"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
