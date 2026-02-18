
"use client";

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parse,
} from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { User, Teacher } from '@/lib/types';
import { users as initialUsers, teachers as initialTeachers } from '@/lib/data';

const USERS_STORAGE_KEY = 'userList';
const TEACHERS_STORAGE_KEY = 'teacherList';

interface NewUsersChartProps {
  selectedMonth: string;
}

const chartConfig = {
  Alunos: {
    label: 'Alunos',
    color: 'hsl(var(--chart-1))',
  },
  Professores: {
    label: 'Professores',
    color: 'hsl(var(--chart-2))',
  },
  Admins: {
    label: 'Admins',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;


export function NewUsersChart({ selectedMonth }: NewUsersChartProps) {
    const [allUsers, setAllUsers] = useState<(User | Teacher)[]>([]);

    useEffect(() => {
        const updateUsers = () => {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            const currentUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
            
            const storedTeachers = localStorage.getItem(TEACHERS_STORAGE_KEY);
            const currentTeachers: Teacher[] = storedTeachers ? JSON.parse(storedTeachers) : initialTeachers;
            
            setAllUsers([...currentUsers, ...currentTeachers]);
        };

        updateUsers();
        window.addEventListener('storage', updateUsers);
        return () => window.removeEventListener('storage', updateUsers);
    }, []);

    const chartData = useMemo(() => {
        const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
        const interval = {
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate),
        };
        const days = eachDayOfInterval(interval);

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            
            const dailyCounts = allUsers.reduce((acc, user) => {
                const idParts = user.id.split('-');
                const timestamp = parseInt(idParts[idParts.length - 1], 10);
                
                if (!isNaN(timestamp)) {
                    const registrationDate = new Date(timestamp);
                    if (format(registrationDate, 'yyyy-MM-dd') === dayStr) {
                        if (user.role === 'student') {
                            acc.Alunos += 1;
                        } else if (user.role === 'teacher') {
                            acc.Professores += 1;
                        } else if (user.role === 'admin') {
                            acc.Admins += 1;
                        }
                    }
                }
                return acc;
            }, { Alunos: 0, Professores: 0, Admins: 0 });

            return { name: format(day, 'dd/MM'), ...dailyCounts };
        });
    }, [selectedMonth, allUsers]);


  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Line
            dataKey="Alunos"
            type="natural"
            stroke="var(--color-Alunos)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="Professores"
            type="natural"
            stroke="var(--color-Professores)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            dataKey="Admins"
            type="natural"
            stroke="var(--color-Admins)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
