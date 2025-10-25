import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [, setLocation] = useLocation();
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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader userEmail={userEmail} onLogout={handleLogout} />
          <div className="flex items-center gap-2 px-6 py-3 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </div>
          <main className="flex-1 overflow-auto p-6 bg-background">
            {children}
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
