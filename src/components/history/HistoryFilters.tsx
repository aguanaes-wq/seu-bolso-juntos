import { useState } from "react";
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
  Calendar,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export type PeriodFilter = "all" | "today" | "week" | "month" | "custom";

interface HistoryFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  onCustomDateChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export function HistoryFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  periodFilter,
  onPeriodChange,
  customDateRange,
  onCustomDateChange,
}: HistoryFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const periodOptions = [
    { value: "all" as PeriodFilter, label: "Tudo" },
    { value: "today" as PeriodFilter, label: "Hoje" },
    { value: "week" as PeriodFilter, label: "Semana" },
    { value: "month" as PeriodFilter, label: "Mês" },
    { value: "custom" as PeriodFilter, label: "Período" },
  ];

  const handlePeriodClick = (period: PeriodFilter) => {
    if (period === "custom") {
      setIsCalendarOpen(true);
    }
    onPeriodChange(period);
  };

  const hasActiveFilters = selectedCategory !== null || periodFilter !== "all";

  const clearFilters = () => {
    onCategoryChange(null);
    onPeriodChange("all");
    onCustomDateChange({ from: undefined, to: undefined });
  };

  return (
    <div className="space-y-3">
      {/* Period filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Período:</span>
        <div className="flex gap-1.5 flex-wrap">
          {periodOptions.map((option) => (
            option.value === "custom" ? (
              <Popover key={option.value} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => handlePeriodClick(option.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1",
                      periodFilter === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {periodFilter === "custom" && customDateRange.from
                      ? customDateRange.to
                        ? `${format(customDateRange.from, "dd/MM")} - ${format(customDateRange.to, "dd/MM")}`
                        : format(customDateRange.from, "dd/MM")
                      : option.label}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range) => {
                      onCustomDateChange({
                        from: range?.from,
                        to: range?.to,
                      });
                      if (range?.from && range?.to) {
                        setIsCalendarOpen(false);
                      }
                    }}
                    locale={ptBR}
                    className="pointer-events-auto"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <button
                key={option.value}
                onClick={() => handlePeriodClick(option.value)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full transition-colors",
                  periodFilter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {option.label}
              </button>
            )
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Categoria:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-colors",
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Todas
          </button>
          {categories.map((category) => {
            const Icon = categoryIcons[category] || MoreHorizontal;
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-3 h-3" />
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" />
          Limpar filtros
        </motion.button>
      )}
    </div>
  );
}

// Helper function to filter transactions by period
export function filterByPeriod(
  date: string,
  periodFilter: PeriodFilter,
  customDateRange: { from: Date | undefined; to: Date | undefined }
): boolean {
  const transactionDate = new Date(date);
  const today = new Date();

  switch (periodFilter) {
    case "today":
      return transactionDate >= startOfDay(today) && transactionDate <= endOfDay(today);
    case "week":
      return transactionDate >= startOfWeek(today, { locale: ptBR }) && transactionDate <= endOfWeek(today, { locale: ptBR });
    case "month":
      return transactionDate >= startOfMonth(today) && transactionDate <= endOfMonth(today);
    case "custom":
      if (customDateRange.from && customDateRange.to) {
        return transactionDate >= startOfDay(customDateRange.from) && transactionDate <= endOfDay(customDateRange.to);
      }
      if (customDateRange.from) {
        return transactionDate >= startOfDay(customDateRange.from);
      }
      return true;
    case "all":
    default:
      return true;
  }
}
