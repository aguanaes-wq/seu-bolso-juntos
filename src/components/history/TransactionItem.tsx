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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/hooks/useTransactions";

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

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  animationDelay?: number;
}

export function TransactionItem({ transaction, onDelete, animationDelay = 0 }: TransactionItemProps) {
  const Icon = categoryIcons[transaction.category] || MoreHorizontal;
  const isIncome = transaction.type === "income";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
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
        onClick={() => onDelete(transaction.id)}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-expense transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
