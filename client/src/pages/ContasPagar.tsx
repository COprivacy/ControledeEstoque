
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, DollarSign, Calendar, TrendingDown } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";
import { apiRequest } from "@/lib/queryClient";

export default function ContasPagar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);

  const { data: contas = [] } = useQuery({
    queryKey: ["/api/contas-pagar"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/contas-pagar", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-pagar"] });
      setIsAddOpen(false);
      toast({ title: "Conta criada com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/contas-pagar/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-pagar"] });
      setEditingConta(null);
      toast({ title: "Conta atualizada com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/contas-pagar/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-pagar"] });
      toast({ title: "Conta excluída com sucesso!" });
    },
  });

  const pagarMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/contas-pagar/${id}/pagar`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-pagar"] });
      toast({ title: "Conta marcada como paga!" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      descricao: formData.get("descricao"),
      valor: parseFloat(formData.get("valor") as string),
      data_vencimento: formData.get("data_vencimento"),
      categoria: formData.get("categoria"),
      data_cadastro: new Date().toISOString(),
    };
    createMutation.mutate(data);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingConta) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      descricao: formData.get("descricao"),
      valor: parseFloat(formData.get("valor") as string),
      data_vencimento: formData.get("data_vencimento"),
      categoria: formData.get("categoria"),
    };
    updateMutation.mutate({ id: editingConta.id, data });
  };

  const totalPendente = contas
    .filter((c: any) => c.status === "pendente")
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const totalPago = contas
    .filter((c: any) => c.status === "pago")
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Contas a Pagar</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas a pagar</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-conta-pagar">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
              <DialogDescription>Adicione uma nova conta a pagar</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" name="descricao" required />
              </div>
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input id="valor" name="valor" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input id="data_vencimento" name="data_vencimento" type="date" required />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" name="categoria" placeholder="Ex: Fornecedor, Aluguel, etc" />
              </div>
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalPendente.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">A pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Já pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{contas.length}</div>
            <p className="text-xs text-muted-foreground">Cadastradas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
          <CardDescription>Visualize e gerencie todas as suas contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma conta a pagar cadastrada</p>
              <p className="text-sm mt-2">Clique em "Nova Conta" para adicionar uma conta a pagar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta: any) => (
                  <TableRow key={conta.id}>
                    <TableCell>{conta.descricao}</TableCell>
                    <TableCell>{conta.categoria || "-"}</TableCell>
                    <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                    <TableCell>{new Date(conta.data_vencimento).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={conta.status === "pago" ? "default" : "destructive"}>
                        {conta.status === "pago" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {conta.status === "pendente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pagarMutation.mutate(conta.id)}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingConta(conta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(conta.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingConta && (
        <Dialog open={!!editingConta} onOpenChange={() => setEditingConta(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Conta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Input id="edit-descricao" name="descricao" defaultValue={editingConta.descricao} required />
              </div>
              <div>
                <Label htmlFor="edit-valor">Valor</Label>
                <Input id="edit-valor" name="valor" type="number" step="0.01" defaultValue={editingConta.valor} required />
              </div>
              <div>
                <Label htmlFor="edit-data_vencimento">Data de Vencimento</Label>
                <Input id="edit-data_vencimento" name="data_vencimento" type="date" defaultValue={editingConta.data_vencimento} required />
              </div>
              <div>
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Input id="edit-categoria" name="categoria" defaultValue={editingConta.categoria} />
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
