import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Package, ClipboardList, BarChart3, Scan, Settings, Users, FileText, DollarSign, CreditCard, TrendingUp, LineChart, Shield, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { useUser } from "@/hooks/use-user";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  permission?: "pdv" | "produtos" | "inventario" | "relatorios" | "clientes" | "fornecedores" | "financeiro" | "config_fiscal";
  adminOnly?: boolean;
};

const generalMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "PDV", url: "/pdv", icon: Scan, permission: "pdv" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, permission: "relatorios" },
];

const inventoryMenuItems: MenuItem[] = [
  { title: "Produtos", url: "/produtos", icon: Package, permission: "produtos" },
  { title: "Inventário", url: "/inventario", icon: ClipboardList, permission: "inventario" },
  { title: "Fornecedores", url: "/fornecedores", icon: Package, permission: "fornecedores" },
  { title: "Clientes", url: "/clientes", icon: Users, permission: "clientes" },
];

const financeMenuItems: MenuItem[] = [
  { title: "Contas a Pagar", url: "/financeiro/contas-pagar", icon: CreditCard, permission: "financeiro" },
  { title: "Contas a Receber", url: "/financeiro/contas-receber", icon: DollarSign, permission: "financeiro" },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo-pdv", icon: TrendingUp, permission: "financeiro" },
  { title: "DRE Simplificado", url: "/financeiro/dre", icon: LineChart, permission: "financeiro" },
];

const configMenuItems: MenuItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Config. Fiscal", url: "/config-fiscal", icon: FileText, permission: "config_fiscal" },
  { title: "Painel Admin", url: "/admin", icon: Shield, adminOnly: true },
];

export default function DashboardSidebar() {
  const [location] = useLocation();
  const { hasPermission } = usePermissions();
  const { user } = useUser();

  const isAdmin = user?.is_admin === "true" || user?.tipo === "usuario";

  const renderMenuItem = (item: MenuItem) => {
    // Se é admin only e não é admin, não mostrar
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    // Se tem permissão requerida, verificar
    const hasAccess = !item.permission || hasPermission(item.permission);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={location === item.url}>
          <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {!hasAccess && <Lock className="h-3 w-3 text-muted-foreground" data-testid={`lock-${item.title.toLowerCase()}`} />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Estoque</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão Financeira</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}