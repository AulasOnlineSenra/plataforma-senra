import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, userPrompt, history, options } = body;

    const agent = await prisma.aiAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
    }

    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    const isOpenRouter = agent.model?.startsWith('openrouter:');
    
    let stream: ReadableStream;

    if (isOpenRouter) {
      const orModelName = agent.model!.replace('openrouter:', '');
      const orApiKey = settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
      if (!orApiKey) {
        return NextResponse.json({ error: "Chave de API do OpenRouter não configurada." }, { status: 400 });
      }

      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: orApiKey,
      });

      const messages: any[] = [];
      if (agent.instructions) {
        messages.push({ role: "system", content: agent.instructions });
      }
      if (history) {
        for (const h of history) {
          messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content });
        }
      }
      messages.push({ role: "user", content: userPrompt });

      const response = await openai.chat.completions.create({
        model: orModelName,
        messages: messages,
        stream: true,
      });

      const encoder = new TextEncoder();
      stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          } catch (e) {
            console.error("Stream error", e);
          } finally {
            controller.close();
          }
        }
      });

    } else {
      // Gemini
      const rawApiKey = settings?.geminiApiKey || "";
      const apiKeys = rawApiKey.split(/\r?\n|,/).map(k => k.trim()).filter(k => k.length > 0);
      if (apiKeys.length === 0) {
        return NextResponse.json({ error: "Chave de API do Google não configurada." }, { status: 400 });
      }

      const modelName = (agent.model || 'gemini-1.5-flash').replace(/^googleai\//, '');
      
      const sdkHistory = (history || []).map((h: any) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));

      let responseStream: any = null;
      let lastError: any = null;

      for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: agent.instructions || undefined,
          });

          const chat = model.startChat({ history: sdkHistory });
          responseStream = await chat.sendMessageStream(userPrompt);
          break; // Sucesso! Sai do loop e continua a execução
        } catch (e: any) {
          lastError = e;
          console.warn(`[IA Stream] Erro com a chave Gemini #${i + 1}: ${e.message}`);
          // O loop continua e tenta a próxima chave
        }
      }

      if (!responseStream) {
        throw new Error(`Todas as chaves do Google Gemini falharam. Último erro: ${lastError?.message || 'Desconhecido'}`);
      }

      const encoder = new TextEncoder();
      stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (e) {
             console.error("Stream error", e);
          } finally {
            controller.close();
          }
        }
      });
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (err: any) {
    console.error("[IA Stream Error]", err);
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
