import { motion } from "framer-motion";
import { Wallet, MessageCircle, Target, TrendingUp } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Registre gastos conversando",
    example: '"uber 32" ou "gastei 50 no mercado"',
  },
  {
    icon: Target,
    title: "Crie metas compartilhadas",
    example: '"economizar 1000 este mês"',
  },
  {
    icon: TrendingUp,
    title: "Acompanhe seus gastos",
    example: '"resumo do mês" ou "quanto gastei com lazer?"',
  },
];

export function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center text-center px-6 py-8"
    >
      {/* Logo/Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-soft-lg mb-4"
      >
        <Wallet className="w-8 h-8 text-primary-foreground" />
      </motion.div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Agente Financeiro Familiar
      </h1>
      <p className="text-muted-foreground text-base max-w-sm mb-8">
        Seu assistente para controlar as finanças da família de forma simples e compartilhada.
      </p>

      {/* Feature hints */}
      <div className="w-full max-w-sm space-y-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 text-left"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <feature.icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {feature.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {feature.example}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Encouragement */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        Comece escrevendo algo como{" "}
        <span className="font-medium text-primary">"gastei 45 no almoço"</span>
      </motion.p>
    </motion.div>
  );
}
