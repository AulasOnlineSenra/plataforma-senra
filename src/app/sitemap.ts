import { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/app/actions/blog';

export const revalidate = 86400; // Atualiza o cache do sitemap a cada 24 horas

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.senraaulasonline.com.br';
  
  // Rotas estáticas principais
  const staticPaths = [
    '',
    '/home',
    '/blog',
    '/login',
    '/register',
    '/politica-de-privacidade',
    '/termos-de-uso',
  ];

  const routes: MetadataRoute.Sitemap = staticPaths.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Rotas dinâmicas do blog
  try {
    const result = await getPublishedPosts();
    if (result.success && result.data) {
      const blogRoutes: MetadataRoute.Sitemap = result.data.map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug || post.id}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
      return [...routes, ...blogRoutes];
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap dinâmico:", error);
  }

  return routes;
}
