import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "error";
  imageUrl?: string;
}

interface ActionData {
  action: string;
  data: Record<string, unknown>;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-chat`;

// Extract JSON action blocks from AI response
function extractActions(content: string): { cleanContent: string; actions: ActionData[] } {
  const actions: ActionData[] = [];
  const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
  
  let match;
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.action && parsed.data) {
        actions.push(parsed as ActionData);
      }
    } catch (e) {
      console.error("Failed to parse action JSON:", e);
    }
  }

  // Remove JSON blocks from the displayed content
  const cleanContent = content.replace(jsonBlockRegex, "").trim();
  
  return { cleanContent, actions };
}

// Execute actions from the AI response
async function executeActions(actions: ActionData[], memberId?: string) {
  for (const action of actions) {
    console.log("Executing action:", action.action, action.data);
    
    try {
      switch (action.action) {
        case "add_transaction": {
          const transactionData = action.data as {
            description: string;
            amount: number;
            type: string;
            category: string;
            date: string;
            person: string;
            payment_method?: string;
            location?: string;
          };
          
          const { data, error } = await supabase
            .from("transactions")
            .insert({
              description: transactionData.description,
              amount: transactionData.amount,
              type: transactionData.type,
              category: transactionData.category,
              date: transactionData.date,
              person: transactionData.person,
              payment_method: transactionData.payment_method || null,
              location: transactionData.location || null,
              member_id: memberId || null,
            })
            .select()
            .single();
          
          if (error) {
            console.error("Error adding transaction:", error);
          } else {
            console.log("Transaction added:", data);
            
            // Update goals that match this transaction category
            if (transactionData.type === "expense") {
              const { data: goals } = await supabase
                .from("goals")
                .select("*")
                .eq("type", "limit");

              if (goals) {
                for (const goal of goals) {
                  if (goal.category === transactionData.category || goal.category === null) {
                    const newAmount = (goal.current_amount || 0) + Number(transactionData.amount);
                    await supabase
                      .from("goals")
                      .update({ current_amount: newAmount })
                      .eq("id", goal.id);
                  }
                }
              }
            }
          }
          break;
        }
        
        case "add_goal": {
          const goalData = action.data as {
            title: string;
            target_amount: number;
            current_amount: number;
            type: string;
            category: string | null;
            period: string;
          };
          
          const { data, error } = await supabase
            .from("goals")
            .insert({
              title: goalData.title,
              target_amount: goalData.target_amount,
              current_amount: goalData.current_amount,
              type: goalData.type,
              category: goalData.category,
              period: goalData.period,
              member_id: memberId || null,
            })
            .select()
            .single();
          
          if (error) {
            console.error("Error adding goal:", error);
          } else {
            console.log("Goal added:", data);
          }
          break;
        }

        case "add_category": {
          const categoryData = action.data as {
            name: string;
            icon?: string;
          };
          
          const { data, error } = await supabase
            .from("categories")
            .insert({
              name: categoryData.name,
              icon: categoryData.icon || "MoreHorizontal",
              is_default: false,
            })
            .select()
            .single();
          
          if (error) {
            if (error.code === "23505") {
              console.log("Category already exists");
            } else {
              console.error("Error adding category:", error);
            }
          } else {
            console.log("Category added:", data);
          }
          break;
        }
        
        case "delete_transaction": {
          // Delete the most recent transaction matching the description
          const { data: transactions } = await supabase
            .from("transactions")
            .select("id")
            .ilike("description", `%${action.data.description}%`)
            .order("created_at", { ascending: false })
            .limit(1);
          
          if (transactions && transactions.length > 0) {
            const { error } = await supabase
              .from("transactions")
              .delete()
              .eq("id", transactions[0].id);
            
            if (error) {
              console.error("Error deleting transaction:", error);
            } else {
              console.log("Transaction deleted");
            }
          }
          break;
        }
        
        case "delete_goal": {
          const { data: goals } = await supabase
            .from("goals")
            .select("id")
            .ilike("title", `%${action.data.title}%`)
            .order("created_at", { ascending: false })
            .limit(1);
          
          if (goals && goals.length > 0) {
            const { error } = await supabase
              .from("goals")
              .delete()
              .eq("id", goals[0].id);
            
            if (error) {
              console.error("Error deleting goal:", error);
            } else {
              console.log("Goal deleted");
            }
          }
          break;
        }
        
        default:
          console.warn("Unknown action:", action.action);
      }
    } catch (err) {
      console.error("Error executing action:", err);
    }
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isProcessingRef = useRef(false);
  const { currentMember, sessionToken } = useAuth();

  // Keep ref in sync with state
  messagesRef.current = messages;

  const sendMessage = useCallback(async (content: string, imageBase64?: string) => {
    // Prevent duplicate submissions
    if (isProcessingRef.current) {
      console.log("Already processing a message, ignoring duplicate call");
      return;
    }
    
    isProcessingRef.current = true;
    setError(null);
     
    // Require authentication
    if (!sessionToken) {
      setError("Você precisa fazer login para usar o chat.");
      isProcessingRef.current = false;
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content,
      timestamp: new Date(),
      status: "sent",
      imageUrl: imageBase64,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Prepare message history for API using ref to avoid stale closure
    const history = messagesRef.current.map((m) => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();

      const requestBody: Record<string, unknown> = {
        messages: [...history, { role: "user", content }],
      };

      // Add image if provided
      if (imageBase64) {
        requestBody.image = imageBase64;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
           "x-session-token": sessionToken,
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
         if (response.status === 401) {
           throw new Error("Sessão expirada. Por favor, faça login novamente.");
         }
        if (response.status === 429) {
          throw new Error("Muitas requisições. Aguarde um momento e tente novamente.");
        }
        if (response.status === 402) {
          throw new Error("Limite de uso atingido. Adicione créditos para continuar.");
        }
        throw new Error("Erro ao processar sua mensagem. Tente novamente.");
      }

      if (!response.body) {
        throw new Error("Resposta vazia do servidor.");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // Add placeholder agent message
      const agentMessageId = `agent-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: agentMessageId,
          type: "agent",
          content: "",
          timestamp: new Date(),
          status: "sending",
        },
      ]);

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              
              // Extract and clean content for display (hide JSON blocks)
              const { cleanContent } = extractActions(assistantContent);
              
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMessageId
                    ? { ...m, content: cleanContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // After streaming is complete, extract and execute actions
      const { cleanContent, actions } = extractActions(assistantContent);
      
      // Update final message content
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMessageId ? { ...m, content: cleanContent, status: "sent" } : m
        )
      );

      // Execute any actions from the AI response
      if (actions.length > 0) {
        await executeActions(actions, currentMember?.id);
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        isProcessingRef.current = false;
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      
      // Add error message from agent
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: "agent",
          content: `Ops! ${errorMessage}`,
          timestamp: new Date(),
          status: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [currentMember, sessionToken]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    cancelRequest,
  };
}
