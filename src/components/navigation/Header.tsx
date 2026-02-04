import { motion } from "framer-motion";
import { Wallet, Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title?: string;
  showActions?: boolean;
}

export function Header({ title = "Agente Financeiro", showActions = true }: HeaderProps) {
  const { currentMember, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        {/* Logo and title */}
        <div className="flex items-center gap-2.5">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-soft"
          >
            <Wallet className="w-4.5 h-4.5 text-primary-foreground" />
          </motion.div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
            </motion.button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                  aria-label="Menu do usuário"
                >
                  <User className="w-5 h-5" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {currentMember && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{currentMember.name}</p>
                      <p className="text-xs text-muted-foreground">Membro da família</p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
