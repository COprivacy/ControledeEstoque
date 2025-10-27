import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Subscription = {
  id: number;
  user_id: string;
  plano: string;
  status: string;
  valor: number;
  data_inicio: string | null;
  data_vencimento: string | null;
  asaas_payment_id: string | null;
  forma_pagamento: string | null;
  status_pagamento: string | null;
  data_criacao: string;
};

type User = {
  id: string;
  nome: string;
  email: string;
  plano: string;
  status: string;
  data_criacao: string | null;
  data_expiracao_trial: string | null;
  data_expiracao_plano: string | null;
};

export default function AdminPublico() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const reenviarCobranca = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription || !subscription.asaas_payment_id) {
        throw new Error("Assinatura ou pagamento não encontrado");
      }
      return apiRequest(`/api/payments/${subscription.asaas_payment_id}/resend`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Cobrança reenviada",
        description: "A cobrança foi reenviada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
    },
    onError: () => {
      toast({
        title: "Erro ao reenviar cobrança",
        description: "Não foi possível reenviar a cobrança",
        variant: "destructive",
      });
    },
  });

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      ativo: { variant: "default", label: "Ativo" },
      pendente: { variant: "secondary", label: "Pendente" },
      expirado: { variant: "destructive", label: "Expirado" },
      cancelado: { variant: "outline", label: "Cancelado" },
    };
    const config = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filterSubscriptions = (subs: Subscription[]) => {
    switch (activeTab) {
      case "active":
        return subs.filter(s => s.status === "ativo");
      case "pending":
        return subs.filter(s => s.status === "pendente");
      case "expired":
        return subs.filter(s => s.status === "expirado" || s.status === "cancelado");
      default:
        return subs;
    }
  };

  const filteredSubscriptions = filterSubscriptions(subscriptions);

  if (isLoadingSubscriptions || isLoadingUsers) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">
                Gerenciamento de Clientes
              </h1>
              <p className="text-gray-400 mt-1">
                Visualize e gerencie assinaturas e pagamentos
              </p>
            </div>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] })}
            variant="outline"
            className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-all"
            >
              Todas ({subscriptions.length})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              data-testid="tab-active"
            >
              Ativas ({subscriptions.filter(s => s.status === "ativo").length})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white"
              data-testid="tab-pending"
            >
              Pendentes ({subscriptions.filter(s => s.status === "pendente").length})
            </TabsTrigger>
            <TabsTrigger
              value="expired"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              data-testid="tab-expired"
            >
              Expiradas ({subscriptions.filter(s => s.status === "expirado" || s.status === "cancelado").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Assinaturas</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie todas as assinaturas e pagamentos dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Nenhuma assinatura encontrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-gray-800/50">
                          <TableHead className="text-gray-400">Cliente</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">Plano</TableHead>
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Início</TableHead>
                          <TableHead className="text-gray-400">Vencimento</TableHead>
                          <TableHead className="text-gray-400">Forma Pagamento</TableHead>
                          <TableHead className="text-gray-400">Status Pagamento</TableHead>
                          <TableHead className="text-gray-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscriptions.map((sub) => {
                          const user = getUserInfo(sub.user_id);
                          return (
                            <TableRow
                              key={sub.id}
                              className="border-gray-800 hover:bg-gray-800/50"
                              data-testid={`row-subscription-${sub.id}`}
                            >
                              <TableCell className="text-white font-medium" data-testid={`text-nome-${sub.id}`}>
                                {user?.nome || "-"}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-email-${sub.id}`}>
                                {user?.email || "-"}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-plano-${sub.id}`}>
                                {sub.plano.replace("_", " ").toUpperCase()}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-valor-${sub.id}`}>
                                {formatCurrency(sub.valor)}
                              </TableCell>
                              <TableCell data-testid={`cell-status-${sub.id}`}>
                                {getStatusBadge(sub.status)}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-inicio-${sub.id}`}>
                                {formatDate(sub.data_inicio)}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-vencimento-${sub.id}`}>
                                {formatDate(sub.data_vencimento)}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-forma-pagamento-${sub.id}`}>
                                {sub.forma_pagamento || "-"}
                              </TableCell>
                              <TableCell className="text-gray-300" data-testid={`text-status-pagamento-${sub.id}`}>
                                {sub.status_pagamento || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {sub.status === "pendente" && sub.asaas_payment_id && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => reenviarCobranca.mutate(sub.id)}
                                      disabled={reenviarCobranca.isPending}
                                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                      data-testid={`button-reenviar-${sub.id}`}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Reenviar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
