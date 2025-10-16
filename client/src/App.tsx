import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import AddProduct from "@/pages/AddProduct";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import PDV from "@/pages/PDV";
import Settings from "@/pages/Settings";
import DashboardLayout from "@/layouts/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}