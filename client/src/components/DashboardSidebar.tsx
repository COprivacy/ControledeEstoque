import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Home, Package, ClipboardList, BarChart3, Scan, Settings, Users, FileText, DollarSign, CreditCard, TrendingUp, LineChart, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

const generalMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "PDV", url: "/pdv", icon: Scan },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const inventoryMenuItems = [
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Inventário", url: "/inventario", icon: ClipboardList },
  { title: "Fornecedores", url: "/fornecedores", icon: Package },
  { title: "Clientes", url: "/clientes", icon: Users },
];

const financeMenuItems = [
  { title: "Contas a Pagar", url: "/financeiro/contas-pagar", icon: CreditCard },
  { title: "Contas a Receber", url: "/financeiro/contas-receber", icon: DollarSign },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo-pdv", icon: TrendingUp },
  { title: "DRE Simplificado", url: "/financeiro/dre", icon: LineChart },
];

const configMenuItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Config. Fiscal", url: "/config-fiscal", icon: FileText },
];

export default function DashboardSidebar() {
  const [location] = useLocation();
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.is_admin === "true";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Estoque</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão Financeira</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"}>
                    <Link href="/admin" data-testid="link-painel-admin">
                      <Shield className="h-4 w-4" />
                      <span>Painel Admin</span>
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