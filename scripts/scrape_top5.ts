import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '../src/generated/client';
import OpenAI from 'openai';
import 'dotenv/config';

const prisma = new PrismaClient();

// Inicializa a OpenAI (Ela puxa automaticamente a OPENAI_API_KEY do seu .env)
const openai = new OpenAI();

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

async function extractEventsWithAI(institution: string, textContext: string) {
  const prompt = `
Você é um extrator de datas de vestibulares altamente preciso. 
Analise o texto abaixo, que foi raspado da página oficial da instituição ${institution}.
Sua missão é identificar as principais datas do calendário do vestibular mais recente (inscrições, provas, resultados, matrículas).

Regras rigorosas:
1. Extraia apenas datas relacionadas ao processo seletivo/vestibular.
2. Categorize cada evento em um destes TIPOS EXATOS: "INSCRIÇÃO", "PAGAMENTO", "PROVA", "RESULTADO" ou "MATRÍCULA".
3. O campo dateStart DEVE estar no formato ISO "YYYY-MM-DD". Se o evento tiver vários dias, use o primeiro dia.
4. O campo description deve ser um resumo curto (ex: "Prova da 1ª Fase").
5. Retorne o resultado ESTRITAMENTE em formato JSON. Nada de texto antes ou depois.

Formato exigido:
{
  "events": [
    { "type": "PROVA", "dateStart": "2026-11-20", "description": "Prova da 1ª Fase" }
  ]
}

Texto extraído do site:
"""
${textContext.substring(0, 15000)}
"""
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{"events":[]}';
    const parsed = JSON.parse(content);
    return parsed.events || [];
  } catch (error) {
    console.error(`Erro na IA ao analisar ${institution}:`, error);
    return [];
  }
}

async function scrapeData() {
  console.log('🤖 Iniciando Scraping com Inteligência Artificial...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERRO: A variável de ambiente OPENAI_API_KEY não foi encontrada no arquivo .env!');
    console.error('Crie a chave na OpenAI e adicione ao .env antes de rodar este script.');
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
      
      // Cheerio para extrair e limpar apenas o texto puro (removendo tags HTML, scripts e css)
      const $ = cheerio.load(response.data);
      $('script, style, noscript, nav, footer, img').remove();
      const rawText = $('body').text().replace(/\s+/g, ' ').trim();
      
      console.log(`🧠 Texto extraído (${rawText.length} caracteres). Enviando para a IA analisar...`);
      const events = await extractEventsWithAI(source.institution, rawText);
      
      if (events && events.length > 0) {
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
            await prisma.vestibularEvent.create({
              data: {
                vestibularId: vestibular.id,
                type: ev.type,
                dateStart: new Date(ev.dateStart),
                description: ev.description || ''
              }
            });
          }
          console.log(`✅ Sucesso! A IA encontrou e salvou ${events.length} datas reais para ${source.institution}`);
        } else {
          console.log(`⚠️ ${source.institution} não encontrada no banco de dados.`);
        }
      } else {
        console.log(`ℹ️ A IA não encontrou nenhuma data clara no texto extraído de ${source.institution}.`);
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
