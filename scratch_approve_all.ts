import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
async function main() {
  const r = await p.vestibularEvent.updateMany({ where: { status: 'PENDING' }, data: { status: 'APPROVED' } });
  console.log('Approved:', r.count);
}
main().catch(console.error).finally(() => p.$disconnect());
