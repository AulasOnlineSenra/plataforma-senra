import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'student' } });
  const jessica = students.find((s: any) => s.name.toLowerCase().includes('jessica') || s.name.toLowerCase().includes('jéssica'));
  if (!jessica) { console.log('Jessica not found'); return; }
  console.log('Found Jessica:', jessica.id, jessica.name);

  const allLessons = await prisma.lesson.findMany({
    where: { studentId: jessica.id },
    include: { teacher: { select: { name: true } } },
    orderBy: { date: 'asc' }
  });

  const mondayLessons = allLessons.filter((l: any) => new Date(l.date).getDay() === 1);
  console.log('Typical Monday lessons for Jessica:');
  const templates = new Map();
  for (const l of mondayLessons) {
    const time = new Date(l.date).toTimeString().substring(0, 5);
    if (!templates.has(time)) {
      templates.set(time, { subject: l.subject, teacherId: l.teacherId, teacherName: l.teacher.name, time });
    }
  }

  const uniqueLessons = Array.from(templates.values());
  console.log(uniqueLessons);

  // Add the lessons for July 6, 2026
  for (const t of uniqueLessons) {
    const [hours, minutes] = (t as any).time.split(':');
    const lessonDate = new Date(2026, 6, 6, parseInt(hours), parseInt(minutes)); // Month is 0-indexed in Date (6 = July)
    const endLessonDate = new Date(lessonDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    // Check if it already exists to avoid duplicates
    const existing = await prisma.lesson.findFirst({
        where: { studentId: jessica.id, date: lessonDate }
    });
    
    if (existing) {
        console.log('Lesson already exists for', lessonDate);
    } else {
        await prisma.lesson.create({
            data: {
                studentId: jessica.id,
                teacherId: (t as any).teacherId,
                subject: (t as any).subject,
                date: lessonDate,
                endDate: endLessonDate,
                status: 'COMPLETED'
            }
        });
        console.log('Created lesson for', lessonDate, 'Subject:', (t as any).subject);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
