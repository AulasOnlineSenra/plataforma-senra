import prisma from './src/lib/prisma.ts';

async function main() {
  const boards = await prisma.crmBoard.findMany({ include: { columns: true } });
  console.log(JSON.stringify(boards, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
