import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLocation } from "wouter";
import { RotateCcw, Truck, FileText } from "lucide-react"; // Added FileText import
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"; // Added SidebarMenuItem and SidebarMenuButton imports
import { Link } from "wouter-preact"; // Added Link import

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
        <DashboardSidebar>
          {/* Dashboard Sidebar Content */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                {/* Add dashboard icon here if needed */}
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/vendas" className="flex items-center gap-2">
                {/* Add sales icon here if needed */}
                <span>Vendas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/clientes" className="flex items-center gap-2">
                {/* Add clients icon here if needed */}
                <span>Clientes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/produtos" className="flex items-center gap-2">
                {/* Add products icon here if needed */}
                <span>Produtos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/pdv" className="flex items-center gap-2">
                {/* Add POS icon here if needed */}
                <span>PDV</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/devolucoes" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Devoluções</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/orcamentos" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Orçamentos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/fornecedores" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>Fornecedores</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Add other sidebar items here */}
        </DashboardSidebar>
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