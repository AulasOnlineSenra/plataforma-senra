require('dotenv').config();
const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.referenceBlog.findMany();
  for (const blog of blogs) {
    let newFeedUrl = null;
    if (blog.name.toLowerCase().includes('uol')) {
      newFeedUrl = 'https://news.google.com/rss/search?q=Educação+site:educacao.uol.com.br';
    } else if (blog.name.toLowerCase().includes('folha')) {
      newFeedUrl = 'https://news.google.com/rss/search?q=Educação+site:folha.uol.com.br/educacao';
    } else if (blog.name.toLowerCase().includes('exame')) {
      newFeedUrl = 'https://news.google.com/rss/search?q=Educação+site:exame.com';
    } else if (blog.name.toLowerCase().includes('estadão') || blog.name.toLowerCase().includes('estadao')) {
      newFeedUrl = 'https://news.google.com/rss/search?q=Educação+site:estadao.com.br/educacao';
    }

    if (newFeedUrl) {
      await prisma.referenceBlog.update({
        where: { id: blog.id },
        data: { feedUrl: newFeedUrl }
      });
      console.log('Updated ' + blog.name + ' -> ' + newFeedUrl);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
