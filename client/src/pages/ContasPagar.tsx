import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContasPagar() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Contas a Pagar</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas a pagar</p>
        </div>
        <Button data-testid="button-add-conta-pagar">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
          <CardDescription>Visualize e gerencie todas as suas contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma conta a pagar cadastrada</p>
            <p className="text-sm mt-2">Clique em "Nova Conta" para adicionar uma conta a pagar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
