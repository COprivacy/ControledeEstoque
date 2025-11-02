
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, TrendingUp, ShoppingCart, ChevronDown, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Fornecedor, Produto, Compra } from "@shared/schema";
import { format } from "date-fns";

export default function Fornecedores() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompraDialogOpen, setIsCompraDialogOpen] = useState(false);
  const [isEditCompraDialogOpen, setIsEditCompraDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading } = useQuery<Fornecedor[]>({
    queryKey: ["/api/fornecedores"],
  });

  const { data: compras = [] } = useQuery<Compra[]>({
    queryKey: ["/api/compras"],
  });

  const { data: produtos = [] } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/fornecedores", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
      setIsDialogOpen(false);
      toast({ title: "Fornecedor cadastrado com sucesso!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/fornecedores/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
      setIsDialogOpen(false);
      setEditingFornecedor(null);
      toast({ title: "Fornecedor atualizado com sucesso!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/fornecedores/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
      toast({ title: "Fornecedor removido com sucesso!" });
    },
  });

  const createCompraMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/compras", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      setIsCompraDialogOpen(false);
      setSelectedProdutoId("");
      toast({ title: "Compra registrada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao registrar compra", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateCompraMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/compras/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      setIsEditCompraDialogOpen(false);
      setEditingCompra(null);
      toast({ title: "Compra atualizada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao atualizar compra", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      cnpj: formData.get("cnpj"),
      telefone: formData.get("telefone"),
      email: formData.get("email"),
      endereco: formData.get("endereco"),
      observacoes: formData.get("observacoes"),
    };

    if (editingFornecedor) {
      updateMutation.mutate({ id: editingFornecedor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCompraSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedProdutoId) {
      toast({ 
        title: "Produto não selecionado", 
        description: "Por favor, selecione um produto antes de registrar a compra.",
        variant: "destructive"
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const quantidade = parseInt(formData.get("quantidade") as string);
    const valor_unitario = parseFloat(formData.get("valor_unitario") as string);
    const data = {
      fornecedor_id: selectedFornecedor?.id,
      produto_id: parseInt(selectedProdutoId),
      quantidade: quantidade,
      valor_unitario: valor_unitario,
      valor_total: quantidade * valor_unitario,
      observacoes: formData.get("observacoes"),
    };
    createCompraMutation.mutate(data);
  };

  const handleEditCompraSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCompra) return;

    const formData = new FormData(e.currentTarget);
    const quantidade = parseInt(formData.get("quantidade") as string);
    const valor_unitario = parseFloat(formData.get("valor_unitario") as string);
    const data = {
      quantidade: quantidade,
      valor_unitario: valor_unitario,
      valor_total: quantidade * valor_unitario,
      observacoes: formData.get("observacoes"),
    };
    updateCompraMutation.mutate({ id: editingCompra.id, data });
  };

  const getComprasPorFornecedor = (fornecedorId: number) => {
    return compras.filter((c: any) => c.fornecedor_id === fornecedorId);
  };

  const getTotalGasto = (fornecedorId: number) => {
    const comprasFornecedor = getComprasPorFornecedor(fornecedorId);
    return comprasFornecedor.reduce((total: number, c: any) => total + (c.valor_total || 0), 0);
  };

  const getProdutosFornecidos = (fornecedorId: number) => {
    const comprasFornecedor = getComprasPorFornecedor(fornecedorId);
    const produtosIds = new Set(comprasFornecedor.map((c: any) => c.produto_id));
    return produtos.filter(p => produtosIds.has(p.id));
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getProdutoNome = (produtoId: number) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.nome || "Produto não encontrado";
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="text-title">
            Fornecedores
          </h1>
          <p className="text-muted-foreground text-lg">Gerencie seus fornecedores e histórico de compras</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingFornecedor(null)} 
              data-testid="button-novo-fornecedor"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl border-t-4 border-t-blue-600">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" name="nome" defaultValue={editingFornecedor?.nome} required data-testid="input-nome-fornecedor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" name="cnpj" defaultValue={editingFornecedor?.cnpj || ""} data-testid="input-cnpj" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" defaultValue={editingFornecedor?.telefone || ""} data-testid="input-telefone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingFornecedor?.email || ""} data-testid="input-email-fornecedor" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" name="endereco" defaultValue={editingFornecedor?.endereco || ""} data-testid="input-endereco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" defaultValue={editingFornecedor?.observacoes || ""} data-testid="input-observacoes-fornecedor" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancelar-fornecedor">
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-salvar-fornecedor">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isCompraDialogOpen} onOpenChange={setIsCompraDialogOpen}>
        <DialogContent className="max-w-2xl border-t-4 border-t-green-600">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Registrar Compra - {selectedFornecedor?.nome}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCompraSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="produto_id">Produto *</Label>
              <Select value={selectedProdutoId} onValueChange={setSelectedProdutoId} required>
                <SelectTrigger data-testid="select-produto-compra">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id.toString()} data-testid={`option-produto-${produto.id}`}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input id="quantidade" name="quantidade" type="number" min="1" required data-testid="input-quantidade-compra" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input id="valor_unitario" name="valor_unitario" type="number" step="0.01" min="0" required data-testid="input-valor-unitario" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" data-testid="input-observacoes-compra" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCompraDialogOpen(false)} data-testid="button-cancelar-compra">
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-salvar-compra">Registrar Compra</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditCompraDialogOpen} onOpenChange={setIsEditCompraDialogOpen}>
        <DialogContent className="max-w-2xl border-t-4 border-t-purple-600">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Editar Compra
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCompraSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Input value={editingCompra ? getProdutoNome(editingCompra.produto_id) : ""} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_quantidade">Quantidade *</Label>
                <Input 
                  id="edit_quantidade" 
                  name="quantidade" 
                  type="number" 
                  min="1" 
                  defaultValue={editingCompra?.quantidade || ""} 
                  required 
                  data-testid="input-edit-quantidade-compra" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_valor_unitario">Valor Unitário (R$) *</Label>
                <Input 
                  id="edit_valor_unitario" 
                  name="valor_unitario" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  defaultValue={editingCompra?.valor_unitario || ""} 
                  required 
                  data-testid="input-edit-valor-unitario" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_observacoes">Observações</Label>
              <Textarea 
                id="edit_observacoes" 
                name="observacoes" 
                defaultValue={editingCompra?.observacoes || ""} 
                data-testid="input-edit-observacoes-compra" 
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditCompraDialogOpen(false);
                  setEditingCompra(null);
                }} 
                data-testid="button-cancelar-edit-compra"
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-salvar-edit-compra">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-xl border-t-4 border-t-blue-600 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Lista de Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-800 dark:hover:to-gray-700">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-bold">Nome</TableHead>
                <TableHead className="font-bold">CNPJ</TableHead>
                <TableHead className="font-bold">Contato</TableHead>
                <TableHead className="text-center font-bold">Compras</TableHead>
                <TableHead className="text-right font-bold">Total Gasto</TableHead>
                <TableHead className="text-right font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum fornecedor cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((fornecedor) => {
                  const comprasFornecedor = getComprasPorFornecedor(fornecedor.id);
                  const totalGasto = getTotalGasto(fornecedor.id);
                  const produtosFornecidos = getProdutosFornecidos(fornecedor.id);
                  const isExpanded = expandedRows.has(fornecedor.id);

                  return (
                    <Fragment key={fornecedor.id}>
                      <TableRow data-testid={`row-fornecedor-${fornecedor.id}`}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(fornecedor.id)}
                            data-testid={`button-expandir-${fornecedor.id}`}
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-nome-${fornecedor.id}`}>{fornecedor.nome}</TableCell>
                        <TableCell data-testid={`text-cnpj-${fornecedor.id}`}>{fornecedor.cnpj || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{fornecedor.telefone || "-"}</div>
                            <div className="text-muted-foreground">{fornecedor.email || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full font-semibold text-green-700 dark:text-green-400" data-testid={`text-total-compras-${fornecedor.id}`}>
                            <TrendingUp className="h-4 w-4" />
                            {comprasFornecedor.length}
                          </span>
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-total-gasto-${fornecedor.id}`}>
                          <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            R$ {totalGasto.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFornecedor(fornecedor);
                                setSelectedProdutoId("");
                                setIsCompraDialogOpen(true);
                              }}
                              data-testid={`button-compra-${fornecedor.id}`}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Compra
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFornecedor(fornecedor);
                                setIsDialogOpen(true);
                              }}
                              data-testid={`button-editar-${fornecedor.id}`}
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 shadow-sm hover:shadow-md transition-all"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Deseja realmente excluir este fornecedor?")) {
                                  deleteMutation.mutate(fornecedor.id);
                                }
                              }}
                              data-testid={`button-deletar-${fornecedor.id}`}
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-l-blue-600">
                            <div className="py-6 space-y-6">
                              <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  <Package className="h-5 w-5 text-blue-600" />
                                  Produtos Fornecidos ({produtosFornecidos.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {produtosFornecidos.length > 0 ? (
                                    produtosFornecidos.map((produto) => (
                                      <span
                                        key={produto.id}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border border-blue-300 dark:border-blue-700 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                                        data-testid={`badge-produto-${produto.id}`}
                                      >
                                        {produto.nome}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhum produto fornecido ainda</p>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  <ShoppingCart className="h-5 w-5 text-green-600" />
                                  Histórico de Compras ({comprasFornecedor.length})
                                </h4>
                                {comprasFornecedor.length > 0 ? (
                                  <div className="border-2 border-green-200 dark:border-green-800 rounded-xl overflow-hidden shadow-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                                          <TableHead className="font-bold">Data</TableHead>
                                          <TableHead className="font-bold">Produto</TableHead>
                                          <TableHead className="text-center font-bold">Quantidade</TableHead>
                                          <TableHead className="text-right font-bold">Valor Unitário</TableHead>
                                          <TableHead className="text-right font-bold">Valor Total</TableHead>
                                          <TableHead className="font-bold">Observações</TableHead>
                                          <TableHead className="text-center font-bold">Ações</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {comprasFornecedor.map((compra: any) => (
                                          <TableRow key={compra.id} data-testid={`row-compra-${compra.id}`}>
                                            <TableCell data-testid={`text-data-${compra.id}`}>
                                              {compra.data ? format(new Date(compra.data), "dd/MM/yyyy") : "-"}
                                            </TableCell>
                                            <TableCell data-testid={`text-produto-compra-${compra.id}`}>
                                              {getProdutoNome(compra.produto_id)}
                                            </TableCell>
                                            <TableCell className="text-center" data-testid={`text-quantidade-${compra.id}`}>
                                              {compra.quantidade}
                                            </TableCell>
                                            <TableCell className="text-right" data-testid={`text-valor-unitario-${compra.id}`}>
                                              R$ {compra.valor_unitario?.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right" data-testid={`text-valor-total-${compra.id}`}>
                                              <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                R$ {compra.valor_total?.toFixed(2)}
                                              </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-observacoes-${compra.id}`}>
                                              {compra.observacoes || "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingCompra(compra);
                                                  setIsEditCompraDialogOpen(true);
                                                }}
                                                data-testid={`button-edit-compra-${compra.id}`}
                                                className="hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 hover:text-purple-700 transition-all"
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
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
