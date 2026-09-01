'use server';

export async function validateApiKey(provider: string, key: string): Promise<boolean> {
  if (!key || !key.trim()) return false;
  
  try {
    if (provider === 'gemini') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
      // Fast, simple validation query
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 }
      });
      return !!result.response;
    }
    
    if (provider === 'openrouter') {
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });
      return response.ok;
    }
    
    if (provider === 'openai') {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`
        }
      });
      return response.ok;
    }

    if (provider === 'anthropic') {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
         method: "POST",
         headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
         },
         body: JSON.stringify({
           model: "claude-3-haiku-20240307",
           max_tokens: 1,
           messages: [{role: "user", content: "ping"}]
         })
      });
      return response.ok;
    }
    
    // Default fallback para provedores não implementados
    return true;
  } catch (error) {
    console.error(`[API Validation] Error validating ${provider} key:`, error);
    return false;
  }
}
