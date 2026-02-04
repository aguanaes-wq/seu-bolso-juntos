import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useGoals, Goal } from "@/hooks/useGoals";
import { useCategories, Category } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";

interface FinanceContextType {
  // Transactions
  transactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  summary: { income: number; expenses: number; balance: number };
  categoryBreakdown: Record<string, number>;
  addTransaction: (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => Promise<{ data: Transaction | null; error: string | null }>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<{ data: Transaction | null; error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  refetchTransactions: () => Promise<void>;
  
  // Goals
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  addGoal: (goal: Omit<Goal, "id" | "created_at" | "updated_at">) => Promise<{ data: Goal | null; error: string | null }>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<{ data: Goal | null; error: string | null }>;
  deleteGoal: (id: string) => Promise<{ error: string | null }>;
  refetchGoals: () => Promise<void>;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  addCategory: (name: string, icon?: string) => Promise<{ data: Category | null; error: string | null }>;
  refetchCategories: () => Promise<void>;

  // Goal sensibilization
  updateGoalsForTransaction: (transaction: { category: string; amount: number; type: string }) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    summary,
    categoryBreakdown,
    addTransaction: addTransactionBase,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions,
  } = useTransactions();

  const {
    goals,
    isLoading: goalsLoading,
    error: goalsError,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: refetchGoals,
  } = useGoals();

  const {
    categories,
    isLoading: categoriesLoading,
    addCategory,
    refetch: refetchCategories,
  } = useCategories();

  // Update goals when a transaction is added
  const updateGoalsForTransaction = useCallback(async (transaction: { category: string; amount: number; type: string }) => {
    if (transaction.type !== "expense") return;

    // Find goals that match the transaction category or have no category (global goals)
    const matchingGoals = goals.filter(
      (goal) =>
        goal.type === "limit" &&
        (goal.category === transaction.category || goal.category === null)
    );

    for (const goal of matchingGoals) {
      const newAmount = goal.current_amount + Number(transaction.amount);
      await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", goal.id);
    }

    // Refetch goals to update UI
    if (matchingGoals.length > 0) {
      await refetchGoals();
    }
  }, [goals, refetchGoals]);

  // Wrap addTransaction to also update goals
  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) => {
    const result = await addTransactionBase(transaction);
    
    if (result.data) {
      // Update goals based on the new transaction
      await updateGoalsForTransaction({
        category: transaction.category,
        amount: transaction.amount,
        type: transaction.type,
      });
    }

    return result;
  }, [addTransactionBase, updateGoalsForTransaction]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        transactionsLoading,
        transactionsError,
        summary,
        categoryBreakdown,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refetchTransactions,
        goals,
        goalsLoading,
        goalsError,
        addGoal,
        updateGoal,
        deleteGoal,
        refetchGoals,
        categories,
        categoriesLoading,
        addCategory,
        refetchCategories,
        updateGoalsForTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
