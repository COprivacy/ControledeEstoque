import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

// Função para converter HEX para HSL
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
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
      
      // Aplicar cores salvas convertidas para HSL
      if (customization.primaryColor) {
        document.documentElement.style.setProperty('--primary', hexToHSL(customization.primaryColor));
      }
      if (customization.secondaryColor) {
        document.documentElement.style.setProperty('--secondary', hexToHSL(customization.secondaryColor));
      }
      if (customization.accentColor) {
        document.documentElement.style.setProperty('--accent', hexToHSL(customization.accentColor));
      }
      if (customization.backgroundColor) {
        document.documentElement.style.setProperty('--background', hexToHSL(customization.backgroundColor));
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
