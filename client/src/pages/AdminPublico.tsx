
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, RefreshCw, ArrowLeft, Users, DollarSign, CreditCard, TrendingUp, Edit2, Save, X, Mail, Phone, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  asaas_customer_id?: string;
};

type Cliente = {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
  data_cadastro: string;
};

export default function AdminPublico() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("planos-assinaturas");
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [editedClientData, setEditedClientData] = useState<Cliente | null>(null);
  const [configAsaasOpen, setConfigAsaasOpen] = useState(false);
  const [testingAsaas, setTestingAsaas] = useState(false);

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: configAsaas } = useQuery({
    queryKey: ["/api/config-asaas"],
  });

  const updateClienteMutation = useMutation({
    mutationFn: async (cliente: Cliente) => {
      const response = await apiRequest("PUT", `/api/clientes/${cliente.id}`, cliente);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas com sucesso",
      });
      setEditingClient(null);
      setEditedClientData(null);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    },
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

  const saveConfigAsaasMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/config-asaas", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config-asaas"] });
      toast({
        title: "Configuração salva",
        description: "Configuração Asaas atualizada com sucesso",
      });
      setConfigAsaasOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    },
  });

  const testAsaasConnection = async (apiKey: string, ambiente: string) => {
    setTestingAsaas(true);
    try {
      const response = await apiRequest("POST", "/api/config-asaas/test", {
        api_key: apiKey,
        ambiente,
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: result.message,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingAsaas(false);
    }
  };

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
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return <Badge variant="outline">-</Badge>;
    const methodMap: Record<string, string> = {
      BOLETO: "Boleto",
      CREDIT_CARD: "Cartão",
      PIX: "PIX",
    };
    return <Badge variant="secondary">{methodMap[method] || method}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEditClient = (cliente: Cliente) => {
    setEditingClient(cliente);
    setEditedClientData({ ...cliente });
  };

  const handleSaveClient = () => {
    if (editedClientData) {
      updateClienteMutation.mutate(editedClientData);
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setEditedClientData(null);
  };

  // Estatísticas Asaas
  const assinaturasAtivas = subscriptions.filter(s => s.status === "ativo").length;
  const assinaturasPendentes = subscriptions.filter(s => s.status === "pendente").length;
  const receitaMensal = subscriptions
    .filter(s => s.status === "ativo")
    .reduce((sum, s) => sum + s.valor, 0);
  const receitaPendente = subscriptions
    .filter(s => s.status === "pendente")
    .reduce((sum, s) => sum + s.valor, 0);
  
  // Clientes com planos pagos
  const clientesComPlanos = users.filter(u => 
    subscriptions.some(s => s.user_id === u.id && s.status === "ativo")
  );

  if (isLoadingSubscriptions || isLoadingUsers || isLoadingClientes) {
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
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Painel de Administração Master
              </h1>
              <p className="text-gray-400 mt-1">
                Gestão de Planos, Assinaturas e Clientes
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
            }}
            variant="outline"
            className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Cards de Estatísticas Asaas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-200">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold text-green-100">{assinaturasAtivas}</p>
                  <p className="text-xs text-green-300 mt-1">Clientes pagantes</p>
                </div>
                <Users className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900 to-blue-950 border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Receita Mensal (MRR)</p>
                  <p className="text-3xl font-bold text-blue-100">{formatCurrency(receitaMensal)}</p>
                  <p className="text-xs text-blue-300 mt-1">Recorrente confirmada</p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900 to-orange-950 border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-200">Pendentes</p>
                  <p className="text-3xl font-bold text-orange-100">{assinaturasPendentes}</p>
                  <p className="text-xs text-orange-300 mt-1">{formatCurrency(receitaPendente)}</p>
                </div>
                <CreditCard className="h-10 w-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-950 border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-200">Total Clientes</p>
                  <p className="text-3xl font-bold text-purple-100">{users.length}</p>
                  <p className="text-xs text-purple-300 mt-1">{clientesComPlanos.length} com planos pagos</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800 grid grid-cols-4 w-full">
            <TabsTrigger value="planos-assinaturas" className="data-[state=active]:bg-blue-600">
              Planos & Assinaturas
            </TabsTrigger>
            <TabsTrigger value="clientes-usuarios" className="data-[state=active]:bg-green-600">
              Clientes & Usuários
            </TabsTrigger>
            <TabsTrigger value="base-clientes" className="data-[state=active]:bg-purple-600">
              Base de Clientes
            </TabsTrigger>
            <TabsTrigger value="integracao-asaas" className="data-[state=active]:bg-orange-600">
              Integração Asaas
            </TabsTrigger>
          </TabsList>

          {/* Tab Planos & Assinaturas */}
          <TabsContent value="planos-assinaturas" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Gestão de Planos e Assinaturas Asaas
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Todas as assinaturas e pagamentos processados pela Asaas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Cliente</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Plano</TableHead>
                      <TableHead className="text-gray-400">Valor</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Pagamento</TableHead>
                      <TableHead className="text-gray-400">Forma</TableHead>
                      <TableHead className="text-gray-400">Vencimento</TableHead>
                      <TableHead className="text-gray-400">ID Asaas</TableHead>
                      <TableHead className="text-gray-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => {
                      const user = getUserInfo(sub.user_id);
                      return (
                        <TableRow key={sub.id} className="border-gray-800">
                          <TableCell className="text-white">{user?.nome || "-"}</TableCell>
                          <TableCell className="text-gray-300">{user?.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-blue-400 border-blue-600">
                              {sub.plano.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-400 font-semibold">{formatCurrency(sub.valor)}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            {sub.status_pagamento ? (
                              <Badge variant={sub.status_pagamento === "RECEIVED" ? "default" : "secondary"}>
                                {sub.status_pagamento}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{getPaymentMethodBadge(sub.forma_pagamento)}</TableCell>
                          <TableCell className="text-gray-300">{formatDate(sub.data_vencimento)}</TableCell>
                          <TableCell className="text-xs text-gray-400 font-mono">
                            {sub.asaas_payment_id ? sub.asaas_payment_id.substring(0, 8) + "..." : "-"}
                          </TableCell>
                          <TableCell>
                            {sub.status === "pendente" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reenviarCobranca.mutate(sub.id)}
                                className="bg-gray-800 border-gray-700"
                              >
                                Reenviar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Clientes & Usuários */}
          <TabsContent value="clientes-usuarios" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Clientes com Planos Ativos
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Usuários que possuem assinaturas ativas ({clientesComPlanos.length} de {users.length} usuários)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Plano Atual</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">ID Cliente Asaas</TableHead>
                      <TableHead className="text-gray-400">Data Cadastro</TableHead>
                      <TableHead className="text-gray-400">Expira Em</TableHead>
                      <TableHead className="text-gray-400">Assinaturas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesComPlanos.map((user) => {
                      const userSubscriptions = subscriptions.filter(s => s.user_id === user.id);
                      const activeSubscription = userSubscriptions.find(s => s.status === "ativo");
                      return (
                        <TableRow key={user.id} className="border-gray-800">
                          <TableCell className="text-white font-semibold">{user.nome}</TableCell>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-600">
                              {user.plano.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-xs text-gray-400 font-mono">
                            {user.asaas_customer_id || "-"}
                          </TableCell>
                          <TableCell className="text-gray-300">{formatDate(user.data_criacao)}</TableCell>
                          <TableCell className="text-gray-300">
                            {formatDate(user.data_expiracao_plano || user.data_expiracao_trial)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {userSubscriptions.length} total
                            </Badge>
                            {activeSubscription && (
                              <Badge variant="default" className="ml-2">
                                {formatCurrency(activeSubscription.valor)}/mês
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Base de Clientes */}
          <TabsContent value="base-clientes" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Base Completa de Clientes (Editável)
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Todos os clientes cadastrados no sistema - Clique para editar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">CPF/CNPJ</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Telefone</TableHead>
                      <TableHead className="text-gray-400">Endereço</TableHead>
                      <TableHead className="text-gray-400">Data Cadastro</TableHead>
                      <TableHead className="text-gray-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id} className="border-gray-800">
                        <TableCell className="text-white">{cliente.nome}</TableCell>
                        <TableCell className="text-gray-300">{cliente.cpf_cnpj || "-"}</TableCell>
                        <TableCell className="text-gray-300">{cliente.email || "-"}</TableCell>
                        <TableCell className="text-gray-300">{cliente.telefone || "-"}</TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">{cliente.endereco || "-"}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(cliente.data_cadastro)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClient(cliente)}
                                className="bg-gray-800 border-gray-700"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  Editar Cliente
                                </DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Atualize as informações do cliente
                                </DialogDescription>
                              </DialogHeader>
                              {editedClientData && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="nome" className="text-gray-300">Nome Completo</Label>
                                      <Input
                                        id="nome"
                                        value={editedClientData.nome}
                                        onChange={(e) => setEditedClientData({ ...editedClientData, nome: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cpf_cnpj" className="text-gray-300">CPF/CNPJ</Label>
                                      <Input
                                        id="cpf_cnpj"
                                        value={editedClientData.cpf_cnpj || ""}
                                        onChange={(e) => setEditedClientData({ ...editedClientData, cpf_cnpj: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="email" className="text-gray-300 flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        Email
                                      </Label>
                                      <Input
                                        id="email"
                                        type="email"
                                        value={editedClientData.email || ""}
                                        onChange={(e) => setEditedClientData({ ...editedClientData, email: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="telefone" className="text-gray-300 flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        Telefone
                                      </Label>
                                      <Input
                                        id="telefone"
                                        value={editedClientData.telefone || ""}
                                        onChange={(e) => setEditedClientData({ ...editedClientData, telefone: e.target.value })}
                                        className="bg-gray-800 border-gray-700 text-white"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="endereco" className="text-gray-300 flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      Endereço Completo
                                    </Label>
                                    <Input
                                      id="endereco"
                                      value={editedClientData.endereco || ""}
                                      onChange={(e) => setEditedClientData({ ...editedClientData, endereco: e.target.value })}
                                      className="bg-gray-800 border-gray-700 text-white"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="observacoes" className="text-gray-300">Observações</Label>
                                    <Input
                                      id="observacoes"
                                      value={editedClientData.observacoes || ""}
                                      onChange={(e) => setEditedClientData({ ...editedClientData, observacoes: e.target.value })}
                                      className="bg-gray-800 border-gray-700 text-white"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      className="bg-gray-800 border-gray-700"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={handleSaveClient}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="h-4 w-4 mr-1" />
                                      Salvar Alterações
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Integração Asaas */}
          <TabsContent value="integracao-asaas" className="mt-6">
            <div className="grid gap-6">
              {/* Status da Conexão */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Status da Integração Asaas
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configuração e status da conexão com o gateway de pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">Status da Conexão</p>
                      <div className="flex items-center gap-2">
                        {configAsaas?.status_conexao === "conectado" ? (
                          <>
                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-semibold">Conectado</span>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                            <span className="text-red-400 font-semibold">Desconectado</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">Ambiente</p>
                      <Badge variant={configAsaas?.ambiente === "production" ? "default" : "secondary"}>
                        {configAsaas?.ambiente === "production" ? "Produção" : "Sandbox"}
                      </Badge>
                    </div>
                  </div>

                  {configAsaas?.ultima_sincronizacao && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">Última Sincronização</p>
                      <p className="text-white">{formatDateTime(configAsaas.ultima_sincronizacao)}</p>
                    </div>
                  )}

                  <Dialog open={configAsaasOpen} onOpenChange={setConfigAsaasOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Configurar Integração Asaas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Configuração Asaas
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Configure a integração com o gateway de pagamentos Asaas
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data = {
                            api_key: formData.get("api_key"),
                            ambiente: formData.get("ambiente"),
                            webhook_url: formData.get("webhook_url"),
                          };
                          saveConfigAsaasMutation.mutate(data);
                        }}
                        className="space-y-4 py-4"
                      >
                        <div>
                          <Label htmlFor="api_key" className="text-gray-300">API Key</Label>
                          <Input
                            id="api_key"
                            name="api_key"
                            type="password"
                            defaultValue={configAsaas?.api_key || ""}
                            placeholder="Sua API Key do Asaas"
                            className="bg-gray-800 border-gray-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="ambiente" className="text-gray-300">Ambiente</Label>
                          <Select name="ambiente" defaultValue={configAsaas?.ambiente || "sandbox"}>
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Selecione o ambiente" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                              <SelectItem value="production">Produção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="webhook_url" className="text-gray-300">Webhook URL</Label>
                          <Input
                            id="webhook_url"
                            name="webhook_url"
                            type="url"
                            defaultValue={configAsaas?.webhook_url || ""}
                            placeholder="https://seudominio.com/api/webhook/asaas"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const apiKey = (document.getElementById("api_key") as HTMLInputElement)?.value;
                              const ambiente = (document.querySelector('[name="ambiente"]') as HTMLInputElement)?.value;
                              if (apiKey) {
                                testAsaasConnection(apiKey, ambiente || "sandbox");
                              }
                            }}
                            disabled={testingAsaas}
                            className="bg-gray-800 border-gray-700"
                          >
                            {testingAsaas ? "Testando..." : "Testar Conexão"}
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={saveConfigAsaasMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {saveConfigAsaasMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Informações da Conta Asaas */}
              {configAsaas?.account_id && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Informações da Conta</CardTitle>
                    <CardDescription className="text-gray-400">
                      Dados da sua conta Asaas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Account ID</p>
                        <p className="text-white font-mono text-sm">{configAsaas.account_id}</p>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Webhook URL</p>
                        <p className="text-white text-sm truncate">
                          {configAsaas.webhook_url || "Não configurado"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
