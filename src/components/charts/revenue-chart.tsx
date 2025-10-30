
'use client';

import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { PaymentTransaction } from '@/lib/types';
import { paymentHistory as initialPaymentHistory } from '@/lib/data';

const PAYMENT_HISTORY_STORAGE_KEY = 'paymentHistory';

type FilterType = 'day' | 'week' | 'month' | 'year';

interface RevenueChartProps {
  filter: FilterType;
}

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--sidebar-primary))',
  },
} satisfies ChartConfig;

export function RevenueChart({ filter }: RevenueChartProps) {
  const [allData, setAllData] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    const updateData = () => {
      const storedHistory = localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
      const history: PaymentTransaction[] = storedHistory
        ? JSON.parse(storedHistory).map((p: any) => ({
            ...p,
            date: new Date(p.date),
          }))
        : initialPaymentHistory;
      setAllData(history);
    };

    updateData();
    window.addEventListener('storage', updateData);
    return () => window.removeEventListener('storage', updateData);
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'day': {
        const interval = { start: startOfMonth(now), end: endOfMonth(now) };
        const days = eachDayOfInterval(interval);
        return days.map((day) => {
          const dayRevenue = allData
            .filter((d) => format(d.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
            .reduce((acc, curr) => acc + curr.amount, 0);
          return { name: format(day, 'dd/MM'), revenue: dayRevenue };
        });
      }
      case 'week': {
        const start = startOfYear(now);
        const end = endOfYear(now);
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return weeks.map((weekStart) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekRevenue = allData
            .filter((d) => isWithinInterval(d.date, { start: weekStart, end: weekEnd }))
            .reduce((acc, curr) => acc + curr.amount, 0);
          return {
            name: `${format(weekStart, 'dd/MM')}`,
            revenue: weekRevenue,
          };
        });
      }
      case 'month': {
        const interval = { start: startOfYear(now), end: endOfYear(now) };
        const months = eachMonthOfInterval(interval);
        return months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const monthRevenue = allData
            .filter((d) => isWithinInterval(d.date, { start: monthStart, end: monthEnd }))
            .reduce((acc, curr) => acc + curr.amount, 0);
          return {
            name: format(month, 'MMM', { locale: ptBR }),
            revenue: monthRevenue,
          };
        });
      }
      case 'year': {
        const years = eachYearOfInterval({
          start: allData.length > 0 ? allData[allData.length - 1].date : now,
          end: now,
        });
        return years.map((year) => {
          const yearStart = startOfYear(year);
          const yearEnd = endOfYear(year);
          const yearRevenue = allData
            .filter((d) => isWithinInterval(d.date, { start: yearStart, end: yearEnd }))
            .reduce((acc, curr) => acc + curr.amount, 0);
          return { name: format(year, 'yyyy'), revenue: yearRevenue };
        });
      }
      default:
        return [];
    }
  }, [filter, allData]);

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            tickMargin={10}
            axisLine={false}
            interval={filter === 'week' ? 4 : 'auto'} // Show fewer labels for weeks
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `R$${Number(value) / 1000}k`}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(value))
                }
                indicator="dot"
              />
            }
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
