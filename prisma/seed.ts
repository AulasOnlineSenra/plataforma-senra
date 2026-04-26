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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
