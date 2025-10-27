
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
import { Loader2, RefreshCw, ArrowLeft, Package, ShoppingCart, Users, TrendingUp, DollarSign, AlertTriangle, Building2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

type Produto = {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  estoque_minimo: number;
  codigo_barras?: string;
  vencimento?: string;
};

type Venda = {
  id: number;
  produto: string;
  quantidade_vendida: number;
  valor_total: number;
  data: string;
  cliente_id?: number;
};

type Cliente = {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  data_cadastro: string;
};

type Fornecedor = {
  id: number;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  data_cadastro: string;
};

export default function AdminPublico() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assinaturas");

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: produtos = [], isLoading: isLoadingProdutos } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const { data: vendas = [], isLoading: isLoadingVendas } = useQuery<Venda[]>({
    queryKey: ["/api/vendas"],
  });

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: fornecedores = [], isLoading: isLoadingFornecedores } = useQuery<Fornecedor[]>({
    queryKey: ["/api/fornecedores"],
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
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  // Estatísticas gerais
  const totalProdutos = produtos.length;
  const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= p.estoque_minimo).length;
  const valorEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
  const totalVendas = vendas.reduce((sum, v) => sum + v.valor_total, 0);
  const totalClientes = clientes.length;
  const totalFornecedores = fornecedores.length;
  const assinaturasAtivas = subscriptions.filter(s => s.status === "ativo").length;
  const receitaMensal = subscriptions
    .filter(s => s.status === "ativo")
    .reduce((sum, s) => sum + s.valor, 0);

  if (isLoadingSubscriptions || isLoadingUsers || isLoadingProdutos || isLoadingVendas || isLoadingClientes || isLoadingFornecedores) {
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
                Controle total do sistema e clientes
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
              queryClient.invalidateQueries({ queryKey: ["/api/vendas"] });
              queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
              queryClient.invalidateQueries({ queryKey: ["/api/fornecedores"] });
            }}
            variant="outline"
            className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Tudo
          </Button>
        </div>

        {/* Cards de Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-green-500">{assinaturasAtivas}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Receita Mensal</p>
                  <p className="text-2xl font-bold text-blue-500">{formatCurrency(receitaMensal)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total de Produtos</p>
                  <p className="text-2xl font-bold text-purple-500">{totalProdutos}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total em Vendas</p>
                  <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalVendas)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800 grid grid-cols-7 w-full">
            <TabsTrigger value="assinaturas" className="data-[state=active]:bg-blue-600">
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-green-600">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="produtos" className="data-[state=active]:bg-purple-600">
              Produtos
            </TabsTrigger>
            <TabsTrigger value="vendas" className="data-[state=active]:bg-orange-600">
              Vendas
            </TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:bg-pink-600">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="data-[state=active]:bg-yellow-600">
              Fornecedores
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="data-[state=active]:bg-red-600">
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Tab Assinaturas */}
          <TabsContent value="assinaturas" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de Assinaturas</CardTitle>
                <CardDescription className="text-gray-400">
                  Todas as assinaturas e pagamentos dos clientes
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
                      <TableHead className="text-gray-400">Vencimento</TableHead>
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
                          <TableCell className="text-gray-300">{sub.plano.replace("_", " ").toUpperCase()}</TableCell>
                          <TableCell className="text-gray-300">{formatCurrency(sub.valor)}</TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell className="text-gray-300">{formatDate(sub.data_vencimento)}</TableCell>
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

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Usuários do Sistema</CardTitle>
                <CardDescription className="text-gray-400">
                  Total: {users.length} usuários cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Plano</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Data Criação</TableHead>
                      <TableHead className="text-gray-400">Expira Em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-800">
                        <TableCell className="text-white">{user.nome}</TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell className="text-gray-300">{user.plano.toUpperCase()}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(user.data_criacao)}</TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(user.data_expiracao_plano || user.data_expiracao_trial)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="mt-6">
            <div className="grid gap-4 mb-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-400">Total Produtos</p>
                        <p className="text-2xl font-bold text-white">{totalProdutos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-400">Baixo Estoque</p>
                        <p className="text-2xl font-bold text-orange-500">{produtosBaixoEstoque}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-400">Valor em Estoque</p>
                        <p className="text-2xl font-bold text-green-500">{formatCurrency(valorEstoque)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Inventário de Produtos</CardTitle>
                <CardDescription className="text-gray-400">
                  Todos os produtos cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Produto</TableHead>
                      <TableHead className="text-gray-400">Categoria</TableHead>
                      <TableHead className="text-gray-400">Preço</TableHead>
                      <TableHead className="text-gray-400">Estoque</TableHead>
                      <TableHead className="text-gray-400">Mín.</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Código</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id} className="border-gray-800">
                        <TableCell className="text-white">{produto.nome}</TableCell>
                        <TableCell className="text-gray-300">{produto.categoria}</TableCell>
                        <TableCell className="text-gray-300">{formatCurrency(produto.preco)}</TableCell>
                        <TableCell className="text-gray-300">{produto.quantidade}</TableCell>
                        <TableCell className="text-gray-300">{produto.estoque_minimo}</TableCell>
                        <TableCell>
                          {produto.quantidade <= produto.estoque_minimo ? (
                            <Badge variant="destructive">Baixo</Badge>
                          ) : (
                            <Badge variant="default">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">{produto.codigo_barras || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Vendas */}
          <TabsContent value="vendas" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Vendas</CardTitle>
                <CardDescription className="text-gray-400">
                  Total: {vendas.length} vendas | Valor: {formatCurrency(totalVendas)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Data/Hora</TableHead>
                      <TableHead className="text-gray-400">Produtos</TableHead>
                      <TableHead className="text-gray-400">Quantidade</TableHead>
                      <TableHead className="text-gray-400">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.slice(0, 50).map((venda) => (
                      <TableRow key={venda.id} className="border-gray-800">
                        <TableCell className="text-gray-300">{formatDateTime(venda.data)}</TableCell>
                        <TableCell className="text-white">{venda.produto}</TableCell>
                        <TableCell className="text-gray-300">{venda.quantidade_vendida}</TableCell>
                        <TableCell className="text-green-500 font-semibold">{formatCurrency(venda.valor_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Clientes */}
          <TabsContent value="clientes" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Base de Clientes</CardTitle>
                <CardDescription className="text-gray-400">
                  Total: {totalClientes} clientes cadastrados
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
                      <TableHead className="text-gray-400">Data Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.map((cliente) => (
                      <TableRow key={cliente.id} className="border-gray-800">
                        <TableCell className="text-white">{cliente.nome}</TableCell>
                        <TableCell className="text-gray-300">{cliente.cpf_cnpj || "-"}</TableCell>
                        <TableCell className="text-gray-300">{cliente.email || "-"}</TableCell>
                        <TableCell className="text-gray-300">{cliente.telefone || "-"}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(cliente.data_cadastro)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Fornecedores */}
          <TabsContent value="fornecedores" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Fornecedores</CardTitle>
                <CardDescription className="text-gray-400">
                  Total: {totalFornecedores} fornecedores cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">CNPJ</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Telefone</TableHead>
                      <TableHead className="text-gray-400">Data Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id} className="border-gray-800">
                        <TableCell className="text-white">{fornecedor.nome}</TableCell>
                        <TableCell className="text-gray-300">{fornecedor.cnpj || "-"}</TableCell>
                        <TableCell className="text-gray-300">{fornecedor.email || "-"}</TableCell>
                        <TableCell className="text-gray-300">{fornecedor.telefone || "-"}</TableCell>
                        <TableCell className="text-gray-300">{formatDate(fornecedor.data_cadastro)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Relatórios */}
          <TabsContent value="relatorios" className="mt-6">
            <div className="grid gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Financeiro</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Receita Mensal (Assinaturas):</span>
                          <span className="text-green-500 font-semibold">{formatCurrency(receitaMensal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total em Vendas:</span>
                          <span className="text-green-500 font-semibold">{formatCurrency(totalVendas)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valor em Estoque:</span>
                          <span className="text-blue-500 font-semibold">{formatCurrency(valorEstoque)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Operacional</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assinaturas Ativas:</span>
                          <span className="text-white font-semibold">{assinaturasAtivas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total de Produtos:</span>
                          <span className="text-white font-semibold">{totalProdutos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Produtos Baixo Estoque:</span>
                          <span className="text-orange-500 font-semibold">{produtosBaixoEstoque}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total de Vendas:</span>
                          <span className="text-white font-semibold">{vendas.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Clientes Cadastrados:</span>
                          <span className="text-white font-semibold">{totalClientes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fornecedores Ativos:</span>
                          <span className="text-white font-semibold">{totalFornecedores}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
