import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories(data as Category[]);
      setError(null);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar categorias");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string, icon: string = "MoreHorizontal") => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, icon, is_default: false })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return { data: null, error: "Categoria já existe" };
        }
        throw error;
      }

      setCategories((prev) => [...prev, data as Category]);
      return { data: data as Category, error: null };
    } catch (err) {
      console.error("Error adding category:", err);
      return { data: null, error: err instanceof Error ? err.message : "Erro ao adicionar categoria" };
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    addCategory,
    refetch: fetchCategories,
  };
}
