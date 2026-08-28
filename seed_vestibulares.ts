import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vestibularesList = [
  { name: 'Exame Nacional do Ensino Médio', institution: 'ENEM', state: 'Nacional', type: 'Exame Nacional' },
  { name: 'Sistema de Seleção Unificada', institution: 'SISU', state: 'Nacional', type: 'Exame Nacional' },
  { name: 'Programa Universidade para Todos', institution: 'Prouni', state: 'Nacional', type: 'Programa de Acesso' },
  { name: 'Fundo de Financiamento Estudantil', institution: 'Fies', state: 'Nacional', type: 'Programa de Acesso' },
  { name: 'Instituto Tecnológico de Aeronáutica', institution: 'ITA', state: 'SP', type: 'Vestibular' },
  { name: 'Instituto Militar de Engenharia', institution: 'IME', state: 'RJ', type: 'Vestibular' },
  { name: 'Universidade de São Paulo (FUVEST)', institution: 'FUVEST', state: 'SP', type: 'Vestibular' },
  { name: 'Universidade Estadual de Campinas', institution: 'UNICAMP', state: 'SP', type: 'Vestibular' },
  { name: 'Universidade Estadual Paulista', institution: 'UNESP', state: 'SP', type: 'Vestibular' },
  { name: 'Universidade do Estado do Rio de Janeiro', institution: 'UERJ', state: 'RJ', type: 'Vestibular' },
  { name: 'Universidade Federal do Rio de Janeiro', institution: 'UFRJ', state: 'RJ', type: 'Vestibular' },
  { name: 'Universidade Federal Fluminense', institution: 'UFF', state: 'RJ', type: 'Vestibular' },
  { name: 'Universidade Federal do Estado do Rio de Janeiro', institution: 'UNIRIO', state: 'RJ', type: 'Vestibular' },
  { name: 'Universidade Federal de Minas Gerais', institution: 'UFMG', state: 'MG', type: 'Vestibular' },
  { name: 'Universidade Federal de Uberlândia', institution: 'UFU', state: 'MG', type: 'Vestibular' },
  { name: 'Universidade Federal de Viçosa', institution: 'UFV', state: 'MG', type: 'Vestibular' },
  { name: 'Universidade Federal de Ouro Preto', institution: 'UFOP', state: 'MG', type: 'Vestibular' },
  { name: 'Universidade Federal do Triângulo Mineiro', institution: 'UFTM', state: 'MG', type: 'Vestibular' },
  { name: 'Universidade Federal do Espírito Santo', institution: 'UFES', state: 'ES', type: 'Vestibular' },
  { name: 'Universidade Estadual de Montes Claros', institution: 'UNIMONTES', state: 'MG', type: 'Vestibular' },
  { name: 'Faculdade de Medicina de São José do Rio Preto', institution: 'FAMERP', state: 'SP', type: 'Medicina' },
  { name: 'Faculdade de Medicina de Marília', institution: 'FAMEMA', state: 'SP', type: 'Medicina' },
  { name: 'Universidade Federal de São Paulo', institution: 'UNIFESP', state: 'SP', type: 'Vestibular' },
  { name: 'Universidade Presbiteriana Mackenzie', institution: 'MACKENZIE', state: 'SP', type: 'Vestibular' },
  { name: 'Pontifícia Universidade Católica de SP', institution: 'PUC-SP', state: 'SP', type: 'Vestibular' },
  { name: 'Fundação Getulio Vargas', institution: 'FGV', state: 'SP', type: 'Vestibular' },
  { name: 'Faculdade Israelita de Ciências da Saúde Albert Einstein', institution: 'Einstein', state: 'SP', type: 'Medicina' },
  { name: 'Faculdade de Ciências Médicas da Santa Casa', institution: 'Santa Casa', state: 'SP', type: 'Medicina' },
  { name: 'Universidade Federal do Rio Grande do Sul', institution: 'UFRGS', state: 'RS', type: 'Vestibular' },
  { name: 'Universidade Federal de Santa Catarina', institution: 'UFSC', state: 'SC', type: 'Vestibular' },
  { name: 'Universidade Federal do Paraná', institution: 'UFPR', state: 'PR', type: 'Vestibular' },
  { name: 'Universidade Estadual de Londrina', institution: 'UEL', state: 'PR', type: 'Vestibular' },
  { name: 'Universidade Estadual de Maringá', institution: 'UEM', state: 'PR', type: 'Vestibular' },
  { name: 'Universidade Estadual de Ponta Grossa', institution: 'UEPG', state: 'PR', type: 'Vestibular' },
  { name: 'Universidade Estadual do Oeste do Paraná', institution: 'UNIOESTE', state: 'PR', type: 'Vestibular' },
  { name: 'Pontifícia Universidade Católica do RS', institution: 'PUCRS', state: 'RS', type: 'Vestibular' },
  { name: 'Universidade de Passo Fundo', institution: 'UPF', state: 'RS', type: 'Vestibular' },
  { name: 'Universidade de Brasília', institution: 'UnB', state: 'DF', type: 'Vestibular' },
  { name: 'Universidade Federal de Goiás', institution: 'UFG', state: 'GO', type: 'Vestibular' },
  { name: 'Universidade Federal de Mato Grosso do Sul', institution: 'UFMS', state: 'MS', type: 'Vestibular' },
  { name: 'Universidade Federal de Mato Grosso', institution: 'UFMT', state: 'MT', type: 'Vestibular' },
  { name: 'Universidade Federal da Grande Dourados', institution: 'UFGD', state: 'MS', type: 'Vestibular' },
  { name: 'Universidade Federal da Bahia', institution: 'UFBA', state: 'BA', type: 'Vestibular' },
  { name: 'Universidade Federal de Pernambuco', institution: 'UFPE', state: 'PE', type: 'Vestibular' },
  { name: 'Universidade Federal do Ceará', institution: 'UFC', state: 'CE', type: 'Vestibular' },
  { name: 'Universidade Estadual do Ceará', institution: 'UECE', state: 'CE', type: 'Vestibular' },
  { name: 'Universidade Federal da Paraíba', institution: 'UFPB', state: 'PB', type: 'Vestibular' },
  { name: 'Universidade Federal do Rio Grande do Norte', institution: 'UFRN', state: 'RN', type: 'Vestibular' },
  { name: 'Universidade Federal de Alagoas', institution: 'UFAL', state: 'AL', type: 'Vestibular' },
  { name: 'Universidade Estadual do Maranhão', institution: 'UEMA', state: 'MA', type: 'Vestibular' },
  { name: 'Processo Seletivo Colégio Pedro II', institution: 'Colégio Pedro II', state: 'RJ', type: 'Admissão Escolar' },
  { name: 'Processo Seletivo Colégios Militares', institution: 'Colégios Militares', state: 'Nacional', type: 'Admissão Escolar' },
];

