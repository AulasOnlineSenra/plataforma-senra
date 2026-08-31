import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

const TOP_5 = [
  {
    name: 'ENEM 2026',
    institution: 'ENEM',
    state: 'Nacional',
    type: 'Exame Nacional',
    scrapingUrl: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem',
    isActive: true
  },
  {
    name: 'FUVEST 2026',
    institution: 'FUVEST',
    state: 'SP',
    type: 'Vestibular',
    scrapingUrl: 'https://www.fuvest.br/vestibular-da-usp/',
    isActive: true
  },
  {
    name: 'UNICAMP 2026',
    institution: 'UNICAMP',
    state: 'SP',
    type: 'Vestibular',
    scrapingUrl: 'https://www.comvest.unicamp.br/',
    isActive: true
  },
  {
    name: 'Vestibular UERJ 2026',
    institution: 'UERJ',
    state: 'RJ',
    type: 'Vestibular',
    scrapingUrl: 'https://www.vestibular.uerj.br/',
    isActive: true
  },
  {
    name: 'Acesso Graduação UFRJ 2026',
    institution: 'UFRJ',
    state: 'RJ',
    type: 'Vestibular',
    scrapingUrl: 'https://acessograduacao.ufrj.br/',
    isActive: true
  }
];

async function main() {
  console.log('🧹 Limpando dados fictícios antigos...');
  await prisma.vestibularEvent.deleteMany({});
  await prisma.vestibular.deleteMany({});

  console.log('🌱 Semeando Top 5 Instituições reais...');
  for (const v of TOP_5) {
    await prisma.vestibular.create({ data: v });
    console.log(`✅ ${v.institution} adicionada com URL: ${v.scrapingUrl}`);
  }

  console.log('🏁 Processo finalizado com sucesso! Nenhuma data inserida ainda (deixe o scraper IA fazer isso).');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
