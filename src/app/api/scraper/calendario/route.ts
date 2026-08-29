import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import prisma from '@/lib/prisma';

async function extractEventsWithGemini(institution: string, textContext: string, apiKey: string) {
  const prompt = `
Você é um extrator de datas de vestibulares altamente preciso. 
Analise o texto abaixo, raspado da página oficial da instituição ${institution}.
Sua missão é identificar as principais datas do calendário do vestibular mais recente (inscrições, provas, resultados, matrículas).

Regras rigorosas:
1. Extraia apenas datas relacionadas ao processo seletivo/vestibular.
2. Categorize cada evento em um destes TIPOS EXATOS: "INSCRIÇÃO", "PAGAMENTO", "PROVA", "RESULTADO" ou "MATRÍCULA".
3. O campo dateStart DEVE estar no formato ISO "YYYY-MM-DD". Se o evento tiver vários dias, use o primeiro dia.
4. O campo description deve ser um resumo curto (ex: "Prova da 1ª Fase").
5. Retorne o resultado ESTRITAMENTE em formato JSON (um array de objetos). Nada de texto antes ou depois, sem crases de formatação markdown.

Formato exigido de resposta (Apenas o Array JSON):
[
  { "type": "PROVA", "dateStart": "2026-11-20", "description": "Prova da 1ª Fase" }
]

Texto extraído do site:
"""
${textContext.substring(0, 15000)}
"""
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error(`Erro na API Gemini: ${data.error.message}`);
      return [];
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const parsed = JSON.parse(textContent);
    return parsed || [];
  } catch (error) {
    console.error(`Erro na requisição ao Gemini ao analisar ${institution}:`, error);
    return [];
  }
}

export async function POST(req: Request) {
  console.log('🤖 [API] Iniciando Scraping de Calendário via API...');
  
  try {
    const appSettings = await prisma.appSetting.findUnique({
      where: { id: 'global' }
    });

    const apiKeyRaw = appSettings?.geminiApiKey;
    const requiresApproval = appSettings?.scraperRequiresApproval ?? true;

    if (!apiKeyRaw) {
      return NextResponse.json({ success: false, error: 'A chave da API Gemini não foi configurada.' }, { status: 400 });
    }
    
    const apiKeys = apiKeyRaw.split(',').map(k => k.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhuma chave da API Gemini válida foi encontrada.' }, { status: 400 });
    }
    
    // Rotação: seleciona uma chave aleatória para evitar o limite de requisições de uma única chave.
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    console.log(`🤖 [API] Usando chave Gemini final terminada em ...${apiKey.substring(apiKey.length - 4)}`);

    const vestibulares = await prisma.vestibular.findMany({
      where: { isActive: true, scrapingUrl: { not: null } }
    });
    
    if (vestibulares.length === 0) {
       // Se não tem dinâmico, vamos tentar puxar os top 5 fixos se eles existirem ou informar para configurar
       return NextResponse.json({ success: false, error: 'Nenhum vestibular com scrapingUrl configurado.' });
    }

    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    
    let totalUpdated = 0;

    for (const vest of vestibulares) {
      if (!vest.scrapingUrl) continue;

      try {
        const response = await axios.get(vest.scrapingUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          httpsAgent
        });
        
        const $ = cheerio.load(response.data);
        $('script, style, noscript, nav, footer, img').remove();
        let rawText = $('body').text().replace(/\s+/g, ' ').trim();
        
        if (rawText.length > 25000) {
          rawText = rawText.substring(0, 25000);
        }
        
        const events = await extractEventsWithGemini(vest.institution, rawText, apiKey);
        
        if (events && Array.isArray(events) && events.length > 0) {
          await prisma.vestibularEvent.deleteMany({
            where: { vestibularId: vest.id }
          });

          for (const ev of events) {
            if (ev.type && ev.dateStart) {
              await prisma.vestibularEvent.create({
                data: {
                  vestibularId: vest.id,
                  type: ev.type,
                  dateStart: new Date(ev.dateStart),
                  description: ev.description || '',
                  status: requiresApproval ? 'PENDING' : 'APPROVED'
                }
              });
              totalUpdated++;
            }
          }
          await prisma.vestibular.update({
            where: { id: vest.id },
            data: { lastScrapeStatus: 'SUCCESS', lastScrapeDate: new Date() }
          });
        } else {
          await prisma.vestibular.update({
             where: { id: vest.id },
             data: { lastScrapeStatus: 'NO_DATA', lastScrapeDate: new Date() }
          });
        }
      } catch (error: any) {
        console.error(`Erro ao processar ${vest.institution}:`, error.message);
        await prisma.vestibular.update({
           where: { id: vest.id },
           data: { lastScrapeStatus: 'ERROR', lastScrapeDate: new Date() }
        });
      }
    }

    return NextResponse.json({ success: true, updated: totalUpdated });
  } catch (error: any) {
    console.error('Erro na rota de scraping:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
