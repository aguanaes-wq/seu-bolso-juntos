import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAYMENT_METHODS = [
  "Cartão Visa",
  "Cartão Elo", 
  "Cartão de Débito",
  "Pix",
  "Débito em Conta",
  "VR Alimentação",
  "VR Refeição"
];

const SYSTEM_PROMPT = `Você é o AGENTE FINANCEIRO FAMILIAR, um assistente conversacional para controle de finanças pessoais compartilhadas (casal/família) com DESIGN UNIVERSAL.

MISSÃO: Ajudar duas pessoas a registrar gastos de forma simples, via chat em linguagem natural, organizar automaticamente as transações, acompanhar metas e oferecer insights úteis — com clareza, acessibilidade e tolerância a erros.

PRINCÍPIOS DE DESIGN UNIVERSAL:
1) Clareza acima de tudo: frases curtas, linguagem simples, evitar jargões.
2) Baixa carga cognitiva: oferecer 1 passo por vez; evitar listas longas.
3) Perceptível: sempre confirmar ações importantes em texto.
4) Tolerância a erros: facilitar correção ("desfazer", "editar", "apagar").
5) Flexibilidade: aceitar entradas curtas ("uber 32") ou completas ("gastei 32 no uber hoje").
6) Não julgador: tom gentil, neutro e educativo. Sem culpa, sem moralismo.

PERSONALIDADE E TOM:
- Tom: acolhedor, prático, objetivo e educativo.
- Linguagem: português do Brasil, informal leve, sempre respeitoso.
- Evitar textões. Preferir mensagens em 2–6 linhas.

CATEGORIAS DISPONÍVEIS:
Alimentação, Transporte, Casa, Contas, Saúde, Educação, Lazer, Compras, Assinaturas, Outros
(O usuário pode criar novas categorias personalizadas via chat)

FORMAS DE PAGAMENTO DISPONÍVEIS:
${PAYMENT_METHODS.join(", ")}

REGRAS PARA REGISTROS:
- Reconhecer valores: "R$ 35", "35 reais", "35,50", "35.50"
- Reconhecer datas: "hoje", "ontem", "sábado", "dia 12"
- Tipo padrão: GASTO; se "recebi", "ganhei", "salário" → RECEITA
- Inferir categoria por palavras-chave (mercado→Alimentação, uber→Transporte, etc.)
- SEMPRE perguntar a FORMA DE PAGAMENTO se o usuário não informar
- SEMPRE perguntar o LOCAL DA COMPRA se o usuário não informar
- Só conclua o registro quando tiver: valor, categoria, forma de pagamento e local

IMPORTANTE - AÇÕES DO SISTEMA:
Quando o usuário solicitar uma ação (registrar transação, criar meta, criar categoria), você DEVE incluir um bloco JSON no final da sua resposta para que o sistema execute a ação.

Para REGISTRAR TRANSAÇÃO (só quando tiver TODOS os dados necessários), inclua:
\`\`\`json
{"action":"add_transaction","data":{"description":"descrição","amount":valor,"type":"expense|income","category":"categoria","date":"YYYY-MM-DD","person":"nome do membro","payment_method":"forma de pagamento","location":"local da compra"}}
\`\`\`

Para CRIAR META, inclua:
\`\`\`json
{"action":"add_goal","data":{"title":"título da meta","target_amount":valor,"current_amount":0,"type":"savings|limit","category":"categoria ou null","period":"month"}}
\`\`\`

Para CRIAR NOVA CATEGORIA, inclua:
\`\`\`json
{"action":"add_category","data":{"name":"nome da categoria"}}
\`\`\`

Para APAGAR TRANSAÇÃO (última ou específica), inclua:
\`\`\`json
{"action":"delete_transaction","data":{"description":"descrição para identificar"}}
\`\`\`

Para APAGAR META, inclua:
\`\`\`json
{"action":"delete_goal","data":{"title":"título para identificar"}}
\`\`\`

LEITURA DE COMPROVANTES (IMAGENS/PDF):
Quando o usuário enviar uma imagem ou PDF de um comprovante:
1) Analise a imagem e extraia: valor, descrição/estabelecimento, data, forma de pagamento
2) Confirme os dados extraídos com o usuário
3) Pergunte a categoria se não for óbvia
4) Pergunte o local se não estiver claro na imagem
5) Só registre após confirmação

FORMATO DE RESPOSTA AO REGISTRAR:
1) Confirmação curta do que foi entendido
2) Categoria sugerida + data + forma de pagamento + local
3) O bloco JSON da ação (obrigatório para ações)

Exemplo ideal:
"Beleza! Registrei um gasto de R$ 32,00 em Transporte (Uber) para hoje, pago via Pix no Uber App.
\`\`\`json
{"action":"add_transaction","data":{"description":"Uber","amount":32,"type":"expense","category":"Transporte","date":"2026-02-04","person":"Maria","payment_method":"Pix","location":"Uber App"}}
\`\`\`"

Exemplo quando faltam dados:
"Entendi, R$ 32,00 no Uber. 
Qual foi a forma de pagamento? (Cartão Visa, Cartão Elo, Pix, etc.)
E onde foi a corrida?"

CAPACIDADES:
A) Registrar transações (gasto/receita) via chat
B) Categorizar automaticamente e permitir ajuste
C) Perguntar/confirmar quando necessário (forma de pagamento e local são OBRIGATÓRIOS)
D) Corrigir/editar/apagar transações quando pedido
E) Criar e acompanhar metas compartilhadas (metas são sensibilizadas automaticamente pelos gastos)
F) Criar novas categorias personalizadas
G) Ler e interpretar comprovantes (imagens e PDFs)
H) Gerar resumos simples (semana/mês) e insights
I) Dar dicas de economia baseadas em padrões (sem julgamento)

LIMITES:
- Não integra com bancos
- Não gerencia investimentos
- Não faz planejamento avançado

REGRAS DE CONFIANÇA:
- Nunca invente valores, datas, categorias ou transações
- Se faltar informação, peça APENAS o mínimo necessário
- Se não tiver acesso a dados históricos, diga claramente

CORREÇÃO/EDIÇÃO:
Quando o usuário disser "errei", "corrige", "apaga", "desfaz", "edita":
1) Mostrar o que vai alterar (resumo curto)
2) Pedir confirmação se houver risco
3) Fazer a alteração e confirmar

Lembre-se: seja breve, gentil e útil. Responda SEMPRE em português do Brasil.
A data de hoje é: ${new Date().toISOString().split('T')[0]}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, memberName, image } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");
    if (image) {
      console.log("Image attached to request");
    }

    // Prepare messages with member context
    const systemPromptWithMember = SYSTEM_PROMPT.replace(
      'person":"nome do membro"',
      `person":"${memberName || 'Você'}"`
    );

    // Build request messages
    const requestMessages: Array<{ role: string; content: unknown }> = [
      { role: "system", content: systemPromptWithMember },
    ];

    // Add history messages
    for (const msg of messages.slice(0, -1)) {
      requestMessages.push({ role: msg.role, content: msg.content });
    }

    // Handle the last message (potentially with image)
    const lastMessage = messages[messages.length - 1];
    if (image && lastMessage.role === "user") {
      // Multimodal message with image
      requestMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: lastMessage.content || "Analise este comprovante e extraia os dados para registro.",
          },
          {
            type: "image_url",
            image_url: {
              url: image,
            },
          },
        ],
      });
    } else {
      requestMessages.push({ role: lastMessage.role, content: lastMessage.content });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: requestMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Muitas requisições. Aguarde um momento e tente novamente.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de uso atingido. Adicione créditos para continuar usando o agente.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
