'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { getBlogPostById } from '@/lib/data';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = getBlogPostById(id as string);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    if (post?.date) {
      setFormattedDate(
        new Date(post.date).toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );
    }
  }, [post?.date]);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-amber-500">
            ← Voltar para o Blog
          </Link>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1 className="mb-6 text-4xl font-bold font-headline text-slate-900">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
            <span>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              {post.author}
            </span>
            <span>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"></path>
              </svg>
              {post.readTime}
            </span>
            <span>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H3a2 2 0 00-2 2v5a2 2 0 002 2h5"></path>
              </svg>
              {formattedDate}
            </span>
          </div>

          <div className="mb-8">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
          </div>

          <div className="space-y-6">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-slate-800 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}