
import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ShoppingCart, ChevronDown, ChevronUp, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Cliente } from "@shared/schema";

export default function Clientes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/clientes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      setIsDialogOpen(false);
      toast({ title: "Cliente cadastrado com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/clientes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      setIsDialogOpen(false);
      setEditingCliente(null);
      toast({ title: "Cliente atualizado com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/clientes/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({ title: "Cliente removido com sucesso!" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      cpf_cnpj: formData.get("cpf_cnpj"),
      telefone: formData.get("telefone"),
      email: formData.get("email"),
      endereco: formData.get("endereco"),
      observacoes: formData.get("observacoes"),
      percentual_desconto: formData.get("percentual_desconto") ? parseFloat(formData.get("percentual_desconto") as string) : null,
      data_cadastro: new Date().toISOString(),
    };

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getVendasPorCliente = (clienteId: number) => {
    return vendas.filter((v: any) => v.cliente_id === clienteId);
  };

  const getClienteStats = (clienteId: number) => {
    const vendasCliente = getVendasPorCliente(clienteId);
    const totalCompras = vendasCliente.length;
    const valorTotal = vendasCliente.reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);
    const ultimaCompra = vendasCliente.length > 0 
      ? vendasCliente.sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
      : null;

    return { totalCompras, valorTotal, ultimaCompra };
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e histórico de compras</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCliente(null)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" name="nome" defaultValue={editingCliente?.nome} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input id="cpf_cnpj" name="cpf_cnpj" defaultValue={editingCliente?.cpf_cnpj || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" defaultValue={editingCliente?.telefone || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCliente?.email || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" name="endereco" defaultValue={editingCliente?.endereco || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" defaultValue={editingCliente?.observacoes || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual_desconto">Desconto Padrão (%)</Label>
                <Input 
                  id="percentual_desconto" 
                  name="percentual_desconto" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.01"
                  defaultValue={editingCliente?.percentual_desconto || ""} 
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Desconto aplicado automaticamente nas vendas para este cliente
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Lista de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    Compras
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Valor Total
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum cliente cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => {
                  const { totalCompras, valorTotal, ultimaCompra } = getClienteStats(cliente.id);
                  const vendasCliente = getVendasPorCliente(cliente.id);
                  const isExpanded = expandedRows.has(cliente.id);

                  return (
                    <Fragment key={cliente.id}>
                      <TableRow className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(cliente.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.cpf_cnpj || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{cliente.telefone || "-"}</div>
                            <div className="text-muted-foreground">{cliente.email || "-"}</div>
                            {cliente.percentual_desconto && cliente.percentual_desconto > 0 && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                  {cliente.percentual_desconto}% desconto
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                            {totalCompras}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            R$ {valorTotal.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCliente(cliente);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Deseja realmente excluir este cliente?")) {
                                  deleteMutation.mutate(cliente.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="space-y-4 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-blue-200">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2">
                                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Total de Compras</p>
                                        <p className="text-2xl font-bold text-blue-600">{totalCompras}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="border-green-200">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-5 w-5 text-green-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Valor Total Gasto</p>
                                        <p className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card className="border-purple-200">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-5 w-5 text-purple-600" />
                                      <div>
                                        <p className="text-sm text-muted-foreground">Última Compra</p>
                                        <p className="text-lg font-bold text-purple-600">
                                          {ultimaCompra 
                                            ? format(new Date(ultimaCompra.data), "dd/MM/yyyy", { locale: ptBR })
                                            : "Nenhuma"}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                  <ShoppingCart className="h-4 w-4" />
                                  Histórico de Compras ({vendasCliente.length})
                                </h4>
                                {vendasCliente.length > 0 ? (
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Data</TableHead>
                                          <TableHead>Produtos</TableHead>
                                          <TableHead className="text-center">Quantidade</TableHead>
                                          <TableHead className="text-right">Valor Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {vendasCliente
                                          .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                          .map((venda: any) => (
                                          <TableRow key={venda.id}>
                                            <TableCell>
                                              {venda.data ? format(new Date(venda.data), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                                            </TableCell>
                                            <TableCell>
                                              <div className="max-w-md">
                                                {venda.produto || "-"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {venda.quantidade_vendida || 0}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                              R$ {(venda.valor_total || 0).toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Nenhuma compra registrada ainda</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
