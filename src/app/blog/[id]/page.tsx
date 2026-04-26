'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getBlogPostById, getPublishedPosts } from '@/app/actions/blog';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import BlogGrid from '@/components/blog-grid';

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
  likes?: number;
  dislikes?: number;
  commentsCount?: number;
};

type CardPost = {
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function parseTags(tagsStr: string): string[] {
  try {
    const parsed = JSON.parse(tagsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function PostReactions({ post, isVertical = false }: { post: BlogPost; isVertical?: boolean }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleReaction = async (type: 'like' | 'dislike', action: () => Promise<any>) => {
    if (isLoading) return;
    setIsLoading(true);
    if (type === 'like') setLikes(prev => prev + 1);
    else setDislikes(prev => prev + 1);
    
    const result = await action();
    if (!result.success) {
      if (type === 'like') setLikes(prev => prev - 1);
      else setDislikes(prev => prev - 1);
      toast.error('Não foi possível registrar');
    }
    setIsLoading(false);
  };

  if (isVertical) {
    return (
      <div className="flex flex-col items-center gap-4 bg-card/80 backdrop-blur-sm rounded-full px-3 py-4 shadow-lg border border-border/30">
        <button 
          onClick={() => handleReaction('like', () => import('@/app/actions/blog').then(m => m.likePost(post.id)))} 
          disabled={isLoading} 
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-amber-600 transition-colors"
        >
          <ThumbsUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">{likes}</span>
        </button>
        <button 
          onClick={() => handleReaction('dislike', () => import('@/app/actions/blog').then(m => m.dislikePost(post.id)))} 
          disabled={isLoading} 
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-amber-600 transition-colors"
        >
          <ThumbsDown className="w-5 h-5" />
          <span className="text-[10px] font-medium">{dislikes}</span>
        </button>
        <div className="flex flex-col items-center gap-1 text-muted-foreground/60 cursor-not-allowed opacity-60">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">{post.commentsCount || 0}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-border/30">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => handleReaction('like', () => import('@/app/actions/blog').then(m => m.likePost(post.id)))} 
          disabled={isLoading} 
          className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium">{likes}</span>
        </button>
        <button 
          onClick={() => handleReaction('dislike', () => import('@/app/actions/blog').then(m => m.dislikePost(post.id)))} 
          disabled={isLoading} 
          className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors"
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-xs font-medium">{dislikes}</span>
        </button>
        <div className="flex items-center gap-1.5 text-muted-foreground/60 cursor-not-allowed opacity-60">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium">{post.commentsCount || 0}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => toast('Link copiado!')} className="text-muted-foreground hover:text-amber-600 transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="text-muted-foreground hover:text-amber-600 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BlogPostContent({ post }: { post: BlogPost }) {
  const tags = parseTags(post.tags);

  return (
    <article className="prose prose-lg max-w-none">
      <h1 className="mb-6 text-4xl font-bold font-headline text-slate-900 dark:text-foreground">
        {post.title}
      </h1>

      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
        <span>{post.author}</span>
        <span>{formatDate(post.createdAt)}</span>
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

      <PostReactions post={post} />
      </article>
  );
}

function shufflePosts<T>(posts: T[], excludeIds: string[] = []): T[] {
  const filtered = posts.filter(p => !excludeIds.includes((p as any).id));
  return shuffleArray(filtered);
}

function convertToCardPost(posts: BlogPost[]): CardPost[] {
  return posts.map(p => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    image: p.image || undefined,
    author: p.author,
    tags: p.tags || undefined,
    createdAt: p.createdAt,
    likes: p.likes || 0,
    dislikes: p.dislikes || 0,
    commentsCount: p.commentsCount || 0,
  }));
}

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedPosts, setLoadedPosts] = useState<BlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [usedPostIds, setUsedPostIds] = useState<Set<string>>(new Set());
  const [gridPostSets, setGridPostSets] = useState<CardPost[][]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const generateGridPosts = useCallback((currentPostId: string, availablePosts: BlogPost[], usedIds: Set<string>): CardPost[] => {
    const postsForGrid = shufflePosts(availablePosts, Array.from(usedIds).concat([currentPostId]));
    const gridPosts = postsForGrid.slice(0, 30);
    return convertToCardPost(gridPosts);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      const [postResult, allPostsResult] = await Promise.all([
        getBlogPostById(id),
        getPublishedPosts()
      ]);

      if (postResult.success && postResult.data) {
        const currentPost = postResult.data;
        setPost(currentPost);
        setLoadedPosts([currentPost]);
        
        if (allPostsResult.success && allPostsResult.data) {
          const publishedPosts = allPostsResult.data;
          setAllPosts(publishedPosts);
          
          const initialUsedIds = new Set<string>([currentPost.id]);
          setUsedPostIds(initialUsedIds);
          
          const firstGridPosts = generateGridPosts(currentPost.id, publishedPosts, initialUsedIds);
          setGridPostSets([firstGridPosts]);
        }
      }
      
      setIsLoading(false);
    };
    
    loadInitialData();
  }, [id, generateGridPosts]);

  const loadMorePosts = useCallback(() => {
    if (isLoadingMore || !hasMore || loadedPosts.length === 0 || allPosts.length === 0) return;

    setIsLoadingMore(true);

    const newUsedIds = new Set(usedPostIds);
    const availablePosts = allPosts.filter(p => !newUsedIds.has(p.id));

    if (availablePosts.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const shuffledAvailable = shufflePosts(availablePosts);
    const nextPost = shuffledAvailable[0];
    
    newUsedIds.add(nextPost.id);
    setUsedPostIds(newUsedIds);

    const nextGridPosts = generateGridPosts(nextPost.id, allPosts, newUsedIds);

    setLoadedPosts(prev => [...prev, nextPost]);
    setGridPostSets(prev => [...prev, nextGridPosts]);
    setIsLoadingMore(false);
  }, [loadedPosts, allPosts, usedPostIds, isLoadingMore, hasMore, generateGridPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, isLoadingMore]);

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

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="container mx-auto pl-[200px] pr-[350px] pt-[220px] pb-[15px]">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-amber-500">
            ← Voltar para o Blog
          </Link>
        </div>

        <div className="space-y-0">
          {loadedPosts.map((postItem, index) => {
            const gridPosts = gridPostSets[index];
            const gridHeight = gridPosts ? Math.min(gridPosts.length, 30) : 0;
            
            return (
              <div key={`post-${postItem.id}`}>
                <BlogPostContent post={postItem} />
                
                {gridPosts && gridPosts.length > 0 && (
                    <div className="my-12">
                    <div className="mb-4 text-center">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Continue explorando</span>
                    </div>
                    <div className="max-h-[840px] w-[95vw] overflow-hidden -ml-[calc(120px+2.5vw)]">
                      <BlogGrid posts={gridPosts} />
                    </div>
                  </div>
                )}

                {index < loadedPosts.length - 1 && (
                  <div className="my-12 border-t border-dashed border-border" />
                )}
              </div>
            );
          })}

          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            )}
            {!hasMore && loadedPosts.length > 1 && (
              <p className="text-sm text-muted-foreground">Fim do conteúdo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}