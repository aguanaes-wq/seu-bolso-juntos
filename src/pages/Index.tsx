import { useState } from "react";
import { Header } from "@/components/navigation/Header";
import { BottomNav, NavTab } from "@/components/navigation/BottomNav";
import { ChatView } from "@/views/ChatView";
import { DashboardView } from "@/views/DashboardView";
import { GoalsView } from "@/views/GoalsView";
import { HistoryView } from "@/views/HistoryView";
import { FinanceProvider } from "@/contexts/FinanceContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("chat");

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
};

export default Index;
