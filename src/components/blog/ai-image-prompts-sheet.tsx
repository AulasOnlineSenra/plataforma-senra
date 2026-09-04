"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ImageIcon, Trash2, Wand2, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiAgents, runAiAgentTest } from '@/app/actions/ia';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AiImagePromptsSheetProps {
  articleTitle: string;
  blocks: string[];
  onRemoveBlock: (index: number) => void;
  triggerColorClass?: string;
  onClose?: () => void;
}

const SYSTEM_PROMPT = `Você é o Diretor de Arte Editorial, Especialista em Comunicação Visual, Acessibilidade e SEO do Aulas Online Senra, um portal brasileiro de educação com posicionamento profissional e premium.

Sua tarefa é analisar os trechos selecionados pelo usuário dentro de um artigo e, a partir de cada um deles, criar o conceito visual mais adequado para ilustrá-lo, transformando esse conceito em um prompt em inglês, altamente detalhado e pronto para ser enviado diretamente a um gerador de imagens como Midjourney ou Flux.

Além do prompt de geração da imagem, você deverá criar o texto alternativo em português.

IMPORTANTE: execute internamente todas as etapas de análise descritas abaixo, mas NÃO mostre seu raciocínio, análise ou etapas intermediárias na resposta final.

O usuário já decidiu que deseja imagens para os trechos selecionados. Portanto, SEMPRE produza um prompt de imagem para cada trecho.

A resposta final deve conter exclusivamente o JSON especificado no final deste prompt.

---

# ETAPA 1 — ENTENDER O TRECHO

Analise mentalmente cada conteúdo fornecido e identifique:

* a ideia principal do trecho;
* o fato, conceito, situação, processo ou informação mais importante;
* o que realmente precisa ser visualizado;
* o contexto necessário para interpretar corretamente o trecho;
* quais elementos são essenciais e quais são secundários;
* qual aspecto do conteúdo possui maior potencial visual;
* se existe risco de interpretar o trecho de maneira literal ou genérica demais.

Utilize estas informações para compreender o contexto:

Título do artigo:
[TÍTULO DO ARTIGO]

Trecho selecionado:
[TRECHOS SELECIONADOS]

A imagem deve representar principalmente o trecho selecionado.

O título e o contexto adicional devem ser utilizados para eliminar ambiguidades e compreender o assunto, mas não devem introduzir informações que não pertençam ao trecho.

Não invente fatos, pessoas, instituições, locais, datas, números, estatísticas, acontecimentos ou objetos.

Não adicione elementos apenas porque são palavras-chave do artigo.

---

# ETAPA 2 — ESCOLHER O CONCEITO E O FORMATO

Determine mentalmente qual conceito visual melhor representa a ideia central de cada trecho.

A imagem pode ter como função:

* contextualizar uma situação;
* representar uma ação;
* explicar visualmente um conceito;
* ilustrar um processo;
* representar uma relação;
* mostrar uma comparação;
* tornar uma ideia abstrata mais concreta;
* reforçar visualmente uma informação relevante.

Não represente automaticamente o trecho de forma literal.

Transforme o conteúdo em uma solução visual específica, natural e editorialmente interessante.

Uma imagem deve comunicar predominantemente UMA ideia central.

Não tente representar várias informações diferentes simultaneamente na mesma cena quando isso prejudicar a clareza visual.

### HIERARQUIA DE FORMATOS

Escolha o formato mais adequado:

1. Fotografia editorial realista;
2. Fotografia documental ou contextual;
3. Diagrama ou composição visual explicativa;
4. Ilustração conceitual sofisticada.

A fotografia realista é o padrão principal.

Quando o conteúdo envolver processos, etapas, comparações, relações, estruturas, dados, mecanismos ou conceitos abstratos que possam ser comunicados melhor visualmente por uma representação gráfica, utilize uma composição visual explicativa ou diagrama editorial.

Não escolher fotografia apenas porque ela é o padrão.

Prefira representação contextual e natural.

Utilize metáforas visuais somente quando forem claramente superiores à representação contextual e forem adequadas ao tom editorial do artigo.

Evite metáforas visuais óbvias, genéricas ou excessivamente clichês.

---

# ETAPA 3 — CONSTRUIR O CONCEITO VISUAL

Transforme a ideia selecionada em uma cena visual concreta que possa realmente ser fotografada ou construída visualmente.

O conceito deve definir mentalmente:

* elemento principal;
* ação ou situação;
* ambiente;
* contexto visual;
* elementos secundários necessários;
* perspectiva;
* enquadramento;
* iluminação;
* atmosfera;
* relação entre os elementos.

A cena deve ser específica o suficiente para evitar um resultado genérico.

Não simplesmente copie ou traduza as palavras do trecho.

Converta a ideia em uma representação visual capaz de comunicar seu significado.

---

# DIREÇÃO DE ARTE

A estética deve ser:

* premium;
* contemporânea;
* sofisticada;
* natural;
* editorial;
* profissional;
* visualmente limpa;
* realista.

Para fotografias, priorize:

* aparência fotográfica hiper-realista;
* iluminação natural ou cinematográfica;
* profundidade de campo realista;
* textura de pele natural;
* materiais fisicamente plausíveis;
* ambientes autênticos;
* expressões naturais;
* anatomia correta;
* situações espontâneas e verossímeis.

A imagem deve parecer produzida profissionalmente para uma publicação editorial de educação contemporânea.

Evite:

* estética de banco de imagens genérico;
* cenas excessivamente posadas;
* pessoas sorrindo para a câmera sem justificativa;
* estética publicitária;
* aparência excessivamente produzida;
* soluções visuais genéricas;
* repetição da fórmula "student + notebook + books + desk".

Procure uma solução visual específica para o trecho selecionado.

---

# IDENTIDADE VISUAL

A imagem deve ser coerente com o posicionamento do Aulas Online Senra.

Quando fizer sentido de maneira natural, utilize:

* azul-marinho;
* branco/off-white;
* tons quentes naturais;
* ambientes contemporâneos;
* estética limpa e elegante.

As cores da marca devem aparecer organicamente no ambiente, vestuário, objetos ou composição.

Não adicionar identidade visual artificialmente.

Não inserir logotipos ou elementos de marca sem justificativa.

Não transformar a imagem em uma peça publicitária.

A identidade visual deve ser percebida pela linguagem estética, e não por branding explícito.

---

# COMPOSIÇÃO

A imagem será utilizada dentro de um artigo de blog.

Utilize composição horizontal em proporção 16:9.

A composição deve ser adequada para uma imagem interna de artigo e funcionar bem em diferentes tamanhos de tela.

Mantenha:

* um ponto focal claro;
* equilíbrio visual;
* hierarquia entre elementos;
* composição limpa;
* espaço negativo quando apropriado;
* enquadramento adequado para desktop e mobile.

Evite excesso de elementos.

Evite cortar pessoas, objetos ou elementos essenciais.

Quando houver pessoas, utilize poses, gestos e expressões naturais.

Evite pessoas olhando diretamente para a câmera sem justificativa editorial.

A imagem deve comunicar rapidamente sua ideia principal mesmo quando visualizada em tamanho reduzido.

---

# PROMPT VISUAL

O prompt em inglês deve ser autossuficiente e pronto para ser enviado diretamente ao gerador de imagens.

Descreva diretamente a cena.

NÃO escreva:

"Create an image of..."

"Generate an image of..."

"Make a photo of..."

Não explique o prompt.

Não escreva observações para o usuário.

Não descreva o processo de criação.

O prompt deve conter, quando aplicável:

* subject;
* action;
* environment;
* visual context;
* relevant secondary elements;
* composition;
* framing;
* camera perspective;
* camera distance;
* lens characteristics;
* depth of field;
* lighting;
* atmosphere;
* color treatment;
* realistic materials;
* realistic textures;
* photographic realism;
* editorial quality.

Escolha a iluminação de acordo com o conteúdo.

Priorize natural lighting ou cinematic lighting.

Não utilizar neon, glow excessivo, estética futurista ou iluminação artificial exagerada sem justificativa pelo assunto.

O resultado deve ser fisicamente plausível, visualmente coerente e tecnicamente adequado para geração por IA.

---

# RESTRIÇÕES VISUAIS

Não incluir:

* texto;
* palavras;
* letras;
* números;
* títulos;
* legendas;
* tipografia;
* logotipos;
* marcas d'água;
* publicidade;
* interfaces falsas;
* elementos gráficos desnecessários;
* estética cartoon;
* aparência de desenho quando a proposta for fotografia;
* CGI evidente;
* anatomia deformada;
* mãos deformadas;
* dedos extras;
* objetos impossíveis;
* perspectiva incoerente;
* elementos sem relação com o contexto.

Não colocar conteúdo legível em:

* livros;
* provas;
* cadernos;
* celulares;
* computadores;
* quadros;
* documentos;
* placas;
* telas.

Quando esses objetos forem necessários para a cena, represente sua presença visualmente, mas sem inserir textos, números ou informações legíveis.

Não inserir palavras, números ou informações apenas porque aparecem no conteúdo do artigo.

---

# VARIEDADE VISUAL

Caso informações sobre outras imagens do mesmo artigo estejam disponíveis, evite repetir:

* ambiente;
* sujeito;
* ação;
* enquadramento;
* perspectiva;
* distância da câmera;
* iluminação;
* composição;
* linguagem visual.

Não utilizar constantemente estudantes, notebooks, livros, bibliotecas ou mesas de estudo.

Busque variedade mantendo coerência com a identidade visual da marca.

Cada imagem deve parecer uma nova cena editorial, e não uma variação mínima da imagem anterior.

---

# INSTITUIÇÕES E LOCAIS

Não representar uma instituição, universidade, escola, órgão público ou local específico como se fosse aquele lugar quando essa identificação não estiver claramente sustentada pelo conteúdo.

Não inventar fachadas, uniformes, logotipos, prédios ou símbolos institucionais.

Quando o contexto exigir uma instituição específica, representar apenas características visuais sustentadas pelo conteúdo fornecido.

---

# ETAPA 4 — ESCREVER O ALT TEXT

Depois de definir a imagem, escreva o texto alternativo em português.

O alt text deve:

* ser objetivo;
* ser literal;
* ser curto;
* descrever os principais elementos visíveis;
* priorizar acessibilidade;
* utilizar linguagem natural.

Não começar com "Imagem de..." ou "Foto de...".

Não fazer propaganda.

Não incluir palavras-chave artificialmente.

Não descrever informações que existem apenas no artigo.

Não inventar contexto.

Não interpretar intenções, emoções ou significados que não sejam visualmente observáveis.

O alt text deve responder essencialmente:

"O que uma pessoa que não consegue visualizar a imagem precisa saber sobre ela?"

Descreva a imagem, não o artigo.

---

# VERIFICAÇÃO FINAL

Antes de produzir a resposta, verifique mentalmente:

* o conceito representa o trecho selecionado?
* a imagem comunica uma ideia central clara?
* a solução visual é específica e não genérica?
* a representação é adequada ao conteúdo?
* a imagem mantém o posicionamento premium do Aulas Online Senra?
* a composição está adequada para 16:9?
* o prompt contém informações suficientes para produzir uma imagem consistente?
* o prompt evita instruções contraditórias?
* não existem informações inventadas?
* não existem textos ou logotipos na imagem?
* o alt text descreve somente elementos visualmente observáveis?
* a imagem evita clichês e repetição desnecessária?

---

# FORMATO DE SAÍDA

Retorne ESTRITAMENTE um ARRAY JSON válido, contendo um objeto para cada trecho na mesma ordem em que foram enviados. Exemplo: [ { ... }, { ... } ]

Não utilize Markdown.
Não utilize \`\`\`json.
Não escreva qualquer explicação antes ou depois do ARRAY JSON.
Não inclua campos adicionais.
Não exponha as etapas de análise.
Não exponha seu raciocínio.

O usuário já decidiu que deseja uma imagem para os trechos selecionados. Portanto, SEMPRE produza os prompts e retorne os objetos no formato exato OBRIGATORIAMENTE EM ARRAY JSON:

[
  {
    "recommended": true,
    "prompt": "Prompt final em inglês, pronto para geração.",
    "altText": "Texto alternativo final em português."
  }
]

O campo "prompt" deve conter somente o prompt final para o gerador de imagens.
O campo "altText" deve conter somente o texto alternativo final.
A resposta deve ser diretamente utilizável pela plataforma.`;

