import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  type: "savings" | "limit";
  category: string | null;
  period: string;
  start_date: string;
  end_date: string | null;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setGoals(data as Goal[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar metas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (goal: Omit<Goal, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      
      setGoals((prev) => [data as Goal, ...prev]);
      return { data: data as Goal, error: null };
    } catch (err) {
      console.error("Error adding goal:", err);
      return { data: null, error: err instanceof Error ? err.message : "Erro ao adicionar meta" };
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? (data as Goal) : g))
      );
      return { data: data as Goal, error: null };
    } catch (err) {
      console.error("Error updating goal:", err);
      return { data: null, error: err instanceof Error ? err.message : "Erro ao atualizar meta" };
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setGoals((prev) => prev.filter((g) => g.id !== id));
      return { error: null };
    } catch (err) {
      console.error("Error deleting goal:", err);
      return { error: err instanceof Error ? err.message : "Erro ao apagar meta" };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel("goals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGoals]);

  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}
