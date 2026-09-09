import { IaManager } from '@/components/ia-manager';
import { AutomationManager } from '@/components/automation-manager'; // Ainda vamos criar
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IaPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <Tabs defaultValue="agents" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Inteligência Artificial
            </h1>
            <p className="text-slate-500 hidden">
              Crie e gerencie multi-agentes autônomos para automatizar sua plataforma.
            </p>
          </div>
          <TabsList className="bg-slate-100/50 p-1 rounded-full w-fit">
            <TabsTrigger value="agents" className="rounded-full px-6">
              Meus Agentes
            </TabsTrigger>
            <TabsTrigger value="workflows" className="rounded-full px-6">
              Automações (Workflows)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agents" className="mt-0 outline-none">
          <IaManager />
        </TabsContent>
        
        <TabsContent value="workflows" className="mt-0 outline-none">
          <AutomationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
