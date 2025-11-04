
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { ScheduleEvent } from '@/lib/types';
import { scheduleEvents as initialScheduleEvents, subjects } from '@/lib/data';
import { parse, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

const SCHEDULE_STORAGE_KEY = 'scheduleEvents';
const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SubjectsChartProps {
    selectedMonth: string;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-2xl font-bold">
        {value}
      </text>
       <text x={cx} y={cy} dy={10} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        Aulas
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + (outerRadius * 0.05)}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  );
};


export function SubjectsChart({ selectedMonth }: SubjectsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>(initialScheduleEvents);

  useEffect(() => {
    const updateSchedule = () => {
        const storedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (storedSchedule) {
            setSchedule(JSON.parse(storedSchedule).map((e: any) => ({ ...e, start: new Date(e.start) })));
        }
    };
    updateSchedule();
    window.addEventListener('storage', updateSchedule);
    return () => window.removeEventListener('storage', updateSchedule);
  }, []);

  const { data, chartConfig } = useMemo(() => {
    const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
    const monthInterval = { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };

    const monthSchedule = schedule.filter(e => isWithinInterval(e.start, monthInterval));

    const subjectCounts = monthSchedule.reduce((acc, event) => {
      acc[event.subject] = (acc[event.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let chartData = Object.entries(subjectCounts).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    })).sort((a,b) => b.value - a.value);

    const config = {
      value: { label: 'Aulas' },
      ...chartData.reduce((acc, cur) => {
        acc[cur.name] = { label: cur.name, color: cur.color };
        return acc;
      }, {} as ChartConfig),
    } satisfies ChartConfig;

    return { data: chartData, chartConfig: config };

  }, [selectedMonth, schedule]);


  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto h-full w-full"
    >
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    strokeWidth={5}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                >
                    {data.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                </Pie>
                <ChartLegend
                    content={<ChartLegendContent nameKey="name" className="text-base" />}
                    className="-mt-4 flex-wrap items-center justify-center gap-2 sm:gap-4"
                />
            </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          Nenhuma aula encontrada para este mês.
        </div>
      )}
    </ChartContainer>
  );
}
