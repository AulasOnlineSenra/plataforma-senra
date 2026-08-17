const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

const blogsToSeed = [
  { name: 'Descomplica', q: 'Descomplica' },
  { name: 'Guia do Estudante', q: 'site:guiadoestudante.abril.com.br' },
  { name: 'Brasil Escola', q: 'site:brasilescola.uol.com.br' },
  { name: 'Mundo Educação', q: 'site:mundoeducacao.uol.com.br' },
  { name: 'Agência Brasil', q: 'site:agenciabrasil.ebc.com.br' },
  { name: 'BBC Brasil', q: 'site:bbc.com/portuguese' },
  { name: 'Nexo', q: 'site:nexojornal.com.br' },
  { name: 'G1 Educação', q: 'site:g1.globo.com/educacao' },
  { name: 'CNN Brasil', q: 'site:cnnbrasil.com.br' },
  { name: 'Estadão', q: 'site:estadao.com.br' },
  { name: 'Folha', q: 'site:folha.uol.com.br' },
  { name: 'Exame', q: 'site:exame.com' },
  { name: 'UOL', q: 'site:uol.com.br' },
  { name: 'Poder360', q: 'site:poder360.com.br' },
  { name: 'DW Brasil', q: 'site:dw.com/pt-br' },
  { name: 'SciELO', q: 'SciELO' },
  { name: 'Nature', q: 'Nature' },
  { name: 'Science', q: 'Science' },
  { name: 'Scientific American', q: 'Scientific American' },
  { name: 'Agência FAPESP', q: 'site:agencia.fapesp.br' },
  { name: 'Fiocruz', q: 'site:fiocruz.br' },
  { name: 'USP', q: 'site:usp.br' },
  { name: 'UFRJ', q: 'site:ufrj.br' },
  { name: 'UFMG', q: 'site:ufmg.br' },
  { name: 'Unicamp', q: 'site:unicamp.br' },
  { name: 'Unesp', q: 'site:unesp.br' },
  { name: 'INEP', q: 'site:gov.br/inep' },
  { name: 'MEC', q: 'site:gov.br/mec' },
  { name: 'IBGE', q: 'site:ibge.gov.br' },
  { name: 'CAPES', q: 'site:gov.br/capes' },
  { name: 'CNPq', q: 'site:gov.br/cnpq' }
];

async function main() {
  console.log('Seeding Reference Blogs...');
  
  for (const blog of blogsToSeed) {
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(blog.q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    
    // Check if exists
    const exists = await prisma.referenceBlog.findFirst({
      where: { name: blog.name }
    });

    if (!exists) {
      await prisma.referenceBlog.create({
        data: {
          name: blog.name,
          url: `https://google.com/search?q=${encodeURIComponent(blog.q)}`,
          feedUrl: feedUrl
        }
      });
      console.log(`Added: ${blog.name}`);
    } else {
      console.log(`Skipped (already exists): ${blog.name}`);
    }
  }
  
  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
