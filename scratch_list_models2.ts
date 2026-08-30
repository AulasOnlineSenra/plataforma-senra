import prisma from './src/lib/prisma';

async function listModels() {
  try {
    const settings = await prisma.appSetting.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey;
    if (!apiKey) {
      console.log("No API Key");
      return;
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
listModels();
