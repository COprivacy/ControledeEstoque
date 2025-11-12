import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  Loader2,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Search,
  UserPlus,
  FileText,
  Eye,
  Trash2,
  ExternalLink,
  Ban,
  Activity,
  BarChart3,
  Calendar,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Save,
  X,
  User,
  LineChart,
  Clock,
  Sparkles,
  Menu,
  Bell,
  LogOut,
  Database,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cliente360Timeline } from "@/components/Cliente360Timeline";
import { Cliente360Notes } from "@/components/Cliente360Notes";

type Subscription = {
  id: number;
  user_id: string;
  plano: string;
  status: string;
  valor: number;
  data_inicio: string | null;
  data_vencimento: string | null;
  mercadopago_payment_id: string | null;
  forma_pagamento: string | null;
  status_pagamento: string | null;
  data_criacao: string;
  invoice_url?: string;
  init_point?: string;
  prazo_limite_pagamento?: string;
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
  mercadopago_customer_id?: string;
  is_admin?: string | boolean;
  cpf_cnpj?: string;
  telefone?: string;
  endereco?: string;
  max_funcionarios?: number;
};

export default function AdminPublico() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientFor360, setSelectedClientFor360] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Calcular métricas
  const assinaturasAtivas = subscriptions.filter(s => s.status === "ativo").length;
  const assinaturasPendentes = subscriptions.filter(s => s.status === "pendente").length;
  const receitaMensal = subscriptions
    .filter(s => s.status === "ativo")
    .reduce((sum, s) => sum + s.valor, 0);

  // Dados para gráficos
  const planDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(user => {
      counts[user.plano] = (counts[user.plano] || 0) + 1;
    });

    const colors: Record<string, string> = {
      free: "#94a3b8",
      trial: "#60a5fa",
      mensal: "#3b82f6",
      premium_mensal: "#3b82f6",
      anual: "#10b981",
      premium_anual: "#10b981",
      premium: "#8b5cf6",
    };

    return Object.entries(counts).map(([plano, value]) => ({
      name: plano.charAt(0).toUpperCase() + plano.slice(1).replace('_', ' '),
      value,
      color: colors[plano] || "#facc15",
    }));
  }, [users]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, color: string }> = {
      ativo: { variant: "default", label: "Ativo", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      pendente: { variant: "secondary", label: "Pendente", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      expirado: { variant: "destructive", label: "Expirado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
      cancelado: { variant: "outline", label: "Cancelado", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    };
    const config = statusMap[status] || { variant: "outline" as const, label: status, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  if (isLoadingSubscriptions || isLoadingUsers) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600 dark:text-slate-300 text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            {sidebarOpen && <span className="font-bold text-lg">Admin Master</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-slate-700"
            onClick={() => setSelectedClientFor360(null)}
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            {sidebarOpen && "Dashboard"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-slate-700"
          >
            <Users className="h-5 w-5 mr-3" />
            {sidebarOpen && "Clientes"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-slate-700"
          >
            <CreditCard className="h-5 w-5 mr-3" />
            {sidebarOpen && "Assinaturas"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-slate-700"
          >
            <Settings className="h-5 w-5 mr-3" />
            {sidebarOpen && "Configurações"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start hover:bg-slate-700"
          >
            <Database className="h-5 w-5 mr-3" />
            {sidebarOpen && "Sistema"}
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-slate-700 hover:text-red-300"
            onClick={() => setLocation("/dashboard")}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {sidebarOpen && "Sair"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedClientFor360 ? 'Cliente 360°' : 'Dashboard Principal'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bem-vindo, Administrador Master
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {assinaturasPendentes}
              </span>
            </Button>
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              }}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedClientFor360 ? (
            // Cliente 360° View
            <div className="space-y-6">
              <Button variant="outline" onClick={() => setSelectedClientFor360(null)}>
                ← Voltar para Dashboard
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline de Atividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Cliente360Timeline userId={selectedClientFor360} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notas Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Cliente360Notes userId={selectedClientFor360} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const client = users.find(u => u.id === selectedClientFor360);
                      const clientSubscriptions = subscriptions.filter(s => s.user_id === selectedClientFor360);

                      return (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Plano Atual</p>
                            <p className="font-semibold">{client?.plano || 'Free'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={client?.status === 'ativo' ? 'default' : 'secondary'}>
                              {client?.status || 'Desconhecido'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Assinaturas</p>
                            <p className="font-semibold">{clientSubscriptions.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data Cadastro</p>
                            <p className="font-semibold">
                              {client?.data_criacao
                                ? new Date(client.data_criacao).toLocaleDateString('pt-BR')
                                : '-'}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Dashboard Principal
            <>
              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Usuários</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{users.length}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          +12% desde a semana passada
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">MRR (Receita Mensal)</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(receitaMensal)}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          +8.5% este mês
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Assinaturas Ativas</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{assinaturasAtivas}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Taxa de conversão: {subscriptions.length > 0 ? ((assinaturasAtivas / subscriptions.length) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Pendentes</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{assinaturasPendentes}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Aguardando pagamento
                        </p>
                      </div>
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Distribuição de Planos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={planDistributionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {planDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Crescimento Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { month: 'Jan', users: 45, revenue: 3500 },
                          { month: 'Fev', users: 52, revenue: 4200 },
                          { month: 'Mar', users: 61, revenue: 4800 },
                          { month: 'Abr', users: 70, revenue: 5500 },
                          { month: 'Mai', users: 85, revenue: 6800 },
                          { month: 'Jun', users: users.length, revenue: receitaMensal },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Clientes */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Clientes Recentes
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar clientes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .filter(user => 
                          user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .slice(0, 10)
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.nome}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.plano}</Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedClientFor360(user.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}