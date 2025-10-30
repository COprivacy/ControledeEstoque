import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, Lock, Unlock, Plus, Minus, History, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Caixa() {
  const [isAbrirDialogOpen, setIsAbrirDialogOpen] = useState(false);
  const [isFecharDialogOpen, setIsFecharDialogOpen] = useState(false);
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<"suprimento" | "retirada">("suprimento");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: caixaAberto, isLoading: isLoadingCaixa } = useQuery({
    queryKey: ["/api/caixas/aberto"],
  });

  const { data: caixas = [] } = useQuery({
    queryKey: ["/api/caixas"],
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["/api/caixas", caixaAberto?.id, "movimentacoes"],
    enabled: !!caixaAberto,
  });

  const abrirCaixaMutation = useMutation({
    mutationFn: async (data: { saldo_inicial: number; observacoes_abertura?: string }) => {
      const response = await fetch("/api/caixas/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast({ title: "Caixa aberto com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao abrir caixa", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: async ({ id, saldo_final, observacoes }: { id: number; saldo_final: number; observacoes?: string }) => {
      const response = await fetch(`/api/caixas/${id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast({ title: "Caixa fechado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao fechar caixa", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const movimentacaoMutation = useMutation({
    mutationFn: async (data: { tipo: string; valor: number; descricao?: string }) => {
      const response = await fetch(`/api/caixas/${caixaAberto.id}/movimentacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toast({ title: "Movimentação registrada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao registrar movimentação", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAbrirCaixa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    abrirCaixaMutation.mutate({
      saldo_inicial: parseFloat(formData.get("saldo_inicial") as string),
      observacoes_abertura: formData.get("observacoes") as string || undefined,
    });
  };

  const handleFecharCaixa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    fecharCaixaMutation.mutate({
      id: caixaAberto.id,
      saldo_final: parseFloat(formData.get("saldo_final") as string),
      observacoes: formData.get("observacoes") as string || undefined,
    });
  };

  const handleMovimentacao = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    movimentacaoMutation.mutate({
      tipo: tipoMovimentacao,
      valor: parseFloat(formData.get("valor") as string),
      descricao: formData.get("descricao") as string || undefined,
    });
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
                  <Dialog open={isFecharDialogOpen} onOpenChange={setIsFecharDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex-1" data-testid="button-fechar-caixa">
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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            name="observacoes"
                            placeholder="Observações sobre o fechamento"
                            data-testid="input-observacoes-fechamento"
                          />
                        </div>
                        <Button type="submit" className="w-full" data-testid="button-confirmar-fechamento">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes_abertura">Observações</Label>
                      <Textarea
                        id="observacoes_abertura"
                        name="observacoes"
                        placeholder="Observações sobre a abertura"
                        data-testid="input-observacoes-abertura"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descricao_suprimento">Descrição</Label>
                        <Textarea
                          id="descricao_suprimento"
                          name="descricao"
                          placeholder="Motivo do suprimento"
                          data-testid="input-descricao-suprimento"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descricao_retirada">Descrição</Label>
                        <Textarea
                          id="descricao_retirada"
                          name="descricao"
                          placeholder="Motivo da retirada"
                          data-testid="input-descricao-retirada"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Caixas
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
                  <TableHead>Abertura</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead>Saldo Inicial</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Saldo Final</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caixas.map((caixa: any) => (
                  <TableRow key={caixa.id} data-testid={`row-caixa-${caixa.id}`}>
                    <TableCell>{caixa.id}</TableCell>
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
    </div>
  );
}
