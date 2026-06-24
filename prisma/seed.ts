import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function main() {
  const email = "senraaulasonline@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin1", 10);

    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: "Admin Senra",
        email,
        password: hashedPassword,
        role: "admin",
        status: "active",
        referralCode: generateReferralCode(),
        updatedAt: new Date(),
      },
    });

    console.log(`Admin criado com sucesso: ${email}`);
  } else {
    console.log(`Admin já existe: ${email}`);
  }

  const existingQuestions = await prisma.quizQuestion.findFirst();
  if (!existingQuestions) {
    const quizQuestions = [
      {
        question: "Qual é o seu nome completo?",
        questionPt: "Qual é o seu nome completo?",
        type: "text",
        placeholder: "Digite seu nome",
        isRequired: true,
        order: 0,
      },
      {
        question: "Qual é a sua idade?",
        questionPt: "Qual é a sua idade?",
        type: "text",
        placeholder: "Digite sua idade",
        isRequired: true,
        order: 1,
      },
      {
        question: "Qual disciplina você mais precisa de ajuda?",
        questionPt: "Qual disciplina você mais precisa de ajuda?",
        type: "multiselect",
        options: JSON.stringify([
          "Matemática",
          "Português",
          "Física",
          "Redação",
          "História",
          "Química",
          "Espanhol",
          "Filosofia",
          "Geografia",
          "Inglês",
          "Sociologia",
          "Biologia",
        ]),
        placeholder: "Selecione as disciplinas",
        isRequired: true,
        order: 2,
      },
      {
        question: "Qual o foco das aulas?",
        questionPt: "Qual o foco das aulas?",
        type: "radio",
        options: JSON.stringify([
          "Ensino Fundamental",
          "Ensino Médio",
          "Vestibulares/Enem",
          "Concursos",
        ]),
        isRequired: true,
        order: 3,
      },
      {
        question: "Já teve a oportunidade de fazer aulas particulares anteriormente?",
        questionPt: "Já teve a oportunidade de fazer aulas particulares anteriormente?",
        type: "radio",
        options: JSON.stringify(["Sim", "Não"]),
        isRequired: false,
        order: 4,
      },
      {
        question: "O melhor horário para as aulas seria em qual período?",
        questionPt: "O melhor horário para as aulas seria em qual período?",
        type: "radio",
        options: JSON.stringify(["Manhã", "Tarde", "Noite"]),
        isRequired: false,
        order: 5,
      },
    ];

    for (const q of quizQuestions) {
      await prisma.quizQuestion.create({ data: q });
    }

    console.log("Perguntas do questionário padrão criadas com sucesso!");
  }

  // Criar templates de simulados padrão do ENEM se não existirem
  const templateCount = await (prisma as any).simuladoTemplate.count();
  if (templateCount === 0) {
    const qDia1 = [
      {
        id: "q-1-1",
        title: "Na estruturação da sociedade grega antiga, a pólis representou muito mais que uma delimitação territorial. Sob a perspectiva da cidadania ateniense, qual das alternativas expressa a principal característica desse modelo?",
        type: "multiple-choice",
        options: [
          { id: "o-1-1-1", text: "A participação direta e deliberativa dos cidadãos nas assembleias democráticas.", isCorrect: true },
          { id: "o-1-1-2", text: "A concessão automática de direitos políticos a escravos e estrangeiros.", isCorrect: false },
          { id: "o-1-1-3", text: "A total submissão das decisões políticas a um poder imperial centralizado.", isCorrect: false },
          { id: "o-1-1-4", text: "A exclusão de proprietários de terras do processo de votação pública.", isCorrect: false }
        ],
        isRequired: true
      },
      {
        id: "q-1-2",
        title: "No Modernismo brasileiro, a Semana de Arte Moderna de 1922 foi um marco para a reconstrução da identidade cultural do país. Qual era a principal proposta estética desse movimento?",
        type: "multiple-choice",
        options: [
          { id: "o-1-2-1", text: "A reprodução fiel dos padrões parnasianos e academicistas europeus.", isCorrect: false },
          { id: "o-1-2-2", text: "A fusão de influências artísticas modernas mundiais com a cultura e a tradição locais sob a ótica da antropofagia.", isCorrect: true },
          { id: "o-1-2-3", text: "O abandono completo de qualquer temática que abordasse a desigualdade social no Brasil.", isCorrect: false },
          { id: "o-1-2-4", text: "A valorização exclusiva de formas rígidas de poesia clássica rimada.", isCorrect: false }
        ],
        isRequired: true
      }
    ];

    const qDia2 = [
      {
        id: "q-2-1",
        title: "Considere uma progressão aritmética (PA) onde o primeiro termo é a_1 = 5 e a razão r = 3. Qual o valor do décimo termo (a_10) dessa progressão?",
        type: "multiple-choice",
        options: [
          { id: "o-2-1-1", text: "35", isCorrect: false },
          { id: "o-2-1-2", text: "32", isCorrect: true },
          { id: "o-2-1-3", text: "38", isCorrect: false },
          { id: "o-2-1-4", text: "29", isCorrect: false }
        ],
        isRequired: true
      },
      {
        id: "q-2-2",
        title: "O fenômeno do efeito estufa é um mecanismo natural vital para manter a temperatura média da Terra propícia à vida. No entanto, a emissão excessiva de qual gás, decorrente da queima de combustíveis fósseis, tem intensificado esse efeito de forma preocupante?",
        type: "multiple-choice",
        options: [
          { id: "o-2-2-1", text: "Dióxido de Carbono (CO2)", isCorrect: true },
          { id: "o-2-2-2", text: "Monóxido de Carbono (CO)", isCorrect: false },
          { id: "o-2-2-3", text: "Nitrogênio Gasoso (N2)", isCorrect: false },
          { id: "o-2-2-4", text: "Hélio (He)", isCorrect: false }
        ],
        isRequired: true
      }
    ];

    await (prisma as any).simuladoTemplate.createMany({
      data: [
        {
          title: "ENEM Oficial - Simulado Mensal (Dia 1)",
          description: "Prova com foco em Linguagens, Códigos e suas Tecnologias, Redação e Ciências Humanas.",
          subject: "ENEM",
          dayType: "DIA1",
          timeLimitMinutes: 330, // 5h30
          questions: qDia1,
        },
        {
          title: "ENEM Oficial - Simulado Mensal (Dia 2)",
          description: "Prova com foco em Ciências da Natureza e suas Tecnologias, e Matemática e suas Tecnologias.",
          subject: "ENEM",
          dayType: "DIA2",
          timeLimitMinutes: 300, // 5h00
          questions: qDia2,
        }
      ]
    });

    console.log("Templates padrão do ENEM criados com sucesso!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
