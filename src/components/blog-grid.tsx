'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal, Share2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { likePost, dislikePost } from '@/app/actions/blog';
import { toast } from 'sonner';
import { formatDistanceStrict } from 'date-fns';
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

const formatShortTime = (dateStr: string) => {
  const diffStr = formatDistanceStrict(new Date(dateStr), new Date(), { locale: ptBR });
  const parts = diffStr.split(' ');
  if (parts.length >= 2) {
    const num = parts[0];
    const unit = parts[1].toLowerCase();
    if (unit.startsWith('segundo')) return `${num}s`;
    if (unit.startsWith('minuto')) return `${num}m`;
    if (unit.startsWith('hora')) return `${num}h`;
    if (unit.startsWith('dia')) return `${num}d`;
    if (unit.startsWith('mês') || unit.startsWith('meses')) return `${num}M`;
    if (unit.startsWith('ano')) return `${num}A`;
  }
  return diffStr;
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
  const [allPosts, setAllPosts] = useState<Post[]>(posts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(context === 'home' && posts.length === 23);

  // Sync state if props change (e.g. from parent re-render)
  useEffect(() => {
    setAllPosts(posts);
    setHasMore(context === 'home' && posts.length >= 23);
  }, [posts, context]);

  const loadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const { getPublishedPostsPaginated } = await import('@/app/actions/blog');
      const res = await getPublishedPostsPaginated(allPosts.length, 15); // Load 3 rows
      if (res.success && res.data) {
        const newPosts = res.data as any[];
        setAllPosts(prev => {
          const combined = [...prev, ...newPosts];
          // Filter duplicates just in case
          const uniqueIds = new Set();
          return combined.filter(p => {
            if (uniqueIds.has(p.id)) return false;
            uniqueIds.add(p.id);
            return true;
          });
        });
        if (newPosts.length < 15) {
          setHasMore(false);
        }
      }
    } catch (e) {
      toast.error('Erro ao buscar mais artigos');
    }
    setIsLoadingMore(false);
  };

  if (!allPosts || allPosts.length === 0) {
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

  // Calcula exatamente quantos itens vão para o carrossel e para a grade
  // de forma que as linhas da grade estejam SEMPRE preenchidas (múltiplos de 5, considerando que o carrossel ocupa 2).
  // A primeira linha precisa de 3 itens (além do carrossel). As próximas precisam de 5.
  let carouselCount = 1;
  let gridCount = allPosts.length - 1;

  if (allPosts.length >= 4) {
    const max_full_rows = Math.floor((allPosts.length - 4) / 5);
    gridCount = 3 + max_full_rows * 5;
    carouselCount = allPosts.length - gridCount;
    
    // Se o carrossel ficar com muitos itens (ex: > 10), limitamos e mostramos linha incompleta no final se necessário
    if (carouselCount > 10) {
      carouselCount = 10;
      gridCount = allPosts.length - 10;
    }
  }
  
  const carouselPosts = allPosts.slice(0, carouselCount);
  const gridPostsList = allPosts.slice(carouselCount, carouselCount + gridCount);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-0 sm:gap-4">
        {carouselPosts.length > 0 && (
          <div className={`col-span-1 sm:col-span-2 xl:col-span-2 row-span-1 mb-4 sm:mb-0 ${context === 'home' ? 'min-h-[160px]' : 'min-h-[224px]'}`}>
            <HeroCarousel posts={carouselPosts} context={context} />
          </div>
        )}
        {gridPostsList.map((post) => (
          <BlogCard key={`card-${post.id}`} post={post} context={context} />
        ))}
      </div>
      
      {context === 'home' && hasMore && (
        <div className="flex justify-center mt-4 mb-8">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {isLoadingMore ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            )}
            Carregar mais artigos
          </button>
        </div>
      )}
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
        const timeLabel = formatShortTime(post.createdAt);
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
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-slate-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
            </div>
            
            <div className={`relative mt-auto ${paddingClass}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  <Image
                    src="/Logo_AOS_fundo_claro.png"
                    alt={post.author}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-[8px] font-semibold text-white/90 leading-tight truncate max-w-[80px]">{post.author}</span>
                <span className="text-white/40 text-[9px] whitespace-nowrap">• {timeLabel}</span>
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
  const timeLabel = formatShortTime(post.createdAt);
  
  const containerHeight = context === 'home' ? 'min-h-[160px]' : 'h-[224px]';
  const imgHeightDesktop = context === 'home' ? 'md:h-24' : 'md:h-24';
  const titleSize = context === 'home' ? 'text-sm md:text-xs' : 'text-sm md:text-xs';

  let category = 'Artigo';
  if (post.tags) {
    try {
      const parsedTags = JSON.parse(post.tags);
      if (Array.isArray(parsedTags) && parsedTags.length > 0) {
        category = parsedTags[0];
      } else if (typeof post.tags === 'string' && post.tags.length > 0 && !post.tags.startsWith('[')) {
        category = post.tags.split(',')[0].trim();
      }
    } catch (e) {
      category = post.tags.replace(/[\[\]"]/g, '').split(',')[0].trim() || 'Artigo';
    }
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-row md:flex-col items-center md:items-stretch bg-transparent md:bg-card md:rounded-xl border-b border-border/40 md:border md:border-border/40 md:overflow-hidden md:shadow-sm hover:bg-slate-50/50 md:hover:bg-card md:hover:shadow-md transition-all duration-300 py-4 md:py-0 md:${containerHeight}`}
    >
      {/* Conteúdo - Textos */}
      <div className="flex flex-col flex-1 pl-[5px] md:pl-3 pr-4 md:pr-3 py-0 md:py-3 order-1 md:order-2 h-full justify-center md:justify-start">
        {/* Metadados: Autor e Data */}
        <div className="flex items-center gap-1.5 mb-2 md:mb-1.5">
          <div className="relative w-4 h-4 rounded flex-shrink-0 overflow-hidden border border-border/50">
            <Image
              src="/Logo_AOS_fundo_claro.png"
              alt={post.author}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-[10px] md:text-[8px] font-semibold text-foreground/80 leading-tight truncate max-w-[100px] md:max-w-[80px]">{post.author}</span>
          <span className="text-muted-foreground/50 text-[10px] md:text-[7px] whitespace-nowrap ml-1 md:ml-0">• {timeLabel}</span>
        </div>

        <h3 className={`${titleSize} font-bold text-foreground leading-snug line-clamp-3 md:mb-1 group-hover:text-amber-600 transition-colors`}>
          {post.title}
        </h3>
        
        {/* Rodapé interativo - Visível apenas no Desktop */}
        <div className="hidden md:block pt-2 border-t border-border/30 mt-auto">
          <PostReactions post={post} />
        </div>
      </div>

      {/* Imagem */}
      <div className={`relative w-24 h-24 rounded-[13px] md:rounded-none mr-[3px] md:mr-0 md:w-full ${imgHeightDesktop} overflow-hidden flex-shrink-0 order-2 md:order-1`}>
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-[10px] md:text-xs text-muted-foreground/50 font-bold uppercase tracking-widest text-center px-1 md:px-4">Senra News</span>
          </div>
        )}
      </div>
    </Link>
  );
}