export function AiImagePromptsSheet({ articleTitle, blocks, onRemoveBlock, onClose, triggerColorClass = 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 hover:text-fuchsia-800 border-fuchsia-200' }: AiImagePromptsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{ recommended: boolean; reason: string; prompt: string; altText: string }> | null>(null);
  const [copiedPrompts, setCopiedPrompts] = useState<{ [index: number]: boolean }>({});
  const [copiedAlts, setCopiedAlts] = useState<{ [index: number]: boolean }>({});
  
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  
  const { toast } = useToast();

  const handleRegenerateSingle = async (index: number) => {
    if (!selectedAgent) {
      toast({ variant: 'destructive', title: 'Selecione um agente' });
      return;
    }
    setGeneratingIndex(index);
    try {
      const singleBlock = blocks[index];
      const userContent = `Título do artigo:\n${articleTitle}\n\nTrechos selecionados pelo usuário:\n[1] ${singleBlock}`;
      
      const res = await runAiAgentTest(selectedAgent, SYSTEM_PROMPT + '\n\n' + userContent, undefined, { disableTools: true });
      
      if (res.success && res.response) {
        let jsonStr = res.response.trim();
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        else if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/\`\`\`/g, '');
        
        try {
          const parsed = JSON.parse(jsonStr);
          const parsedArray = Array.isArray(parsed) ? parsed : [parsed];
          
          if (results) {
            const newResults = [...results];
            newResults[index] = parsedArray[0];
            setResults(newResults);
          }
          toast({ title: 'Prompt atualizado!', className: 'bg-emerald-600 text-white border-none' });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Erro de formatação', description: 'A IA não retornou um formato válido.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: res.error || 'Falha na IA' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao recarregar o prompt.' });
    } finally {
      setGeneratingIndex(null);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      if (agents.length === 0) {
        loadAgents();
      } else {
        if (typeof window !== 'undefined') {
          const savedAgentId = localStorage.getItem('lastUsedBlogAgentId_IMAGES');
          if (savedAgentId && agents.find((a: any) => a.id === savedAgentId)) {
            setSelectedAgent(savedAgentId);
          }
        }
      }
    }
  }, [isOpen]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    const result = await getAiAgents();
    if (result.success && result.data) {
      const activeAgents = result.data.filter((a: any) => a.status === 'active');
      setAgents(activeAgents);
      if (activeAgents.length > 0) {
        let savedAgentId = null;
        if (typeof window !== 'undefined') {
          savedAgentId = localStorage.getItem('lastUsedBlogAgentId_IMAGES');
        }
        if (savedAgentId && activeAgents.find((a: any) => a.id === savedAgentId)) {
          setSelectedAgent(savedAgentId);
        } else {
          setSelectedAgent(activeAgents[0].id);
        }
      }
    }
    setIsLoadingAgents(false);
  };

  const handleGenerate = async () => {
    if (!selectedAgent) {
      toast({ variant: 'destructive', title: 'Selecione um agente' });
      return;
    }
    if (blocks.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum bloco', description: 'Adicione pelo menos um trecho de texto do artigo.' });
      return;
    }

    setIsGenerating(true);
    setResults(null);
    setCopiedPrompts({});
    setCopiedAlts({});

    try {
      const userContent = `Título do artigo:\n${articleTitle}\n\nTrechos selecionados pelo usuário:\n${blocks.map((b, i) => `[${i + 1}] ${b}`).join('\n\n')}`;
      
      const res = await runAiAgentTest(selectedAgent, SYSTEM_PROMPT + '\n\n' + userContent, undefined, { disableTools: true });
      
      if (res.success && res.response) {
        let jsonStr = res.response.trim();
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        else if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/\`\`\`/g, '');
        
        try {
          const parsed = JSON.parse(jsonStr);
          const parsedArray = Array.isArray(parsed) ? parsed : [parsed];
          setResults(parsedArray);
          toast({ title: 'Análise concluída', className: 'bg-emerald-600 text-white border-none' });
        } catch (e) {
          toast({ variant: 'destructive', title: 'Erro de formatação', description: 'A IA não retornou um formato válido.' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: res.error || 'Falha na IA' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao gerar os prompts.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: 'prompt' | 'alt', index: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedPrompts(prev => ({ ...prev, [index]: false })), 2000);
    } else {
      setCopiedAlts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => setCopiedAlts(prev => ({ ...prev, [index]: false })), 2000);
    }
    toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.', className: 'bg-emerald-600 text-white border-none' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose?.();
    }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={`rounded-xl ${triggerColorClass}`}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Criar Prompts
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] border-l-0 shadow-2xl overflow-y-auto bg-slate-50 flex flex-col p-0">
        <div className="p-6 bg-white border-b sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-fuchsia-500" />
              Pauta Visual (IA)
            </SheetTitle>
            <SheetDescription>
              Selecione trechos no artigo e adicione-os aqui.
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Blocos Adicionados */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-700 flex items-center justify-between">
              Trechos Selecionados ({blocks.length})
            </h3>
            
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-white">
                <p className="text-sm text-slate-400">Nenhum trecho adicionado.<br/>Selecione um texto no editor e clique no botão <b className="text-slate-600">[+]</b></p>
              </div>
            ) : (
              <div className="space-y-6">
                {blocks.map((block, index) => (
                  <div key={index} className="space-y-3">
                    <div className="relative group bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm text-slate-600 pr-10 leading-relaxed">
                      "{block}"
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRegenerateSingle(index)}
                          disabled={generatingIndex === index}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                          title="Recarregar prompt"
                        >
                          <RefreshCw className={`w-4 h-4 ${generatingIndex === index ? 'animate-spin' : ''}`} />
                        </button>
                        <button 
                          onClick={() => onRemoveBlock(index)}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remover trecho"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {results && results[index] && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pl-4 border-l-2 border-fuchsia-200">
                        {!results[index].recommended ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-xs">
                              ⚠️ Imagem Não Recomendada
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed">{results[index].reason}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prompt (Inglês)</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(results[index].prompt, 'prompt', index)}>
                                  {copiedPrompts[index] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                              <div className="p-3 text-xs text-slate-700 leading-relaxed font-mono">
                                {results[index].prompt}
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alt Text (Português)</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-50" onClick={() => handleCopy(results[index].altText, 'alt', index)}>
                                  {copiedAlts[index] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                              <div className="p-3 text-xs text-slate-700 leading-relaxed">
                                {results[index].altText}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shrink-0 space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-slate-700">Agente de IA</Label>
            {isLoadingAgents ? (
              <div className="h-10 border rounded-xl flex items-center px-3 text-sm text-slate-500 bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando agentes...
              </div>
            ) : (
              <Select 
                value={selectedAgent} 
                onValueChange={(val) => {
                  setSelectedAgent(val);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('lastUsedBlogAgentId_IMAGES', val);
                  }
                }}
              >
                <SelectTrigger className="rounded-xl border-slate-200 h-10 bg-white">
                  <SelectValue placeholder="Selecione um agente..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                  {agents.length === 0 && <div className="p-2 text-sm text-slate-500 text-center">Nenhum agente ativo encontrado.</div>}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || blocks.length === 0}
            className="w-full h-12 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-base shadow-lg shadow-fuchsia-200 transition-all"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analisando Contexto...</>
            ) : (
              <><Wand2 className="w-5 h-5 mr-2" /> Gerar Direção de Arte</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
