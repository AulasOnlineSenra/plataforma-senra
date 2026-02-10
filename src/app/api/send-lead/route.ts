import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, 
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, 
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    const mailOptionsAdmin = {
      from: `"Site Senra Aulas" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '🚀 Novo Interessado na Aula Experimental!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FFC107;">Novo Lead Capturado!</h2>
          <p>Alguém demonstrou interesse através do formulário da Home.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>E-mail do aluno:</strong> ${email}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Entre em contato o mais rápido possível para converter!</p>
        </div>
      `,
    };
    
    const mailOptionsCliente = {
      from: `"Equipe Senra Aulas" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recebemos seu contato! 📚',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
             <h1 style="color: #FFC107;">Olá! 👋</h1>
          </div>
          
          <p>Obrigado pelo seu interesse na <strong>Senra Aulas Online</strong>.</p>
          
          <p>Recebemos o seu contato e ficamos muito felizes! 🎉</p>
          
          <p><strong>Nossa equipe pedagógica</strong> entrará em contato com você em breve através deste e-mail para entender melhor sua necessidade e agendar sua aula.</p>
          
          <br/>
          <p>Atenciosamente,</p>
          <p><strong>Equipe Senra Aulas Online</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Este é um e-mail automático, por favor não responda diretamente a esta mensagem.</p>
        </div>
      `,
    };

    await Promise.all([
      transporter.sendMail(mailOptionsAdmin),
      transporter.sendMail(mailOptionsCliente),
    ]);

    return NextResponse.json({ success: true, message: 'Email enviado!' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
  }
}