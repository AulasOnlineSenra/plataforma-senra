import { getPublishedPosts } from '@/app/actions/blog';

// Revalidate every 1 hour (3600 seconds) for fresh news indexing
export const revalidate = 3600;

export async function GET() {
  const baseUrl = 'https://www.senraaulasonline.com.br';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

  try {
    const result = await getPublishedPosts();
    
    if (result.success && result.data) {
      // Google News sitemaps should ideally only contain articles published in the last 48 hours.
      // However, we can include all recent articles (e.g. last 30 days) just to be safe if the blog volume is low.
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 30); // We'll use 30 days as a safe margin for smaller blogs

      const recentPosts = result.data.filter((post: any) => new Date(post.createdAt) > twoDaysAgo);

      recentPosts.forEach((post: any) => {
        const url = `${baseUrl}/blog/${post.slug || post.id}`;
        const pubDate = new Date(post.createdAt).toISOString();
        // Replace special characters in title to avoid XML breaking
        const safeTitle = post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        
        xml += `
  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>Plataforma Senra</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${safeTitle}</news:title>
    </news:news>
  </url>`;
      });
    }
  } catch (error) {
    console.error("Erro ao gerar news-sitemap:", error);
  }

  xml += `\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
