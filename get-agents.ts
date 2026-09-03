import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const agents = await prisma.aiAgent.findMany();
  console.log(agents.map(a => ({ id: a.id, name: a.name, model: a.model })));
}
run();
