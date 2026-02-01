import { motion } from "framer-motion";
import { Target, Plus, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const mockGoals = [
  {
    id: "1",
    title: "Economizar para viagem",
    target: 3000,
    current: 1850,
    deadline: "Março 2026",
    category: "Economia",
  },
  {
    id: "2",
    title: "Limite de gastos com lazer",
    target: 500,
    current: 432.1,
    deadline: "Este mês",
    category: "Controle",
    isLimit: true,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function GoalsView() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Metas</h2>
          <p className="text-sm text-muted-foreground">
            Compartilhadas com a família
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-xl bg-primary text-primary-foreground shadow-soft"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Goals list */}
      <div className="space-y-4">
        {mockGoals.map((goal, index) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          const isNearLimit = goal.isLimit && progress >= 80;
          const isCompleted = progress >= 100;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-2xl border",
                isCompleted
                  ? "bg-income/5 border-income/20"
                  : isNearLimit
                  ? "bg-expense/5 border-expense/20"
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isCompleted
                      ? "bg-income/20"
                      : isNearLimit
                      ? "bg-expense/20"
                      : "bg-primary/10"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2
                      className={cn(
                        "w-5 h-5",
                        isCompleted ? "text-income" : "text-primary"
                      )}
                    />
                  ) : (
                    <Target
                      className={cn(
                        "w-5 h-5",
                        isNearLimit ? "text-expense" : "text-primary"
                      )}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {goal.title}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {goal.deadline}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isCompleted
                          ? "text-income"
                          : isNearLimit
                          ? "text-expense"
                          : "text-primary"
                      )}
                    >
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        isCompleted
                          ? "bg-income"
                          : isNearLimit
                          ? "bg-expense"
                          : "bg-primary"
                      )}
                    />
                  </div>

                  {isNearLimit && !isCompleted && (
                    <p className="mt-2 text-xs text-expense flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Vocês estão próximos do limite
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state hint */}
      {mockGoals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma meta ainda
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Crie metas compartilhadas para acompanhar as economias da família.
          </p>
        </div>
      )}

      {/* Quick create hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-2xl bg-muted/50"
      >
        <p className="text-sm text-muted-foreground text-center">
          💡 Dica: No chat, digite{" "}
          <span className="font-medium text-foreground">
            "criar meta economizar 1000"
          </span>{" "}
          para adicionar rapidamente.
        </p>
      </motion.div>
    </div>
  );
}
