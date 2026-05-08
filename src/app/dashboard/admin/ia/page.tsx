import { IaManager } from '@/components/ia-manager';

export default function IaPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Inteligência Artificial
        </h1>
        <p className="text-slate-500">
          Crie e gerencie multi-agentes autônomos para automatizar sua plataforma.
        </p>
      </div>
      <IaManager />
    </div>
  );
}
