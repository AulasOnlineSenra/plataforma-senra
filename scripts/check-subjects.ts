import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany();
  console.log('Disciplinas cadastradas no banco:');
  for (const s of subjects) {
    console.log(`ID: "${s.id}" | Name: "${s.name}"`);
  }
}

main().finally(() => prisma.$disconnect());
