import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const jessica = students.find((s: any) => s.name.toLowerCase().includes('jessica') || s.name.toLowerCase().includes('jéssica'));
  if (!jessica) { console.log('Jessica not found'); return; }
  console.log('Found Jessica:', jessica.name, '| Credits before:', jessica.credits);

  // 1. Delete the wrong lessons added for July 6, 2026
  const wrongLessons = await prisma.lesson.findMany({
    where: { 
        studentId: jessica.id,
        date: {
            gte: new Date(2026, 6, 6, 0, 0),
            lt: new Date(2026, 6, 7, 0, 0)
        }
    }
  });

  if (wrongLessons.length > 0) {
      console.log(`Deleting ${wrongLessons.length} incorrect lessons for July 6...`);
      for (const wl of wrongLessons) {
          await prisma.lesson.delete({ where: { id: wl.id } });
      }
  }

  // 2. Find the correct teachers
  const teachers = await prisma.user.findMany({ where: { role: 'teacher' } });
  const juan = teachers.find((t: any) => t.name.includes('Juan Costa'));
  const leon = teachers.find((t: any) => t.name.includes('Leon Karlos'));

  if (!juan || !leon) {
      console.log('Could not find teachers');
      return;
  }

  // 3. Create the correct lessons
  const lesson1 = {
      studentId: jessica.id,
      teacherId: juan.id,
      subject: 'Química',
      date: new Date(2026, 6, 6, 7, 0),
      endDate: new Date(2026, 6, 6, 8, 30),
      status: 'COMPLETED'
  };

  const lesson2 = {
      studentId: jessica.id,
      teacherId: leon.id,
      subject: 'Sociologia',
      date: new Date(2026, 6, 6, 9, 0),
      endDate: new Date(2026, 6, 6, 10, 30),
      status: 'COMPLETED'
  };

  await prisma.lesson.create({ data: lesson1 });
  console.log('Created lesson: Química at 07:00-08:30');
  
  await prisma.lesson.create({ data: lesson2 });
  console.log('Created lesson: Sociologia at 09:00-10:30');

  // 4. Update credits
  const updatedJessica = await prisma.user.update({
      where: { id: jessica.id },
      data: { credits: { decrement: 2 } }
  });

  console.log('Credits after deduction:', updatedJessica.credits);
}
main().catch(console.error).finally(() => prisma.$disconnect());
