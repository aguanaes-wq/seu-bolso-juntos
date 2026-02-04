import { useState } from "react";
import { Header } from "@/components/navigation/Header";
import { BottomNav, NavTab } from "@/components/navigation/BottomNav";
import { ChatView } from "@/views/ChatView";
import { DashboardView } from "@/views/DashboardView";
import { GoalsView } from "@/views/GoalsView";
import { HistoryView } from "@/views/HistoryView";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { Loader2 } from "lucide-react";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("chat");

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (activeTab) {
      case "chat":
        return <ChatView />;
      case "dashboard":
        return <DashboardView />;
      case "goals":
        return <GoalsView />;
      case "history":
        return <HistoryView />;
      default:
        return <ChatView />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case "chat":
        return "Agente Financeiro";
      case "dashboard":
        return "Resumo";
      case "goals":
        return "Metas";
      case "history":
        return "Histórico";
      default:
        return "Agente Financeiro";
    }
  };

  return (
    <FinanceProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header title={getTitle()} />
        
        <main className="flex-1 overflow-hidden pb-16">
          {renderView()}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </FinanceProvider>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;
