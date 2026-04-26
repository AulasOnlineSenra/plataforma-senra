'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getOtherPosts } from '@/app/actions/blog';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';

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
  likes: number;
  dislikes: number;
  commentsCount: number;
};

type PostFeedProps = {
  initialPost: BlogPost;
};

function PostReactions({ post }: { post: BlogPost }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setLikes(prev => prev + 1);
    const result = await (await import('@/app/actions/blog')).likePost(post.id);
    if (!result.success) {
      setLikes(prev => prev - 1);
      toast.error('Não foi possível registrar o like');
    }
    setIsLoading(false);
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setDislikes(prev => prev + 1);
    const result = await (await import('@/app/actions/blog')).dislikePost(post.id);
    if (!result.success) {
      setDislikes(prev => prev - 1);
      toast.error('Não foi possível registrar o dislike');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-border/30">
      <div className="flex items-center gap-4">
        <button onClick={handleLike} disabled={isLoading} className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium">{likes}</span>
        </button>
        <button onClick={handleDislike} disabled={isLoading} className="flex items-center gap-1.5 text-muted-foreground hover:text-amber-600 transition-colors">
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
  const formattedDate = new Date(post.createdAt).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let tags: string[] = [];
  try {
    tags = JSON.parse(post.tags);
    if (!Array.isArray(tags)) tags = [];
  } catch { tags = []; }

  return (
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

      <PostReactions post={post} />
    </article>
  );
}

function PostGrid({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.id}`}
          className="group flex flex-col bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
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
          <div className="flex flex-col flex-grow p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                {post.author.charAt(0)}
              </div>
              <span className="text-[11px] font-semibold text-foreground/80">{post.author}</span>
            </div>
            <h2 className="text-[13px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
              {post.title}
            </h2>
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-auto">
              {post.excerpt}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function PostFeed({ initialPost }: PostFeedProps) {
  const [loadedPosts, setLoadedPosts] = useState<BlogPost[]>([initialPost]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [gridPosts, setGridPosts] = useState<BlogPost[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const lastPost = loadedPosts[loadedPosts.length - 1];
    const result = await getOtherPosts(lastPost.id, 30);

    if (result.success && result.data.length > 0) {
      const numRows = Math.floor(Math.random() * 4) + 3;
      const numPosts = numRows * 5;
      const postsToShow = result.data.slice(0, numPosts);
      setGridPosts(postsToShow);

      const nextPost = result.data[numPosts] || result.data[0];
      if (nextPost) {
        setLoadedPosts(prev => [...prev, nextPost]);
      } else {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }

    setIsLoading(false);
  }, [loadedPosts, isLoading, hasMore]);

  useEffect(() => {
    loadMorePosts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, isLoading]);

  return (
    <div className="space-y-0">
      {loadedPosts.map((post, index) => (
        <div key={`post-${post.id}`}>
          <BlogPostContent post={post} />
          {index < loadedPosts.length - 1 && (
            <div className="my-8 border-t border-dashed border-border" />
          )}
        </div>
      ))}

      {gridPosts.length > 0 && (
        <>
          <div className="my-8 text-center">
            <span className="text-sm text-muted-foreground">Continue explorando</span>
          </div>
          <PostGrid posts={gridPosts} />
        </>
      )}

      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isLoading && (
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        )}
        {!hasMore && loadedPosts.length > 1 && (
          <p className="text-sm text-muted-foreground">Fim do conteúdo</p>
        )}
      </div>
    </div>
  );
}