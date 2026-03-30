'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getBlogPostById } from '@/app/actions/blog';

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
};

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const loadPost = async () => {
      const result = await getBlogPostById(id);
      if (result.success && result.data) {
        setPost(result.data);
        setFormattedDate(
          new Date(result.data.createdAt).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );
      }
      setIsLoading(false);
    };
    loadPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando artigo...
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  let tags: string[] = [];
  try {
    tags = JSON.parse(post.tags);
    if (!Array.isArray(tags)) tags = [];
  } catch { tags = []; }

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-amber-500">
            ← Voltar para o Blog
          </Link>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1 className="mb-6 text-4xl font-bold font-headline text-slate-900 dark:text-foreground">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
            <span>{post.author}</span>
            <span>{formattedDate}</span>
          </div>

          {post.image && (
            <div className="mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-64 sm:h-96 object-cover rounded-xl shadow-lg"
              />
            </div>
          )}

          <div className="space-y-6">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-slate-800 dark:text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-medium rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
