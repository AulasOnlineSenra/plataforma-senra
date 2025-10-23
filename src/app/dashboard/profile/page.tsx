import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getMockUser, teachers, subjects } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Link, Calendar, Mail } from 'lucide-react';

const userRole: UserRole = 'teacher';

const TeacherProfileForm = () => {
    const teacher = teachers[0];
    const days = [
        { id: "monday", label: "Segunda" },
        { id: "tuesday", label: "Terça" },
        { id: "wednesday", label: "Quarta" },
        { id: "thursday", label: "Quinta" },
        { id: "friday", label: "Sexta" },
        { id: "saturday", label: "Sábado" },
    ];

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Atualize seus dados, foto de perfil e informações de contato.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-8">
                     <div className="flex flex-col items-center gap-4 md:col-span-1">
                        <Avatar className="h-32 w-32">
                           <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                           <AvatarFallback>{teacher.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline">Alterar Foto</Button>
                    </div>
                    <div className="grid gap-4 md:col-span-2">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" defaultValue={teacher.name.split(' ')[0]} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="lastName">Sobrenome</Label>
                                <Input id="lastName" defaultValue={teacher.name.split(' ').slice(1).join(' ')} />
                            </div>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="nickname">Apelido (opcional)</Label>
                            <Input id="nickname" defaultValue={teacher.nickname} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={teacher.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" type="tel" defaultValue={teacher.phone} placeholder="(DDD) 99999-9999" />
                            </div>
                        </div>
                    </div>
                </CardContent>
                 <CardContent>
                     <div className="grid gap-2">
                        <Label htmlFor="bio">Descrição (Bio)</Label>
                        <Textarea id="bio" defaultValue={teacher.bio} rows={4} placeholder="Fale um pouco sobre sua experiência, metodologia e paixão por ensinar."/>
                    </div>
                 </CardContent>
                 <CardContent>
                    <div className="grid gap-2">
                        <Label htmlFor="education">Formação</Label>
                        <Input id="education" defaultValue={teacher.education} placeholder="Ex: Mestrado em Física Aplicada - USP" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Serviços</CardTitle>
                    <CardDescription>Selecione as disciplinas que você leciona.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox id={`subject-${subject.id}`} defaultChecked={teacher.subjects.includes(subject.id)} />
                            <label
                                htmlFor={`subject-${subject.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {subject.name}
                            </label>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Disponibilidade</CardTitle>
                    <CardDescription>Marque os dias e horários que você pode dar aulas.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {days.map(day => (
                        <div key={day.id} className="grid gap-3">
                             <h4 className="font-semibold">{day.label}</h4>
                             <div className="flex flex-wrap gap-x-6 gap-y-3">
                                {["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"].map(time => (
                                    <div key={time} className="flex items-center space-x-2">
                                        <Checkbox id={`${day.id}-${time}`} />
                                        <label
                                            htmlFor={`${day.id}-${time}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {time}
                                        </label>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Integrações</CardTitle>
                    <CardDescription>Conecte suas contas para automatizar agendamentos e comunicações.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Calendar className="h-6 w-6 text-red-500" />
                            <div>
                                <h4 className="font-semibold">Google Calendar</h4>
                                <p className="text-sm text-muted-foreground">Sincronize sua disponibilidade e agendamentos.</p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Mail className="h-6 w-6 text-blue-500" />
                            <div>
                                <h4 className="font-semibold">Gmail</h4>
                                <p className="text-sm text-muted-foreground">Envie confirmações e lembretes de aula.</p>
                            </div>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const StudentProfileForm = () => {
     const student = getMockUser('student');
    return (
        <Card>
            <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>Mantenha seus dados atualizados.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" defaultValue={student.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={student.email} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <Input id="password" type="password" placeholder="Deixe em branco para não alterar" />
                </div>
            </CardContent>
        </Card>
    )
}


export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl">Configurações de Perfil</h1>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        {userRole === 'teacher' ? <TeacherProfileForm /> : <StudentProfileForm />}
         <div className="flex justify-end">
          <Button size="lg">Salvar Alterações</Button>
        </div>
      </div>
    </div>
  );
}
