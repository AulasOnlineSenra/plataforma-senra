const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.referenceBlog.findMany();
  const posts = await prisma.blogPost.findMany({
    where: { referenceUrl: { not: null }, referenceBlogId: null }
  });

  console.log(`Encontrados ${posts.length} posts para atualizar.`);

  let updatedCount = 0;

  for (const post of posts) {
    if (!post.referenceUrl) continue;
    
    console.log(`URL do Post ${post.id}: ${post.referenceUrl}`);
    let finalUrl = post.referenceUrl;
    if (finalUrl.includes('google.com/url') && finalUrl.includes('url=')) {
      try {
        const urlObj = new URL(finalUrl);
        const realUrl = urlObj.searchParams.get('url');
        if (realUrl) finalUrl = realUrl;
      } catch (e) {}
    }

    try {
      const postDomain = new URL(finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`).hostname.replace('www.', '');
      
      let matchedBlogId = null;
      for (const blog of blogs) {
        const sourceUrl = blog.url || blog.feedUrl || '';
        const refDomain = new URL(sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`).hostname.replace('www.', '');
        if (refDomain === 'google.com' || refDomain === 'google.com.br') continue;
        
        if (refDomain && (postDomain === refDomain || postDomain.endsWith(`.${refDomain}`) || refDomain.endsWith(`.${postDomain}`))) {
          matchedBlogId = blog.id;
          break;
        }
      }

      if (matchedBlogId) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { referenceBlogId: matchedBlogId }
        });
        updatedCount++;
        console.log(`Post "${post.title}" -> vinculado ao BlogID: ${matchedBlogId}`);
      }
    } catch (e) {
      console.log('Erro ao ler URL do post', post.id);
    }
  }

  console.log(`Processo finalizado. Atualizados ${updatedCount} posts.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
