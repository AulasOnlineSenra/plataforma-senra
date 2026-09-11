'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import BlogGrid from '@/components/blog-grid';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string | null;
  tags: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
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

function PostReactions({ post }: { post: BlogPost }) {
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

function parseContentForCarousel(content: string) {
  if (!content) return '';
  const decoded = content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  const regex = /\[CARROSSEL_DE_IMAGENS:([^\]]+)\]/g;
  return decoded.replace(regex, (_match, urlsStr) => {
    const urls = (urlsStr as string).split(',').map((u: string) => u.trim()).filter(Boolean);
    const imagesHtml = urls.map((url: string, i: number) =>
      `<div class="carousel-slide" data-index="${i}"><img src="${url}" alt="Imagem ${i + 1} do carrossel" loading="lazy" /></div>`
    ).join('');
    const thumbnailsHtml = urls.map((url: string, i: number) =>
      `<button class="carousel-thumb${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Ver Imagem ${i + 1}" onclick="(function(btn){var c=btn.closest('.blog-carousel-wrapper');var t=c.querySelector('.blog-carousel-track');var next=parseInt(btn.getAttribute('data-index')||'0');t.style.transform='translateX(-'+next*100+'%)';t.setAttribute('data-current',next);c.querySelectorAll('.carousel-thumb').forEach(function(d,i){d.classList.toggle('active',i===next);});})(this)"><img src="${url}" alt="Miniatura ${i + 1}" loading="lazy" /></button>`
    ).join('');
    const id = `carousel-${Math.random().toString(36).substring(2, 8)}`;
    return `<div class="blog-carousel-wrapper" id="${id}"><div class="blog-carousel-container"><div class="blog-carousel-track">${imagesHtml}</div><button class="carousel-prev" onclick="(function(btn){var c=btn.closest('.blog-carousel-wrapper');var t=c.querySelector('.blog-carousel-track');var cur=parseInt(t.getAttribute('data-current')||'0');var tot=t.querySelectorAll('.carousel-slide').length;var next=(cur-1+tot)%tot;t.style.transform='translateX(-'+next*100+'%)';t.setAttribute('data-current',next);c.querySelectorAll('.carousel-thumb').forEach(function(d,i){d.classList.toggle('active',i===next);});})(this)" aria-label="Anterior">&lsaquo;</button><button class="carousel-next" onclick="(function(btn){var c=btn.closest('.blog-carousel-wrapper');var t=c.querySelector('.blog-carousel-track');var cur=parseInt(t.getAttribute('data-current')||'0');var tot=t.querySelectorAll('.carousel-slide').length;var next=(cur+1)%tot;t.style.transform='translateX(-'+next*100+'%)';t.setAttribute('data-current',next);c.querySelectorAll('.carousel-thumb').forEach(function(d,i){d.classList.toggle('active',i===next);});})(this)" aria-label="Próximo">&rsaquo;</button></div><div class="carousel-thumbnails">${thumbnailsHtml}</div></div>`;
  });
}

function parseContentForVideo(content: string) {
  if (!content) return '';
  return content.replace(/\[VIDEO:([^\]]+)\]/g, (_match, url) =>
    `<div class="blog-video-container"><video controls preload="metadata" class="blog-video"><source src="${url.trim()}" />Seu navegador não suporta reprodução de vídeo.</video></div>`
  );
}

function parseContentForTOC(htmlString: string) {
  if (!htmlString) return { newHtml: '', toc: [] as { id: string; text: string; level: number }[] };
  const toc: { id: string; text: string; level: number }[] = [];
  let counter = 0;
  const newHtml = htmlString.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, innerHtml) => {
    counter++;
    const text = innerHtml.replace(/<[^>]+>/g, '').trim();
    const id = `toc-heading-${counter}`;
    if (!attrs.includes('id=')) {
      attrs = ` id="${id}" ${attrs}`;
    } else {
      const idMatch = attrs.match(/id=["']([^"']+)["']/);
      if (idMatch) { toc.push({ id: idMatch[1], text, level: tag.toLowerCase() === 'h2' ? 2 : 3 }); return match; }
    }
    toc.push({ id, text, level: tag.toLowerCase() === 'h2' ? 2 : 3 });
    return `<${tag}${attrs}>${innerHtml}</${tag}>`;
  });
  return { newHtml, toc };
}

