'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBlogPostById, updatePost } from '@/app/actions/blog';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => {
  return import('react-quill-new').then((mod) => {
    const Quill = mod.default.Quill;
    const Font = Quill.import('formats/font');
    Font.whitelist = ['arial', 'courier', 'garamond', 'tahoma', 'verdana', 'times-new-roman'];
    Quill.register(Font, true);
    return mod;
  });
}, { ssr: false });

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    image: '',
    tags: '',
    published: false,
    createdAt: '',
  });

  useEffect(() => {
    const loadPost = async () => {
      const id = params.id as string;
      const result = await getBlogPostById(id);
      if (result.success && result.data) {
        const post = result.data;
        let tagsStr = '';
        try {
          const parsed = JSON.parse(post.tags);
          if (Array.isArray(parsed)) {
            tagsStr = parsed.join(', ');
          }
        } catch {
          tagsStr = post.tags;
        }
        setFormData({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          image: post.image || '',
          tags: tagsStr,
          published: post.published,
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString().slice(0, 16) : '',
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Post não encontrado.' });
        router.push('/dashboard/blog');
      }
      setIsLoading(false);
    };
    loadPost();
  }, [params.id, router, toast]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: '#custom-toolbar',
    },
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim() || !formData.author.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha título, resumo, conteúdo e autor.',
      });
      return;
    }

    setIsSubmitting(true);
    const id = params.id as string;
    const result = await updatePost(id, {
      ...formData,
      tags: JSON.stringify(formData.tags.split(',').map((t) => t.trim()).filter(Boolean)),
    });

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: 'Artigo atualizado com sucesso.',
        className: 'bg-emerald-600 text-white border-none',
      });
      router.push('/dashboard/blog');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando artigo...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Editar Artigo</h1>
          <p className="text-muted-foreground">Atualize as informações do artigo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Artigo</CardTitle>
            <CardDescription>Edite os campos abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Título do artigo"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                placeholder="Nome do autor"
                value={formData.author}
                onChange={(e) => handleChange('author', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo *</Label>
              <Textarea
                id="excerpt"
                placeholder="Breve descrição do artigo (aparece na listagem)"
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <div className="bg-white text-slate-800 rounded-md border border-slate-200">
                <div id="custom-toolbar" className="w-full bg-slate-50 border-b border-slate-200 px-2 py-2 flex flex-wrap items-center gap-1">
                  <select className="ql-font border-slate-200 rounded-md h-8 text-sm" defaultValue="">
                    <option value="">Padrão</option>
                    <option value="arial">Arial</option>
                    <option value="courier">Courier</option>
                    <option value="garamond">Garamond</option>
                    <option value="tahoma">Tahoma</option>
                    <option value="times-new-roman">Times New</option>
                    <option value="verdana">Verdana</option>
                  </select>
                  <select className="ql-size border-slate-200 rounded-md h-8 text-sm" defaultValue="">
                    <option value="small">Pequeno</option>
                    <option value="">Normal</option>
                    <option value="large">Grande</option>
                    <option value="huge">Gigante</option>
                  </select>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-strike" />
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <select className="ql-color border-slate-200 rounded-md h-8" />
                  <select className="ql-background border-slate-200 rounded-md h-8" />
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                  <button className="ql-link" />
                  <button className="ql-image" />
                  <button className="ql-clean" />
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  .ql-toolbar.ql-snow { display: none; }
                  .ql-container.ql-snow { border: none; font-size: 1.05rem; min-height: 400px; }
                  .ql-font-arial { font-family: Arial, sans-serif; }
                  .ql-font-courier { font-family: "Courier New", Courier, monospace; }
                  .ql-font-garamond { font-family: Garamond, serif; }
                  .ql-font-tahoma { font-family: Tahoma, sans-serif; }
                  .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif; }
                  .ql-font-verdana { font-family: Verdana, sans-serif; }
                `}} />
                <ReactQuill 
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => handleChange('content', val)}
                  modules={modules}
                  placeholder="Escreva seu artigo aqui..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL da Imagem</Label>
              <Input
                id="image"
                placeholder="https://exemplo.com/imagem.jpg"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="Educação, Metodologia, Dicas"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
              />
            </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="published" className="text-base">Publicar Imediatamente</Label>
                  <p className="text-sm text-muted-foreground">
                    O artigo ficará visível publicamente.
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => handleChange('published', checked)}
                />
              </div>

              {!formData.published && (
                <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-xl">
                  <Label htmlFor="createdAt" className="text-slate-700 font-bold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Data e Hora de Publicação
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">Defina para quando o artigo deve ser agendado.</p>
                  <Input
                    id="createdAt"
                    type="datetime-local"
                    value={formData.createdAt}
                    onChange={(e) => handleChange('createdAt', e.target.value)}
                    className="bg-white"
                  />
                </div>
              )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button asChild variant="outline" type="button">
            <Link href="/dashboard/blog">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
