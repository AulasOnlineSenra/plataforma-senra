
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const data = [
  { name: 'Matemática', value: 40, fill: 'hsl(var(--chart-1))' },
  { name: 'Português', value: 25, fill: 'hsl(var(--chart-2))' },
  { name: 'Física', value: 18, fill: 'hsl(var(--chart-3))' },
  { name: 'Redação', value: 12, fill: 'hsl(var(--chart-4))' },
  { name: 'Outros', value: 5, fill: 'hsl(var(--chart-5))' },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't render label for small slices

  return (
    <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export function SubjectsChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <ChartTooltip
          cursor={{
            stroke: 'hsl(var(--border))',
            strokeWidth: 2,
          }}
          content={<ChartTooltipContent
            formatter={(value, name) => [`${value} aulas`, name]}
            labelClassName="font-bold"
          />}
        />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={110}
          innerRadius={60}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke={entry.fill} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          wrapperStyle={{
            paddingTop: '20px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
