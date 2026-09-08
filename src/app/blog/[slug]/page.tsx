import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getBlogPostBySlug, getPublishedPosts } from '@/app/actions/blog';
import BlogPostClient from '@/components/blog/blog-post-client';
import type { BlogPost } from '@/components/blog/blog-post-client';

// ISR: revalida a cada 1 hora. revalidatePath('/blog/[slug]') invalida imediatamente ao publicar.
export const revalidate = 3600;
// Força Next.js a servir com headers públicos de cache
export const dynamic = 'force-static';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage(props: Props) {
  const { slug } = await props.params;

  const [postResult, allPostsResult] = await Promise.all([
    getBlogPostBySlug(slug),
    getPublishedPosts(),
  ]);

  if (!postResult.success || !postResult.data) {
    notFound();
  }

  const initialPost = postResult.data as BlogPost;
  const allPosts = (allPostsResult.success && allPostsResult.data ? allPostsResult.data : []) as BlogPost[];

  // Nota: incrementPostViews é feito no client (blog-post-client.tsx) ao montar o componente
  // para não interferir no cache SSR desta página.

  return <BlogPostClient initialPost={initialPost} allPosts={allPosts} />;
}