const blogContentStyles = `
  .blog-content { padding-left: 0; padding-right: 0; -webkit-hyphens: none; -ms-hyphens: none; hyphens: none; overflow-wrap: break-word; word-break: normal; word-wrap: break-word; white-space: normal; }
  .ql-align-center { text-align: center !important; } .ql-align-right { text-align: right !important; } .ql-align-justify { text-align: justify !important; }
  .ql-video { width: 100%; height: 450px; border: none; border-radius: 12px; margin: 2rem 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
  @media (max-width: 640px) { .ql-video { height: 250px; } }
  .ql-font-arial { font-family: Arial, sans-serif !important; } .ql-font-courier { font-family: "Courier New", Courier, monospace !important; } .ql-font-garamond { font-family: Garamond, serif !important; } .ql-font-tahoma { font-family: Tahoma, sans-serif !important; } .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; } .ql-font-verdana { font-family: Verdana, sans-serif !important; }
  .ql-size-small { font-size: 0.75em !important; } .ql-size-large { font-size: 1.5em !important; } .ql-size-huge { font-size: 2.5em !important; }
  .blog-content h1 { font-size: 2.2em !important; font-weight: bold; margin-bottom: 0.5em; line-height: 1.2; }
  .blog-content h2 { font-size: 1.8em !important; font-weight: bold; margin-bottom: 0.5em; line-height: 1.3; }
  .blog-content h3 { font-size: 1.4em !important; font-weight: bold; margin-bottom: 0.5em; line-height: 1.4; }
  .blog-content h4 { font-size: 1.2em !important; font-weight: bold; margin-bottom: 0.5em; }
  .blog-content table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 1.5rem 0; }
  .blog-content table td, .blog-content table th { border: 1px solid #e2e8f0; padding: 0.75rem; vertical-align: top; word-wrap: break-word; }
  .blog-content table th { background-color: #f8fafc; font-weight: 600; }
  .dark .blog-content table td, .dark .blog-content table th { border-color: #334155; }
  .dark .blog-content table th { background-color: #1e293b; }
  @media (max-width: 640px) { .blog-content h1 { font-size: 1.8em !important; } .blog-content h2 { font-size: 1.45em !important; } .blog-content h3 { font-size: 1.2em !important; } .blog-content h4 { font-size: 1.1em !important; } }
  .blog-content img { border-radius: 15px; margin-top: 2rem; margin-bottom: 2rem; max-width: 100%; height: auto; display: block; }
  .blog-content table { max-width: 100%; overflow-x: auto; display: block; border-collapse: collapse; }
  .blog-content td, .blog-content th { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; min-width: 80px; }
  .blog-content p, .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 { max-width: 100%; overflow-wrap: break-word; word-break: normal; -webkit-hyphens: none; -ms-hyphens: none; hyphens: none; white-space: normal; }
  .blog-content ul { list-style-type: disc !important; padding-left: 2.5rem !important; margin-top: 1rem; margin-bottom: 1rem; }
  .blog-content ol { list-style-type: decimal !important; padding-left: 2.5rem !important; margin-top: 1rem; margin-bottom: 1rem; }
  .blog-content li { display: list-item !important; margin-bottom: 0.5em; max-width: 100%; overflow-wrap: break-word; word-break: normal; }
  .blog-content li[data-list="bullet"] { list-style-type: disc !important; margin-left: 2.5rem !important; }
  .blog-content li[data-list="ordered"] { list-style-type: decimal !important; margin-left: 2.5rem !important; }
  .blog-content strong, .blog-content em, .blog-content span, .blog-content b, .blog-content i, .blog-content u, .blog-content a { overflow-wrap: break-word; word-break: normal; -webkit-hyphens: none; -ms-hyphens: none; hyphens: none; white-space: normal; }
  .blog-content a { font-size: 15px !important; color: #f5b000 !important; font-family: inherit !important; text-decoration: underline; }
  .blog-content a:hover { opacity: 0.8; }
  .blog-video-container { width: 100%; margin: 2rem auto; border-radius: 15px; overflow: hidden; background: #000; }
  .blog-video { width: 100%; max-height: 480px; display: block; border-radius: 15px; }
  .blog-carousel-wrapper { width: 100%; margin: 2rem auto; display: flex; flex-direction: column; gap: 0.5rem; }
  .blog-carousel-container { position: relative; width: 100%; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12); background: #0f172a; max-width: 100%; }
  .blog-carousel-track { display: flex; transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); will-change: transform; }
  .carousel-slide { flex: 0 0 100%; min-width: 100%; }
  .carousel-slide img { margin: 0 !important; width: 100%; max-height: 520px; object-fit: cover; border-radius: 0; display: block; }
  .carousel-prev, .carousel-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s; }
  .carousel-prev:hover, .carousel-next:hover { background: rgba(0,0,0,0.75); }
  .carousel-prev { left: 10px; } .carousel-next { right: 10px; }
  .carousel-thumbnails { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem 0; scrollbar-width: none; }
  .carousel-thumbnails::-webkit-scrollbar { display: none; }
  .carousel-thumb { flex: 0 0 80px; height: 60px; border: 2px solid transparent; border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.2s; opacity: 0.6; padding: 0; background: transparent; }
  .carousel-thumb img { width: 100%; height: 100%; object-fit: cover; margin: 0 !important; }
  .carousel-thumb:hover { opacity: 0.8; }
  .carousel-thumb.active { border-color: #f5b000; opacity: 1; }
`;

