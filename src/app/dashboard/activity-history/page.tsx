
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from '@/lib/types';

const ACTIVITY_LOG_STORAGE_KEY = 'activityLog';

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const updateActivities = () => {
      const storedLog = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
      if (storedLog) {
        // Parse and ensure dates are Date objects
        const parsedLog = JSON.parse(storedLog).map((item: any) => ({
            ...item,
            date: new Date(item.date)
        }));
        setActivities(parsedLog);
      }
    };
    
    updateActivities();

    window.addEventListener('storage', updateActivities);
    return () => window.removeEventListener('storage', updateActivities);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Histórico de Atividades
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Suas Atividades Recentes</CardTitle>
          <CardDescription>
            Um registro de todas as ações realizadas na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead className="text-right">Data e Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                    <TableRow key={index}>
                    <TableCell className="font-medium">{activity.action}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                        {format(activity.date, "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                        })}
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Nenhuma atividade registrada ainda.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
