// Script direto sem Prisma - passa a chave como argumento
// Uso: npx tsx scratch_list_available.ts AQ.Ab8RN6...

const key = process.argv[2];
if (!key) {
  console.error("Uso: npx tsx scratch_list_available.ts SUA_CHAVE");
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  console.log("Testando chave contra o endpoint v1beta...");
  const res = await fetch(url);
  const json = await res.json();

  if (json.models && json.models.length > 0) {
    console.log(`\n✅ Chave VÁLIDA! ${json.models.length} modelos encontrados:\n`);
    json.models.forEach((m: any) => {
      const supports = m.supportedGenerationMethods?.join(', ') || '';
      console.log(`  - ${m.name}  [${supports}]`);
    });
  } else if (json.error) {
    console.log(`\n❌ Erro da API Google:\n  Código: ${json.error.code}\n  Mensagem: ${json.error.message}\n  Status: ${json.error.status}`);
  } else {
    console.log("\nResposta inesperada:", JSON.stringify(json, null, 2));
  }
}

listModels();
