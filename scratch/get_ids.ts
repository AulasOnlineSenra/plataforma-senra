import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jessica = await prisma.user.findFirst({
    where: { name: { contains: 'Jéssica' }, role: 'student' }
  });
  console.log('Jessica:', jessica?.id, jessica?.name);

  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' },
    select: { id: true, name: true }
  });
  console.log('Teachers:', teachers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
