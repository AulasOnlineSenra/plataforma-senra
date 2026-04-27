"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendResetPasswordEmail } from "@/lib/mailer";
import crypto from "crypto";
import { applyReferralOnSignup } from "@/app/actions/users";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = new Set(["student", "teacher"]);

// REGISTRAR USUÁRIO (Com Criptografia)
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  referralCode?: string;
}) {
  try {
    if (data.role === "admin") {
      return { success: false, error: "Ação não permitida." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Este e-mail já está cadastrado. Vá para a tela de login.",
      };
    }

    // MÁGICA DA SEGURANÇA: Embaralhando a senha antes de salvar
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const normalizedRole = ALLOWED_ROLES.has(data.role) ? data.role : "student";

    const newUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        password: hashedPassword, // Salva o hash (ex: $2a$10$wY... ), ninguém nunca saberá a senha real
        role: normalizedRole,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=FFC107&textColor=000000`,
        referralCode: crypto.randomUUID().split('-')[0].toUpperCase(),
        updatedAt: new Date(),
        ...(normalizedRole === "teacher" ? { isValidated: false } : {}),
        status: normalizedRole === "teacher" ? "pending" : "active",
      },
    });

    // Notificação para o admin sobre novo usuário
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: adminUser.id,
          title: "Novo Usuário Cadastrado!",
          message: `${data.name} (${data.email}) se cadastrou como ${normalizedRole === "teacher" ? "professor" : "aluno"}.`,
          type: "NEW_USER",
          read: false,
        },
      });
    }

    // lógica de indicação
    if (data.referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: data.referralCode },
      });

      if (referrer) {
        // Notificação 1: para o dono do código de indicação
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: referrer.id,
            title: "Nova Indicação!",
            message: `O aluno ${data.name} se cadastrou usando seu código!`,
            type: "REFERRAL",
            read: false,
          },
        });

        // Notificação 2: para o novo aluno
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: newUser.id,
            title: "Bem-vindo!",
            message: `Você se cadastrou com o código de indicação de ${referrer.name}! Aproveite a plataforma.`,
            type: "REFERRAL",
            read: false,
          },
        });

        await applyReferralOnSignup(newUser.id, data.referralCode);
        revalidatePath("/dashboard/notifications");
      }
    }

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Erro no registro:", error);
    console.error("Dados recebidos - name:", data.name, "email:", data.email, "role:", data.role, "referralCode:", data.referralCode);
    return { success: false, error: "Erro interno ao criar a conta." };
  }
}

//  LOGIN (Comparando o Hash)
export async function loginUser(data: { email: string; password: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      console.log(`[LOGIN_DEBUG] Falha: E-mail não encontrado - ${data.email}`);
      return { success: false, error: "E-mail não encontrado no sistema." };
    }

    console.log(`[LOGIN_DEBUG] Usuário encontrado: ${user.email} (Role: ${user.role})`);

    // Verifica se a senha digitada bate com a criptografia do banco
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    // (Apoio para testes) Permite logar com usuários criados ANTES da criptografia
    const isLegacyPassword = user.password === data.password;

    if (!isPasswordValid && !isLegacyPassword) {
      return { success: false, error: "Senha incorreta. Tente novamente." };
    }

    // Validando o status ANTES de deixar entrar
   /* if (user.status === "pending") {
      return {
        success: false,
        error:
          "Sua conta está em análise! Aguarde a aprovação do administrador para acessar o sistema.",
      };
    } */

    if (user.status === "inactive") {
      return {
        success: false,
        error:
          "Sua conta foi desativada. Entre em contato com o suporte para mais informações.",
      };
    }

    // Se a senha tá certa e o status tá 'active', portas abertas!
    return { success: true, user };
  } catch (error) {
    console.error("Erro ao iniciar sessão:", error);
    return { success: false, error: "Erro interno ao iniciar sessão." };
  }
}

// TROCAR A SENHA (Para a tela de Perfil)
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    // Valida se ele sabe a senha atual antes de deixar trocar
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    const isLegacyPassword = user.password === currentPassword;

    if (!isPasswordValid && !isLegacyPassword) {
      return {
        success: false,
        error: "A senha atual está incorreta. Não foi possível alterar.",
      };
    }

    // Criptografa a senha nova
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao trocar senha:", error);
    return { success: false, error: "Erro interno ao atualizar a senha." };
  }
}

// 4. SOLICITAR RECUPERAÇÃO DE SENHA
// 4. SOLICITAR RECUPERAÇÃO DE SENHA (MODO DEBUG LIGADO 🐛)
export async function requestPasswordReset(email: string) {
  try {
    console.log(`[DEBUG] 1. A procurar o e-mail no banco de dados: "${email}"`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(
        `[DEBUG] ❌ FALHA: O e-mail "${email}" NÃO foi encontrado no banco de dados SQLite! O sistema vai fingir sucesso por segurança.`,
      );
      return { success: true };
    }

    console.log(
      `[DEBUG] ✅ SUCESSO: Utilizador encontrado! ID: ${user.id}. A gerar Token...`,
    );
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    console.log(
      `[DEBUG] 📨 A tentar ligar à Hostinger para enviar o e-mail...`,
    );
    const mailResult = await sendResetPasswordEmail(user.email, resetToken);

    console.log(`[DEBUG] 🏁 Resposta do Carteiro (Nodemailer):`, mailResult);

    return { success: true };
  } catch (error) {
    console.error("[DEBUG] 🚨 ERRO GRAVE no pedido de reset:", error);
    return {
      success: false,
      error: "Erro interno ao processar a solicitação.",
    };
  }
}

// 5. VALIDAR TOKEN E SALVAR NOVA SENHA
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // Verifica se ainda não expirou
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Link inválido ou expirado. Solicite a recuperação novamente.",
      };
    }

    // Criptografa a nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Salva a senha e limpa o Token para ele não ser usado de novo
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return { success: false, error: "Erro interno ao atualizar a senha." };
  }
}
