'use server';

import prisma from '@/lib/prisma';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'description']
  }
});

export async function getReferenceBlogs() {
  try {
    const blogs = await prisma.referenceBlog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: blogs };
  } catch (error) {
    console.error('Erro ao buscar blogs de referência:', error);
    return { success: false, error: 'Falha ao buscar referências.' };
  }
}

export async function addReferenceBlog(name: string, url: string, feedUrl: string) {
  try {
    const blog = await prisma.referenceBlog.create({
      data: { name, url, feedUrl }
    });
    return { success: true, data: blog };
  } catch (error) {
    console.error('Erro ao adicionar blog:', error);
    return { success: false, error: 'Falha ao adicionar blog.' };
  }
}

export async function removeReferenceBlog(id: string) {
  try {
    await prisma.referenceBlog.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover blog:', error);
    return { success: false, error: 'Falha ao remover blog.' };
  }
}

export async function fetchExternalIdeas(maxDays?: number) {
  try {
    const blogs = await prisma.referenceBlog.findMany();
    
    if (blogs.length === 0) {
      return { success: true, data: [] };
    }

    const allIdeas = [];
    const cutoffTime = maxDays ? Date.now() - (maxDays * 24 * 60 * 60 * 1000) : 0;

    // Busca feeds de forma paralela (com limite de tempo para não travar a requisição)
    const fetchPromises = blogs.map(async (blog) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        // rss-parser não suporta fetch direto com AbortController na versão atual sem custom fetch,
        // mas vamos puxar o XML primeiro com fetch nativo para aplicar o timeout.
        const response = await fetch(blog.feedUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const xml = await response.text();
        const feed = await parser.parseString(xml);
        
        // Pegar artigos, filtrando por data e limitando aos 5 mais recentes
        const recentItems = feed.items
          .filter(item => {
             if (!maxDays) return true;
             if (!item.pubDate) return true; // Mantém se não tiver data
             return new Date(item.pubDate).getTime() >= cutoffTime;
          })
          .slice(0, 5)
          .map(item => ({
            id: `${blog.id}-${item.guid || item.link}`,
            title: item.title || 'Sem título',
            source: blog.name,
            link: item.link || blog.url,
            pubDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
          }));

        return recentItems;
      } catch (err) {
        console.error(`Erro ao ler feed do blog ${blog.name}:`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Junta tudo, ordena pelos mais recentes e pega os top 20
    for (const res of results) {
      allIdeas.push(...res);
    }
    
    allIdeas.sort((a, b) => b.pubDate - a.pubDate);
    const finalIdeas = allIdeas.slice(0, 150);

    return { success: true, data: finalIdeas };

  } catch (error) {
    console.error('Erro ao buscar ideias externas:', error);
    return { success: false, error: 'Falha ao processar RSS feeds.' };
  }
}
