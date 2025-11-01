import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/usePermissions";

export function TrialExpiredModal() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { isPremium } = usePermissions();

  const isTrialExpired = (): boolean => {
    if (!user) return false;
    
    if (user.is_admin === "true") return false;
    
    if (user.tipo === "funcionario") return false;
    
    if (isPremium()) return false;

    if (user.plano === 'trial' || user.plano === 'free') {
      if (user.data_expiracao_plano) {
        const now = new Date();
        const expirationDate = new Date(user.data_expiracao_plano);
        return now >= expirationDate;
      }
      
      if (user.data_expiracao_trial) {
        const now = new Date();
        const expirationDate = new Date(user.data_expiracao_trial);
        return now >= expirationDate;
      }
    }

    return false;
  };

  if (!isTrialExpired()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="modal-trial-expired">
      <Card className="max-w-2xl w-full" data-testid="card-trial-expired">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-8">
              <AlertCircle className="h-20 w-20 text-yellow-600 dark:text-yellow-400" data-testid="icon-alert" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-expired-title">
                Período de Teste Expirado
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300" data-testid="text-expired-description">
                Para continuar utilizando nossos serviços, contrate um plano
              </p>
            </div>

            <div className="w-full space-y-4 pt-4">
              <button
                onClick={() => setLocation("/planos")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
                data-testid="button-ver-planos"
              >
                Ver Planos Disponíveis
              </button>
              
              <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-contato-info">
                Dúvidas? Entre em contato: pavisoft.suporte@gmail.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
