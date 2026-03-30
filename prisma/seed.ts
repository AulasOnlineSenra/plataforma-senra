import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "senraaulasonline@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin já existe: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash("admin1", 10);

  await prisma.user.create({
    data: {
      name: "Admin Senra",
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    },
  });

  console.log(`Admin criado com sucesso: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
