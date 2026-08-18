'use client';

import Link from 'next/link';
import WeatherWidget from '@/components/weather-widget';
import { ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { likePost, dislikePost } from '@/app/actions/blog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Post = {
  id: string;
  slug: string;
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

export default function BlogGrid({ posts, context = 'home' }: { posts: Post[], context?: 'home' | 'article' }) {
  if (!posts || posts.length === 0) {
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

  // Define counts: up to 10 for carousel, up to 8 for the remaining 5-col grid
  const carouselCount = Math.min(10, Math.max(1, posts.length > 8 ? posts.length - 8 : 1));
  const gridCount = Math.min(8, Math.max(0, posts.length - carouselCount));
  
  const carouselPosts = posts.slice(0, carouselCount);
  const gridPostsList = posts.slice(carouselCount, carouselCount + gridCount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {carouselPosts.length > 0 && (
        <div className={`col-span-1 sm:col-span-2 xl:col-span-2 row-span-1 ${context === 'home' ? 'min-h-[160px]' : 'min-h-[224px]'}`}>
          <HeroCarousel posts={carouselPosts} context={context} />
        </div>
      )}
      {gridPostsList.map((post) => (
        <BlogCard key={`card-${post.id}`} post={post} context={context} />
      ))}
    </div>
  );
}

function HeroCarousel({ posts, context = 'home' }: { posts: Post[], context?: 'home' | 'article' }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [posts.length]);

  if (posts.length === 0) return null;

  const paddingClass = context === 'home' ? 'p-3 sm:p-4 pb-2' : 'p-4 sm:p-5 pb-3';
  const titleClass = context === 'home' ? 'text-lg sm:text-xl mb-2' : 'text-xl sm:text-2xl mb-4';

  return (
    <div className="relative flex flex-col w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">
      {posts.map((post, index) => {
        const timeLabel = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR });
        const isActive = index === currentIndex;
        
        return (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute inset-0 flex flex-col transition-opacity duration-1000 ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 overflow-hidden">
              {post.image ? (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            </div>
            
            <div className={`relative mt-auto ${paddingClass}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-black border border-white/20">
                  {post.author.charAt(0)}
                </div>
                <span className="text-[10px] font-semibold text-white/90">{post.author}</span>
                <span className="text-white/40 text-[9px]">• {timeLabel}</span>
              </div>
              
              <h3 className={`font-bold text-white leading-tight group-hover:text-amber-400 transition-colors line-clamp-3 ${titleClass}`}>
                {post.title}
              </h3>
              
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <PostReactions post={post} isHero={true} />
                {posts.length > 1 && (
                  <div className="flex flex-shrink-0 items-center gap-1.5 ml-4">
                    {posts.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          dotIndex === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function BlogCard({ post, context = 'home' }: { post: Post, context?: 'home' | 'article' }) {
  const timeLabel = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR });
  
  const containerHeight = context === 'home' ? 'min-h-[160px]' : 'h-[164px]';
  const imgHeight = context === 'home' ? 'h-20 sm:h-24' : 'h-20 sm:h-24';
  const titleSize = context === 'home' ? 'text-xs' : 'text-xs';
  const excerptClass = 'hidden';

  return (
    <Link
      href={`/blog/${post.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col bg-card rounded-xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${containerHeight}`}
    >
      {/* Imagem */}
      <div className={`relative ${imgHeight} overflow-hidden flex-shrink-0`}>
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest text-center px-4">Senra News</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-grow p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-4 h-4 rounded flex items-center justify-center bg-amber-500/10 text-amber-600 text-[8px] font-bold">
            {post.author.charAt(0)}
          </div>
          <span className="text-[10px] font-semibold text-foreground/80">{post.author}</span>
          <span className="text-muted-foreground/50 text-[9px]">• {timeLabel}</span>
        </div>

        <h3 className={`${titleSize} font-bold text-foreground leading-snug line-clamp-3 mb-1 group-hover:text-amber-600 transition-colors`}>
          {post.title}
        </h3>
        
        <p className={excerptClass}>
          {post.excerpt}
        </p>

        {/* Rodapé interativo */}
        <div className="pt-2 border-t border-border/30 mt-auto">
          <PostReactions post={post} />
        </div>
      </div>
    </Link>
  );
}