function BlogPostContent({ post }: { post: BlogPost }) {
  const tags = parseTags(post.tags);
  let rawParsedContent = parseContentForCarousel(post.content);
  rawParsedContent = parseContentForVideo(rawParsedContent);
  rawParsedContent = rawParsedContent.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  const { newHtml: parsedContent, toc } = parseContentForTOC(rawParsedContent);

  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [collapseHeight, setCollapseHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setTimeout(() => {
        if (contentRef.current) {
          const height = contentRef.current.scrollHeight;
          if (height > 1200) {
            setNeedsCollapse(true);
            setCollapseHeight(Math.max(600, height * 0.3));
          }
        }
      }, 300);
    }
  }, [parsedContent]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": [post.image || "https://www.senraaulasonline.com.br/placeholder.jpg"],
    "datePublished": post.createdAt,
    "dateModified": post.updatedAt || post.createdAt,
    "author": [{ "@type": "Person", "name": post.author || "Professor Senra", "url": "https://www.senraaulasonline.com.br/professores" }]
  };

  return (
    <article className="prose prose-lg max-w-none w-full relative mb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style dangerouslySetInnerHTML={{ __html: blogContentStyles }} />

      {toc.length > 0 && (
        <nav aria-label="Índice do Artigo" className="sr-only">
          <h2>Índice</h2>
          <ul>{toc.map((item, index) => (<li key={index}><a href={`#${item.id}`}>{item.text}</a></li>))}</ul>
        </nav>
      )}

      <h1 className="mb-6 text-3xl md:text-4xl font-bold font-headline text-slate-900 dark:text-foreground">
        {post.title}
      </h1>

      <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted-foreground">
        <span>{post.author}</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>

      {post.image && (
        <div className="mb-8">
          <img src={post.image} alt={post.title} className="w-full h-64 sm:h-96 object-cover rounded-xl shadow-lg" />
        </div>
      )}

      <div
        ref={contentRef}
        className="relative transition-all duration-700 ease-in-out overflow-hidden"
        style={{ maxHeight: needsCollapse && !isExpanded ? `${collapseHeight}px` : 'none' }}
      >
        <div className="space-y-6 prose prose-lg max-w-none prose-slate dark:prose-invert blog-content px-0 overflow-x-hidden" dangerouslySetInnerHTML={{ __html: parsedContent }} />

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs font-medium rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {needsCollapse && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-[226px] bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        )}
      </div>

      {needsCollapse && !isExpanded && (
        <div className="mt-2 flex justify-center relative z-10">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            Continuar lendo
          </button>
        </div>
      )}

      <PostReactions post={post} />
    </article>
  );
}

function shufflePosts<T>(posts: T[], excludeIds: string[] = []): T[] {
  return shuffleArray(posts.filter(p => !excludeIds.includes((p as any).id)));
}

