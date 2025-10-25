import { ReactNode } from "react";
import { useUser } from "@/hooks/use-user";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useUser();

  const isAdmin = user?.is_admin === "true" || user?.tipo === "usuario";

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
