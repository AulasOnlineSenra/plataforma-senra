import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

async function run() {
  console.log("Fetching settings...");
  const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
  if (!settings || !settings.geminiApiKey) {
    console.error("No Gemini API key found in DB");
    return;
  }
  const apiKeys = settings.geminiApiKey.split(/\r?\n|,/).map(k => k.trim()).filter(k => k.length > 0);
  const currentKey = apiKeys[0];
  console.log("Got API key. Initializing...");

  const genAI = new GoogleGenerativeAI(currentKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const chat = model.startChat({ history: [] });
  console.log("Sending message...");
  
  try {
    const responseStream = await chat.sendMessageStream("Olá, responda com 1 palavra");
    console.log("sendMessageStream returned!");
    for await (const chunk of responseStream.stream) {
      console.log("Chunk:", chunk.text());
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
