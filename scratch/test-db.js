require('dotenv').config();
const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Tentando conectar ao banco...');
    const usersCount = await prisma.user.count();
    console.log(`Conexão bem-sucedida! Total de usuários: ${usersCount}`);
    
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (admin) {
      console.log(`Admin encontrado: ${admin.email}`);
    } else {
      console.log('Nenhum admin encontrado.');
    }
  } catch (error) {
    console.error('Erro ao conectar ao banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
