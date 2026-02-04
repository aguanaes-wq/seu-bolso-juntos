import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  date: string;
  person: string;
  payment_method: string | null;
  location: string | null;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setTransactions(data as Transaction[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar transações");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions((prev) => [data as Transaction, ...prev]);
      return { data: data as Transaction, error: null };
    } catch (err) {
      console.error("Error adding transaction:", err);
      return { data: null, error: err instanceof Error ? err.message : "Erro ao adicionar transação" };
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? (data as Transaction) : t))
      );
      return { data: data as Transaction, error: null };
    } catch (err) {
      console.error("Error updating transaction:", err);
      return { data: null, error: err instanceof Error ? err.message : "Erro ao atualizar transação" };
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting transaction:", err);
      return { error: err instanceof Error ? err.message : "Erro ao apagar transação" };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  // Calculate summary
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") {
        acc.income += Number(t.amount);
      } else {
        acc.expenses += Number(t.amount);
      }
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
  summary.balance = summary.income - summary.expenses;

  // Category breakdown for expenses
  const categoryBreakdown = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  return {
    transactions,
    isLoading,
    error,
    summary,
    categoryBreakdown,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
