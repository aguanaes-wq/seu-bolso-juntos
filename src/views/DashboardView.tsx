import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/contexts/FinanceContext";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DashboardView() {
  const { summary, categoryBreakdown, transactionsLoading } = useFinance();
  const { income, expenses, balance } = summary;
  const isPositive = balance >= 0;

  // Convert category breakdown to array and sort
  const topCategories = Object.entries(categoryBreakdown)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

  if (transactionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground mb-1">Resumo de {capitalizedMonth}</p>
        <h2 className="text-3xl font-bold text-foreground">
          {formatCurrency(balance)}
        </h2>
        <p
          className={cn(
            "text-sm font-medium mt-1",
            isPositive ? "text-income" : "text-expense"
          )}
        >
          {isPositive ? "Saldo positivo" : "Saldo negativo"}
        </p>
      </motion.div>

      {/* Income / Expenses cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-income/10 border border-income/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-income/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-income" />
            </div>
            <span className="text-sm text-muted-foreground">Receitas</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {formatCurrency(income)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl bg-expense/10 border border-expense/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-expense/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-expense" />
            </div>
            <span className="text-sm text-muted-foreground">Gastos</span>
          </div>
          <p className="text-xl font-semibold text-foreground">
            {formatCurrency(expenses)}
          </p>
        </motion.div>
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Principais gastos</h3>
            <button className="flex items-center gap-1 text-sm text-primary font-medium">
              Ver tudo <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {category.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ delay: 0.4 + index * 0.05, duration: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {topCategories.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-6 text-center"
        >
          <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhum gasto ainda</h3>
          <p className="text-sm text-muted-foreground">
            Registre transações no chat para ver o resumo aqui.
          </p>
        </motion.div>
      )}

      {/* Quick tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-2xl bg-accent/10 border border-accent/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Dica do agente
            </p>
            <p className="text-sm text-muted-foreground">
              Use o chat para registrar gastos rapidamente: "gastei 50 no mercado" ou "uber 32".
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
