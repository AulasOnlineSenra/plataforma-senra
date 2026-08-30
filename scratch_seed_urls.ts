import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

const URLS: Record<string, string> = {
  'ENEM': 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem',
  'FUVEST': 'https://www.fuvest.br/vestibular-da-usp/',
  'UNICAMP': 'https://www.comvest.unicamp.br/',
  'UERJ': 'https://www.vestibular.uerj.br/',
  'UFRJ': 'https://acessograduacao.ufrj.br/'
};

async function seed() {
  for (const [inst, url] of Object.entries(URLS)) {
    await prisma.vestibular.updateMany({
      where: { institution: inst },
      data: { scrapingUrl: url }
    });
    console.log(`Updated ${inst} with ${url}`);
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect());
