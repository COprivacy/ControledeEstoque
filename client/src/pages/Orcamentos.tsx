
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
import { Plus, FileText, CheckCircle, XCircle, ShoppingCart, Printer, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Orcamentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [formData, setFormData] = useState({
    clienteNome: "",
    clienteEmail: "",
    clienteTelefone: "",
    dataValidade: "",
    observacoes: "",
  });
  const [itensCarrinho, setItensCarrinho] = useState<any[]>([]);

  const { data: orcamentos = [], isLoading } = useQuery({
    queryKey: ["/api/orcamentos"],
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["/api/produtos"],
  });

  const { data: clientes = [] } = useQuery({
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
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orcamentos/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      toast({ title: "Status atualizado!" });
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
      toast({ title: "Orçamento convertido em venda!" });
    },
  });

  const adicionarItem = (produtoId: number) => {
    const produto = produtos.find((p: any) => p.id === produtoId);
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

  const calcularTotal = () => {
    return itensCarrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  };

  const resetForm = () => {
    setFormData({
      clienteNome: "",
      clienteEmail: "",
      clienteTelefone: "",
      dataValidade: "",
      observacoes: "",
    });
    setItensCarrinho([]);
  };

  const handleSubmit = () => {
    if (itensCarrinho.length === 0) {
      toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
      return;
    }

    const total = calcularTotal();
    
    createMutation.mutate({
      ...formData,
      itens: itensCarrinho,
      subtotal: total,
      desconto: 0,
      total,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: <Badge variant="outline">Pendente</Badge>,
      aprovado: <Badge className="bg-green-600">Aprovado</Badge>,
      rejeitado: <Badge variant="destructive">Rejeitado</Badge>,
      convertido: <Badge className="bg-blue-600">Convertido</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pendente;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie seus orçamentos e propostas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Orçamento</DialogTitle>
              <DialogDescription>Preencha os dados do orçamento</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Input
                    value={formData.clienteNome}
                    onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.clienteEmail}
                    onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.clienteTelefone}
                    onChange={(e) => setFormData({ ...formData, clienteTelefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input
                    type="date"
                    value={formData.dataValidade}
                    onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Adicionar Produtos</Label>
                <Select onValueChange={(value) => adicionarItem(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto: any) => (
                      <SelectItem key={produto.id} value={produto.id.toString()}>
                        {produto.nome} - R$ {produto.preco.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {itensCarrinho.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Itens do Orçamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Preço Unit.</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itensCarrinho.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => {
                                  const newQtd = parseInt(e.target.value);
                                  setItensCarrinho(
                                    itensCarrinho.map((i, index) =>
                                      index === idx ? { ...i, quantidade: newQtd } : i
                                    )
                                  );
                                }}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>R$ {item.preco.toFixed(2)}</TableCell>
                            <TableCell>R$ {(item.preco * item.quantidade).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-right">
                      <p className="text-2xl font-bold">Total: R$ {calcularTotal().toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Criar Orçamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos</CardTitle>
          <CardDescription>Todos os orçamentos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamentos.map((orcamento: any) => (
                <TableRow key={orcamento.id}>
                  <TableCell className="font-mono">{orcamento.numero_orcamento}</TableCell>
                  <TableCell>{orcamento.cliente_nome || "Sem cliente"}</TableCell>
                  <TableCell>
                    {format(new Date(orcamento.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {orcamento.data_validade
                      ? format(new Date(orcamento.data_validade), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </TableCell>
                  <TableCell>R$ {orcamento.total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {orcamento.status === "pendente" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "aprovado" })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "rejeitado" })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {orcamento.status === "aprovado" && (
                        <Button
                          size="sm"
                          onClick={() => converterMutation.mutate(orcamento.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Converter em Venda
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
