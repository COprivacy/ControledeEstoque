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
import { Plus, Pencil, Trash2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function ContasReceber() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  const { data: contas = [], isLoading } = useQuery({
    queryKey: ["/api/contas-receber"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contas-receber");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/contas-receber", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-receber"] });
      setIsAddOpen(false);
      toast({ title: "Conta criada com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/contas-receber/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-receber"] });
      setEditingConta(null);
      toast({ title: "Conta atualizada com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/contas-receber/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-receber"] });
      toast({ title: "Conta excluída com sucesso!" });
    },
  });

  const receberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/contas-receber/${id}/receber`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contas-receber"] });
      toast({ title: "Conta marcada como recebida!" });
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

  // Categorias únicas
  const categorias = Array.from(new Set(contas.map((c: any) => c.categoria).filter(Boolean)));

  // Filtrar contas
  const filteredContas = contas.filter((conta: any) => {
    const matchesSearch = !searchTerm || 
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || conta.status === filterStatus;
    const matchesCategoria = filterCategoria === "all" || conta.categoria === filterCategoria;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const totalPendente = filteredContas
    .filter((c: any) => c.status === "pendente")
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const totalRecebido = filteredContas
    .filter((c: any) => c.status === "recebido")
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Contas a Receber</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas contas a receber</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-conta-receber">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Receber</DialogTitle>
              <DialogDescription>Adicione uma nova conta a receber</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" name="descricao" required disabled={createMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input id="valor" name="valor" type="number" step="0.01" required disabled={createMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="data_vencimento">Data de Recebimento</Label>
                <Input id="data_vencimento" name="data_vencimento" type="date" required disabled={createMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" name="categoria" placeholder="Ex: Cliente, Serviço, etc" disabled={createMutation.isPending} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {totalPendente.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalRecebido.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Já recebidos</p>
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Contas a Receber</CardTitle>
              <CardDescription>Visualize e gerencie todas as suas contas a receber</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Buscar contas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categorias.map((cat: any) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma conta a receber cadastrada</p>
              <p className="text-sm mt-2">Clique em "Nova Conta" para adicionar uma conta a receber</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContas.map((conta: any) => (
                  <TableRow key={conta.id}>
                    <TableCell>{conta.descricao}</TableCell>
                    <TableCell>{conta.categoria || "-"}</TableCell>
                    <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                    <TableCell>{new Date(conta.data_vencimento).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={conta.status === "recebido" ? "default" : "secondary"}>
                        {conta.status === "recebido" ? "Recebido" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {conta.status === "pendente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => receberMutation.mutate(conta.id)}
                            disabled={receberMutation.isPending}
                          >
                            {receberMutation.isPending ? "..." : "Receber"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingConta(conta)}
                          disabled={deleteMutation.isPending || receberMutation.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(conta.id)}
                          disabled={deleteMutation.isPending}
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
                <Input id="edit-descricao" name="descricao" defaultValue={editingConta.descricao} required disabled={updateMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="edit-valor">Valor</Label>
                <Input id="edit-valor" name="valor" type="number" step="0.01" defaultValue={editingConta.valor} required disabled={updateMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="edit-data_vencimento">Data de Recebimento</Label>
                <Input id="edit-data_vencimento" name="data_vencimento" type="date" defaultValue={editingConta.data_vencimento} required disabled={updateMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Input id="edit-categoria" name="categoria" defaultValue={editingConta.categoria} disabled={updateMutation.isPending} />
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}