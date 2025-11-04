import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Package, ClipboardList, FileText, Settings, CreditCard, Users, DollarSign, TrendingUp, BarChart3, Crown, Lock, LineChart, Scan, Wallet, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import { useUser } from "@/hooks/use-user";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  permission?: "dashboard" | "pdv" | "produtos" | "inventario" | "relatorios" | "clientes" | "fornecedores" | "financeiro" | "config_fiscal" | "configuracoes" | "caixa";
  adminOnly?: boolean;
};

const generalMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, permission: "dashboard" },
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
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, permission: "relatorios" },
];

const configMenuItems: MenuItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, permission: "configuracoes" },
  { title: "Config. Fiscal", url: "/config-fiscal", icon: FileText, permission: "config_fiscal" },
];

export default function DashboardSidebar() {
  const [location] = useLocation();
  const { hasPermission } = usePermissions();
  const { user } = useUser();

  const isAdmin = user?.is_admin === "true";

  const renderMenuItem = (item: MenuItem) => {
    // Se é admin only e não é admin, não mostrar
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    // Se tem permissão requerida, verificar
    const hasAccess = !item.permission || hasPermission(item.permission);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={location === item.url}
          className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-primary/5 data-[active=true]:shadow-sm"
        >
          <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
            <item.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="flex-1 font-medium">{item.title}</span>
            {!hasAccess && (
              <Lock
                className="h-3 w-3 text-muted-foreground/60 animate-pulse"
                data-testid={`lock-${item.title.toLowerCase()}`}
              />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border/50 bg-gradient-to-b from-sidebar to-sidebar/95">
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {generalMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
            Estoque
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {inventoryMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
            Gestão Financeira
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {hasPermission("pdv") && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/pdv"}>
                    <Link href="/pdv">
                      <ShoppingCart className="h-4 w-4" />
                      <span>PDV</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {hasPermission("caixa") && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/caixa"}>
                    <Link href="/caixa">
                      <Wallet className="h-4 w-4" />
                      <span>Caixa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {financeMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold tracking-wider text-muted-foreground/80 uppercase">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {configMenuItems.map(renderMenuItem)}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-primary/5"
                  >
                    <Link href="/admin">
                      <Crown className="h-4 w-4 text-yellow-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <span className="flex-1 font-medium">Painel Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {user?.email === "pavisoft.suporte@gmail.com" && user?.is_admin === "true" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-primary/5"
                  >
                    <Link href="/admin-master">
                      <Crown className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <span className="flex-1 font-medium bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                        Admin Master
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}