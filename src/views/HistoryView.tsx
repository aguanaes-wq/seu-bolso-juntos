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
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";

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
};

// Mock data
const mockTransactions = [
  {
    id: "1",
    description: "Uber para o trabalho",
    amount: 32,
    type: "expense" as const,
    category: "Transporte",
    date: new Date(),
    person: "Você",
  },
  {
    id: "2",
    description: "Almoço restaurante",
    amount: 45.9,
    type: "expense" as const,
    category: "Alimentação",
    date: new Date(),
    person: "Você",
  },
  {
    id: "3",
    description: "Salário",
    amount: 2750,
    type: "income" as const,
    category: "Receita",
    date: new Date(Date.now() - 86400000),
    person: "Parceiro(a)",
  },
  {
    id: "4",
    description: "Mercado da semana",
    amount: 234.5,
    type: "expense" as const,
    category: "Alimentação",
    date: new Date(Date.now() - 86400000),
    person: "Parceiro(a)",
  },
  {
    id: "5",
    description: "Netflix",
    amount: 55.9,
    type: "expense" as const,
    category: "Assinaturas",
    date: new Date(Date.now() - 2 * 86400000),
    person: "Você",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hoje";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Ontem";
  }
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

// Group transactions by date
function groupByDate(transactions: typeof mockTransactions) {
  const groups: Record<string, typeof mockTransactions> = {};
  
  transactions.forEach((t) => {
    const key = formatDate(t.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups);
}

export function HistoryView() {
  const groupedTransactions = groupByDate(mockTransactions);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
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
        {groupedTransactions.map(([date, transactions], groupIndex) => (
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
              {transactions.map((transaction, index) => {
                const Icon =
                  categoryIcons[transaction.category] || MoreHorizontal;
                const isIncome = transaction.type === "income";

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-soft transition-shadow cursor-pointer"
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
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className={cn(
                        "text-sm font-semibold flex-shrink-0",
                        isIncome ? "text-income" : "text-foreground"
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {mockTransactions.length === 0 && (
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
    </div>
  );
}
