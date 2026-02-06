import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Receipt, Loader2 } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";
import { HistoryFilters, PeriodFilter, filterByPeriod } from "@/components/history/HistoryFilters";
import { TransactionItem } from "@/components/history/TransactionItem";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Add timezone offset to compare dates correctly
  const dateLocal = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  if (dateLocal.toDateString() === today.toDateString()) {
    return "Hoje";
  }
  if (dateLocal.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }
  return dateLocal.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

export function HistoryView() {
  const { transactions, transactionsLoading, deleteTransaction } = useFinance();
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Get unique categories from transactions
  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Category filter
      if (selectedCategory && t.category !== selectedCategory) {
        return false;
      }
      // Period filter
      if (!filterByPeriod(t.date, periodFilter, customDateRange)) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedCategory, periodFilter, customDateRange]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  // Group filtered transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const key = formatDate(transaction.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(transaction);
    return groups;
  }, {} as Record<string, typeof filteredTransactions>);

  const groupedEntries = Object.entries(groupedTransactions);

  if (transactionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
        <p className="text-sm text-muted-foreground">
          {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? "ões" : ""} encontrada{filteredTransactions.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <HistoryFilters
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          customDateRange={customDateRange}
          onCustomDateChange={setCustomDateRange}
        />
      </motion.div>

      {/* Transaction groups */}
      <div className="space-y-6">
        {groupedEntries.map(([date, transactionGroup], groupIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {date}
            </h3>
            <div className="space-y-2">
              {transactionGroup.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDelete}
                  animationDelay={groupIndex * 0.1 + index * 0.05}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {transactions.length === 0 ? "Nenhuma transação" : "Nenhum resultado"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {transactions.length === 0 
              ? "Comece registrando gastos no chat para ver seu histórico aqui."
              : "Tente ajustar os filtros para ver mais transações."}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
