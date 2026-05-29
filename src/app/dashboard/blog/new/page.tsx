'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Type, Image as ImageIcon, Settings, Save, CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPost } from '@/app/actions/blog';
import dynamic from 'next/dynamic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
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
  const [insertedLinks, setInsertedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    import('@/app/actions/blog').then(m => {
      m.getPublishedPosts().then(res => {
        if (res.success && res.data) {
          setPublishedPosts(res.data);
        }
      });
    });
  }, []);

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

  const videoHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection(true);

      toast({
        title: 'Fazendo upload do vídeo...',
        description: 'Por favor, aguarde. Vídeos podem demorar alguns segundos.',
      });

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();

        if (result.success && result.data?.url) {
          const videoHtml = `\n[VIDEO:${result.data.url}]\n`;
          quill.insertText(range.index, videoHtml);
          quill.setSelection(range.index + videoHtml.length);
          toast({
            title: 'Vídeo adicionado!',
            description: 'O vídeo será exibido corretamente na página do artigo.',
            className: 'bg-emerald-600 text-white border-none',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no Upload',
            description: result.error || 'Não foi possível salvar o vídeo.',
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Erro inesperado',
          description: 'Ocorreu um erro ao enviar o vídeo.',
        });
      }
    };
  }, [toast]);

  const modules = useMemo(() => ({
    toolbar: {
      container: '#custom-toolbar',
      handlers: {
        image: imageHandler,
        video: videoHandler,
      },
    },
  }), [imageHandler, videoHandler]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const adjustTextareaHeight = () => {
    // Only adjust if we fallback to textarea (not using quill)
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent | null, publishMode?: 'now' | 'draft' | 'schedule') => {
    if (e) e.preventDefault();

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim() || !formData.author.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha título, resumo, conteúdo e autor.',
      });
      return;
    }

    if (publishMode === 'schedule' && !formData.createdAt) {
      toast({
        variant: 'destructive',
        title: 'Data obrigatória',
        description: 'Selecione uma data e hora para agendamento nas Configurações.',
      });
      return;
    }

    const publishedValue = publishMode === 'now' || publishMode === 'schedule' ? true : false;
    // Convert datetime-local (no timezone) to ISO string so VPS receives correct UTC time
    const createdAtValue = publishMode === 'schedule' && formData.createdAt
      ? new Date(formData.createdAt).toISOString()
      : '';

    setIsSubmitting(true);
    const result = await createPost({
      ...formData,
      published: publishedValue,
      createdAt: createdAtValue,
      tags: JSON.stringify(formData.tags.split(',').map((t) => t.trim()).filter(Boolean)),
    });

    if (result.success) {
      const msg = publishMode === 'now'
        ? 'Artigo publicado com sucesso!'
        : publishMode === 'schedule'
        ? 'Artigo agendado com sucesso!'
        : 'Rascunho salvo com sucesso!';
      toast({
        title: 'Sucesso!',
        description: msg,
        className: 'bg-emerald-600 text-white border-none',
      });
      router.push('/dashboard/blog');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  // Save as draft when going back if there's content
  const handleGoBack = async () => {
    const hasContent = formData.title.trim() || formData.content.trim() || formData.excerpt.trim();
    if (!hasContent) {
      router.push('/dashboard/blog');
      return;
    }

    setIsSubmitting(true);
    const draftTitle = formData.title.trim() || `Rascunho - ${new Date().toLocaleDateString('pt-BR')}`;
    const draftAuthor = formData.author.trim() || 'Administrador';
    const draftExcerpt = formData.excerpt.trim() || 'Rascunho não finalizado.';

    const result = await createPost({
      ...formData,
      title: draftTitle,
      author: draftAuthor,
      excerpt: draftExcerpt,
      published: false,
      createdAt: '',
      tags: JSON.stringify(formData.tags.split(',').map((t) => t.trim()).filter(Boolean)),
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Rascunho salvo!',
        description: 'Seu artigo foi salvo como rascunho e pode ser editado depois.',
        className: 'bg-emerald-600 text-white border-none',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Aviso',
        description: 'Não foi possível salvar o rascunho automaticamente.',
      });
    }
    router.push('/dashboard/blog');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
            onClick={handleGoBack}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : <ArrowLeft className="h-5 w-5 text-slate-600" />}
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">Rascunho</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] border-l-0 shadow-2xl overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="font-headline text-2xl">Configurações do Artigo</SheetTitle>
                <SheetDescription>Ajuste os metadados e configurações de publicação.</SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="author" className="text-slate-700 font-bold">Autor *</Label>
                  <Input
                    id="author"
                    placeholder="Nome do autor"
                    value={formData.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-brand-yellow focus-visible:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-slate-700 font-bold">Resumo *</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Breve descrição do artigo (aparece na listagem)"
                    value={formData.excerpt}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    rows={4}
                    className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-brand-yellow focus-visible:ring-offset-0 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Capa do Artigo
                  </Label>
                  {formData.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={formData.image} alt="Capa" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleChange('image', '')}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow"
                      >✕</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          toast({ title: 'Fazendo upload...', description: 'Aguarde enquanto salvamos a capa.' });
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            const res = await fetch('/api/upload', { method: 'POST', body: fd });
                            const result = await res.json();
                            if (result.success && result.data?.url) {
                              handleChange('image', result.data.url);
                              toast({ title: 'Capa enviada!', className: 'bg-emerald-600 text-white border-none' });
                            } else {
                              toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar a imagem.' });
                            }
                          } catch {
                            toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Tente novamente.' });
                          }
                        }}
                      />
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                      <span className="text-sm text-slate-500">Clique para fazer upload da capa</span>
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-slate-700 font-bold">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    placeholder="Educação, Metodologia, Dicas"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-brand-yellow focus-visible:ring-offset-0"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="published" className="text-base font-bold text-slate-800">Publicar Imediatamente</Label>
                    <p className="text-sm text-slate-500">
                      O artigo ficará visível publicamente de imediato.
                    </p>
                  </div>
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => handleChange('published', checked)}
                  />
                </div>

                {!formData.published && (
                  <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-2xl">
                    <Label htmlFor="createdAt" className="text-slate-700 font-bold flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Data e Hora de Publicação
                    </Label>
                    <p className="text-xs text-slate-500 mb-2">Defina para quando o artigo deve ser agendado.</p>
                    <Input
                      id="createdAt"
                      type="datetime-local"
                      value={formData.createdAt}
                      onChange={(e) => handleChange('createdAt', e.target.value)}
                      className="h-12 rounded-xl border-slate-300 focus-visible:ring-brand-yellow focus-visible:ring-offset-0"
                    />
                  </div>
                )}

                {/* Related Links Injector */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <Label className="text-slate-700 font-bold">Links de Apontamento</Label>
                  <p className="text-xs text-slate-500">Selecione posts para distribuir entre os parágrafos do artigo atual.</p>
                  
                  <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                    {publishedPosts.map(post => {
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
                    {publishedPosts.length === 0 && (
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
                      // Mark inserted links visually - keep checkboxes checked
                      setInsertedLinks(prev => new Set([...prev, ...selectedLinks]));
                      setSelectedLinks([]);
                      toast({ title: 'Sucesso', description: 'Links distribuídos no texto!', className: 'bg-emerald-600 text-white border-none' });
                    }}
                  >
                    Distribuir Links no Texto
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isSubmitting}
                className="rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white px-5 shadow-md transition-all hover:shadow-lg gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Publicar
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => handleSubmit(null, 'now')} className="gap-2 font-medium">
                <Save className="h-4 w-4 text-emerald-600" />
                Publicar agora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSubmit(null, 'draft')} className="gap-2">
                <Type className="h-4 w-4 text-slate-500" />
                Salvar rascunho
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSubmit(null, 'schedule')} className="gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Agendar publicação
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 w-full bg-[#f8fafc] flex flex-col relative">
        {/* Custom Toolbar */}
        <div id="custom-toolbar" className="sticky top-[72px] z-20 w-full bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-2 shadow-sm justify-center">
          <select className="ql-font border-slate-200 rounded-md" defaultValue="">
            <option value="">Padrão</option>
            <option value="arial">Arial</option>
            <option value="courier">Courier</option>
            <option value="garamond">Garamond</option>
            <option value="tahoma">Tahoma</option>
            <option value="times-new-roman">Times New Roman</option>
            <option value="verdana">Verdana</option>
          </select>
          <select className="ql-size border-slate-200 rounded-md" defaultValue="">
            <option value="small">Pequeno</option>
            <option value="">Normal</option>
            <option value="large">Grande</option>
            <option value="huge">Gigante</option>
          </select>
          <span className="w-px h-6 bg-slate-200 mx-1"></span>
          <button className="ql-bold text-slate-700 hover:text-slate-900" />
          <button className="ql-italic text-slate-700 hover:text-slate-900" />
          <button className="ql-underline text-slate-700 hover:text-slate-900" />
          <button className="ql-strike text-slate-700 hover:text-slate-900" />
          <span className="w-px h-6 bg-slate-200 mx-1"></span>
          <select className="ql-color border-slate-200 rounded-md" />
          <select className="ql-background border-slate-200 rounded-md" />
          <span className="w-px h-6 bg-slate-200 mx-1"></span>
          <button className="ql-list text-slate-700 hover:text-slate-900" value="ordered" />
          <button className="ql-list text-slate-700 hover:text-slate-900" value="bullet" />
          <span className="w-px h-6 bg-slate-200 mx-1"></span>
          <button className="ql-link text-slate-700 hover:text-slate-900" />
          <button className="ql-image text-slate-700 hover:text-slate-900" />
          <button className="ql-video text-slate-700 hover:text-slate-900" />
          <button className="ql-clean text-slate-700 hover:text-slate-900" />
        </div>

        <div className="max-w-4xl w-full mx-auto p-8 md:p-12 lg:px-24 bg-white min-h-[800px] shadow-sm my-8 border border-slate-100 rounded-xl">
          {formData.image && (
            <div className="mb-8 rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-[300px] w-full">
              <img src={formData.image} alt="Capa" className="w-full h-full object-cover" />
            </div>
          )}

          <Input
            placeholder="Título do Artigo"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 placeholder:text-slate-300 border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-4 rounded-none font-headline tracking-tight"
          />

          <div className="w-full h-px bg-slate-100 my-8"></div>

          <div className="text-slate-800">
            <style dangerouslySetInnerHTML={{__html: `
              .ql-container.ql-snow {
                border: none;
                font-size: 1.125rem;
                font-family: inherit;
                min-height: 500px;
              }
              .ql-editor {
                padding: 0;
                line-height: 1.8;
              }
              .ql-editor p { margin-bottom: 1.2rem; }
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
              placeholder="Comece a escrever seu conteúdo épico aqui..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
