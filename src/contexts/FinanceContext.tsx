import React, { createContext, useContext, ReactNode } from "react";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useGoals, Goal } from "@/hooks/useGoals";

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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    summary,
    categoryBreakdown,
    addTransaction,
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
