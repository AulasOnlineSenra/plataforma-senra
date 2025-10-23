
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { teachers, subjects } from '@/lib/data';
import { Teacher } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const teacherSubjects = teacher.subjects
    .map((subjectId) => subjects.find((s) => s.id === subjectId)?.name)
    .filter(Boolean);

  // Mock rating for demonstration
  const rating = 4.5 + (parseInt(teacher.id.slice(-1), 16) % 5) / 10;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
          <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="font-headline text-xl">{teacher.name}</CardTitle>
         <div className="flex items-center gap-1 pt-1">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          <span className="text-sm text-muted-foreground ml-1">
            ({rating.toFixed(1)})
          </span>
        </div>
        <CardDescription>{teacher.education}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {teacher.bio}
        </p>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {teacherSubjects.map((subjectName) => (
            <Badge key={subjectName} variant="secondary">
              {subjectName}
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full">
          <Link href={`/dashboard/profile`}>Ver Perfil e Agendar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function TeachersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Nossos Professores
        </h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teachers.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </div>
  );
}
