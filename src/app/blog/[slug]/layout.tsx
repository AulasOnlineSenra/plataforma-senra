import { Metadata, ResolvingMetadata } from 'next';
import { getBlogPostBySlug } from '@/app/actions/blog';

type Props = {
  params: { slug: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const postResult = await getBlogPostBySlug(slug);

  if (!postResult.success || !postResult.data) {
    return {
      title: 'Artigo não encontrado',
    };
  }

  const post = postResult.data;
  
  return {
    title: `${post.title} | Plataforma Senra`,
    description: (post as any).metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: (post as any).metaDescription || post.excerpt,
      images: post.image ? [post.image] : [],
      type: 'article',
      publishedTime: post.createdAt.toString(),
      authors: [post.author],
    }
  };
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
