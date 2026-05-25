'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Type, Image as ImageIcon, Settings, Save, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPost } from '@/app/actions/blog';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    image: '',
    tags: '',
    published: false,
  });

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  }), []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const adjustTextareaHeight = () => {
    // Only adjust if we fallback to textarea (not using quill)
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [formData.content]);

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
    const result = await createPost({
      ...formData,
      tags: JSON.stringify(formData.tags.split(',').map((t) => t.trim()).filter(Boolean)),
    });

    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: 'Artigo criado com sucesso.',
        className: 'bg-emerald-600 text-white border-none',
      });
      router.push('/dashboard/blog');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <Link href="/dashboard/blog">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
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
            <SheetContent className="w-[400px] sm:w-[540px] border-l-0 shadow-2xl">
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
                  <Label htmlFor="image" className="text-slate-700 font-bold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Capa (URL)
                  </Label>
                  <Input
                    id="image"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={formData.image}
                    onChange={(e) => handleChange('image', e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-brand-yellow focus-visible:ring-offset-0"
                  />
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
                    <Label htmlFor="published" className="text-base font-bold text-slate-800">Publicar agora</Label>
                    <p className="text-sm text-slate-500">
                      O artigo ficará visível publicamente.
                    </p>
                  </div>
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => handleChange('published', checked)}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white px-6 shadow-md transition-all hover:shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </header>

      {/* Editor Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-8 md:p-16 lg:px-24">
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

        <div className="mb-4 text-slate-800">
          <style dangerouslySetInnerHTML={{__html: `
            .ql-toolbar.ql-snow {
              border: none;
              border-bottom: 1px solid #f1f5f9;
              padding: 12px 0;
              margin-bottom: 16px;
              background: #fff;
              position: sticky;
              top: 70px;
              z-index: 10;
            }
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
            .ql-editor p {
              margin-bottom: 1.2rem;
            }
          `}} />
          <ReactQuill 
            theme="snow"
            value={formData.content}
            onChange={(val) => handleChange('content', val)}
            modules={modules}
            placeholder="Comece a escrever seu conteúdo épico aqui..."
          />
        </div>
      </main>
    </div>
  );
}
