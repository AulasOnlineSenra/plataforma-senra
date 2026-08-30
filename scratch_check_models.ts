import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function checkKey() {
  try {
    const s = await prisma.appSetting.findUnique({where: {id: 'global'}});
    if (!s || !s.geminiApiKey) {
      console.log('No key in db');
      return;
    }
    const key = s.geminiApiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log('Fetching from:', url.substring(0, 70) + '...');
    const res = await fetch(url);
    const json = await res.json();
    if (json.models) {
      console.log('Available models:');
      json.models.filter((m: any) => m.name.includes('gemini-1.5') || m.name.includes('gemini-2.0')).forEach((m: any) => {
        console.log(`- ${m.name}`);
      });
    } else {
      console.log('Error from Google:', JSON.stringify(json, null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkKey();