function convertToCardPost(posts: BlogPost[]): CardPost[] {
  return posts.map(p => ({
    id: p.id, title: p.title, excerpt: p.excerpt, image: p.image || undefined,
    author: p.author, tags: p.tags || undefined, createdAt: p.createdAt,
    likes: p.likes || 0, dislikes: p.dislikes || 0, commentsCount: p.commentsCount || 0,
  }));
}

type BlogPostClientProps = {
  initialPost: BlogPost;
  allPosts: BlogPost[];
};

export default function BlogPostClient({ initialPost, allPosts }: BlogPostClientProps) {
  const [loadedPosts, setLoadedPosts] = useState<BlogPost[]>([initialPost]);
  const [usedPostIds, setUsedPostIds] = useState<Set<string>>(new Set([initialPost.id]));
  const [gridPostSets, setGridPostSets] = useState<CardPost[][]>(() => {
    const firstGrid = shufflePosts(allPosts, [initialPost.id]).slice(0, 13);
    return [convertToCardPost(firstGrid)];
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const generateGridPosts = useCallback((currentPostId: string, usedIds: Set<string>): CardPost[] => {
    const postsForGrid = shufflePosts(allPosts, Array.from(usedIds).concat([currentPostId]));
    return convertToCardPost(postsForGrid.slice(0, 13));
  }, [allPosts]);

  // Incrementa visualizações do artigo inicial ao montar (client-side para não interferir no SSR cache)
  useEffect(() => {
    import('@/app/actions/blog').then(m => m.incrementPostViews(initialPost.id));
  }, [initialPost.id]);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || allPosts.length === 0) return;

    const availablePosts = allPosts.filter(p => !usedPostIds.has(p.id));
    if (availablePosts.length === 0) { setHasMore(false); return; }

    setIsLoadingMore(true);
    const nextPostHeader = shufflePosts(availablePosts)[0];
    const fullPostResult = await import('@/app/actions/blog').then(m => m.getBlogPostById(nextPostHeader.id));

    if (fullPostResult.success && fullPostResult.data) {
      const nextPost = fullPostResult.data as BlogPost;
      import('@/app/actions/blog').then(m => m.incrementPostViews(nextPost.id));
      const newUsedIds = new Set(usedPostIds);
      newUsedIds.add(nextPost.id);
      setUsedPostIds(newUsedIds);
      setLoadedPosts(prev => [...prev, nextPost]);
      setGridPostSets(prev => [...prev, generateGridPosts(nextPost.id, newUsedIds)]);
    }
    setIsLoadingMore(false);
  }, [allPosts, usedPostIds, isLoadingMore, hasMore, generateGridPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isLoadingMore) loadMorePosts(); },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMorePosts, hasMore, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute('data-slug');
            const title = entry.target.getAttribute('data-title');
            if (slug && window.location.pathname !== `/blog/${slug}`) window.history.replaceState(null, '', `/blog/${slug}`);
            if (title) { const newTitle = `${title} | Plataforma Senra`; if (document.title !== newTitle) document.title = newTitle; }
          }
        });
      },
      { threshold: 0, rootMargin: "-40% 0px -40% 0px" }
    );
    document.querySelectorAll('.article-container').forEach(a => observer.observe(a));
    return () => observer.disconnect();
  }, [loadedPosts]);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background overflow-x-hidden relative">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-8 pt-[50px] md:pt-[220px] pb-[15px]">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-amber-500">
            ← Voltar para o Blog
          </Link>
        </div>
        <div className="space-y-0">
          {loadedPosts.map((postItem, index) => {
            const gridPosts = gridPostSets[index];
            return (
              <div key={`post-${postItem.id}`}>
                <div className="article-container" data-slug={postItem.slug} data-title={postItem.title}>
                  <BlogPostContent post={postItem} />
                </div>
                {gridPosts && gridPosts.length > 0 && (
                  <div className="my-16 w-[100vw] max-w-[1224px] relative left-1/2 -translate-x-1/2 px-4 sm:px-8">
                    <div className="mb-6 text-left">
                      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Continue explorando</h2>
                    </div>
                    <div className="overflow-hidden">
                      <BlogGrid posts={gridPosts} context="article" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-amber-500" />}
            {!hasMore && loadedPosts.length > 1 && <p className="text-sm text-muted-foreground">Fim do conteúdo</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
