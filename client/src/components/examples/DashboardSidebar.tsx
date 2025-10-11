import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from "../DashboardSidebar";

export default function DashboardSidebarExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold">Conteúdo Principal</h2>
          <p className="text-muted-foreground mt-2">Clique nos itens do menu para navegar</p>
        </main>
      </div>
    </SidebarProvider>
  );
}
