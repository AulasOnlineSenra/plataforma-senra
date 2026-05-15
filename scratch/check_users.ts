import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      }
    });
    console.log('Recent users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
