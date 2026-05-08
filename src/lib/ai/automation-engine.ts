import { runAiAgentTest } from '@/app/actions/ia';
import prisma from '@/lib/prisma';

export type AutomationEvent = 'LEAD_CREATED' | 'BLOG_POST_CREATED' | 'DAILY_REPORT' | 'LESSON_BOOKED' | 'USER_REGISTERED';

interface AutomationTrigger {
  event: AutomationEvent;
  agentId: string;
  condition?: (payload: any) => boolean;
}

// Registro simples de automações (no futuro pode vir do banco de dados)
const REGISTERED_AUTOMATIONS: AutomationTrigger[] = [
  // Exemplo: Sempre que um lead for criado, o Agente Comercial analisa
  // { event: 'LEAD_CREATED', agentId: 'cm_agent_id' },
];

export async function triggerAiAutomation(event: AutomationEvent, payload: any) {
  console.log(`[Automation] Triggering event: ${event}`);

  // Busca agentes que devem reagir a este evento
  let targetAgentName = '';
  switch(event) {
    case 'LEAD_CREATED': targetAgentName = 'Agente Comercial'; break;
    case 'BLOG_POST_CREATED': targetAgentName = 'Redator de Blog'; break;
    case 'LESSON_BOOKED': targetAgentName = 'Gestor de Operações'; break;
    case 'USER_REGISTERED': targetAgentName = 'Agente Comercial'; break; // Ou um novo agente de Onboarding
    default: return;
  }

  try {
    const agent = await prisma.aiAgent.findFirst({
      where: { name: { contains: targetAgentName, mode: 'insensitive' } }
    });

    if (!agent) {
      console.log(`[Automation] No agent found for ${event}`);
      return;
    }

    let prompt = '';
    if (event === 'LEAD_CREATED') {
      prompt = `Um novo lead foi criado: ${JSON.stringify(payload)}. Analise o perfil dele e sugira uma abordagem inicial.`;
    } else if (event === 'BLOG_POST_CREATED') {
      prompt = `Uma nova postagem foi criada no blog: ${payload.title}. Verifique se as tags e o resumo estão adequados.`;
    } else if (event === 'LESSON_BOOKED') {
      prompt = `Uma nova aula foi agendada: ${JSON.stringify(payload)}. Verifique se há conflitos ou se o professor precisa de algum material especial.`;
    } else if (event === 'USER_REGISTERED') {
      prompt = `Um novo usuário se registrou: ${payload.name} (${payload.role}). Crie uma mensagem de boas-vindas personalizada e sugira os primeiros passos na plataforma.`;
    }

    console.log(`[Automation] Running agent ${agent.name} for event ${event}`);
    const result = await runAiAgentTest(agent.id, prompt);
    
    if (result.success) {
      console.log(`[Automation] Execution successful: ${result.response?.substring(0, 100)}...`);
      // Aqui poderíamos salvar um log de execução no banco
    } else {
      console.error(`[Automation] Error running agent: ${result.error}`);
    }

  } catch (error) {
    console.error(`[Automation] Critical error in triggerAiAutomation:`, error);
  }
}
