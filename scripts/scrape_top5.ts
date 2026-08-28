import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

const SOURCES = [
  {
    institution: 'ENEM',
    url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem',
  },
  {
    institution: 'FUVEST',
    url: 'https://www.fuvest.br/vestibular-da-usp/',
  },
  {
    institution: 'UNICAMP',
    url: 'https://www.comvest.unicamp.br/',
  },
  {
    institution: 'UERJ',
    url: 'https://www.vestibular.uerj.br/',
  },
  {
    institution: 'UFRJ',
    url: 'https://acessograduacao.ufrj.br/',
  }
];

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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

async function scrapeData() {
  console.log('🤖 Iniciando Scraping com Inteligência Artificial (Google Gemini)...');
  
  // Buscar a chave da API salva no banco de dados (Painel Administrativo)
  const appSettings = await prisma.appSetting.findUnique({
    where: { id: 'global' }
  });

  const apiKey = appSettings?.geminiApiKey;

  if (!apiKey) {
    console.error('❌ ERRO: A chave da API Gemini não foi encontrada no banco de dados!');
    console.error('Acesse o Painel Administrativo > Configurações e adicione sua chave de API.');
    process.exit(1);
  }

  for (const source of SOURCES) {
    try {
      console.log(`\n🌍 Acessando site: ${source.institution}...`);
      
      const response = await axios.get(source.url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      $('script, style, noscript, nav, footer, img').remove();
      const rawText = $('body').text().replace(/\s+/g, ' ').trim();
      
      console.log(`🧠 Texto extraído (${rawText.length} caracteres). Enviando para a IA analisar...`);
      const events = await extractEventsWithGemini(source.institution, rawText, apiKey);
      
      if (events && Array.isArray(events) && events.length > 0) {
        const vestibular = await prisma.vestibular.findFirst({
          where: { institution: source.institution }
        });
        
        if (vestibular) {
          // Limpa os antigos
          await prisma.vestibularEvent.deleteMany({
            where: { vestibularId: vestibular.id }
          });

          // Insere os novos
          for (const ev of events) {
            if (ev.type && ev.dateStart) {
              await prisma.vestibularEvent.create({
                data: {
                  vestibularId: vestibular.id,
                  type: ev.type,
                  dateStart: new Date(ev.dateStart),
                  description: ev.description || ''
                }
              });
            }
          }
          console.log(`✅ Sucesso! O Gemini encontrou e salvou ${events.length} datas reais para ${source.institution}`);
        } else {
          console.log(`⚠️ ${source.institution} não encontrada no banco de dados.`);
        }
      } else {
        console.log(`ℹ️ O Gemini não encontrou nenhuma data clara no texto extraído de ${source.institution}.`);
      }
    } catch (error: any) {
      console.error(`❌ Erro geral no processamento de ${source.institution}: ${error.message}`);
    }
  }

  console.log('\n🏁 Processo finalizado.');
}

scrapeData()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
