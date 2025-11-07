import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackageX, Plus, Search, CheckCircle2, XCircle, Clock, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { Devolucao, Produto } from "@shared/schema";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

export default function Devolucoes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<Devolucao | null>(null);
  const [editingDevolucao, setEditingDevolucao] = useState<Devolucao | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devolucoes = [], isLoading: loadingDevolucoes } = useQuery<Devolucao[]>({
    queryKey: ["/api/devolucoes"],
  });

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/devolucoes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devolucoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Devolução registrada!",
        description: "A devolução foi cadastrada com sucesso",
      });
      setDialogOpen(false);
      setEditingDevolucao(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a devolução",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/devolucoes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devolucoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Devolução atualizada!",
        description: "As informações foram atualizadas com sucesso",
      });
      setDialogOpen(false);
      setEditingDevolucao(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a devolução",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/devolucoes/${id}`, undefined);
      if (!response.ok) throw new Error("Erro ao deletar devolução");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devolucoes"] });
      toast({
        title: "Devolução excluída!",
        description: "A devolução foi removida do sistema",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a devolução",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const produtoId = parseInt(formData.get("produto_id") as string);
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) {
      toast({
        title: "Erro",
        description: "Produto não encontrado",
        variant: "destructive",
      });
      return;
    }

    const quantidade = parseInt(formData.get("quantidade") as string);
    const valorTotal = produto.preco * quantidade;

    const data = {
      produto_id: produtoId,
      produto_nome: produto.nome,
      quantidade,
      valor_total: valorTotal,
      motivo: formData.get("motivo") as string,
      status: formData.get("status") as string,
      observacoes: formData.get("observacoes") as string || null,
      cliente_nome: formData.get("cliente_nome") as string || null,
    };

    if (editingDevolucao) {
      updateMutation.mutate({ id: editingDevolucao.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (devolucao: Devolucao) => {
    setEditingDevolucao(devolucao);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta devolução?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDevolucao = () => {
    setEditingDevolucao(null);
    setDialogOpen(true);
  };

  const handleViewDetails = (devolucao: Devolucao) => {
    setSelectedDevolucao(devolucao);
    setDetailsDialogOpen(true);
  };

  const getFilteredByPeriod = (devolucao: Devolucao) => {
    if (filterPeriodo === "all") return true;
    
    const hoje = new Date();
    const dataDevolucao = new Date(devolucao.data_devolucao);
    
    switch (filterPeriodo) {
      case "hoje":
        return dataDevolucao.toDateString() === hoje.toDateString();
      case "semana":
        const umaSemanaAtras = new Date(hoje);
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        return dataDevolucao >= umaSemanaAtras;
      case "mes":
        const umMesAtras = new Date(hoje);
        umMesAtras.setMonth(hoje.getMonth() - 1);
        return dataDevolucao >= umMesAtras;
      default:
        return true;
    }
  };

  const filteredDevolucoes = devolucoes.filter(d => {
    const matchesSearch = d.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    const matchesPeriodo = getFilteredByPeriod(d);
    return matchesSearch && matchesStatus && matchesPeriodo;
  });

  const totalDevolucoes = devolucoes.length;
  const devolucoesAprovadas = devolucoes.filter(d => d.status === "aprovada").length;
  const devolucoesRejeitadas = devolucoes.filter(d => d.status === "rejeitada").length;
  const devolucoesValor = devolucoes
    .filter(d => d.status === "aprovada")
    .reduce((sum, d) => sum + d.valor_total, 0);

  const getMotivoLabel = (motivo: string) => {
    const motivos: Record<string, string> = {
      "defeito": "Produto com defeito",
      "insatisfacao": "Insatisfação",
      "vencido": "Produto vencido",
      "errado": "Produto errado",
      "danificado": "Produto danificado",
      "outro": "Outro motivo"
    };
    return motivos[motivo] || motivo;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovada":
        return (
          <Badge className="bg-green-500 hover:bg-green-600" data-testid={`badge-status-aprovada`}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovada
          </Badge>
        );
      case "rejeitada":
        return (
          <Badge variant="destructive" data-testid={`badge-status-rejeitada`}>
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid={`badge-status-pendente`}>
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  if (loadingDevolucoes || loadingProdutos) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
            Devoluções
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as devoluções de produtos
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleNewDevolucao}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              data-testid="button-new-devolucao"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Devolução
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingDevolucao ? "Editar Devolução" : "Nova Devolução"}
              </DialogTitle>
              <DialogDescription>
                {editingDevolucao
                  ? "Atualize as informações da devolução"
                  : "Preencha os dados para registrar uma nova devolução"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="produto_id">Produto *</Label>
                <Select
                  name="produto_id"
                  defaultValue={editingDevolucao?.produto_id?.toString()}
                  required
                >
                  <SelectTrigger data-testid="select-produto">
                    <SelectValue placeholder="Selecione o produto" />
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

              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="1"
                  defaultValue={editingDevolucao?.quantidade}
                  required
                  data-testid="input-quantidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                <Input
                  id="cliente_nome"
                  name="cliente_nome"
                  defaultValue={editingDevolucao?.cliente_nome || ""}
                  data-testid="input-cliente-nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Select
                  name="motivo"
                  defaultValue={editingDevolucao?.motivo || "defeito"}
                  required
                >
                  <SelectTrigger data-testid="select-motivo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defeito">Produto com defeito</SelectItem>
                    <SelectItem value="insatisfacao">Insatisfação com o produto</SelectItem>
                    <SelectItem value="vencido">Produto vencido</SelectItem>
                    <SelectItem value="errado">Produto errado</SelectItem>
                    <SelectItem value="danificado">Produto danificado</SelectItem>
                    <SelectItem value="outro">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  name="status"
                  defaultValue={editingDevolucao?.status || "pendente"}
                  required
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  defaultValue={editingDevolucao?.observacoes || ""}
                  placeholder="Adicione observações adicionais..."
                  data-testid="textarea-observacoes"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingDevolucao(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingDevolucao
                    ? "Atualizar"
                    : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Devoluções
            </CardTitle>
            <PackageX className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-total-devolucoes">
              {totalDevolucoes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as devoluções registradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devoluções Aprovadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-devolucoes-aprovadas">
              {devolucoesAprovadas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Devoluções processadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Devoluções Rejeitadas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-devolucoes-rejeitadas">
              {devolucoesRejeitadas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Não processadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Devolvido
            </CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-valor-devolvido">
              R$ {devolucoesValor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Devoluções aprovadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Listagem de Devoluções</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as devoluções de produtos
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger className="w-[140px]" data-testid="select-filter-periodo">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Última Semana</SelectItem>
                  <SelectItem value="mes">Último Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDevolucoes.length === 0 ? (
            <div className="text-center py-12">
              <PackageX className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || filterStatus !== "all"
                  ? "Nenhuma devolução encontrada com os filtros aplicados"
                  : "Nenhuma devolução registrada ainda"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevolucoes.map((devolucao) => (
                    <TableRow key={devolucao.id} data-testid={`row-devolucao-${devolucao.id}`}>
                      <TableCell className="font-medium" data-testid={`text-data-${devolucao.id}`}>
                        {formatDate(devolucao.data_devolucao)}
                      </TableCell>
                      <TableCell data-testid={`text-produto-${devolucao.id}`}>
                        {devolucao.produto_nome}
                      </TableCell>
                      <TableCell data-testid={`text-cliente-${devolucao.id}`}>
                        {devolucao.cliente_nome || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-quantidade-${devolucao.id}`}>
                        {devolucao.quantidade}
                      </TableCell>
                      <TableCell data-testid={`text-valor-${devolucao.id}`}>
                        R$ {devolucao.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-motivo-${devolucao.id}`}>
                        <span className="text-sm">{getMotivoLabel(devolucao.motivo)}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(devolucao.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleViewDetails(devolucao)}
                            data-testid={`button-view-${devolucao.id}`}
                            className="h-8 w-8"
                            title="Ver detalhes"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(devolucao)}
                            data-testid={`button-edit-${devolucao.id}`}
                            className="h-8 w-8"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDelete(devolucao.id)}
                            data-testid={`button-delete-${devolucao.id}`}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Diálogo de Detalhes da Devolução */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Devolução</DialogTitle>
            <DialogDescription>
              Informações completas da devolução
            </DialogDescription>
          </DialogHeader>
          {selectedDevolucao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data da Devolução</Label>
                  <p className="font-medium">{formatDate(selectedDevolucao.data_devolucao)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedDevolucao.status)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Produto</Label>
                <p className="font-medium text-lg">{selectedDevolucao.produto_nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Quantidade</Label>
                  <p className="font-medium">{selectedDevolucao.quantidade} unidades</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg">R$ {selectedDevolucao.valor_total.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-medium">{selectedDevolucao.cliente_nome || "Não informado"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Motivo</Label>
                <p className="font-medium">{getMotivoLabel(selectedDevolucao.motivo)}</p>
              </div>

              {selectedDevolucao.observacoes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedDevolucao.observacoes}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleEdit(selectedDevolucao);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
