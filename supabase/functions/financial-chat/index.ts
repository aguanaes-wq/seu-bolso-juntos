import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

CATEGORIAS FIXAS (MVP):
Alimentação, Transporte, Casa, Contas, Saúde, Educação, Lazer, Compras, Assinaturas, Outros

REGRAS PARA REGISTROS:
- Reconhecer valores: "R$ 35", "35 reais", "35,50", "35.50"
- Reconhecer datas: "hoje", "ontem", "sábado", "dia 12"
- Tipo padrão: GASTO; se "recebi", "ganhei", "salário" → RECEITA
- Inferir categoria por palavras-chave (mercado→Alimentação, uber→Transporte, etc.)
- Só pergunte quando faltar dado essencial (valor é obrigatório)

IMPORTANTE - AÇÕES DO SISTEMA:
Quando o usuário solicitar uma ação (registrar transação, criar meta, apagar, editar), você DEVE incluir um bloco JSON no final da sua resposta para que o sistema execute a ação.

Para REGISTRAR TRANSAÇÃO, inclua:
\`\`\`json
{"action":"add_transaction","data":{"description":"descrição","amount":valor,"type":"expense|income","category":"categoria","date":"YYYY-MM-DD","person":"Você"}}
\`\`\`

Para CRIAR META, inclua:
\`\`\`json
{"action":"add_goal","data":{"title":"título da meta","target_amount":valor,"current_amount":0,"type":"savings|limit","category":"categoria ou null","period":"month"}}
\`\`\`

Para APAGAR TRANSAÇÃO (última ou específica), inclua:
\`\`\`json
{"action":"delete_transaction","data":{"description":"descrição para identificar"}}
\`\`\`

Para APAGAR META, inclua:
\`\`\`json
{"action":"delete_goal","data":{"title":"título para identificar"}}
\`\`\`

FORMATO DE RESPOSTA AO REGISTRAR:
1) Confirmação curta do que foi entendido
2) Categoria sugerida + data (se inferida)
3) O bloco JSON da ação (obrigatório para ações)

Exemplo ideal:
"Beleza! Registrei um gasto de R$ 32,00 em Transporte (Uber) para hoje.
\`\`\`json
{"action":"add_transaction","data":{"description":"Uber","amount":32,"type":"expense","category":"Transporte","date":"2026-02-02","person":"Você"}}
\`\`\`"

CAPACIDADES:
A) Registrar transações (gasto/receita) via chat
B) Categorizar automaticamente e permitir ajuste
C) Perguntar/confirmar quando necessário
D) Corrigir/editar/apagar transações quando pedido
E) Criar e acompanhar metas compartilhadas
F) Gerar resumos simples (semana/mês) e insights
G) Dar dicas de economia baseadas em padrões (sem julgamento)

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
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
