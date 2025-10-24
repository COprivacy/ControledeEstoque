import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Privacy from "@/pages/Privacy";
import Admin from "@/pages/Admin";
import PublicAdmin from "@/pages/PublicAdmin";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import AddProduct from "@/pages/AddProduct";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import PDV from "@/pages/PDV";
import Settings from "@/pages/Settings";
import ConfigFiscal from "@/pages/ConfigFiscal";
import Fornecedores from "@/pages/Fornecedores";
import Clientes from "@/pages/Clientes";
import ContasPagar from "@/pages/ContasPagar";
import ContasReceber from "@/pages/ContasReceber";
import FluxoPDV from "@/pages/FluxoPDV";
import DRE from "@/pages/DRE";
import DashboardLayout from "@/layouts/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos">
        {() => (
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos/adicionar">
        {() => (
          <DashboardLayout>
            <AddProduct />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos/editar/:id">
        {() => (
          <DashboardLayout>
            <AddProduct />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inventario">
        {() => (
          <DashboardLayout>
            <Inventory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/fornecedores">
        {() => (
          <DashboardLayout>
            <Fornecedores />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/clientes">
        {() => (
          <DashboardLayout>
            <Clientes />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/pdv">
        {() => (
          <DashboardLayout>
            <PDV />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/relatorios">
        {() => (
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/configuracoes">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/config-fiscal">
        {() => (
          <DashboardLayout>
            <ConfigFiscal />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/contas-pagar">
        {() => (
          <DashboardLayout>
            <ContasPagar />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/contas-receber">
        {() => (
          <DashboardLayout>
            <ContasReceber />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/fluxo-pdv">
        {() => (
          <DashboardLayout>
            <FluxoPDV />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/dre">
        {() => (
          <DashboardLayout>
            <DRE />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin-publico">
        {() => (
          <PublicAdmin />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}