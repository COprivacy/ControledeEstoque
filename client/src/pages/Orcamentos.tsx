
import { useState, useMemo } from "react";
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
import { Plus, FileText, CheckCircle, XCircle, ShoppingCart, Printer, Eye, Trash2, Calendar, Mail, Phone, User } from "lucide-react";
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
  const [searchProduto, setSearchProduto] = useState("");

  const { data: orcamentos = [], isLoading } = useQuery<Orcamento[]>({
    queryKey: ["/api/orcamentos"],
  });

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const produtosFiltrados = useMemo(() => {
    if (!searchProduto.trim()) {
      return produtos;
    }
    return produtos.filter((produto) =>
      produto.nome.toLowerCase().includes(searchProduto.toLowerCase())
    );
  }, [produtos, searchProduto]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orcamentos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orcamentos"] });
      toast({ title: "✅ Orçamento criado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro ao criar orçamento", 
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
      toast({ title: "✅ Status atualizado com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "❌ Erro ao atualizar status", 
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
      toast({ title: "✅ Orçamento convertido em venda com sucesso!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro ao converter orçamento",
        description: error.message || "Tente novamente",
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
      toast({ title: "✅ Orçamento excluído com sucesso!" });
    },
    onError: () => {
      toast({ 
        title: "❌ Erro ao excluir orçamento", 
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
      toast({ title: "⚠️ Nome do cliente é obrigatório", variant: "destructive" });
      return;
    }

    if (itensCarrinho.length === 0) {
      toast({ title: "⚠️ Adicione pelo menos um produto", variant: "destructive" });
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
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
            .header p { color: #6b7280; margin: 5px 0; }
            .info-section { margin: 30px 0; }
            .info-section h2 { color: #1e40af; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #4b5563; display: block; margin-bottom: 3px; font-size: 12px; text-transform: uppercase; }
            .info-value { color: #1f2937; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #f3f4f6; color: #1f2937; font-weight: 600; text-transform: uppercase; font-size: 12px; }
            td { color: #4b5563; }
            .text-right { text-align: right; }
            .total-section { margin-top: 30px; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; margin: 10px 0; }
            .total-label { font-weight: 600; margin-right: 20px; min-width: 100px; }
            .total-value { font-size: 18px; }
            .grand-total { font-size: 24px; color: #1e40af; font-weight: bold; border-top: 2px solid #3b82f6; padding-top: 15px; margin-top: 15px; }
            .observacoes { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .observacoes h3 { color: #1e40af; margin-top: 0; }
            .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORÇAMENTO</h1>
            <p>${orcamento.numero}</p>
          </div>

          <div class="info-section">
            <h2>Informações do Cliente</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nome</span>
                <span class="info-value">${orcamento.cliente_nome || 'Não informado'}</span>
              </div>
              ${orcamento.cliente_email ? `
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">${orcamento.cliente_email}</span>
                </div>
              ` : ''}
              ${orcamento.cliente_telefone ? `
                <div class="info-item">
                  <span class="info-label">Telefone</span>
                  <span class="info-value">${orcamento.cliente_telefone}</span>
                </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">Data de Emissão</span>
                <span class="info-value">${orcamento.data_criacao ? format(new Date(orcamento.data_criacao), "dd/MM/yyyy", { locale: ptBR }) : ''}</span>
              </div>
              ${orcamento.validade ? `
                <div class="info-item">
                  <span class="info-label">Validade</span>
                  <span class="info-value">${format(new Date(orcamento.validade), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="info-section">
            <h2>Itens do Orçamento</h2>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th class="text-right">Qtd.</th>
                  <th class="text-right">Preço Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itens.map((item: any) => `
                  <tr>
                    <td>${item.nome}</td>
                    <td class="text-right">${item.quantidade}</td>
                    <td class="text-right">R$ ${item.preco.toFixed(2)}</td>
                    <td class="text-right">R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">R$ ${orcamento.subtotal.toFixed(2)}</span>
            </div>
            ${(orcamento.desconto && orcamento.desconto > 0) ? `
              <div class="total-row">
                <span class="total-label">Desconto:</span>
                <span class="total-value">R$ ${orcamento.desconto.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span class="total-label">TOTAL:</span>
              <span class="total-value">R$ ${orcamento.valor_total.toFixed(2)}</span>
            </div>
          </div>
          
          ${orcamento.observacoes ? `
            <div class="observacoes">
              <h3>Observações</h3>
              <p>${orcamento.observacoes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Este orçamento foi gerado automaticamente pelo sistema</p>
            <p>Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>,
      aprovado: <Badge className="bg-green-50 text-green-700 border-green-200 border">Aprovado</Badge>,
      rejeitado: <Badge className="bg-red-50 text-red-700 border-red-200 border">Rejeitado</Badge>,
      convertido: <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">Convertido</Badge>,
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
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Orçamentos
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie suas propostas comerciais de forma profissional</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="default" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Criar Novo Orçamento
              </DialogTitle>
              <DialogDescription className="text-base">
                Preencha as informações do cliente e adicione os produtos para gerar o orçamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <Card className="border-2 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">Informações do Cliente</CardTitle>
                        <CardDescription className="text-sm">Dados necessários para identificação do cliente</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <Label htmlFor="select-cliente" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Cliente Cadastrado (Opcional)
                    </Label>
                    <Select onValueChange={handleSelecionarCliente}>
                      <SelectTrigger id="select-cliente" className="bg-white">
                        <SelectValue placeholder="Buscar cliente já cadastrado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{cliente.nome}</span>
                              {cliente.email && <span className="text-xs text-muted-foreground">{cliente.email}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="input-nome" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <User className="h-4 w-4 text-blue-600" />
                        Nome Completo *
                      </Label>
                      <Input
                        id="input-nome"
                        value={formData.cliente_nome}
                        onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                        placeholder="Digite o nome completo do cliente"
                        required
                        className="border-2 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-email" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Mail className="h-4 w-4 text-purple-600" />
                        Email
                      </Label>
                      <Input
                        id="input-email"
                        type="email"
                        value={formData.cliente_email}
                        onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="input-telefone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Phone className="h-4 w-4 text-green-600" />
                        Telefone
                      </Label>
                      <Input
                        id="input-telefone"
                        value={formData.cliente_telefone}
                        onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="border-2 focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="input-validade" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        Validade do Orçamento
                      </Label>
                      <Input
                        id="input-validade"
                        type="date"
                        value={formData.validade}
                        onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                        className="border-2 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-md">
                <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">Produtos do Orçamento</CardTitle>
                        <CardDescription className="text-sm">Selecione e adicione os produtos</CardDescription>
                      </div>
                    </div>
                    {itensCarrinho.length > 0 && (
                      <Badge className="bg-green-600 text-white px-3 py-1">
                        {itensCarrinho.length} {itensCarrinho.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="search-produto" className="text-sm font-semibold text-gray-700">
                      Buscar Produto
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-produto"
                        type="text"
                        placeholder="Digite o nome do produto para buscar..."
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        className="pl-9 border-2 focus:border-green-500"
                      />
                    </div>
                    {searchProduto && (
                      <p className="text-xs text-muted-foreground">
                        {produtosFiltrados.length} produto(s) encontrado(s)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="select-produto" className="text-sm font-semibold text-gray-700">
                      Selecionar e Adicionar Produto
                    </Label>
                    <Select 
                      onValueChange={(value) => {
                        adicionarItem(parseInt(value));
                        setSearchProduto("");
                      }}
                      value=""
                    >
                      <SelectTrigger id="select-produto" className="border-2 focus:border-green-500">
                        <SelectValue placeholder="🔍 Selecione um produto da lista..." />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosFiltrados.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            {searchProduto 
                              ? `Nenhum produto encontrado para "${searchProduto}"`
                              : "Nenhum produto disponível"}
                          </div>
                        ) : (
                          produtosFiltrados.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id.toString()}>
                              <div className="flex justify-between items-center w-full gap-4">
                                <span className="font-medium">{produto.nome}</span>
                                <span className="text-green-600 font-semibold">R$ {produto.preco.toFixed(2)}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {itensCarrinho.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Produto</TableHead>
                            <TableHead className="w-32">Quantidade</TableHead>
                            <TableHead className="w-32 text-right">Preço Unit.</TableHead>
                            <TableHead className="w-32 text-right">Subtotal</TableHead>
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
                                />
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                R$ {item.preco.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                R$ {(item.preco * item.quantidade).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removerItem(item.produto_id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
                        <div className="flex justify-end">
                          <div className="text-right space-y-1">
                            <div className="text-sm text-muted-foreground">Total do Orçamento</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              R$ {calcularSubtotal().toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {itensCarrinho.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhum produto adicionado. Selecione produtos acima.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 shadow-md">
                <CardHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">Observações e Condições</CardTitle>
                      <CardDescription className="text-sm">Informações adicionais importantes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes" className="text-sm font-semibold text-gray-700">
                      Condições de pagamento, prazos, garantias e outras informações
                    </Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Exemplo:&#10;- Pagamento: 50% entrada + 50% em 30 dias&#10;- Prazo de entrega: 7 dias úteis&#10;- Garantia: 12 meses&#10;- Frete: Por conta do cliente"
                      rows={5}
                      className="border-2 focus:border-orange-500 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Estas informações aparecerão no orçamento impresso
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {createMutation.isPending ? "Criando..." : "Criar Orçamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
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
            <div className="text-center py-16">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum orçamento criado</h3>
              <p className="text-muted-foreground mb-6">
                Comece criando seu primeiro orçamento profissional
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                    <TableRow key={orcamento.id}>
                      <TableCell className="font-mono font-semibold text-blue-600">
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
                      <TableCell className="text-right font-semibold text-lg">
                        R$ {orcamento.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(orcamento.status || "pendente")}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => visualizarOrcamento(orcamento)}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => imprimirOrcamento(orcamento)}
                            className="hover:bg-purple-50"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {orcamento.status === "pendente" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "aprovado" })}
                                className="hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: orcamento.id, status: "rejeitado" })}
                                className="hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {orcamento.status === "aprovado" && (
                            <Button
                              size="sm"
                              onClick={() => converterMutation.mutate(orcamento.id)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
                              className="hover:bg-red-50"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrcamento && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Orçamento {selectedOrcamento.numero}</DialogTitle>
                <DialogDescription>
                  {selectedOrcamento.data_criacao && `Criado em ${format(new Date(selectedOrcamento.data_criacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Nome</div>
                        <div className="font-medium">{selectedOrcamento.cliente_nome || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Email</div>
                        <div className="font-medium">{selectedOrcamento.cliente_email || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Telefone</div>
                        <div className="font-medium">{selectedOrcamento.cliente_telefone || "Não informado"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <div className="mt-1">{getStatusBadge(selectedOrcamento.status || "pendente")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
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
                            <TableCell className="text-right font-semibold">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Separator className="my-6" />
                    <div className="space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">R$ {selectedOrcamento.subtotal.toFixed(2)}</span>
                      </div>
                      {selectedOrcamento.desconto && selectedOrcamento.desconto > 0 && (
                        <div className="flex justify-between text-base">
                          <span className="text-muted-foreground">Desconto</span>
                          <span className="font-medium text-green-600">
                            - R$ {selectedOrcamento.desconto.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-xl">
                        <span className="font-bold">Total</span>
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          R$ {selectedOrcamento.valor_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedOrcamento.observacoes && (
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-sm whitespace-pre-wrap">
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
                <Button onClick={() => imprimirOrcamento(selectedOrcamento)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
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
