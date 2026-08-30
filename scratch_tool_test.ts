import { getSystemStatsTool } from './src/lib/ai/tools.ts';

async function test() {
  try {
    const res = await getSystemStatsTool({});
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
