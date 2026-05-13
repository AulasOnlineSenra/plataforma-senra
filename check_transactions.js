const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find Jessica Patricia's user first
    const jessica = await prisma.user.findFirst({
      where: { name: { contains: 'Jéssica', mode: 'insensitive' } },
      select: { id: true, name: true }
    });
    
    if (!jessica) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', jessica.name, jessica.id);
    console.log('---');
    
    // Get all transactions for this user
    const transactions = await prisma.transaction.findMany({
      where: { studentId: jessica.id },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total transactions:', transactions.length);
    console.log('');
    
    transactions.forEach(t => {
      console.log(`Status: "${t.status}" | Amount: ${t.amountPaid} | Plan: ${t.planName}`);
      console.log(`  status.toUpperCase() = "${t.status.toUpperCase()}"`);
      console.log(`  status !== 'CANCELADO' = ${t.status.toUpperCase() !== 'CANCELADO'}`);
      console.log('---');
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
