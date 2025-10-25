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
    if (user.plano === 'premium') return true;

    // Trial de 7 dias tem acesso completo
    if (user.data_expiracao_trial) {
      const now = new Date();
      const expirationDate = new Date(user.data_expiracao_trial);
      return now < expirationDate;
    }

    return false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.tipo_usuario === 'admin') return true;

    // Usuários em trial ou premium têm acesso completo
    if (isPremium()) return true;

    const userPermissions = user.permissoes || [];
    return userPermissions.includes(permission);
  };

  return { hasPermission, isPremium };
}