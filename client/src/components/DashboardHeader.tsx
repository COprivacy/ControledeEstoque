import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface DashboardHeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export default function DashboardHeader({ userEmail = "usuario@email.com", onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Controle de Estoque Simples</h1>
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
