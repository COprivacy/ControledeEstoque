import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";

interface Permissions {
  dashboard: string;
  pdv: string;
  produtos: string;
  inventario: string;
  relatorios: string;
  clientes: string;
  fornecedores: string;
  financeiro: string;
  config_fiscal: string;
  configuracoes: string;
}

const defaultPermissions: Permissions = {
  dashboard: "false",
  pdv: "false",
  produtos: "false",
  inventario: "false",
  relatorios: "false",
  clientes: "false",
  fornecedores: "false",
  financeiro: "false",
  config_fiscal: "false",
  configuracoes: "false",
};

export function usePermissions() {
  const { user } = useUser();

  const isPremium = (): boolean => {
    if (!user) return false;
    
    // Admin sempre tem acesso
    if (user.is_admin === "true") return true;
    
    // Verifica se tem plano ativo (trial, mensal ou anual)
    if (user.plano === 'trial' || user.plano === 'mensal' || user.plano === 'anual') {
      // Verifica se a data de expiração ainda é válida
      if (user.data_expiracao_plano) {
        const now = new Date();
        const expirationDate = new Date(user.data_expiracao_plano);
        return now < expirationDate;
      }
    }

    // Mantém compatibilidade com planos antigos
    if (user.plano === 'premium') return true;
    
    // Trial antigo (por compatibilidade)
    if (user.data_expiracao_trial) {
      const now = new Date();
      const expirationDate = new Date(user.data_expiracao_trial);
      return now < expirationDate;
    }

    return false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin sempre tem permissão total
    if (user.is_admin === "true") return true;

    // Usuários em trial ou premium têm acesso completo
    if (isPremium()) return true;

    // Funcionários verificam permissões específicas
    const userPermissions = user.permissoes || [];
    return userPermissions.includes(permission);
  };

  const isLoading = !user;

  return { hasPermission, isPremium, isLoading };
}