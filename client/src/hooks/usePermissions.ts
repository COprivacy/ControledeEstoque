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

  const { data: permissions, isLoading } = useQuery<Permissions>({
    queryKey: ["/api/funcionarios", user?.id, "permissoes"],
    enabled: !!user && user.tipo === "funcionario",
  });

  // Se for usuário principal ou admin, tem todas as permissões
  if (user && user.tipo === "usuario") {
    return {
      permissions: {
        dashboard: "true",
        pdv: "true",
        produtos: "true",
        inventario: "true",
        relatorios: "true",
        clientes: "true",
        fornecedores: "true",
        financeiro: "true",
        config_fiscal: "true",
        configuracoes: "true",
      } as Permissions,
      isLoading: false,
      hasPermission: () => true,
    };
  }

  // Se for funcionário, usa as permissões da API
  const userPermissions = permissions || defaultPermissions;

  const hasPermission = (permission: keyof Permissions): boolean => {
    return userPermissions[permission] === "true";
  };

  return {
    permissions: userPermissions,
    isLoading,
    hasPermission,
  };
}
