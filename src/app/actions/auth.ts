'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendResetPasswordEmail } from '@/lib/mailer';
import crypto from 'crypto';

// REGISTRAR USUÁRIO (Com Criptografia)
export async function registerUser(data: { name: string, email: string, password: string, role: string }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return { success: false, error: 'Este e-mail já está cadastrado. Vá para a tela de login.' }
    }

    // MÁGICA DA SEGURANÇA: Embaralhando a senha antes de salvar
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword, // Salva o hash (ex: $2a$10$wY... ), ninguém nunca saberá a senha real
        role: data.role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=FFC107&textColor=000000`, 
        status: 'active'
      }
    })

    return { success: true, user: newUser }
  } catch (error) {
    console.error('Erro ao registrar no banco:', error)
    return { success: false, error: 'Erro interno ao criar a conta.' }
  }
}

//  LOGIN (Comparando o Hash)
export async function loginUser(data: { email: string, password: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      return { success: false, error: 'E-mail não encontrado no sistema.' }
    }

    // Verifica se a senha digitada bate com a criptografia do banco
    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    
    // (Apoio para testes) Permite logar com usuários criados ANTES da criptografia
    const isLegacyPassword = user.password === data.password

    if (!isPasswordValid && !isLegacyPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' }
    }

    return { success: true, user }
  } catch (error) {
    console.error('Erro ao iniciar sessão:', error)
    return { success: false, error: 'Erro interno ao iniciar sessão.' }
  }
}

// TROCAR A SENHA (Para a tela de Perfil)
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: 'Usuário não encontrado.' };

        // Valida se ele sabe a senha atual antes de deixar trocar
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        const isLegacyPassword = user.password === currentPassword;

        if (!isPasswordValid && !isLegacyPassword) {
            return { success: false, error: 'A senha atual está incorreta. Não foi possível alterar.' };
        }

        // Criptografa a senha nova
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Atualiza no banco
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return { success: true };
    } catch (error) {
        console.error('Erro ao trocar senha:', error);
        return { success: false, error: 'Erro interno ao atualizar a senha.' };
    }
}

// 4. SOLICITAR RECUPERAÇÃO DE SENHA
// 4. SOLICITAR RECUPERAÇÃO DE SENHA (MODO DEBUG LIGADO 🐛)
export async function requestPasswordReset(email: string) {
  try {
    console.log(`[DEBUG] 1. A procurar o e-mail no banco de dados: "${email}"`);
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        console.log(`[DEBUG] ❌ FALHA: O e-mail "${email}" NÃO foi encontrado no banco de dados SQLite! O sistema vai fingir sucesso por segurança.`);
        return { success: true };
    }

    console.log(`[DEBUG] ✅ SUCESSO: Utilizador encontrado! ID: ${user.id}. A gerar Token...`);
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    console.log(`[DEBUG] 📨 A tentar ligar à Hostinger para enviar o e-mail...`);
    const mailResult = await sendResetPasswordEmail(user.email, resetToken);
    
    console.log(`[DEBUG] 🏁 Resposta do Carteiro (Nodemailer):`, mailResult);

    return { success: true };
  } catch (error) {
    console.error('[DEBUG] 🚨 ERRO GRAVE no pedido de reset:', error);
    return { success: false, error: 'Erro interno ao processar a solicitação.' };
  }
}

// 5. VALIDAR TOKEN E SALVAR NOVA SENHA
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Verifica se ainda não expirou
      }
    });

    if (!user) {
      return { success: false, error: 'Link inválido ou expirado. Solicite a recuperação novamente.' };
    }

    // Criptografa a nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Salva a senha e limpa o Token para ele não ser usado de novo
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return { success: false, error: 'Erro interno ao atualizar a senha.' };
  }
}