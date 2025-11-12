import { ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Lock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const isAdmin = user?.is_admin === "true";

  // MASTER_USER_EMAIL é o único usuário imune ao bloqueio
  const MASTER_USER_EMAIL = "pavisoft.suporte@gmail.com";
  const isMasterUser = user?.email === MASTER_USER_EMAIL;

  // Verificar se o usuário está bloqueado (para admins comuns)
  const { data: userStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ["/api/user/check-blocked"],
    enabled: isAdmin && !isMasterUser, // Apenas admins comuns precisam ser verificados
    refetchInterval: 5000,
  });

  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Se o admin comum está bloqueado, mostrar tela de bloqueio
  if (isAdmin && !isMasterUser && userStatus?.isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-950 via-red-900 to-gray-900">
        <Card className="max-w-2xl w-full border-2 border-red-800 shadow-2xl" data-testid="blocked-page">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Ícone de Alerta */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-950/50 p-8 border-4 border-red-600">
                  <Lock className="h-16 w-16 text-red-600 dark:text-red-400" data-testid="icon-lock" />
                </div>
              </div>

              {/* Título e Descrição */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-blocked-title">
                  🔒 Acesso Suspenso
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md" data-testid="text-blocked-description">
                  {user?.plano === "trial" 
                    ? "Seu período de teste gratuito expirou. Faça upgrade para continuar usando o sistema."
                    : "Identificamos uma pendência no pagamento da sua assinatura. Regularize para reativar o acesso."}
                </p>
              </div>

              {/* Informações do Plano */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status Atual:</span>
                  <Badge variant="destructive" className="bg-red-600">Bloqueado</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Plano Anterior:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user?.plano === "trial" ? "Trial Gratuito" : 
                     user?.plano === "premium_mensal" ? "Premium Mensal" :
                     user?.plano === "premium_anual" ? "Premium Anual" : "Free"}
                  </span>
                </div>
                {user?.data_expiracao_plano && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Data de Vencimento:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(user.data_expiracao_plano).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                <Button
                  onClick={() => {
                    window.location.href = "/planos";
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  size="lg"
                >
                  💳 Ver Planos e Renovar
                </Button>
                <Button
                  onClick={() => {
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                  }}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600"
                  size="lg"
                >
                  Fazer Logout
                </Button>
              </div>

              {/* Link de Ajuda */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Precisa de ajuda? Entre em contato:{" "}
                <a 
                  href="https://wa.me/5581989842677" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  WhatsApp Suporte
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full" data-testid="admin-blocked-page">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" data-testid="icon-shield-alert" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-admin-blocked-title">
                  Acesso Restrito
                </h2>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-admin-blocked-description">
                  Esta área é restrita a administradores do sistema. Somente usuários com privilégios de administrador podem acessar este painel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
