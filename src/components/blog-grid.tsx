'use client';

import Link from 'next/link';
import WeatherWidget from '@/components/weather-widget';
import { ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import { useState } from 'react';
import { likePost, dislikePost } from '@/app/actions/blog';
import { toast } from 'sonner';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  image?: string;
  author: string;
  tags?: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  commentsCount: number;
};

// Componente para gerenciar as reações de cada post
function PostReactions({ post, isHero = false }: { post: Post, isHero?: boolean }) {
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    setLikes(prev => prev + 1);
    const result = await likePost(post.id);
    if (!result.success) {
      setLikes(prev => prev - 1);
      toast.error('Não foi possível registrar o like');
    }
    setIsLoading(false);
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    setDislikes(prev => prev + 1);
    const result = await dislikePost(post.id);
    if (!result.success) {
      setDislikes(prev => prev - 1);
      toast.error('Não foi possível registrar o dislike');
    }
    setIsLoading(false);
  };

  const textColorClass = isHero ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-amber-600";
  const iconSize = isHero ? "w-4 h-4" : "w-3.5 h-3.5";
  const textSize = isHero ? "text-xs" : "text-[10px]";

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center gap-1.5 transition-colors ${textColorClass}`}
        >
          <ThumbsUp className={iconSize} />
          <span className={`${textSize} font-medium`}>{likes}</span>
        </button>

        <button 
          onClick={handleDislike}
          disabled={isLoading}
          className={`flex items-center gap-1.5 transition-colors ${textColorClass}`}
        >
          <ThumbsDown className={iconSize} />
          <span className={`${textSize} font-medium`}>{dislikes}</span>
        </button>

        <div className={`flex items-center gap-1.5 cursor-not-allowed opacity-60 ${textColorClass}`}>
          <MessageSquare className={iconSize} />
          <span className={`${textSize} font-medium`}>{post.commentsCount}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast('Link copiado!'); }}
          className={`transition-colors ${textColorClass}`}
        >
          <Share2 className={iconSize} />
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className={`transition-colors ${textColorClass}`}
        >
          <MoreHorizontal className={iconSize} />
        </button>
      </div>
    </div>
  );
}

export default function BlogGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <svg className="w-16 h-16 mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-lg font-medium">Nenhum artigo encontrado</p>
        <p className="text-sm mt-1">Tente outro termo de busca</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-1">
      {renderFeed(posts)}
    </div>
  );
}

function renderFeed(posts: Post[]) {
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Primeiro Post em Destaque (Hero)
  elements.push(<HeroPost key={`hero-${posts[0].id}`} post={posts[0]} />);
  i = 1;

  let cycleIndex = 0;
  while (i < posts.length) {
    if (cycleIndex % 2 === 0) {
      // Um post em destaque menor (Hero secundário)
      const hero = <HeroPost key={`hero-sec-${cycleIndex}-${posts[i].id}`} post={posts[i]} />;
      elements.push(hero);
      i++;
      
      const remainingSlots = 3;
      const remainingPosts = posts.slice(i, i + remainingSlots);
      
      remainingPosts.forEach((post) => {
        elements.push(<BlogCard key={`card-${post.id}`} post={post} />);
        i++;
      });
      
      if (remainingPosts.length < remainingSlots) {
        const emptyCount = remainingSlots - remainingPosts.length;
        for (let e = 0; e < emptyCount; e++) {
          elements.push(<div key={`empty-${cycleIndex}-${e}`} className="hidden lg:block" />);
        }
      }
    } else {
      const items = posts.slice(i, i + 4);
      items.forEach((post) => {
        elements.push(<BlogCard key={`card-fill-${post.id}`} post={post} />);
        i++;
      });
      
      elements.push(
        <div key={`weather-${cycleIndex}`} className="col-span-1 h-full min-h-[300px]">
          <WeatherWidget />
        </div>
      );
    }
    cycleIndex++;
  }

  return elements;
}

function HeroPost({ post }: { post: Post }) {
  // Simular tempo decorrido do MSN se o createdAt for recente
  const timeLabel = "2h"; // Em produção isso seria calculado
  
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 col-span-1 md:col-span-2 row-span-1 min-h-[300px] shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="absolute inset-0 overflow-hidden">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-slate-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      
      <div className="relative mt-auto p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black border border-white/20">
            {post.author.charAt(0)}
          </div>
          <span className="text-xs font-semibold text-white/90">{post.author}</span>
          <span className="text-white/40 text-[10px]">• {timeLabel}</span>
        </div>
        
        <h2 className="text-xl sm:text-3xl font-bold text-white font-headline leading-tight mb-3 group-hover:text-amber-400 transition-colors">
          {post.title}
        </h2>
        
        <p className="text-white/70 text-sm line-clamp-2 mb-6 hidden sm:block">
          {post.excerpt}
        </p>
        
        <div className="pt-4 border-t border-white/10">
          <PostReactions post={post} isHero={true} />
        </div>
      </div>
    </Link>
  );
}

function BlogCard({ post }: { post: Post }) {
  const timeLabel = "5h"; // Simulado
  
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex flex-col bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 min-h-[340px]"
    >
      {/* Imagem */}
      <div className="relative aspect-video overflow-hidden">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground/30 font-bold uppercase tracking-widest text-center px-4">Plataforma Senra News</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-grow p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/10 text-amber-600 text-[10px] font-bold">
            {post.author.charAt(0)}
          </div>
          <span className="text-[11px] font-semibold text-foreground/80">{post.author}</span>
          <span className="text-muted-foreground/60 text-[10px]">• {timeLabel}</span>
        </div>

        <h2 className="text-[15px] font-bold text-foreground leading-snug line-clamp-3 mb-2 group-hover:text-amber-600 transition-colors">
          {post.title}
        </h2>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto mb-4">
          {post.excerpt}
        </p>

        {/* Rodapé interativo */}
        <div className="pt-3 border-t border-border/40">
          <PostReactions post={post} />
        </div>
      </div>
    </Link>
  );
}