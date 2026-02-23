import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, token: string) {
  // Esse é o link que o aluno vai clicar no e-mail 
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Plataforma Senra" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Recuperação de Senha - Plataforma Senra',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a;">Recuperação de Senha</h2>
        <p style="color: #475569; font-size: 16px;">Olá,</p>
        <p style="color: #475569; font-size: 16px;">Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #FFC107; color: #0f172a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Redefinir Minha Senha</a>
        </div>
        <p style="color: #475569; font-size: 14px;">Este link é válido por 1 hora. Se não pediu a alteração, pode ignorar este e-mail em segurança.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Plataforma Senra. Todos os direitos reservados.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, error: 'Falha ao conectar com o servidor de e-mail.' };
  }
}

export async function sendNewBookingNotificationEmail(params: {
  teacherEmail: string;
  teacherName: string;
  studentName: string;
  subject: string;
  startAt: Date;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const mailOptions = {
    from: `"Plataforma Senra" <${process.env.SMTP_USER}>`,
    to: params.teacherEmail,
    subject: 'Nova aula agendada na Plataforma Senra',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0f172a;">Nova marcacao de aula</h2>
        <p style="color: #475569; font-size: 16px;">Ola, ${params.teacherName}!</p>
        <p style="color: #475569; font-size: 16px;">Voce recebeu um novo agendamento.</p>
        <ul style="color: #334155; font-size: 15px; line-height: 1.6;">
          <li><strong>Aluno:</strong> ${params.studentName}</li>
          <li><strong>Disciplina:</strong> ${params.subject}</li>
          <li><strong>Data:</strong> ${params.startAt.toLocaleString('pt-BR')}</li>
        </ul>
        <div style="margin-top: 24px;">
          <a href="${appUrl}/dashboard/minhas-aulas" style="background-color: #FFC107; color: #0f172a; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Abrir Minhas Aulas</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail de nova aula:', error);
    return { success: false, error: 'Falha ao enviar notificacao de nova aula.' };
  }
}
