import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";


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
  const [userName, setUserName] = useState("");

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

    // Buscar nome do usuário do localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.nome || "Usuário");
      } catch (e) {
        setUserName("Usuário");
      }
    }
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userName ? getInitials(userName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium" data-testid="text-user-name">
                  {userName || "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default" disabled>
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium" data-testid="text-user-email">{userEmail}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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