import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allStudents = await prisma.user.findMany({ where: { role: 'student' } });
  const students = allStudents.filter((s: any) => s.name.toLowerCase().includes('jessica') || s.name.toLowerCase().includes('jéssica'));
  console.log('Found students:', students.map(s => ({ id: s.id, name: s.name })));

  if (students.length === 0) return;

  const jessica = students[0];

  const allLessons = await prisma.lesson.findMany({
    where: { studentId: jessica.id },
    include: { teacher: { select: { name: true } } },
    orderBy: { date: 'asc' }
  });

  const mondayLessons = allLessons.filter(l => new Date(l.date).getDay() === 1);
  console.log('Typical Monday lessons for Jessica:');
  const templates = new Map();
  for (const l of mondayLessons) {
    const time = new Date(l.date).toTimeString().substring(0, 5);
    if (!templates.has(time)) {
      templates.set(time, { subject: l.subject, teacherId: l.teacherId, teacherName: l.teacher.name, time });
    }
  }

  console.log(Array.from(templates.values()));
}

main().catch(console.error).finally(() => prisma.$disconnect());
