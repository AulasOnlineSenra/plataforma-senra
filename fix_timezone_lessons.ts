import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const jessica = students.find((s: any) => s.name.toLowerCase().includes('jessica') || s.name.toLowerCase().includes('jéssica'));
  if (!jessica) return;

  const lessonsToFix = await prisma.lesson.findMany({
    where: { 
        studentId: jessica.id,
        date: {
            gte: new Date('2026-07-06T00:00:00.000Z'),
            lt: new Date('2026-07-07T00:00:00.000Z')
        }
    }
  });

  console.log(`Found ${lessonsToFix.length} lessons to fix.`);
  
  for (const lesson of lessonsToFix) {
      // Current date is probably 2026-07-06T07:00:00.000Z
      // If we want it to be 07:00 BRT, it should be 2026-07-06T10:00:00.000Z (UTC)
      
      let newDate: Date;
      let newEndDate: Date;
      
      if (lesson.subject === 'Química') {
          newDate = new Date('2026-07-06T10:00:00.000Z');
          newEndDate = new Date('2026-07-06T11:30:00.000Z');
      } else if (lesson.subject === 'Sociologia') {
          newDate = new Date('2026-07-06T12:00:00.000Z');
          newEndDate = new Date('2026-07-06T13:30:00.000Z');
      } else {
          continue;
      }
      
      await prisma.lesson.update({
          where: { id: lesson.id },
          data: { date: newDate, endDate: newEndDate }
      });
      console.log(`Updated ${lesson.subject} to start at ${newDate.toISOString()}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
