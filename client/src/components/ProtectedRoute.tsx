import { ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/usePermissions";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: "dashboard" | "pdv" | "caixa" | "historico_caixas" | "produtos" | "inventario" | "relatorios" | "clientes" | "fornecedores" | "financeiro" | "config_fiscal" | "configuracoes" | "devolucoes" | "contas_pagar" | "contas_receber";
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { hasPermission, isLoading } = usePermissions();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  // Adicionado estado para controlar autenticação, pois a lógica de verificação de permissão é separada
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      console.warn("⚠️ ProtectedRoute: Nenhum usuário encontrado, redirecionando para login");
      setLocation("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);

      // Verificar se a conta está bloqueada
      if (parsedUser.status === "bloqueado" && parsedUser.is_admin !== "true") {
        console.warn("⚠️ ProtectedRoute: Conta bloqueada");
        // Manter autenticado mas será mostrado o modal de expiração
        setIsAuthenticated(true);
        return;
      }

      console.log("✅ ProtectedRoute: Usuário autenticado encontrado");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("❌ ProtectedRoute: Erro ao parsear usuário", error);
      localStorage.removeItem("user");
      setLocation("/login");
    }
  }, [setLocation]);

  // Atualiza o estado hasUser com base no localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setHasUser(true);
    } else {
      setHasUser(false);
      // Se não houver usuário e não estivermos mais verificando, redireciona para login
      if (!isChecking && !isAuthenticated) {
        setLocation("/login");
      }
    }
    setIsChecking(false); // Marca a verificação inicial como concluída
  }, [setLocation, isChecking, isAuthenticated]);


  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="loading-permissions"></div>
      </div>
    );
  }

  // Se o usuário não estiver autenticado ou a conta estiver bloqueada (e não for admin)
  if (!isAuthenticated || (!hasPermission(requiredPermission) && !isLoading)) {
    return (
      <div className="flex items-center justify-center h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full" data-testid="blocked-page">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                <Lock className="h-12 w-12 text-red-600 dark:text-red-400" data-testid="icon-lock" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-blocked-title">
                  Acesso Negado
                </h2>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-blocked-description">
                  {/* Mensagem mais genérica caso a conta esteja bloqueada ou não tenha permissão */}
                  {localStorage.getItem("user") && JSON.parse(localStorage.getItem("user")!).status === "bloqueado" && JSON.parse(localStorage.getItem("user")!).is_admin !== "true"
                    ? "Sua conta está bloqueada. Entre em contato com o administrador para reativá-la."
                    : "Você não tem permissão para acessar esta página. Entre em contato com o administrador da sua conta para solicitar acesso."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o usuário não tiver sido carregado ainda e a verificação estiver completa, mas não houver usuário, retorna null (ou redireciona para login, já tratado acima)
  if (!hasUser && !isChecking) {
    return null;
  }

  return <>{children}</>;
}