const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrando os artigos do Blog para o novo formato Kanban...');
  
  const posts = await prisma.blogPost.findMany();
  
  let publicados = 0;
  let revisao = 0;
  
  for (const post of posts) {
    const newStatus = post.published ? 'PUBLISHED' : 'REVIEW';
    
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { status: newStatus }
    });
    
    if (newStatus === 'PUBLISHED') publicados++;
    else revisao++;
  }
  
  console.log(`Migração concluída!`);
  console.log(`Total de artigos processados: ${posts.length}`);
  console.log(`Movidios para PUBLISHED: ${publicados}`);
  console.log(`Movidos para REVIEW: ${revisao}`);
}

main()
  .catch(e => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
