'use client';

import { 
  TrendingUp, 
  Users, 
  UserPlus, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/button'; // Note: check path based on previous file context
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ManagerDashboard() {
  const kpis = [
    { title: 'Total de Leads', value: '42', change: '+12%', icon: UserPlus, trend: 'up' },
    { title: 'Aulas Realizadas', value: '128', change: '+5%', icon: Calendar, trend: 'up' },
    { title: 'Conversão', value: '18%', change: '-2%', icon: Target, trend: 'down' },
    { title: 'Professores Ativos', value: '15', change: '0%', icon: Users, trend: 'neutral' },
  ];

  const leadData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Leads Capturados',
        data: [5, 8, 4, 10, 7, 3, 5],
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
        borderColor: 'rgb(255, 193, 7)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard do Gestor</h1>
            <p className="text-slate-500">Bem-vindo, Severino. Aqui está o resumo da AOS.</p>
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
            Exportar Relatório
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.title} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <kpi.icon className="w-6 h-6 text-slate-700" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${
                  kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {kpi.change}
                  {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : kpi.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-slate-500 text-sm font-medium">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Fluxo de Leads (Semanal)
            </h3>
            <div className="h-[300px]">
              <Bar 
                data={leadData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                }} 
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 font-medium">
            <h3 className="font-bold text-lg mb-6">Próximas Ações Operacionais</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div>
                  <p className="text-sm text-slate-900">Validar Match: Aluno João P.</p>
                  <p className="text-xs text-slate-500">Pendente para Yuri (Tech)</p>
                </div>
              </li>
              <li className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm text-slate-900">Relatório Semanal Mari</p>
                  <p className="text-xs text-slate-500">Concluído conforme guidelines</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
