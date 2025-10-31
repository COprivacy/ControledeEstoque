import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminMasterRouteProps {
  children: ReactNode;
}

const ADMIN_MASTER_PASSWORD = "PAVISOFT.SISTEMASLTDA";
const AUTHORIZED_EMAIL = "pavisoft.suporte@gmail.com";

export function AdminMasterRoute({ children }: AdminMasterRouteProps) {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    // Apenas o usuário específico pode acessar
    if (user.email !== AUTHORIZED_EMAIL || user.is_admin !== "true") {
      setLocation("/dashboard");
      return;
    }

    // Verificar se já está autenticado na sessão
    const sessionAuth = sessionStorage.getItem("admin_master_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, [user, setLocation]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (password === ADMIN_MASTER_PASSWORD) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_master_auth", "true");
        toast({
          title: "Acesso autorizado",
          description: "Bem-vindo ao Admin Master",
        });
      } else {
        toast({
          title: "Senha incorreta",
          description: "A senha de acesso está incorreta",
          variant: "destructive",
        });
      }
      setIsLoading(false);
      setPassword("");
    }, 500);
  };

  if (!user || user.email !== AUTHORIZED_EMAIL || user.is_admin !== "true") {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Admin Master</CardTitle>
            <CardDescription className="text-center">
              Digite a senha de acesso para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-password">Senha de Acesso</Label>
                <Input
                  id="master-password"
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Acessar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}