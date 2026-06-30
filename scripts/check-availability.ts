import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const availabilities = await prisma.availability.findMany({
    take: 10,
  });
  console.log('Slots de disponibilidade no banco:', JSON.stringify(availabilities, null, 2));

  const lessons = await prisma.lesson.findMany({
    take: 10,
    orderBy: { date: 'desc' },
  });
  console.log('Algumas aulas agendadas no banco:', JSON.stringify(lessons, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
