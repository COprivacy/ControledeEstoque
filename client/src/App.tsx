import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProvider } from "@/hooks/use-user";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminMasterRoute } from "@/components/AdminMasterRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Admin from "@/pages/Admin";
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
import Caixa from "@/pages/Caixa";
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminPublico from "@/pages/AdminPublico";
import Planos from "@/pages/Planos";
import Devolucoes from "@/pages/Devolucoes";
import Orcamentos from "@/pages/Orcamentos";
import TestSuite from "./pages/TestSuite";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/planos" component={Planos} />
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="dashboard">
              <Dashboard />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="produtos">
              <Products />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos/adicionar">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="produtos">
              <AddProduct />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/produtos/editar/:id">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="produtos">
              <AddProduct />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inventario">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="inventario">
              <Inventory />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/devolucoes">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="devolucoes">
              <Devolucoes />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/orcamentos">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="orcamentos">
              <Orcamentos />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/fornecedores">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="fornecedores">
              <Fornecedores />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/clientes">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="clientes">
              <Clientes />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/pdv">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="pdv">
              <PDV />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/relatorios">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="relatorios">
              <Reports />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/configuracoes">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="configuracoes">
              <Settings />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/config-fiscal">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="config_fiscal">
              <ConfigFiscal />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/contas-pagar">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="contas_pagar">
              <ContasPagar />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/contas-receber">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="contas_receber">
              <ContasReceber />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/fluxo-pdv">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="financeiro">
              <FluxoPDV />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financeiro/dre">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="financeiro">
              <DRE />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/caixa">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="caixa">
              <Caixa />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <DashboardLayout>
            <AdminRoute>
              <Admin />
            </AdminRoute>
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin-publico" element={<AdminMasterRoute><AdminPublico /></AdminMasterRoute>} />
      <Route path="/test-suite" element={<AdminMasterRoute><TestSuite /></AdminMasterRoute>} />
      <Route path="/ajuda" element={<Ajuda />} />
      <Route path="/contato" element={<Contato />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}