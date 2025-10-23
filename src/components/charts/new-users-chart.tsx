
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', Alunos: 25, Professores: 5 },
  { name: 'Fev', Alunos: 30, Professores: 3 },
  { name: 'Mar', Alunos: 45, Professores: 8 },
  { name: 'Abr', Alunos: 40, Professores: 6 },
  { name: 'Mai', Alunos: 55, Professores: 10 },
  { name: 'Jun', Alunos: 60, Professores: 7 },
];

export function NewUsersChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
        <YAxis stroke="#888888" fontSize={12} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="Alunos"
          stroke="hsl(var(--chart-1))"
          activeDot={{ r: 8 }}
        />
        <Line type="monotone" dataKey="Professores" stroke="hsl(var(--chart-2))" />
      </LineChart>
    </ResponsiveContainer>
  );
}
