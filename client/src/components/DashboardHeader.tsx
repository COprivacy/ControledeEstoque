import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export default function DashboardHeader({ userEmail = "usuario@email.com", onLogout }: DashboardHeaderProps) {
  const [config, setConfig] = useState({
    logoUrl: "",
    storeName: "Controle de Estoque Simples"
  });

  useEffect(() => {
    const saved = localStorage.getItem("customization");
    if (saved) {
      const customization = JSON.parse(saved);
      setConfig({
        logoUrl: customization.logoUrl || "",
        storeName: customization.storeName || "Controle de Estoque Simples"
      });
      
      // Aplicar cores salvas
      if (customization.primaryColor) {
        document.documentElement.style.setProperty('--primary', customization.primaryColor);
      }
      if (customization.secondaryColor) {
        document.documentElement.style.setProperty('--secondary', customization.secondaryColor);
      }
      if (customization.accentColor) {
        document.documentElement.style.setProperty('--accent', customization.accentColor);
      }
      if (customization.backgroundColor) {
        document.documentElement.style.setProperty('--background', customization.backgroundColor);
      }
    }
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          )}
          <h1 className="text-xl font-bold text-foreground">{config.storeName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground" data-testid="text-user-email">{userEmail}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
