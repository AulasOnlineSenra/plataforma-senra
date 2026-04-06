'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import WeatherWidget from '@/components/weather-widget';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  image?: string;
  author: string;
  tags?: string;
  createdAt: string;
};

export default function BlogSearchContent({ posts, showSearch = true }: { posts: Post[], showSearch?: boolean }) {
  const [query, setQuery] = useState('');

  const filteredPosts = posts.filter((post) => {
    if (!query.trim()) return true;
    const term = query.toLowerCase();
    const title = post.title?.toLowerCase() || '';
    const excerpt = post.excerpt?.toLowerCase() || '';
    let tags = '';
    try {
      const parsed = JSON.parse(post.tags || '[]');
      tags = Array.isArray(parsed) ? parsed.join(' ').toLowerCase() : '';
    } catch { tags = ''; }
    return title.includes(term) || excerpt.includes(term) || tags.includes(term);
  });

  return (
    <>
      {showSearch && (
      <div className="mb-[85px] -mt-[45px] max-w-[65%] mx-auto">
        <div className="flex items-center gap-2 bg-card border border-[#f5b000] rounded-2xl px-4 py-3 shadow-[0_0_10px_rgba(245,176,0,0.4)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar posts..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
      )}

      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-4 gap-[0.6rem]">
          {renderFeed(filteredPosts)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <svg className="w-16 h-16 mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-lg font-medium">Nenhum artigo encontrado</p>
          <p className="text-sm mt-1">Tente outro termo de busca</p>
        </div>
      )}
    </>
  );
}

function renderFeed(posts: Post[]) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  elements.push(<HeroPost key={`hero-${posts[0].id}`} post={posts[0]} />);
  i = 1;

  let cycleIndex = 0;
  while (i < posts.length) {
    if (cycleIndex % 2 === 0) {
      const hero = <HeroPost key={`hero-cycle-${cycleIndex}-${posts[i].id}`} post={posts[i]} />;
      i++;
      
      const remainingSlots = 3;
      const remainingPosts = posts.slice(i, i + remainingSlots);
      
      remainingPosts.forEach((post) => {
        if (getPostType(post.id) === 'wide') {
          elements.push(<WidePost key={`wide-${post.id}`} post={post} />);
        } else {
          elements.push(<Card50_50 key={`card50-${post.id}`} post={post} />);
        }
        i++;
      });
      
      if (remainingPosts.length < remainingSlots) {
        const emptyCount = remainingSlots - remainingPosts.length;
        for (let e = 0; e < emptyCount; e++) {
          elements.push(<div key={`empty-cycle-${cycleIndex}-${e}`} className="col-span-1" />);
        }
      }
    } else {
      const items = posts.slice(i, i + 3);
      items.forEach((post) => {
        if (getPostType(post.id) === 'wide') {
          elements.push(<WidePost key={`wide-${post.id}`} post={post} />);
        } else {
          elements.push(<Card50_50 key={`card50-${post.id}`} post={post} />);
        }
        i++;
      });
      elements.push(
        <div key={`weather-mosaic-${cycleIndex}`} className="col-span-1">
          <WeatherWidget />
        </div>
      );
    }

    cycleIndex++;
  }

  return elements;
}

function getPostType(postId: string): 'wide' | 'card50' {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash) + postId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 2 === 0 ? 'wide' : 'card50';
}

function HeroPost({ post }: { post: Post }) {
  let firstTag = '';
  try {
    const parsed = JSON.parse(post.tags || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) firstTag = parsed[0];
  } catch { firstTag = ''; }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group block relative overflow-hidden rounded-2xl col-span-4"
    >
      {post.image ? (
        <div className="relative aspect-[21/5] sm:aspect-[21/4]">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            {firstTag && (
              <span className="inline-block px-3 py-1 bg-amber-500/90 text-black text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                {firstTag}
              </span>
            )}
            <h2 className="text-2xl sm:text-4xl font-bold text-white font-headline leading-tight mb-3 group-hover:text-amber-400 transition-colors duration-300">
              {post.title}
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-2xl line-clamp-2 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <span>{post.author}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-amber-500/20 to-slate-900/10 p-8 sm:p-12 rounded-2xl">
          {firstTag && (
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
              {firstTag}
            </span>
          )}
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground font-headline leading-tight mb-3 group-hover:text-amber-500 transition-colors duration-300">
            {post.title}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 text-muted-foreground/60 text-sm">
            <span>{post.author}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>{formattedDate}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

function Card50_50({ post }: { post: Post }) {
  let firstTag = '';
  try {
    const parsed = JSON.parse(post.tags || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) firstTag = parsed[0];
  } catch { firstTag = ''; }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group block relative overflow-hidden rounded-2xl col-span-1"
    >
      {post.image ? (
        <div className="relative h-[160px]">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-amber-500/20 to-slate-900/10 h-[160px]" />
      )}
      <div className="p-4 bg-card">
        {firstTag && (
          <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
            {firstTag}
          </span>
        )}
        <h2 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-amber-500 transition-colors duration-200">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
          <span>{post.author}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

function WidePost({ post }: { post: Post }) {
  let firstTag = '';
  try {
    const parsed = JSON.parse(post.tags || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) firstTag = parsed[0];
  } catch { firstTag = ''; }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group block relative overflow-hidden rounded-2xl col-span-1"
    >
      {post.image ? (
        <div className="relative h-[160px]">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-amber-500/20 to-slate-900/10 h-[160px]" />
      )}
      <div className="p-4 bg-card">
        {firstTag && (
          <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
            {firstTag}
          </span>
        )}
        <h2 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-amber-500 transition-colors duration-200">
          {post.title}
        </h2>
        <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
          <span>{post.author}</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

function AdSlot() {
  return (
    <div className="col-span-1 rounded-2xl border border-dashed border-border/50 bg-muted/20 flex items-center justify-center min-h-[180px]">
      <p className="text-xs text-muted-foreground/40 uppercase tracking-wider">Espaço publicitário</p>
    </div>
  );
}