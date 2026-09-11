'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Type, Image as ImageIcon, Settings, Save, CalendarIcon, ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPost, getBlogScheduleTimes, addBlogScheduleTime, removeBlogScheduleTime } from '@/app/actions/blog';
import { suggestRelatedLinks } from '@/app/actions/blog-links';
import dynamic from 'next/dynamic';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AiSeoAssistant } from '@/components/blog/ai-seo-assistant';
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingLinks, setIsSuggestingLinks] = useState(false);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [altPrompt, setAltPrompt] = useState<{
    isOpen: boolean;
    initialAlt: string;
    onSave: (val: string) => void;
  }>({ isOpen: false, initialAlt: '', onSave: () => {} });
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [selectedTextData, setSelectedTextData] = useState<{ text: string; top: number; left: number } | null>(null);
  const [isSendingIdea, setIsSendingIdea] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: 'Aulas Online Senra',
    image: '',
    tags: '',
    metaDescription: '',
    published: false,
    createdAt: '',
  });

  const [publishedPosts, setPublishedPosts] = useState<{id: string, title: string}[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [insertedLinks, setInsertedLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    getBlogScheduleTimes().then(res => {
      if (res.success && res.data) setPreferredTimes(res.data);
    });

    import('@/app/actions/blog').then(m => {
      m.getPublishedPosts().then(res => {
        if (res.success && res.data) {
          setPublishedPosts(res.data);
        }
      });
    });

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
    return () => document.removeEventListener('dblclick', handleDblClick);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const attach = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill?.root) return false;

      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
          let hasImage = false;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              hasImage = true;
              e.preventDefault();
              e.stopPropagation();
              
              const file = items[i].getAsFile();
              if (!file) continue;
              
              const placeholderId = `uploading-${Date.now()}-${i}`;
              const placeholderSvg = "data:image/svg+xml;charset=utf-8,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2364748b'%3ECarregando imagem...%3C/text%3E%3C/svg%3E";
              
              const range = quill.getSelection(true) || { index: quill.getLength() };
              quill.insertEmbed(range.index, 'image', placeholderSvg);
              quill.formatText(range.index, 1, 'alt', placeholderId);
              quill.setSelection(range.index + 1);

              const formData = new FormData();
              formData.append('file', file);
              
              try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const result = await res.json();
                
                const img = quill.root.querySelector(`img[alt="${placeholderId}"]`);
                if (img) {
                  if (result.success && result.data?.url) {
                    img.setAttribute('src', result.data.url);
                    img.removeAttribute('alt');
                  } else {
                    img.remove();
                    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar a imagem colada.' });
                  }
                  setFormData(prev => ({ ...prev, content: quill.root.innerHTML }));
                }
              } catch (err) {
                console.error(err);
                const img = quill.root.querySelector(`img[alt="${placeholderId}"]`);
                if (img) img.remove();
                toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao enviar a imagem colada.' });
              }
            }
          }
          if (hasImage) return; // Stop processing if images were handled
        }

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
  }, [toast]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    // For single image upload
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
    input.setAttribute('multiple', 'true');
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

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const adjustTextareaHeight = () => {
    // Only adjust if we fallback to textarea (not using quill)
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.content]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [formData.title]);

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

  const handleSubmit = async (e: React.FormEvent | null, publishMode?: 'now' | 'draft' | 'schedule') => {
    if (e) e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
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
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm w-full gap-4">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100 shrink-0"
            onClick={handleGoBack}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : <ArrowLeft className="h-5 w-5 text-slate-600" />}
          </Button>
          
          <div className="w-px h-6 bg-slate-200 hidden sm:block shrink-0"></div>

          <div id="custom-toolbar" className="hidden sm:flex items-center gap-1 shrink-0 scale-[0.85] origin-left">
            <select className="ql-font border-slate-200 rounded-md h-8 text-xs" defaultValue="">
              <option value="">Padrão</option>
              <option value="arial">Arial</option>
              <option value="courier">Courier</option>
              <option value="garamond">Garamond</option>
              <option value="tahoma">Tahoma</option>
              <option value="times-new-roman">Times New Roman</option>
              <option value="verdana">Verdana</option>
            </select>
            <select className="ql-size border-slate-200 rounded-md h-8 text-xs" defaultValue="">
              <option value="small">Pequeno</option>
              <option value="">Normal</option>
              <option value="large">Grande</option>
              <option value="huge">Gigante</option>
            </select>
            <span className="w-px h-5 bg-slate-200 mx-1"></span>
            <button className="ql-bold text-slate-700 hover:text-slate-900" />
            <button className="ql-italic text-slate-700 hover:text-slate-900" />
            <button className="ql-underline text-slate-700 hover:text-slate-900" />
            <button className="ql-strike text-slate-700 hover:text-slate-900" />
            <span className="w-px h-5 bg-slate-200 mx-1"></span>
            <select className="ql-color border-slate-200 rounded-md h-8" />
            <select className="ql-background border-slate-200 rounded-md h-8" />
            <span className="w-px h-5 bg-slate-200 mx-1"></span>
            <button className="ql-list text-slate-700 hover:text-slate-900" value="ordered" />
            <button className="ql-list text-slate-700 hover:text-slate-900" value="bullet" />
            <span className="w-px h-5 bg-slate-200 mx-1"></span>
            <button className="ql-link text-slate-700 hover:text-slate-900" title="Inserir Link" />
            <button className="ql-image text-slate-700 hover:text-slate-900" title="Inserir Imagem Simples" />
            <button className="ql-carousel text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1" title="Inserir Carrossel de Imagens">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </button>
            <button className="ql-video text-slate-700 hover:text-slate-900" title="Inserir Vídeo" />
            <button className="ql-clean text-slate-700 hover:text-slate-900" title="Limpar Formatação" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-slate-200 text-slate-600 h-9 w-9" title="Configurações">
                <Settings className="h-4 w-4" />
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
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 font-bold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Capa do Artigo
                    </Label>
                    <AiSeoAssistant content={formData.content} title={formData.title} type="cover" />
                  </div>
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

                <div className="space-y-2 border border-slate-200 bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="createdAt" className="text-slate-700 font-bold flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Data de Agendamento
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-brand-blue font-medium"
                      onClick={async () => {
                        const time = formData.createdAt ? formData.createdAt.split('T')[1] : null;
                        if (!time) {
                          toast({ title: 'Aviso', description: 'Selecione uma hora antes de salvar.', variant: 'destructive' });
                          return;
                        }
                        const res = await addBlogScheduleTime(time);
                        if (res.success && res.data) {
                          setPreferredTimes(res.data);
                          toast({ title: 'Horário salvo!', className: 'bg-emerald-600 text-white border-none' });
                        }
                      }}
                    >
                      Salvar Horário
                    </Button>
                  </div>
                  <Input
                    id="createdAt"
                    type="datetime-local"
                    value={formData.createdAt}
                    onChange={(e) => handleChange('createdAt', e.target.value)}
                    className="h-12 rounded-xl border-slate-300 focus-visible:ring-brand-yellow focus-visible:ring-offset-0"
                  />
                  {preferredTimes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {preferredTimes.map(time => (
                        <div key={time} className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                          <button
                            type="button"
                            className="px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                            onClick={() => {
                              const datePart = formData.createdAt ? formData.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
                              handleChange('createdAt', `${datePart}T${time}`);
                            }}
                          >
                            {time}
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 border-l border-slate-200"
                            onClick={async () => {
                              const res = await removeBlogScheduleTime(time);
                              if (res.success && res.data) setPreferredTimes(res.data);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 font-bold">Links de Apontamento</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSuggestingLinks || publishedPosts.length === 0}
                      className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium flex items-center gap-1"
                      onClick={async () => {
                        if (!formData.content) {
                          toast({ title: 'Aviso', description: 'Escreva algum conteúdo primeiro.', variant: 'destructive' });
                          return;
                        }
                        setIsSuggestingLinks(true);
                        const wordCount = formData.content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length;
                        const maxLinks = wordCount < 1950 ? 3 : (wordCount < 2400 ? 4 : 5);
                        toast({ title: 'IA Analisando...', description: `Buscando ${maxLinks} links...` });
                        
                        const res = await suggestRelatedLinks(formData.content, publishedPosts, maxLinks);
                        setIsSuggestingLinks(false);
                        
                        if (res.success && res.data) {
                          setSelectedLinks(res.data);
                          toast({ title: 'Sucesso', description: `${res.data.length} links selecionados!`, className: 'bg-emerald-600 text-white border-none' });
                        } else {
                          toast({ title: 'Erro', description: res.error || 'Falha ao buscar links', variant: 'destructive' });
                        }
                      }}
                    >
                      {isSuggestingLinks ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Sugestão IA
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Selecione posts para distribuir entre os parágrafos do artigo atual.</p>
                  
                  <div className="max-h-[278px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                    {publishedPosts.map(post => {
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
                className="rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white px-2 h-9 w-12 shadow-md transition-all hover:shadow-lg gap-0.5 justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3 opacity-70 ml-1" />
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
      <main className="flex-1 w-full bg-[#f8fafc] flex flex-col relative pb-16">
        
        {/* Floating Word Counter */}
        <div className="fixed bottom-6 right-6 z-30 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm rounded-full px-4 py-1.5 text-[11px] font-semibold text-slate-500 hidden sm:flex items-center gap-3">
          <span>{counters.words} <span className="font-normal">palavras</span></span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{counters.chars} <span className="font-normal">caracteres</span></span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{counters.lines} <span className="font-normal">linhas</span></span>
        </div>

        <div className="max-w-4xl w-full mx-auto p-8 md:p-12 lg:px-24 bg-white min-h-[800px] shadow-sm my-8 border border-slate-100 rounded-xl">
          {formData.image && (
            <div className="mb-8 rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-[300px] w-full">
              <img src={formData.image} alt="Capa" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="relative">
            <textarea
              ref={titleRef}
              placeholder="Título do Artigo"
              value={formData.title}
              onChange={(e) => {
                handleChange('title', e.target.value);
              }}
              rows={1}
              className="w-full text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 placeholder:text-slate-300 border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-4 rounded-none font-headline tracking-tight resize-none bg-transparent overflow-hidden"
              style={{ minHeight: '80px', paddingRight: '120px' }}
            />
            <div className="absolute right-0 top-6">
              <AiSeoAssistant content={formData.content} title={formData.title} type="title" onApply={(text) => handleChange('title', text)} />
            </div>
          </div>

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
                    toast({ title: 'Enviando...', description: 'Salvando texto selecionado como ideia.' });
                    const res = await sendIdeaToCrm(selectedTextData.text.slice(0, 100));
                    if (res.success) {
                      toast({ title: 'Ideia salva!', description: 'Foi enviada para a coluna Redação/Ideias.', className: 'bg-emerald-600 text-white border-none' });
                    } else {
                      toast({ variant: 'destructive', title: 'Erro', description: res.error });
                    }
                    setIsSendingIdea(false);
                    setSelectedTextData(null);
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-amber-500 text-white shadow-lg flex items-center gap-2 transition-colors border border-slate-700 hover:border-amber-500 text-xs font-medium cursor-pointer"
                  title="Transformar texto selecionado em ideia de artigo (CRM)"
                >
                  {isSendingIdea ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Ideia CRM
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
              placeholder="Comece a escrever seu conteúdo épico aqui..."
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
