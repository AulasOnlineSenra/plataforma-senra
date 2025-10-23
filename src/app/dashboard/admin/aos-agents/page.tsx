import { AgentManager } from '@/components/agent-manager';

export default function AosAgentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          AOS Agents
        </h1>
      </div>
      <AgentManager />
    </div>
  );
}
