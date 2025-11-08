import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [userEmail, setUserEmail] = React.useState("usuario@email.com");

  React.useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || "usuario@email.com");
      } catch (e) {
        setUserEmail("usuario@email.com");
      }
    }
  }, []);

  const handleLogout = () => {
    console.log("Logout realizado");
    localStorage.removeItem("user");
    setLocation("/");
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const isPDVPage = location === "/pdv";

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <TrialExpiredModal />
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {!isPDVPage && <DashboardHeader userEmail={userEmail} onLogout={handleLogout} />}
          <main className="flex-1 overflow-auto p-6 bg-background">
            {children}
            
            {/* Botão do WhatsApp - não aparece em Caixa e PDV */}
            <WhatsAppButton 
              phoneNumber={localStorage.getItem('whatsapp_number') || "+5598984267488"}
              message="Olá! Gostaria de tirar uma dúvida sobre o Pavisoft Sistemas."
            />

            <footer className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-xs text-muted-foreground">
                Desenvolvido por <span className="font-medium text-foreground">Pavisoft Sistemas</span>
              </p>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
