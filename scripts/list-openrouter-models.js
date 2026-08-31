

async function getModels() {
  console.log("Conectando ao OpenRouter para buscar os modelos disponíveis...");
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) {
      throw new Error(`Erro HTTP: ${res.status}`);
    }
    const data = await res.json();
    
    const models = data.data;
    console.log(`\n✅ Sucesso! Encontrados ${models.length} modelos.\n`);
    
    // Sort models by pricing (cheapest first) or just alphabetically
    models.sort((a, b) => a.id.localeCompare(b.id));

    models.forEach(model => {
      console.log(`ID para usar na Plataforma: openrouter:${model.id}`);
      console.log(`Nome: ${model.name}`);
      console.log(`Contexto Máximo: ${model.context_length} tokens`);
      console.log("---------------------------------------------------");
    });

    console.log(`\n💡 DICA: Copie o 'ID para usar na Plataforma' (incluindo o prefixo openrouter:) e cole no campo 'Modelo' do seu Agente de IA.`);

  } catch (error) {
    console.error("Erro ao buscar modelos:", error.message);
  }
}

getModels();
