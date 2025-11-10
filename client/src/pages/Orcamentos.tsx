import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, FileText, CheckCircle, XCircle, ShoppingCart, Printer, Eye, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Orcamento, Produto, Cliente } from "@shared/schema";

interface ItemCarrinho {
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function Orcamentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [formData, setFormData] = useState({
    cliente_nome: "",
    cliente_email: "",
    cliente_telefone: "",
    validade: "",
    observacoes: "",
  });
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);

  const { data: orcamentos = [], isLoading } = useQuery<Orcamento[]>({
    queryKey: ["/api/orcamentos"],
  });

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orcamentos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      toast({ title: "Orçamento criado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar orçamento", 
        description: error.message || "Tente novamente",
        variant: "destructive" 
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orcamentos/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      toast({ title: "Status atualizado com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao atualizar status", 
        variant: "destructive" 
      });
    },
  });

  const converterMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/orcamentos/${id}/converter-venda`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendas"] });
      toast({ title: "Orçamento convertido em venda com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao converter orçamento", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/orcamentos/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      toast({ title: "Orçamento excluído com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "Erro ao excluir orçamento", 
        variant: "destructive" 
      });
    },
  });

  const adicionarItem = (produtoId: number) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;

    const itemExistente = itensCarrinho.find((item) => item.produto_id === produtoId);
    
    if (itemExistente) {
      setItensCarrinho(
        itensCarrinho.map((item) =>
          item.produto_id === produtoId
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setItensCarrinho([
        ...itensCarrinho,
        {
          produto_id: produtoId,
          nome: produto.nome,
          preco: produto.preco,
          quantidade: 1,
        },
      ]);
    }
  };

  const removerItem = (produtoId: number) => {
    setItensCarrinho(itensCarrinho.filter((item) => item.produto_id !== produtoId));
  };

  const calcularSubtotal = () => {
    return itensCarrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  };

  const resetForm = () => {
    setFormData({
      cliente_nome: "",
      cliente_email: "",
      cliente_telefone: "",
      validade: "",
      observacoes: "",
    });
    setItensCarrinho([]);
  };

  const handleSubmit = () => {
    if (!formData.cliente_nome.trim()) {
      toast({ title: "Nome do cliente é obrigatório", variant: "destructive" });
      return;
    }

    if (itensCarrinho.length === 0) {
      toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
      return;
    }

    const subtotal = calcularSubtotal();
    
    createMutation.mutate({
      cliente_nome: formData.cliente_nome,
      cliente_email: formData.cliente_email || "",
      cliente_telefone: formData.cliente_telefone || "",
      validade: formData.validade || null,
      observacoes: formData.observacoes || null,
      itens: itensCarrinho,
      subtotal,
      desconto: 0,
      valor_total: subtotal,
    });
  };

  const handleSelecionarCliente = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === parseInt(clienteId));
    if (cliente) {
      setFormData({
        ...formData,
        cliente_nome: cliente.nome,
        cliente_email: cliente.email || "",
        cliente_telefone: cliente.telefone || "",
      });
    }
  };

  const visualizarOrcamento = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsViewDialogOpen(true);
  };

  const imprimirOrcamento = (orcamento: Orcamento) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itens = Array.isArray(orcamento.itens) ? orcamento.itens : [];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento ${orcamento.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Orçamento ${orcamento.numero}</h1>
          <p><strong>Data:</strong> ${orcamento.data_criacao ? format(new Date(orcamento.data_criacao), "dd/MM/yyyy", { locale: ptBR }) : ''}</p>
          <p><strong>Cliente:</strong> ${orcamento.cliente_nome || 'Não informado'}</p>
          ${orcamento.cliente_email ? `<p><strong>Email:</strong> ${orcamento.cliente_email}</p>` : ''}
          ${orcamento.cliente_telefone ? `<p><strong>Telefone:</strong> ${orcamento.cliente_telefone}</p>` : ''}
          ${orcamento.validade ? `<p><strong>Validade:</strong> ${format(new Date(orcamento.validade), "dd/MM/yyyy", { locale: ptBR })}</p>` : ''}
          
          <h2>Itens</h2>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itens.map((item: any) => `
                <tr>
                  <td>${item.nome}</td>
                  <td>${item.quantidade}</td>
                  <td>R$ ${item.preco.toFixed(2)}</td>
                  <td>R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: R$ ${orcamento.subtotal.toFixed(2)}</p>
            ${(orcamento.desconto && orcamento.desconto > 0) ? `<p>Desconto: R$ ${orcamento.desconto.toFixed(2)}</p>` : ''}
            <p>Total: R$ ${orcamento.valor_total.toFixed(2)}</p>
          </div>
          
          ${orcamento.observacoes ? `<p><strong>Observações:</strong> ${orcamento.observacoes}</p>` : ''}
          
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: <Badge variant="outline" data-testid={`badge-status-pendente`}>Pendente</Badge>,
      aprovado: <Badge className="bg-green-600 dark:bg-green-700 text-white" data-testid={`badge-status-aprovado`}>Aprovado</Badge>,
      rejeitado: <Badge variant="destructive" data-testid={`badge-status-rejeitado`}>Rejeitado</Badge>,
      convertido: <Badge className="bg-blue-600 dark:bg-blue-700 text-white" data-testid={`badge-status-convertido`}>Convertido</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pendente;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-muted-foreground">Carregando orçamentos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus orçamentos e propostas comerciais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="default" data-testid="button-novo-orcamento">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
              <DialogDescription>Preencha as informações do orçamento e adicione os produtos</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                  <CardDescription>Dados do cliente para o orçamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="select-cliente">Selecionar Cliente Cadastrado</Label>
                    <Select onValueChange={handleSelecionarCliente}>
                      <SelectTrigger id="select-cliente" data-testid="select-cliente">
                        <SelectValue placeholder="Selecione um cliente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome} {cliente.email ? `- ${cliente.email}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="input-nome">Nome do Cliente *</Label>
                      <Input
                        id="input-nome"
                        data-testid="input-cliente-nome"
                        value={formData.cliente_nome}
                        onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="input-email">Email</Label>
                      <Input
                        id="input-email"
                        data-testid="input-cliente-email"
                        type="email"
                        value={formData.cliente_email}
                        onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="input-telefone">Telefone</Label>
                      <Input
                        id="input-telefone"
                        data-testid="input-cliente-telefone"
                        value={formData.cliente_telefone}
                        onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="input-validade">Validade do Orçamento</Label>
                      <Input
                        id="input-validade"
                        data-testid="input-data-validade"
                        type="date"
                        value={formData.validade}
                        onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-lg">Produtos</CardTitle>
                  <CardDescription>Adicione produtos ao orçamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="select-produto">Adicionar Produto</Label>
                    <Select onValueChange={(value) => adicionarItem(parseInt(value))}>
                      <SelectTrigger id="select-produto" data-testid="select-produto">
                        <SelectValue placeholder="Selecione um produto para adicionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id.toString()}>
                            {produto.nome} - R$ {produto.preco.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {itensCarrinho.length > 0 && (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="w-32">Quantidade</TableHead>
                            <TableHead className="w-32">Preço Unit.</TableHead>
                            <TableHead className="w-32">Subtotal</TableHead>
                            <TableHead className="w-20"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itensCarrinho.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.nome}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) => {
                                    const newQtd = Math.max(1, parseInt(e.target.value) || 1);
                                    setItensCarrinho(
                                      itensCarrinho.map((i, index) =>
                                        index === idx ? { ...i, quantidade: newQtd } : i
                                      )
                                    );
                                  }}
                                  className="w-20"
                                  data-testid={`input-quantidade-${idx}`}
                                />
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                R$ {item.preco.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium">
                                R$ {(item.preco * item.quantidade).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerItem(item.produto_id)}
                                  data-testid={`button-remover-item-${idx}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-4 bg-muted/50 border-t">
                        <div className="flex justify-end">
                          <div className="text-right space-y-1">
                            <div className="text-sm text-muted-foreground">Total do Orçamento</div>
                            <div className="text-2xl font-bold" data-testid="text-total">
                              R$ {calcularSubtotal().toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {itensCarrinho.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto adicionado. Selecione produtos acima.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-lg">Observações</CardTitle>
                  <CardDescription>Informações adicionais sobre o orçamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Condições de pagamento, prazos, garantias, etc..."
                    rows={4}
                    data-testid="textarea-observacoes"
                  />
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancelar"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                data-testid="button-criar-orcamento"
              >
                {createMutation.isPending ? "Criando..." : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle>Lista de Orçamentos</CardTitle>
          <CardDescription>
            {orcamentos.length === 0 
              ? "Nenhum orçamento cadastrado" 
              : `${orcamentos.length} orçamento(s) cadastrado(s)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orcamentos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum orçamento criado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro orçamento
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamentos.map((orcamento) => (
                    <TableRow key={orcamento.id} data-testid={`row-orcamento-${orcamento.id}`}>
                      <TableCell className="font-mono font-medium" data-testid={`text-numero-${orcamento.id}`}>
                        {orcamento.numero}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{orcamento.cliente_nome || "Cliente não informado"}</div>
                          {orcamento.cliente_email && (
                            <div className="text-sm text-muted-foreground">{orcamento.cliente_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {orcamento.data_criacao && format(new Date(orcamento.data_criacao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {orcamento.validade
                          ? format(new Date(orcamento.validade), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium" data-testid={`text-total-${orcamento.id}`}>
                        R$ {orcamento.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(orcamento.status || "pendente")}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => visualizarOrcamento(orcamento)}
                            data-testid={`button-visualizar-${orcamento.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => imprimirOrcamento(orcamento)}
                            data-testid={`button-imprimir-${orcamento.id}`}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {orcamento.status === "pendente" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "aprovado" })}
                                data-testid={`button-aprovar-${orcamento.id}`}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "rejeitado" })}
                                data-testid={`button-rejeitar-${orcamento.id}`}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {orcamento.status === "aprovado" && (
                            <Button
                              size="sm"
                              onClick={() => converterMutation.mutate(orcamento.id)}
                              data-testid={`button-converter-${orcamento.id}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Converter
                            </Button>
                          )}
                          {orcamento.status !== "convertido" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este orçamento?")) {
                                  deleteMutation.mutate(orcamento.id);
                                }
                              }}
                              data-testid={`button-excluir-${orcamento.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrcamento && (
            <>
              <DialogHeader>
                <DialogTitle>Orçamento {selectedOrcamento.numero}</DialogTitle>
                <DialogDescription>
                  {selectedOrcamento.data_criacao && `Criado em ${format(new Date(selectedOrcamento.data_criacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="gap-1">
                    <CardTitle className="text-base">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Nome</div>
                        <div className="font-medium">{selectedOrcamento.cliente_nome || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{selectedOrcamento.cliente_email || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Telefone</div>
                        <div className="font-medium">{selectedOrcamento.cliente_telefone || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="mt-1">{getStatusBadge(selectedOrcamento.status || "pendente")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="gap-1">
                    <CardTitle className="text-base">Produtos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="w-24 text-center">Qtd</TableHead>
                          <TableHead className="w-32 text-right">Preço Unit.</TableHead>
                          <TableHead className="w-32 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(selectedOrcamento.itens) ? selectedOrcamento.itens : []).map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.nome}</TableCell>
                            <TableCell className="text-center">{item.quantidade}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              R$ {item.preco.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">R$ {selectedOrcamento.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedOrcamento.desconto && selectedOrcamento.desconto > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Desconto</span>
                          <span className="font-medium text-green-600">
                            - R$ {selectedOrcamento.desconto.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-bold">R$ {selectedOrcamento.valor_total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedOrcamento.observacoes && (
                  <Card>
                    <CardHeader className="gap-1">
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedOrcamento.observacoes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => imprimirOrcamento(selectedOrcamento)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
