import { PrismaClient } from './src/generated/client';

const prisma = new PrismaClient();

async function main() {
  const vestibulares = await prisma.vestibular.findMany({
    where: { isActive: true },
    select: { id: true, name: true, institution: true, scrapingUrl: true }
  });
  console.log(JSON.stringify(vestibulares, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
