import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar todas as aulas com status COMPLETED
  const lessons = await prisma.lesson.findMany({
    where: { status: 'COMPLETED' },
  });

  console.log(`Total de aulas concluídas: ${lessons.length}`);

  // Verificar aulas com título customizado (contém " - ")
  const customLessons = lessons.filter(l => l.subject && l.subject.includes(' - '));
  
  console.log(`Aulas com título customizado: ${customLessons.length}`);
  
  for (const lesson of customLessons) {
    console.log(`  - ${lesson.id}: "${lesson.subject}"`);
  }

  // Reverter os títulos customizados para o original
  // O padrão é: "geografia - Jessica..." → "geografia"
  for (const lesson of customLessons) {
    const originalSubject = lesson.subject.split(' - ')[0].trim();
    
    console.log(`Revertendo ${lesson.id}: "${lesson.subject}" → "${originalSubject}"`);
    
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { subject: originalSubject },
    });
  }

  console.log('\nConcluído!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());