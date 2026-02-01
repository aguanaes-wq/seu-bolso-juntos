import { motion } from "framer-motion";
import { MessageCircle, LayoutDashboard, Target, History } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavTab = "chat" | "dashboard" | "goals" | "history";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const tabs = [
  { id: "chat" as const, icon: MessageCircle, label: "Chat" },
  { id: "dashboard" as const, icon: LayoutDashboard, label: "Resumo" },
  { id: "goals" as const, icon: Target, label: "Metas" },
  { id: "history" as const, icon: History, label: "Histórico" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={cn(
                  "w-5 h-5 relative z-10 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[11px] font-medium relative z-10">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
