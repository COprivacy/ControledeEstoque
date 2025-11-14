import { useState, useEffect } from "react"; // Added useEffect import
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Lock, Unlock, Plus, Minus, History, DollarSign, TrendingUp, TrendingDown, ShoppingCart, Archive } from "lucide-react"; // Added ShoppingCart icon
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Caixa() {
  const [, setLocation] = useLocation();
  const [isAbrirDialogOpen, setIsAbrirDialogOpen] = useState(false);
  const [isFecharDialogOpen, setIsFecharDialogOpen] = useState(false);
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<"suprimento" | "retirada">("suprimento");
  const [incluirArquivados, setIncluirArquivados] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  // State variables to manage form inputs
  const [saldoInicial, setSaldoInicial] = useState("");
  const [observacoesAbertura, setObservacoesAbertura] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacoesFechamento, setObservacoesFechamento] = useState("");
  const [valorMovimentacao, setValorMovimentacao] = useState("");
  const [descricaoMovimentacao, setDescricaoMovimentacao] = useState("");

  // Functions to fetch data
  const fetchCaixaAberto = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userType = user.tipo || "usuario";
      const headers: Record<string, string> = {
        "x-user-id": user.id || "",
        "x-user-type": userType,
        "x-conta-id": user.conta_id || user.id || "",
      };

      // Adicionar funcionario-id apenas se for funcionário
      if (userType === "funcionario" && user.id) {
        headers["funcionario-id"] = user.id;
      }

      const response = await fetch("/api/caixas/aberto", { headers });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar caixa aberto:", error);
      return null;
    }
  };

  const fetchHistoricoCaixas = async (incluirArquivados: boolean = false) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || "";
      const response = await fetch(`/api/caixas?conta_id=${userId}&incluirArquivados=${incluirArquivados}`, {
        headers: {
          "x-user-id": userId,
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || userId,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar histórico de caixas:", error);
      return [];
    }
  };

  const fetchMovimentacoes = async (caixaId: number) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/caixas/${caixaId}/movimentacoes`, {
        headers: {
          "x-user-id": user.id || "",
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || user.id || "",
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
      return [];
    }
  };

  // UseQuery hooks com atualização automática
  const { data: caixaAberto, isLoading: isLoadingCaixa } = useQuery({
    queryKey: ["/api/caixas/aberto"],
    queryFn: fetchCaixaAberto,
    refetchInterval: 3000, // Atualiza a cada 3 segundos
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || "";

  const { data: caixas = [] } = useQuery({
    queryKey: ["/api/caixas", userId, incluirArquivados],
    queryFn: () => fetchHistoricoCaixas(incluirArquivados),
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    enabled: !!userId, // Só executa se tiver userId
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["/api/caixas", caixaAberto?.id, "movimentacoes"],
    queryFn: () => fetchMovimentacoes(caixaAberto!.id), // Assert non-null with '!'
    enabled: !!caixaAberto,
    refetchInterval: 3000, // Atualiza a cada 3 segundos
  });

  // Mutate functions
  const abrirCaixaMutation = useMutation({
    mutationFn: async (data: { saldo_inicial: number; observacoes_abertura?: string }) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("/api/caixas/abrir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id || "",
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || user.id || "",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao abrir caixa");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caixas/aberto"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixas"] });
      setIsAbrirDialogOpen(false);
      setSaldoInicial(""); // Clear form
      setObservacoesAbertura(""); // Clear form
      toast({ title: "Caixa aberto com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao abrir caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async ({ id, saldo_final, observacoes }: { id: number; saldo_final: number; observacoes?: string }) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/caixas/${id}/fechar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id || "",
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || user.id || "",
        },
        body: JSON.stringify({ saldo_final, observacoes_fechamento: observacoes }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fechar caixa");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caixas/aberto"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixas"] });
      setIsFecharDialogOpen(false);
      setSaldoFinal(""); // Clear form
      setObservacoesFechamento(""); // Clear form
      toast({ title: "Caixa fechado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fechar caixa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const movimentacaoMutation = useMutation({
    mutationFn: async (data: { tipo: string; valor: number; descricao?: string }) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/caixas/${caixaAberto!.id}/movimentacoes`, { // Assert non-null with '!'
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id || "",
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || user.id || "",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao registrar movimentação");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/caixas", caixaAberto?.id, "movimentacoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/caixas/aberto"] });
      setIsMovimentacaoDialogOpen(false);
      setValorMovimentacao(""); // Clear form
      setDescricaoMovimentacao(""); // Clear form
      toast({ title: "Movimentação registrada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAbrirCaixa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const saldo = parseFloat(formData.get("saldo_inicial") as string);
    setSaldoInicial(formData.get("saldo_inicial") as string); // Update state
    setObservacoesAbertura(formData.get("observacoes") as string); // Update state

    if (!isNaN(saldo) && saldo >= 0) {
      abrirCaixaMutation.mutate({
        saldo_inicial: saldo,
        observacoes_abertura: formData.get("observacoes") as string || undefined,
      });
    } else {
      toast({
        title: "Erro",
        description: "Informe um saldo inicial válido",
        variant: "destructive",
      });
    }
  };

  const handleFecharCaixa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const saldo = parseFloat(formData.get("saldo_final") as string);
    setSaldoFinal(formData.get("saldo_final") as string); // Update state
    setObservacoesFechamento(formData.get("observacoes") as string); // Update state

    if (caixaAberto && !isNaN(saldo) && saldo >= 0) {
      fecharCaixaMutation.mutate({
        id: caixaAberto.id,
        saldo_final: saldo,
        observacoes: formData.get("observacoes") as string || undefined,
      });
    } else {
      toast({
        title: "Erro",
        description: "Informe o saldo final corretamente",
        variant: "destructive",
      });
    }
  };

  const handleMovimentacao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const valor = parseFloat(formData.get("valor") as string);
    setValorMovimentacao(formData.get("valor") as string); // Update state
    setDescricaoMovimentacao(formData.get("descricao") as string); // Update state

    if (!isNaN(valor) && valor > 0) {
      movimentacaoMutation.mutate({
        tipo: tipoMovimentacao,
        valor: valor,
        descricao: formData.get("descricao") as string || undefined,
      });
    } else {
      toast({
        title: "Erro",
        description: "Informe um valor válido para a movimentação",
        variant: "destructive",
      });
    }
  };

  const calcularSaldoAtual = () => {
    if (!caixaAberto) return 0;
    return (
      (caixaAberto.saldo_inicial || 0) +
      (caixaAberto.total_vendas || 0) +
      (caixaAberto.total_suprimentos || 0) -
      (caixaAberto.total_retiradas || 0)
    );
  };

  const handleLimparHistorico = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de caixas fechados? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("/api/caixas/historico", {
        method: "DELETE",
        headers: {
          "x-user-id": user.id || "",
          "x-user-type": user.tipo || "usuario",
          "x-conta-id": user.conta_id || user.id || "",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao limpar histórico");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/caixas"] });
      toast({
        title: "Histórico limpo com sucesso!",
        description: `${result.deletedCount} caixa(s) removido(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar histórico",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Function to check if "Finalizar" button should be enabled
  const isFinalizarCompraEnabled = () => {
    if (!caixaAberto) return false;

    // Logic to determine if "Finalizar" button should be enabled
    // For now, let's assume it depends on having some payment method selected and a valid amount
    // This logic might need to be more sophisticated based on actual payment types and requirements.

    // Example: Enable if any payment method has been added and the total amount is not zero (or if it's a payment type that doesn't require payment, like "a prazo")
    // This is a placeholder and should be replaced with actual logic.

    // Placeholder logic: enable if saldo atual is greater than 0 or if there are sales recorded
    // A more robust solution would involve checking the state of the sales/payment form.
    return calcularSaldoAtual() > 0 || (caixaAberto.total_vendas || 0) > 0;
  };

  // Effect to fetch initial data
  useEffect(() => {
    // Data fetching is now handled by useQuery, so no explicit calls here
  }, [queryClient]); // Re-run effect if queryClient changes

  if (isLoadingCaixa) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Caixa</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {caixaAberto ? (
                <>
                  <Unlock className="h-5 w-5 text-green-600" />
                  Status do Caixa
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-red-600" />
                  Caixa Fechado
                </>
              )}
            </CardTitle>
            <CardDescription>
              {caixaAberto ? "O caixa está aberto" : "Abra o caixa para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {caixaAberto ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className="bg-green-600" data-testid="badge-status">Aberto</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Operador:</span>
                    <span className="font-medium" data-testid="text-operador">
                      {caixaAberto.operador_nome || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Abertura:</span>
                    <span className="font-medium" data-testid="text-abertura">
                      {format(new Date(caixaAberto.data_abertura), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Saldo Inicial:</span>
                    <span className="font-medium" data-testid="text-saldo-inicial">
                      R$ {(caixaAberto.saldo_inicial || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vendas:</span>
                    <span className="font-medium text-green-600" data-testid="text-total-vendas">
                      + R$ {(caixaAberto.total_vendas || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Suprimentos:</span>
                    <span className="font-medium text-green-600" data-testid="text-total-suprimentos">
                      + R$ {(caixaAberto.total_suprimentos || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Retiradas:</span>
                    <span className="font-medium text-red-600" data-testid="text-total-retiradas">
                      - R$ {(caixaAberto.total_retiradas || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Saldo Atual:</span>
                    <span className="text-xl font-bold" data-testid="text-saldo-atual">
                      R$ {calcularSaldoAtual().toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Botão para ir ao PDV */}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/pdv")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Ir para PDV
                  </Button>

                  {/* Botão para fechar caixa */}
                  <Dialog open={isFecharDialogOpen} onOpenChange={setIsFecharDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        data-testid="button-fechar-caixa"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Fechar Caixa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Fechar Caixa</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleFecharCaixa} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="saldo_final">Saldo Final *</Label>
                          <Input
                            id="saldo_final"
                            name="saldo_final"
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            data-testid="input-saldo-final"
                            value={saldoFinal}
                            onChange={(e) => setSaldoFinal(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="observacoes_fechamento">Observações</Label>
                          <Textarea
                            id="observacoes_fechamento"
                            name="observacoes"
                            placeholder="Observações sobre o fechamento"
                            data-testid="input-observacoes-fechamento"
                            value={observacoesFechamento}
                            onChange={(e) => setObservacoesFechamento(e.target.value)}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          data-testid="button-confirmar-fechamento"
                          disabled={!saldoFinal || parseFloat(saldoFinal) < 0}
                        >
                          Confirmar Fechamento
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <Dialog open={isAbrirDialogOpen} onOpenChange={setIsAbrirDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" data-testid="button-abrir-caixa">
                    <Unlock className="mr-2 h-4 w-4" />
                    Abrir Caixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Caixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAbrirCaixa} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="saldo_inicial">Saldo Inicial *</Label>
                      <Input
                        id="saldo_inicial"
                        name="saldo_inicial"
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        data-testid="input-saldo-inicial"
                        value={saldoInicial}
                        onChange={(e) => setSaldoInicial(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes_abertura">Observações</Label>
                      <Textarea
                        id="observacoes_abertura"
                        name="observacoes"
                        placeholder="Observações sobre a abertura"
                        data-testid="input-observacoes-abertura"
                        value={observacoesAbertura}
                        onChange={(e) => setObservacoesAbertura(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" data-testid="button-confirmar-abertura">
                      Confirmar Abertura
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {caixaAberto && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Movimentações
              </CardTitle>
              <CardDescription>
                Registre suprimentos ou retiradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Dialog open={isMovimentacaoDialogOpen && tipoMovimentacao === "suprimento"} onOpenChange={(open) => {
                  setIsMovimentacaoDialogOpen(open);
                  if (open) setTipoMovimentacao("suprimento");
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-suprimento">
                      <Plus className="mr-2 h-4 w-4" />
                      Suprimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Registrar Suprimento
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMovimentacao} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor_suprimento">Valor *</Label>
                        <Input
                          id="valor_suprimento"
                          name="valor"
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          data-testid="input-valor-suprimento"
                          value={valorMovimentacao}
                          onChange={(e) => setValorMovimentacao(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descricao_suprimento">Descrição</Label>
                        <Textarea
                          id="descricao_suprimento"
                          name="descricao"
                          placeholder="Motivo do suprimento"
                          data-testid="input-descricao-suprimento"
                          value={descricaoMovimentacao}
                          onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" data-testid="button-confirmar-suprimento">
                        Confirmar Suprimento
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isMovimentacaoDialogOpen && tipoMovimentacao === "retirada"} onOpenChange={(open) => {
                  setIsMovimentacaoDialogOpen(open);
                  if (open) setTipoMovimentacao("retirada");
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-retirada">
                      <Minus className="mr-2 h-4 w-4" />
                      Retirada
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        Registrar Retirada
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMovimentacao} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor_retirada">Valor *</Label>
                        <Input
                          id="valor_retirada"
                          name="valor"
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          data-testid="input-valor-retirada"
                          value={valorMovimentacao}
                          onChange={(e) => setValorMovimentacao(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descricao_retirada">Descrição</Label>
                        <Textarea
                          id="descricao_retirada"
                          name="descricao"
                          placeholder="Motivo da retirada"
                          data-testid="input-descricao-retirada"
                          value={descricaoMovimentacao}
                          onChange={(e) => setDescricaoMovimentacao(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="button-confirmar-retirada">
                        Confirmar Retirada
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {movimentacoes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Últimas Movimentações</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {movimentacoes.slice(0, 5).map((mov: any) => (
                      <div key={mov.id} className="flex justify-between items-center text-sm border-b pb-1" data-testid={`movimentacao-${mov.id}`}>
                        <div>
                          <Badge variant={mov.tipo === "suprimento" ? "default" : "destructive"} className="mr-2">
                            {mov.tipo === "suprimento" ? "Suprimento" : "Retirada"}
                          </Badge>
                          <span className="text-muted-foreground">{mov.descricao || "Sem descrição"}</span>
                        </div>
                        <span className={`font-medium ${mov.tipo === "suprimento" ? "text-green-600" : "text-red-600"}`}>
                          {mov.tipo === "suprimento" ? "+" : "-"} R$ {mov.valor.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {hasPermission("historico_caixas") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Caixas
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="incluir-arquivados-caixas" className="text-sm font-normal cursor-pointer">
                    Incluir Arquivados
                  </Label>
                  <Switch
                    id="incluir-arquivados-caixas"
                    checked={incluirArquivados}
                    onCheckedChange={setIncluirArquivados}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLimparHistorico}
                  disabled={caixas.filter((c: any) => c.status === "fechado").length === 0}
                  data-testid="button-limpar-historico"
                >
                  Limpar Histórico
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caixas.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum caixa encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Fechamento</TableHead>
                    <TableHead>Saldo Inicial</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Saldo Final</TableHead>
                    <TableHead>Obs. Abertura</TableHead>
                    <TableHead>Obs. Fechamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caixas.map((caixa: any) => (
                    <TableRow key={caixa.id} data-testid={`row-caixa-${caixa.id}`}>
                      <TableCell>{caixa.id}</TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {caixa.operador_nome || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(caixa.data_abertura), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>
                        {caixa.data_fechamento
                          ? format(new Date(caixa.data_fechamento), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>R$ {(caixa.saldo_inicial || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">R$ {(caixa.total_vendas || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        {caixa.saldo_final ? `R$ ${caixa.saldo_final.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={caixa.observacoes_abertura || ""}>
                          {caixa.observacoes_abertura || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={caixa.observacoes_fechamento || ""}>
                          {caixa.observacoes_fechamento || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={caixa.status === "aberto" ? "default" : "secondary"}>
                          {caixa.status === "aberto" ? "Aberto" : "Fechado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}