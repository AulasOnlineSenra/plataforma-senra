import { getPublishedPosts } from '@/app/actions/blog';
import BlogSearchBar from '@/components/blog-search-bar';
import BlogGrid from '@/components/blog-grid';
import BlogBackground from '@/components/blog-background';

export default async function BlogPage() {
  const result = await getPublishedPosts();
  const posts = result.success ? result.data : [];

  return (
    <div className="min-h-screen">
      <BlogBackground />
      {/* Header minimalista */}
      <div className="hidden border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold font-headline text-foreground tracking-tight">
            Blog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Artigos, tutoriais e novidades
          </p>
        </div>
      </div>

      <div className="container mx-auto px-[150px] pt-[100px] pb-[25px]">
        <BlogSearchBar posts={posts} />
        <div className="bg-white rounded-[12px] p-[3px]">
          {posts && posts.length > 0 ? (
            <BlogGrid posts={posts} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
              <svg className="w-16 h-16 mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-lg font-medium">Nenhum artigo publicado ainda</p>
              <p className="text-sm mt-1">Volte em breve para novos conteúdos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
