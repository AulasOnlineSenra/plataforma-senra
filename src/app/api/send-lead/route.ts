import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// Validação com Zod
const leadSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').optional().or(z.literal('')),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido').optional().or(z.literal('')),
  source: z.string().default('home'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validar Dados
    const result = leadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { email, name, phone, source } = result.data;

    // 2. Salvar no Banco de Dados (Prioridade Máxima)
    const newLead = await prisma.lead.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: name || null,
        phone: phone || null,
        source,
        status: 'novo'
      }
    });

    // 3. Enviar Emails (Em segundo plano/Não bloqueante para o usuário)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
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
            <p>Alguém demonstrou interesse através do formulário.</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p><strong>Nome:</strong> ${name || 'Não informado'}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
            <p><strong>Origem:</strong> ${source}</p>
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
               <h1 style="color: #FFC107;">Olá${name ? ', ' + name : ''}! 👋</h1>
            </div>
            <p>Obrigado pelo seu interesse na <strong>Senra Aulas Online</strong>.</p>
            <p>Recebemos o seu contato e ficamos muito felizes! 🎉</p>
            <p><strong>Nossa equipe pedagógica</strong> entrará em contato com você em breve para agendar sua aula experimental.</p>
            <br/>
            <p>Atenciosamente,</p>
            <p><strong>Equipe Senra Aulas Online</strong></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #999; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
          </div>
        `,
      };

      // Dispara os e-mails mas não aguarda o término para responder ao cliente front-end
      // No entanto, envolvemos em um try/catch para logar erros sem quebrar o fluxo principal
      Promise.all([
        transporter.sendMail(mailOptionsAdmin),
        transporter.sendMail(mailOptionsCliente),
      ]).catch(err => console.error('Erro ao enviar e-mails de lead:', err));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead processado e salvo com sucesso!',
      leadId: newLead.id 
    });
  } catch (error) {
    console.error('Erro crítico ao processar lead:', error);
    return NextResponse.json({ error: 'Erro interno ao processar lead' }, { status: 500 });
  }
}