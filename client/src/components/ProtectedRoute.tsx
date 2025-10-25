import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: "pdv" | "produtos" | "inventario" | "relatorios" | "clientes" | "fornecedores" | "financeiro" | "config_fiscal";
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="loading-permissions"></div>
      </div>
    );
  }

  if (!hasPermission(requiredPermission)) {
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
                  Você não tem permissão para acessar esta página. Entre em contato com o administrador da sua conta para solicitar acesso.
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
