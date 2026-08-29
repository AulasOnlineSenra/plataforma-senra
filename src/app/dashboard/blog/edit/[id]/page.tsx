'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Type, Image as ImageIcon, Settings, Save, CalendarIcon, ChevronDown, Clock, CheckCircle2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBlogPostById, updatePost, createDraftFromIdea } from '@/app/actions/blog';
import dynamic from 'next/dynamic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AiDraftModal } from '@/components/blog/ai-draft-modal';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => {
  return import('react-quill-new').then((mod) => {
    const Quill = mod.default.Quill;
    const Font = Quill.import('formats/font');
    Font.whitelist = ['arial', 'courier', 'garamond', 'tahoma', 'verdana', 'times-new-roman'];
    Quill.register(Font, true);

    const BaseImageFormat = Quill.import('formats/image');
    class ImageFormat extends BaseImageFormat {
      static formats(domNode: any) {
        return ['alt', 'width', 'height'].reduce(function(formats: any, attribute: string) {
          if (domNode.hasAttribute(attribute)) {
            formats[attribute] = domNode.getAttribute(attribute);
          }
          return formats;
        }, {});
      }
      format(name: string, value: any) {
        if (['alt', 'width', 'height'].indexOf(name) > -1) {
          if (value) {
            this.domNode.setAttribute(name, value);
          } else {
            this.domNode.removeAttribute(name);
          }
        } else {
          super.format(name, value);
        }
      }
    }
    Quill.register(ImageFormat, true);

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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [altPrompt, setAltPrompt] = useState<{
    isOpen: boolean;
    initialAlt: string;
    onSave: (val: string) => void;
  }>({ isOpen: false, initialAlt: '', onSave: () => {} });
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [selectedTextData, setSelectedTextData] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isSendingIdea, setIsSendingIdea] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    image: '',
    tags: '',
    metaDescription: '',
    published: false,
    createdAt: '',
  });

  const [publishedPosts, setPublishedPosts] = useState<{id: string, title: string, slug?: string | null}[]>([]);
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
          metaDescription: (post as any).metaDescription || '',
          published: post.published,
          createdAt: post.createdAt ? (() => {
            const d = new Date(post.createdAt);
            if (isNaN(d.getTime())) return '';
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          })() : '',
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Post não encontrado.' });
        router.push('/dashboard/blog');
      }
      setIsLoading(false);
    };
    loadPost();
  }, [params.id, router, toast]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const currentAlt = target.getAttribute('alt') || '';
        setAltPrompt({
          isOpen: true,
          initialAlt: currentAlt,
          onSave: (newAlt: string) => {
            const quill = quillRef.current?.getEditor();
            if (quill) {
              let blot;
              if (quill.constructor && typeof quill.constructor.find === 'function') {
                blot = quill.constructor.find(target);
              }
              if (blot && typeof blot.format === 'function') {
                blot.format('alt', newAlt);
              } else {
                target.setAttribute('alt', newAlt);
              }
              setFormData(prev => ({ ...prev, content: quill.root.innerHTML }));
            }
          }
        });
      }
    };
    document.addEventListener('dblclick', handleDblClick);
  }, [formData.title]);

  // Fix: Quill clipboard does not handle <th>/<thead> correctly — header cells
  // get concatenated into one line. This interceptor pre-processes the pasted
  // HTML before Quill sees it, converting <th> → bold <td> and <thead> → <tbody>.
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const attach = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill?.root) return false;

      const handlePaste = (e: ClipboardEvent) => {
        const html = e.clipboardData?.getData('text/html');
        if (!html || !/<th[\s>]/i.test(html)) return; // Only intervene when <th> is present

        e.preventDefault();
        e.stopPropagation();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Convert <th> → <td><strong>...</strong></td>
        doc.querySelectorAll('th').forEach((th) => {
          const td = doc.createElement('td');
          const strong = doc.createElement('strong');
          strong.innerHTML = th.innerHTML;
          td.appendChild(strong);
          th.parentNode?.replaceChild(td, th);
        });

        // Convert <thead> → <tbody> so Quill treats header rows like body rows
        doc.querySelectorAll('thead').forEach((thead) => {
          const tbody = doc.createElement('tbody');
          tbody.innerHTML = thead.innerHTML;
          thead.parentNode?.replaceChild(tbody, thead);
        });

        const fixedHtml = doc.body.innerHTML;
        const range = quill.getSelection(true);
        quill.clipboard.dangerouslyPasteHTML(range?.index ?? 0, fixedHtml);
      };

      quill.root.addEventListener('paste', handlePaste, true);
      cleanup = () => quill.root.removeEventListener('paste', handlePaste, true);
      return true;
    };

    if (!attach()) {
      const timer = setInterval(() => {
        if (attach()) clearInterval(timer);
      }, 300);
      return () => {
        clearInterval(timer);
        cleanup?.();
      };
    }

    return () => cleanup?.();
  }, []);

  // Effect to track text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const container = editorContainerRef.current;
        if (!selection || selection.isCollapsed || !container) {
          if (selection?.isCollapsed) setSelectedTextData(null);
          return;
        }

        if (!container.contains(selection.anchorNode)) {
          setSelectedTextData(null);
          return;
        }

        const text = selection.toString().trim();
        if (!text) {
          setSelectedTextData(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setSelectedTextData({
          text,
          top: rect.top - containerRect.top - 40,
          left: rect.left - containerRect.left + (rect.width / 2),
        });
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleMouseUp);
    };
  }, []);

  const counters = useMemo(() => {
    const text = (formData.content || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const blocks = (formData.content || '').match(/<\/(p|h[1-6]|li)>/g);
    const lines = blocks ? blocks.length : 0;
    return { chars, words, lines };
  }, [formData.content]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    // For single image
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
            setTimeout(() => {
              setAltPrompt({
                isOpen: true,
                initialAlt: '',
                onSave: (newAlt: string) => {
                  if (newAlt) {
                    const [leaf] = quill.getLeaf(range.index);
                    if (leaf && typeof leaf.format === 'function') {
                      leaf.format('alt', newAlt);
                      setFormData(prev => ({ ...prev, content: quill.root.innerHTML }));
                    }
                  }
                }
              });
            }, 100);
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

  const carouselHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('multiple', 'true'); // explicitly multiple for carousel
    input.click();

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection(true);

      toast({
        title: 'Criando carrossel...',
        description: `Aguarde enquanto salvamos ${files.length} imagens.`,
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
            description: 'Carrossel inserido com sucesso.',
            className: 'bg-emerald-600 text-white border-none',
          });
        }
      } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Erro ao criar carrossel.' });
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
        carousel: carouselHandler,
        video: videoHandler,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [imageHandler, videoHandler]);

  const handleSubmit = async (e: React.FormEvent | null, publishMode?: 'now' | 'draft' | 'schedule' | 'update' | 'review') => {
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

    setIsSubmitting(true);
    try {
      const id = params.id as string;
      
      const createdAtISO = formData.createdAt
        ? new Date(formData.createdAt).toISOString()
        : undefined;

      let finalCreatedAt = createdAtISO;
      const scheduledDate = createdAtISO ? new Date(createdAtISO) : null;
      
      let publishedValue = formData.published;
      let statusValue: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | undefined;
      
      if (publishMode === 'now') {
         publishedValue = true;
         finalCreatedAt = new Date().toISOString();
         statusValue = 'PUBLISHED';
      } else if (publishMode === 'draft') {
         publishedValue = false;
         statusValue = 'DRAFT';
      } else if (publishMode === 'schedule') {
         publishedValue = true; // It's "published" but in the future
         statusValue = 'PUBLISHED';
      } else if (publishMode === 'review') {
         publishedValue = false;
         statusValue = 'REVIEW';
      } else {
        // 'update' mode keeps existing logic
        if (formData.published && scheduledDate && scheduledDate > new Date()) {
          finalCreatedAt = new Date().toISOString();
        }
        const isScheduled = !formData.published && scheduledDate && scheduledDate > new Date();
        publishedValue = isScheduled ? true : formData.published;
      }

      const result = await updatePost(id, {
        ...formData,
        published: publishedValue,
        ...(finalCreatedAt && { createdAt: finalCreatedAt }),
        ...(statusValue && { status: statusValue }),
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
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const isScheduled = formData.published && formData.createdAt && new Date(formData.createdAt) > new Date();

  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${weekdays[d.getDay()]} ${day}/${month}/${year} às ${time}`;
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
            onClick={() => handleSubmit(null, 'update')}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : <ArrowLeft className="h-5 w-5 text-slate-600" />}
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="bg-blue-100 px-2 py-1 rounded-md text-blue-700">Editando Artigo</span>
            {isScheduled && (
              <span className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md text-amber-700 font-bold border border-amber-200">
                <Clock className="w-4 h-4 text-[#f5b000]" /> Agendado para: {formatDateForDisplay(formData.createdAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AiDraftModal 
            currentTitle={formData.title} 
            onDraftGenerated={(contentHtml, seo) => {
              if (contentHtml) {
                const quill = quillRef.current?.getEditor();
                if (quill) {
                  // Append content to existing content or replace if empty
                  const currentLength = quill.getLength();
                  quill.clipboard.dangerouslyPasteHTML(currentLength, contentHtml);
                  setFormData(prev => ({ ...prev, content: quill.root.innerHTML }));
                } else {
                  setFormData(prev => ({ ...prev, content: prev.content + contentHtml }));
                }
              }
              if (seo) {
                setFormData(prev => ({
                  ...prev,
                  metaDescription: seo.metaDescription || prev.metaDescription,
                  tags: seo.tags || prev.tags
                }));
              }
            }}
          />
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
                  <Label htmlFor="metaDescription" className="text-slate-700 font-bold">Meta Description (SEO)</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Resumo otimizado para o Google (máx 160 caracteres)"
                    value={formData.metaDescription}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    maxLength={160}
                    rows={2}
                    className="rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-brand-yellow focus-visible:ring-offset-0 resize-none"
                  />
                  <div className="text-xs text-slate-400 text-right">{formData.metaDescription?.length || 0}/160</div>
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
                  
                  <div className="max-h-[278px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                    {publishedPosts.filter(p => p.id !== params.id).map(post => {
                      const isInserted = formData.content?.includes(post.slug || post.id);
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
                          <span className={`text-xs line-clamp-2 flex-1 ${isInserted ? 'text-emerald-700 font-medium' : 'text-slate-700 group-hover:text-amber-600'} transition-colors`}>
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
                          a.innerHTML = `<strong style="font-size: 13px;"><em>Leia também: <a href="/blog/${post.slug || post.id}" target="_blank" rel="noopener noreferrer" style="color: #d97706; text-decoration: underline;">${post.title}</a></em></strong>`;
                          tempDiv.appendChild(a);
                        });
                      } else {
                        const interval = Math.max(1, Math.floor(paragraphs.length / (selectedPostsData.length + 1)));
                        selectedPostsData.forEach((post, index) => {
                          const targetIndex = Math.min((index + 1) * interval - 1, paragraphs.length - 1);
                          const targetP = paragraphs[targetIndex];
                          if (targetP) {
                            const linkHtml = document.createElement('p');
                            linkHtml.innerHTML = `<strong style="font-size: 13px;"><em>Leia também: <a href="/blog/${post.slug || post.id}" target="_blank" rel="noopener noreferrer" style="color: #d97706; text-decoration: underline;">${post.title}</a></em></strong>`;
                            targetP.parentNode?.insertBefore(linkHtml, targetP.nextSibling);
                          }
                        });
                      }
                      
                      handleChange('content', tempDiv.innerHTML);
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
                    Salvar Alterações
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => handleSubmit(null, 'review')} className="gap-2 font-medium">
                <Save className="h-4 w-4 text-emerald-600" />
                Atualizar (Revisão)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSubmit(null, 'now')} className="gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Forçar Publicação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSubmit(null, 'draft')} className="gap-2">
                <Type className="h-4 w-4 text-slate-500" />
                Voltar para Rascunho
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
        <div id="custom-toolbar" className="sticky top-[72px] z-20 w-full bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mx-auto sm:mx-0">
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
          <button className="ql-link text-slate-700 hover:text-slate-900" title="Inserir Link" />
          <button className="ql-image text-slate-700 hover:text-slate-900" title="Inserir Imagem Simples" />
          <button className="ql-carousel text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1" title="Inserir Carrossel de Imagens">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </button>
          <button className="ql-video text-slate-700 hover:text-slate-900" title="Inserir Vídeo" />
          <button className="ql-clean text-slate-700 hover:text-slate-900" title="Limpar Formatação" />
          </div>

          {/* Counters */}
          <div className="text-[11px] font-semibold text-slate-400 hidden sm:flex items-center gap-3">
            <span>{counters.words} <span className="font-normal">palavras</span></span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{counters.chars} <span className="font-normal">caracteres</span></span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{counters.lines} <span className="font-normal">linhas</span></span>
          </div>
        </div>

        <div className="max-w-4xl w-full mx-auto p-8 md:p-12 lg:px-24 bg-white min-h-[800px] shadow-sm my-8 border border-slate-100 rounded-xl">
          {formData.image && (
            <div className="mb-8 rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-[300px] w-full">
              <img src={formData.image} alt="Capa" className="w-full h-full object-cover" />
            </div>
          )}

          <textarea
            ref={titleRef}
            placeholder="Título do Artigo"
            value={formData.title}
            onChange={(e) => {
              handleChange('title', e.target.value);
            }}
            rows={1}
            className="w-full text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 placeholder:text-slate-300 border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-4 rounded-none font-headline tracking-tight resize-none bg-transparent overflow-hidden"
            style={{ minHeight: '80px' }}
          />

          <div className="w-full h-px bg-slate-100 my-8"></div>

          <div className="text-slate-800 relative" ref={editorContainerRef}>
            
            {/* Floating Selection CRM Button */}
            {selectedTextData && (
              <div 
                className="absolute z-50 flex items-center justify-center transition-all duration-200 animate-in fade-in zoom-in-95"
                style={{
                  top: `${selectedTextData.top}px`,
                  left: `${selectedTextData.left}px`,
                  transform: 'translate(-50%, 0)',
                }}
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // Prevents selection from clearing
                  disabled={isSendingIdea}
                  onClick={async () => {
                    setIsSendingIdea(true);
                    toast({ title: 'Salvando...', description: 'Criando novo rascunho de artigo.' });
                    const res = await createDraftFromIdea(selectedTextData.text.slice(0, 100));
                    if (res.success) {
                      toast({ title: 'Rascunho criado!', description: 'Adicionado na aba de Redação do Blog.', className: 'bg-emerald-600 text-white border-none' });
                    } else {
                      toast({ variant: 'destructive', title: 'Erro', description: res.error });
                    }
                    setIsSendingIdea(false);
                    setSelectedTextData(null);
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-emerald-600 text-white shadow-lg flex items-center gap-2 transition-colors border border-slate-700 hover:border-emerald-600 text-xs font-medium cursor-pointer"
                  title="Transformar texto selecionado em rascunho de artigo"
                >
                  {isSendingIdea ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Type className="w-3.5 h-3.5" />}
                  Nova Ideia (Blog)
                </button>
              </div>
            )}

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
              
              /* Headings Spacing */
              .ql-editor h2 {
                margin-top: 3.5rem !important;
                margin-bottom: 2rem !important;
              }
              .ql-editor h3 {
                margin-top: 2.5rem !important;
                margin-bottom: 2rem !important;
              }
              
              /* Lists Spacing */
              .ql-editor ul, .ql-editor ol {
                margin-top: 2rem !important;
                margin-bottom: 2rem !important;
              }
              
              /* Table Styling */
              .ql-editor table {
                width: 100% !important;
                border: none !important;
                border-collapse: collapse !important;
                margin-top: 2rem !important;
                margin-bottom: 2rem !important;
              }
              .ql-editor table td, .ql-editor table th {
                border-top: none !important;
                border-left: none !important;
                border-right: none !important;
                border-bottom: 1px solid #e2e8f0 !important;
                padding: 1rem !important;
                vertical-align: top !important;
                word-wrap: break-word !important;
              }
              .ql-editor table td:first-child, .ql-editor table th:first-child {
                padding-right: 1.5rem !important;
              }
              .ql-editor table th {
                font-weight: 700 !important;
                text-align: left !important;
                color: #334155 !important;
                font-size: 0.75rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
              }
            `}} />
            <ReactQuill 
              ref={quillRef}
              theme="snow"
              value={formData.content}
              onChange={(val) => handleChange('content', val)}
              modules={modules}
              placeholder="Continue editando seu artigo incrível aqui..."
            />
          </div>
        </div>
      </main>

      {altPrompt.isOpen && (
        <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-4 w-[340px] animate-in slide-in-from-bottom-5">
          <p className="text-sm font-semibold mb-3">Texto Alternativo (SEO) da imagem</p>
          <form onSubmit={(e) => {
             e.preventDefault();
             const val = new FormData(e.currentTarget).get('altText') as string;
             altPrompt.onSave(val);
             setAltPrompt({ ...altPrompt, isOpen: false });
          }}>
            <Input 
              name="altText" 
              defaultValue={altPrompt.initialAlt} 
              placeholder="Digite o texto (opcional)" 
              autoFocus 
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAltPrompt({ ...altPrompt, isOpen: false })}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900">Salvar</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
