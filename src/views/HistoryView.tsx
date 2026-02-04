import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils, 
  Heart, 
  Gamepad2,
  Receipt,
  Tv,
  GraduationCap,
  MoreHorizontal,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/contexts/FinanceContext";

// Category icon mapping
const categoryIcons: Record<string, React.ElementType> = {
  Alimentação: Utensils,
  Transporte: Car,
  Casa: Home,
  Contas: Receipt,
  Saúde: Heart,
  Educação: GraduationCap,
  Lazer: Gamepad2,
  Compras: ShoppingBag,
  Assinaturas: Tv,
  Outros: MoreHorizontal,
  Receita: Receipt,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

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

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const key = formatDate(transaction.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(transaction);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const groupedEntries = Object.entries(groupedTransactions);

  if (transactionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
        <p className="text-sm text-muted-foreground">
          Todas as transações da família
        </p>
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
              {transactionGroup.map((transaction, index) => {
                const Icon =
                  categoryIcons[transaction.category] || MoreHorizontal;
                const isIncome = transaction.type === "income";

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-soft transition-shadow group"
                  >
                    {/* Category icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        isIncome ? "bg-income/10" : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isIncome ? "text-income" : "text-muted-foreground"
                        )}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.category} • {transaction.person}
                        {transaction.payment_method && ` • ${transaction.payment_method}`}
                      </p>
                      {transaction.location && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                          📍 {transaction.location}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <span
                      className={cn(
                        "text-sm font-semibold flex-shrink-0",
                        isIncome ? "text-income" : "text-foreground"
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(Number(transaction.amount))}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-expense transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma transação
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Comece registrando gastos no chat para ver seu histórico aqui.
            </p>
          </div>
        )}
        
        {/* Bottom padding for scrolling */}
        <div className="h-8" />
      </div>
    </div>
  );
}
