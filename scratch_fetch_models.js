const fetch = require('node-fetch'); // or native fetch if node 18+

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key provided. Run with GEMINI_API_KEY=your_key node scratch.js");
    return;
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  if (data.models) {
    console.log(data.models.map(m => m.name));
  } else {
    console.log(data);
  }
}

listModels();