const eventTypes = ['INSCRIÇÃO', 'PAGAMENTO', 'PROVA', 'RESULTADO', 'MATRÍCULA'];

async function main() {
  console.log('Iniciando seed de vestibulares...');

  for (const item of vestibularesList) {
    const existing = await prisma.vestibular.findFirst({
      where: { institution: item.institution }
    });

    if (!existing) {
      const vestibular = await prisma.vestibular.create({
        data: {
          name: item.name,
          institution: item.institution,
          state: item.state,
          type: item.type,
          officialSite: 'https://google.com/search?q=' + encodeURIComponent(item.institution + ' vestibular')
        }
      });
      console.log(`Criado: ${vestibular.institution}`);

      // Add a couple of random events in the current and next month for the calendar to have data
      const randomEventCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 events
      
      for(let i = 0; i < randomEventCount; i++) {
        const today = new Date();
        // Generate a random day in the current month or next month
        const futureDays = Math.floor(Math.random() * 60) + 1; 
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + futureDays);
        
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        await prisma.vestibularEvent.create({
          data: {
            vestibularId: vestibular.id,
            type: randomType,
            dateStart: eventDate,
            description: `Atenção para o prazo de ${randomType.toLowerCase()} da instituição ${item.institution}.`
          }
        });
      }
    } else {
      console.log(`Já existe: ${item.institution}`);
    }
  }

  console.log('Seed completo!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
