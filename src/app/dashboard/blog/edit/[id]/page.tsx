'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  const quillRef = useRef<any>(null);

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

  const [publishedPosts, setPublishedPosts] = useState<{id: string, title: string}[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

  useEffect(() => {
    import('@/app/actions/blog').then(m => {
      m.getPublishedPosts().then(res => {
        if (res.success && res.data) {
          setPublishedPosts(res.data);
        }
      });
    });
  }, []);

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

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('multiple', 'true');
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection(true);

      toast({
        title: 'Fazendo upload...',
        description: `Aguarde enquanto salvamos ${files.length} imagem(ns).`,
      });

      try {
        const uploadedUrls: string[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const formData = new FormData();
          formData.append('file', files[i]);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await res.json();
          if (result.success && result.data?.url) {
            uploadedUrls.push(result.data.url);
          }
        }

        if (uploadedUrls.length > 0) {
          if (uploadedUrls.length === 1) {
            quill.insertEmbed(range.index, 'image', uploadedUrls[0]);
            quill.setSelection(range.index + 1);
          } else {
            const marker = `\n[CARROSSEL_DE_IMAGENS:${uploadedUrls.join(',')}]\n`;
            quill.insertText(range.index, marker);
            quill.setSelection(range.index + marker.length);
          }
          
          toast({
            title: 'Sucesso!',
            description: uploadedUrls.length > 1 ? 'Carrossel inserido com sucesso.' : 'Imagem enviada com sucesso.',
            className: 'bg-emerald-600 text-white border-none',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no Upload',
            description: 'Não foi possível salvar as imagens.',
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Erro inesperado',
          description: 'Ocorreu um erro ao enviar a imagem.',
        });
      }
    };
  }, [toast]);

  const modules = useMemo(() => ({
    toolbar: {
      container: '#custom-toolbar',
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

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
    try {
      const id = params.id as string;
      // Convert datetime-local (local time, no tz) to ISO string with timezone offset
      // so the server stores the correct UTC time regardless of VPS timezone.
      const createdAtISO = formData.createdAt
        ? new Date(formData.createdAt).toISOString()
        : undefined;

      let finalCreatedAt = createdAtISO;
      const scheduledDate = createdAtISO ? new Date(createdAtISO) : null;
      
      // If the user checked "Publicar Imediatamente" BUT the date is still in the future,
      // we must reset the date to NOW so it publishes immediately.
      if (formData.published && scheduledDate && scheduledDate > new Date()) {
        finalCreatedAt = new Date().toISOString();
      }

      const isScheduled = !formData.published && scheduledDate && scheduledDate > new Date();
      const publishedValue = isScheduled ? true : formData.published;

      const result = await updatePost(id, {
        ...formData,
        published: publishedValue,
        ...(finalCreatedAt && { createdAt: finalCreatedAt }),
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
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Falha ao salvar.' });
      }
    } catch (err) {
      console.error('Erro ao salvar artigo:', err);
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
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
                <div id="custom-toolbar" className="w-full bg-slate-50 border-b border-slate-200 px-2 py-2 flex flex-wrap items-center gap-1 sticky top-0 z-10">
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
                  .ql-container.ql-snow { border: none; font-size: 1.05rem; min-height: 400px; }
                  .ql-font-arial { font-family: Arial, sans-serif; }
                  .ql-font-courier { font-family: "Courier New", Courier, monospace; }
                  .ql-font-garamond { font-family: Garamond, serif; }
                  .ql-font-tahoma { font-family: Tahoma, sans-serif; }
                  .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif; }
                  .ql-font-verdana { font-family: Verdana, sans-serif; }
                `}} />
                <ReactQuill 
                  ref={quillRef}
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => handleChange('content', val)}
                  modules={modules}
                  placeholder="Escreva seu artigo aqui..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Capa do Artigo</Label>
              {formData.image ? (
                <div className="relative rounded-lg overflow-hidden border bg-slate-50">
                  <img src={formData.image} alt="Capa" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleChange('image', '')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow"
                  >✕</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      toast({ title: 'Fazendo upload...', description: 'Aguarde.' });
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch('/api/upload', { method: 'POST', body: fd });
                        const result = await res.json();
                        if (result.success && result.data?.url) {
                          handleChange('image', result.data.url);
                          toast({ title: 'Capa enviada!', className: 'bg-emerald-600 text-white border-none' });
                        } else {
                          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar.' });
                        }
                      } catch {
                        toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
                      }
                    }}
                  />
                  <span className="text-xs text-slate-400">Clique para upload da capa</span>
                </label>
              )}
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
                    <CalendarIcon className="h-4 w-4" /> Agendar Publicação
                  </Label>
                  <p className="text-xs text-slate-500 mb-2">Se preenchido, o artigo será publicado automaticamente nessa data e hora. Deixe vazio para salvar como rascunho.</p>
                  <Input
                    id="createdAt"
                    type="datetime-local"
                    value={formData.createdAt}
                    onChange={(e) => handleChange('createdAt', e.target.value)}
                    className="bg-white"
                  />
                </div>
              )}

              {/* Related Links Injector */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Label className="text-slate-700 font-bold">Links de Apontamento</Label>
                <p className="text-xs text-slate-500">Selecione posts para distribuir entre os parágrafos do artigo atual.</p>
                
                <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                  {publishedPosts.filter(p => p.id !== params.id).map(post => {
                    const isInserted = formData.content?.includes(post.id);
                    const isSelected = selectedLinks.includes(post.id);
                    return (
                      <label key={post.id} className={`flex items-start gap-2 cursor-pointer group rounded-lg px-2 py-1 transition-colors ${isInserted ? 'bg-emerald-50 border border-emerald-200' : isSelected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          checked={isSelected || isInserted}
                          disabled={isInserted}
                          onChange={(e) => {
                            if (isInserted) return;
                            if (e.target.checked) setSelectedLinks(prev => [...prev, post.id]);
                            else setSelectedLinks(prev => prev.filter(id => id !== post.id));
                          }}
                        />
                        <span className={`text-sm line-clamp-2 flex-1 ${isInserted ? 'text-emerald-700 font-medium' : 'text-slate-700 group-hover:text-amber-600'} transition-colors`}>
                          {post.title}
                          {isInserted && <span className="ml-1 text-xs text-emerald-600">✓ adicionado</span>}
                        </span>
                      </label>
                    );
                  })}
                  {publishedPosts.filter(p => p.id !== params.id).length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-2">Nenhum post publicado.</p>
                  )}
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                  disabled={selectedLinks.length === 0}
                  onClick={() => {
                    if (!formData.content) {
                      toast({ title: 'Aviso', description: 'Escreva algum conteúdo primeiro.', variant: 'destructive' });
                      return;
                    }
                    
                    const selectedPostsData = publishedPosts.filter(p => selectedLinks.includes(p.id));
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = formData.content;
                    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
                    
                    if (paragraphs.length < 2) {
                      selectedPostsData.forEach(post => {
                        const a = document.createElement('p');
                        a.innerHTML = `<strong><em>Leia também: <a href="/blog/${post.id}" target="_blank" rel="noopener noreferrer" style="color: #d97706; text-decoration: underline;">${post.title}</a></em></strong>`;
                        tempDiv.appendChild(a);
                      });
                    } else {
                      const interval = Math.max(1, Math.floor(paragraphs.length / (selectedPostsData.length + 1)));
                      selectedPostsData.forEach((post, index) => {
                        const targetIndex = Math.min((index + 1) * interval - 1, paragraphs.length - 1);
                        const targetP = paragraphs[targetIndex];
                        if (targetP) {
                          const linkHtml = document.createElement('p');
                          linkHtml.innerHTML = `<strong><em>Leia também: <a href="/blog/${post.id}" target="_blank" rel="noopener noreferrer" style="color: #d97706; text-decoration: underline;">${post.title}</a></em></strong>`;
                          targetP.parentNode?.insertBefore(linkHtml, targetP.nextSibling);
                        }
                      });
                    }
                    
                    handleChange('content', tempDiv.innerHTML);
                    setSelectedLinks([]);
                    toast({ title: 'Sucesso', description: 'Links distribuídos no texto!', className: 'bg-emerald-600 text-white border-none' });
                  }}
                >
                  Distribuir Links no Texto
                </Button>
              </div>
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
