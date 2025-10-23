import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContasReceber() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Contas a Receber</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas a receber</p>
        </div>
        <Button data-testid="button-add-conta-receber">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Receber</CardTitle>
          <CardDescription>Visualize e gerencie todas as suas contas a receber</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma conta a receber cadastrada</p>
            <p className="text-sm mt-2">Clique em "Nova Conta" para adicionar uma conta a receber</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
