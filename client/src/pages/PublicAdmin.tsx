import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Crown, Shield, CheckCircle2, AlertCircle, Trash2, UserPlus, Key, Webhook, Database, Activity, Filter, Search, TrendingUp, DollarSign, UserCheck, Lock, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

// Senha mais forte
const ADMIN_PASSWORD = "Pavisoft@2025#Admin";
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
  status: string;
  data_criacao?: string;
  data_expiracao_trial?: string;
  data_expiracao_plano?: string;
  ultimo_acesso?: string;
  cadastro?: string; // Adicionado para cálculo de novos cadastros
  max_funcionarios?: number; // Adicionado para limite de funcionários
}

interface Plano {
  id: number;
  nome: string;
  preco: number;
  duracao_dias: number;
  descricao?: string;
  ativo: string;
}

interface ConfigAsaas {
  id: number;
  api_key: string;
  ambiente: string;
  webhook_url?: string;
  account_id?: string;
  ultima_sincronizacao?: string;
  status_conexao?: string;
}

export default function PublicAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlano, setFilterPlano] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createPlanoOpen, setCreatePlanoOpen] = useState(false);
  const [testingAsaas, setTestingAsaas] = useState(false);

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("admin_auth");
    const authTime = sessionStorage.getItem("admin_auth_time");

    if (adminAuth === "authenticated" && authTime) {
      const elapsed = Date.now() - parseInt(authTime);
      if (elapsed < SESSION_TIMEOUT) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem("admin_auth");
        sessionStorage.removeItem("admin_auth_time");
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Auto-logout por inatividade
  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsAuthenticated(false);
        sessionStorage.removeItem("admin_auth");
        sessionStorage.removeItem("admin_auth_time");
        toast({
          title: "Sessão expirada",
          description: "Você foi desconectado por inatividade",
          variant: "destructive",
        });
      }, SESSION_TIMEOUT);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timer);
    };
  }, [isAuthenticated, toast]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "authenticated");
      sessionStorage.setItem("admin_auth_time", Date.now().toString());
      toast({
        title: "Acesso concedido",
        description: "Bem-vindo ao painel administrativo",
      });
    } else {
      toast({
        title: "Senha incorreta",
        description: "Tente novamente",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    senha: "",
    plano: "free",
    is_admin: "false",
  });

  const [newPlano, setNewPlano] = useState({
    nome: "",
    preco: 0,
    duracao_dias: 30,
    descricao: "",
  });

  const [asaasConfig, setAsaasConfig] = useState({
    api_key: "",
    ambiente: "sandbox",
    webhook_url: "",
    account_id: "",
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: planos = [] } = useQuery<Plano[]>({
    queryKey: ["/api/planos"],
  });

  const { data: configAsaasData } = useQuery<ConfigAsaas>({
    queryKey: ["/api/config-asaas"],
  });

  const { data: allFuncionarios = [] } = useQuery({
    queryKey: ["/api/funcionarios/all"],
    queryFn: async () => {
      const funcionarios: any[] = [];
      for (const user of users) {
        try {
          const response = await apiRequest("GET", `/api/funcionarios?conta_id=${user.id}`);
          const userFuncionarios = await response.json();
          funcionarios.push(...userFuncionarios.map((f: any) => ({ ...f, conta_nome: user.nome })));
        } catch (error) {
          console.error(`Erro ao buscar funcionários do usuário ${user.id}:`, error);
        }
      }
      return funcionarios;
    },
    enabled: users.length > 0,
  });

  useEffect(() => {
    if (configAsaasData) {
      setAsaasConfig({
        api_key: configAsaasData.api_key || "",
        ambiente: configAsaasData.ambiente || "sandbox",
        webhook_url: configAsaasData.webhook_url || "",
        account_id: configAsaasData.account_id || "",
      });
    }
  }, [configAsaasData]);

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const updateType = variables.updates.max_funcionarios !== undefined
        ? "Limite de funcionários atualizado"
        : "Usuário atualizado";
      toast({
        title: updateType,
        description: "Informações atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const result = await response.json();

      // Se o plano selecionado não for trial, atualiza imediatamente
      if (userData.plano !== "trial" && result.id) {
        const hoje = new Date();
        const updates: any = { plano: userData.plano };

        if (userData.plano === "mensal") {
          hoje.setMonth(hoje.getMonth() + 1);
          updates.data_expiracao_plano = hoje.toISOString();
          updates.data_expiracao_trial = null;
        } else if (userData.plano === "anual") {
          hoje.setFullYear(hoje.getFullYear() + 1);
          updates.data_expiracao_plano = hoje.toISOString();
          updates.data_expiracao_trial = null;
        } else if (userData.plano === "premium") {
          hoje.setFullYear(hoje.getFullYear() + 10);
          updates.data_expiracao_plano = hoje.toISOString();
          updates.data_expiracao_trial = null;
        } else if (userData.plano === "free") {
          updates.data_expiracao_plano = null;
          updates.data_expiracao_trial = null;
        }

        // Adiciona o limite padrão de funcionários para novos usuários
        updates.max_funcionarios = 5;

        // Atualiza o plano e data de expiração
        await apiRequest("PATCH", `/api/users/${result.id}`, updates);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado com sucesso! ✅",
        description: "O plano e data de expiração foram configurados corretamente.",
      });
      setCreateUserOpen(false);
      setNewUser({ nome: "", email: "", senha: "", plano: "free", is_admin: "false" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "Usuário removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const createPlanoMutation = useMutation({
    mutationFn: async (planoData: typeof newPlano) => {
      const response = await apiRequest("POST", "/api/planos", planoData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos"] });
      toast({
        title: "Plano criado",
        description: "Novo plano criado com sucesso!",
      });
      setCreatePlanoOpen(false);
      setNewPlano({ nome: "", preco: 0, duracao_dias: 30, descricao: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveAsaasMutation = useMutation({
    mutationFn: async (config: typeof asaasConfig) => {
      const response = await apiRequest("POST", "/api/config-asaas", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config-asaas"] });
      toast({
        title: "Configuração salva",
        description: "Configuração Asaas atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testAsaasConnection = async () => {
    setTestingAsaas(true);
    try {
      const response = await apiRequest("POST", "/api/config-asaas/test", {
        api_key: asaasConfig.api_key,
        ambiente: asaasConfig.ambiente,
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/config-asaas"] });
      } else {
        toast({
          title: "Falha na conexão",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingAsaas(false);
    }
  };

  const updateUserPlanMutation = useMutation({
    mutationFn: async ({ userId, plano }: { userId: string; plano: string }) => {
      const updates: any = { plano };

      // Calcular nova data de expiração baseada no plano
      const hoje = new Date();
      if (plano === "trial") {
        hoje.setDate(hoje.getDate() + 7);
        updates.data_expiracao_trial = hoje.toISOString();
        updates.data_expiracao_plano = hoje.toISOString();
      } else if (plano === "mensal") {
        hoje.setMonth(hoje.getMonth() + 1);
        updates.data_expiracao_plano = hoje.toISOString();
        updates.data_expiracao_trial = null;
      } else if (plano === "anual") {
        hoje.setFullYear(hoje.getFullYear() + 1);
        updates.data_expiracao_plano = hoje.toISOString();
        updates.data_expiracao_trial = null;
      } else if (plano === "premium") {
        // Premium sem expiração ou com expiração muito longa
        hoje.setFullYear(hoje.getFullYear() + 10);
        updates.data_expiracao_plano = hoje.toISOString();
        updates.data_expiracao_trial = null;
      } else if (plano === "free") {
        updates.data_expiracao_plano = null;
        updates.data_expiracao_trial = null;
      }

      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Plano atualizado com sucesso! ✅",
        description: `Plano alterado para ${variables.plano.toUpperCase()} e data de expiração atualizada.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserPlanMutation.mutate({ userId, plano: newPlan });
  };

  const handleAdminToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "true" ? "false" : "true";
    updateUserMutation.mutate({ id: userId, updates: { is_admin: newStatus } });
  };

  const handleStatusToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    updateUserMutation.mutate({ id: userId, updates: { status: newStatus } });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    if (plan === "premium") return "default";
    if (plan === "trial") return "outline";
    return "secondary";
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "ativo" ? "default" : "destructive";
  };

  const calculateDaysRemaining = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days; // Retorna 0 se já expirou
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlano = filterPlano === "todos" || user.plano === filterPlano;
    const matchesStatus = filterStatus === "todos" || user.status === filterStatus;
    return matchesSearch && matchesPlano && matchesStatus;
  });

  const stats = {
    total: users.length,
    premium: users.filter((u) => u.plano === "premium").length,
    free: users.filter((u) => u.plano === "free").length,
    admins: users.filter((u) => u.is_admin === "true").length,
    ativos: users.filter((u) => u.status === "ativo").length,
    inativos: users.filter((u) => u.status === "inativo").length,
    expiringTrial: users.filter(u => {
      const days = calculateDaysRemaining(u.data_expiracao_trial);
      return days !== null && days <= 3 && days > 0;
    }).length,
    trial: users.filter(u => u.plano === "trial").length, // Adicionado para estatísticas
  };

  // Dados para gráficos
  const userGrowthData = users.slice(-7).map((u, i) => ({
    day: `Dia ${i + 1}`,
    usuarios: i + 1
  }));

  const planDistributionData = [
    { name: "Premium", value: stats.premium, color: "#2563EB" },
    { name: "Free", value: stats.free, color: "#10B981" }
  ].filter(item => item.value > 0);

  const statusDistributionData = [
    { name: "Ativos", value: stats.ativos, color: "#10B981" },
    { name: "Inativos", value: stats.inativos, color: "#EF4444" }
  ].filter(item => item.value > 0);

  const revenueData = planos.map(p => ({
    nome: p.nome,
    receita: p.preco * users.filter(u => u.plano === p.nome.toLowerCase() && u.status === "ativo").length
  }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">Painel Administrativo</CardTitle>
              <CardDescription className="text-base mt-2">
                Sistema Pavisoft - Acesso Restrito
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-base font-semibold">Senha de Administrador</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  autoFocus
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold">
                <Key className="h-5 w-5 mr-2" />
                Acessar Painel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => setLocation("/")}
              >
                Voltar ao Site
              </Button>
            </form>
            <Alert className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                Este painel é exclusivo para administradores do sistema. Sessão expira em 10 minutos de inatividade.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Painel Administrativo Pavisoft
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Gestão completa do sistema
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false);
              sessionStorage.removeItem("admin_auth");
              sessionStorage.removeItem("admin_auth_time");
              setLocation("/");
            }}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
            <TabsTrigger value="dashboard" className="text-base" data-testid="tab-dashboard">
              <Activity className="h-5 w-5 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="text-base" data-testid="tab-usuarios">
              <Users className="h-5 w-5 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="funcionarios" className="text-base" data-testid="tab-funcionarios">
              <UserCheck className="h-5 w-5 mr-2" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="planos" className="text-base" data-testid="tab-planos">
              <Crown className="h-5 w-5 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="asaas" className="text-base" data-testid="tab-asaas">
              <DollarSign className="h-5 w-5 mr-2" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Total de Usuários</CardTitle>
                  <Users className="h-8 w-8 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-total-users">{stats.total}</div>
                  <p className="text-sm opacity-90 mt-2">Cadastrados no sistema</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Assinantes Ativos</CardTitle>
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-active-users">{stats.ativos}</div>
                  <p className="text-sm opacity-90 mt-2">Com planos válidos</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Trials Ativos</CardTitle>
                  <Clock className="h-8 w-8 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-trial-users">{stats.trial}</div>
                  <p className="text-sm opacity-90 mt-2">Testando o sistema</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">Administradores</CardTitle>
                  <Shield className="h-8 w-8 opacity-80" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-admin-users">{stats.admins}</div>
                  <p className="text-sm opacity-90 mt-2">Acessos privilegiados</p>
                </CardContent>
              </Card>
            </div>

            {/* Informativos e Alertas de Gestão */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Alertas de Expiração */}
              <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-800/50">
                <CardHeader>
                  <CardTitle className="text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Atenção Urgente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-red-900/40 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-red-200">Expirando em 7 dias</span>
                      <Badge variant="destructive" className="bg-red-600">
                        {users.filter(u => {
                          const days = calculateDaysRemaining(u.data_expiracao_plano || u.data_expiracao_trial);
                          return days !== null && days > 0 && days <= 7;
                        }).length}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-300">Contato imediato necessário</p>
                  </div>

                  <div className="p-3 bg-orange-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-orange-200">Expirando em 15 dias</span>
                      <Badge variant="secondary" className="bg-orange-600 text-white">
                        {users.filter(u => {
                          const days = calculateDaysRemaining(u.data_expiracao_plano || u.data_expiracao_trial);
                          return days !== null && days > 7 && days <= 15;
                        }).length}
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-300">Planejar abordagem</p>
                  </div>

                  <div className="p-3 bg-yellow-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-yellow-200">Expirando em 30 dias</span>
                      <Badge variant="outline" className="border-yellow-600 text-yellow-200">
                        {users.filter(u => {
                          const days = calculateDaysRemaining(u.data_expiracao_plano || u.data_expiracao_trial);
                          return days !== null && days > 15 && days <= 30;
                        }).length}
                      </Badge>
                    </div>
                    <p className="text-xs text-yellow-300">Preparar renovação</p>
                  </div>

                  <div className="p-3 bg-gray-900/40 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-200">Já expirados</span>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {users.filter(u => {
                          const days = calculateDaysRemaining(u.data_expiracao_plano || u.data_expiracao_trial);
                          return days !== null && days === 0;
                        }).length}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">Reativar ou remover</p>
                  </div>
                </CardContent>
              </Card>

              {/* Conversão e Performance */}
              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 border-blue-800/50">
                <CardHeader>
                  <CardTitle className="text-blue-200 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversão & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-900/40 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-200">Taxa de Conversão Trial</span>
                      <Badge className="bg-blue-600">
                        {stats.trial > 0 ? Math.round((stats.ativos / (stats.trial + stats.ativos)) * 100) : 0}%
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-300">
                      {users.filter(u => u.plano !== "trial" && u.plano !== "free" && u.status === "ativo").length} convertidos de {stats.trial + users.filter(u => u.plano !== "trial" && u.plano !== "free" && u.status === "ativo").length} trials
                    </div>
                  </div>

                  <div className="p-3 bg-green-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-200">Receita Mensal (MRR)</span>
                      <Badge className="bg-green-600">
                        R$ {(
                          users.filter(u => u.plano === "mensal" && u.status === "ativo").length * 79.99 +
                          users.filter(u => u.plano === "anual" && u.status === "ativo").length * 67.99
                        ).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-xs text-green-300">
                      {users.filter(u => (u.plano === "mensal" || u.plano === "anual") && u.status === "ativo").length} assinantes pagantes
                    </div>
                  </div>

                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-purple-200">Receita Anual (ARR)</span>
                      <Badge className="bg-purple-600">
                        R$ {(
                          users.filter(u => u.plano === "mensal" && u.status === "ativo").length * 79.99 * 12 +
                          users.filter(u => u.plano === "anual" && u.status === "ativo").length * 815.88
                        ).toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-xs text-purple-300">
                      Projeção baseada em assinantes ativos
                    </div>
                  </div>

                  <div className="p-3 bg-pink-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-pink-200">Ticket Médio</span>
                      <Badge className="bg-pink-600">
                        R$ {stats.ativos > 0 ? (
                          (users.filter(u => u.plano === "mensal" && u.status === "ativo").length * 79.99 +
                          users.filter(u => u.plano === "anual" && u.status === "ativo").length * 67.99) /
                          users.filter(u => (u.plano === "mensal" || u.plano === "anual") && u.status === "ativo").length
                        ).toFixed(2) : "0.00"}
                      </Badge>
                    </div>
                    <div className="text-xs text-pink-300">
                      Valor médio por cliente
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Recomendadas */}
              <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-950/30 border-indigo-800/50">
                <CardHeader>
                  <CardTitle className="text-indigo-200 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Ações Recomendadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.filter(u => {
                    const days = calculateDaysRemaining(u.data_expiracao_trial);
                    return u.plano === "trial" && days !== null && days <= 3 && days > 0;
                  }).length > 0 && (
                    <Alert className="bg-red-900/30 border-red-700">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertTitle className="text-red-200">Trials Críticos</AlertTitle>
                      <AlertDescription className="text-red-300 text-xs">
                        {users.filter(u => {
                          const days = calculateDaysRemaining(u.data_expiracao_trial);
                          return u.plano === "trial" && days !== null && days <= 3 && days > 0;
                        }).length} trial(s) expirando em até 3 dias
                      </AlertDescription>
                    </Alert>
                  )}

                  {users.filter(u => u.status === "inativo").length > 0 && (
                    <Alert className="bg-gray-900/30 border-gray-700">
                      <Users className="h-4 w-4 text-gray-400" />
                      <AlertTitle className="text-gray-200">Clientes Inativos</AlertTitle>
                      <AlertDescription className="text-gray-300 text-xs">
                        {users.filter(u => u.status === "inativo").length} cliente(s) inativos - considere reativação
                      </AlertDescription>
                    </Alert>
                  )}

                  {users.filter(u => u.plano === "free").length > 3 && (
                    <Alert className="bg-blue-900/30 border-blue-700">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <AlertTitle className="text-blue-200">Oportunidade de Upsell</AlertTitle>
                      <AlertDescription className="text-blue-300 text-xs">
                        {users.filter(u => u.plano === "free").length} usuários no plano free
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="p-3 bg-indigo-900/40 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-indigo-200">Renovações do Mês</span>
                      <Badge className="bg-indigo-600">
                        {users.filter(u => {
                          const expDate = u.data_expiracao_plano;
                          if (!expDate) return false;
                          const exp = new Date(expDate);
                          const now = new Date();
                          return exp.getMonth() === now.getMonth() && exp.getFullYear() === now.getFullYear();
                        }).length}
                      </Badge>
                    </div>
                    <div className="text-xs text-indigo-300">
                      Acompanhe as renovações previstas
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-900/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-cyan-200">Novos Cadastros (30d)</span>
                      <Badge className="bg-cyan-600">
                        {users.filter(u => {
                          const dataRef = u.data_criacao || u.cadastro;
                          if (!dataRef) return false;
                          const cadastro = new Date(dataRef);
                          const now = new Date();
                          const diff = now.getTime() - cadastro.getTime();
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          return days <= 30 && days >= 0;
                        }).length}
                      </Badge>
                    </div>
                    <div className="text-xs text-cyan-300">
                      Novos usuários no último mês
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
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

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-6 w-6 text-green-600" />
                    Status dos Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {revenueData.length > 0 && (
                <Card className="shadow-lg lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      Receita por Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="nome" className="text-sm" />
                          <YAxis className="text-sm" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="receita" fill="#10B981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Status Asaas */}
            {configAsaasData && (
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-6 w-6" />
                    Status da Integração Asaas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant={configAsaasData.status_conexao === "conectado" ? "default" : "secondary"} className="text-base px-4 py-2">
                      {configAsaasData.status_conexao === "conectado" ? "✓ Conectado" : "✗ Desconectado"}
                    </Badge>
                    <span className="text-base text-muted-foreground">
                      <strong>Ambiente:</strong> {configAsaasData.ambiente === "sandbox" ? "Sandbox" : "Produção"}
                    </span>
                    {configAsaasData.ultima_sincronizacao && (
                      <span className="text-base text-muted-foreground">
                        <strong>Última sincronização:</strong> {new Date(configAsaasData.ultima_sincronizacao).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search" className="text-base">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="input-search-users"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="filter-plano" className="text-base">Plano</Label>
                    <Select value={filterPlano} onValueChange={setFilterPlano}>
                      <SelectTrigger className="w-36 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-status" className="text-base">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-36 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await apiRequest("POST", "/api/asaas/sync");
                        const result = await response.json();
                        toast({
                          title: "Sincronização concluída",
                          description: result.message,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                      } catch (error: any) {
                        toast({
                          title: "Erro na sincronização",
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="h-12"
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    Sincronizar Asaas
                  </Button>
                  <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-12" data-testid="button-create-user">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Criar Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                        <DialogDescription>
                          Preencha os dados do novo usuário
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            value={newUser.nome}
                            onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                            data-testid="input-new-user-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            data-testid="input-new-user-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="senha">Senha</Label>
                          <Input
                            id="senha"
                            type="password"
                            value={newUser.senha}
                            onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })}
                            data-testid="input-new-user-password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plano">Plano</Label>
                          <Select value={newUser.plano} onValueChange={(v) => setNewUser({ ...newUser, plano: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_admin"
                            checked={newUser.is_admin === "true"}
                            onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked ? "true" : "false" })}
                            data-testid="checkbox-new-user-admin"
                          />
                          <Label htmlFor="is_admin">Administrador</Label>
                        </div>
                        <Button onClick={() => createUserMutation.mutate(newUser)} className="w-full" data-testid="button-submit-new-user">
                          Criar Usuário
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Data Criação</TableHead>
                        <TableHead className="font-semibold">Plano</TableHead>
                        <TableHead className="font-semibold">Dias Restantes</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Limite Funcionários</TableHead>
                        <TableHead className="font-semibold">Admin</TableHead>
                        <TableHead className="font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const daysRemaining = user.plano === "trial"
                            ? calculateDaysRemaining(user.data_expiracao_trial)
                            : calculateDaysRemaining(user.data_expiracao_plano);

                          return (
                            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                              <TableCell className="font-medium">{user.nome}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                {user.data_criacao
                                  ? new Date(user.data_criacao).toLocaleDateString('pt-BR')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {editingUser === user.id ? (
                                  <Select
                                    value={user.plano}
                                    onValueChange={(value) => {
                                      handlePlanChange(user.id, value);
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Free</SelectItem>
                                      <SelectItem value="trial">Trial</SelectItem>
                                      <SelectItem value="mensal">Mensal</SelectItem>
                                      <SelectItem value="anual">Anual</SelectItem>
                                      <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge
                                    variant={getPlanBadgeVariant(user.plano)}
                                    className="cursor-pointer"
                                    onClick={() => setEditingUser(user.id)}
                                    data-testid={`badge-plan-${user.id}`}
                                  >
                                    {user.plano === "trial" && "Trial (7 dias)"}
                                    {user.plano === "mensal" && "Mensal"}
                                    {user.plano === "anual" && "Anual"}
                                    {user.plano === "premium" && "Premium"}
                                    {user.plano === "free" && "Free"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {daysRemaining !== null ? (
                                  <div className="flex flex-col gap-1">
                                    <Badge variant={daysRemaining <= 3 ? "destructive" : daysRemaining <= 7 ? "default" : "secondary"}>
                                      {daysRemaining} dias
                                    </Badge>
                                    {user.data_expiracao_plano && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(user.data_expiracao_plano).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Sem limite</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getStatusBadgeVariant(user.status)}
                                  className="cursor-pointer"
                                  onClick={() => handleStatusToggle(user.id, user.status)}
                                  data-testid={`badge-status-${user.id}`}
                                >
                                  {user.status === "ativo" ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={user.max_funcionarios || 5}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value) || 5;
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: { max_funcionarios: newValue }
                                      });
                                    }}
                                    className="w-20 h-8 text-sm"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.is_admin === "true" ? "default" : "secondary"}
                                  className="cursor-pointer"
                                  onClick={() => handleAdminToggle(user.id, user.is_admin)}
                                  data-testid={`badge-admin-${user.id}`}
                                >
                                  {user.is_admin === "true" ? (
                                    <>
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </>
                                  ) : (
                                    "Usuário"
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.id)}
                                  data-testid={`button-delete-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funcionarios" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Funcionários de Todas as Contas</CardTitle>
                <CardDescription className="text-base">
                  Visualize todos os funcionários cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Conta</TableHead>
                        <TableHead className="font-semibold">Data Criação</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allFuncionarios.length > 0 ? (
                        allFuncionarios.map((func: any) => (
                          <TableRow key={func.id}>
                            <TableCell className="font-medium">{func.nome}</TableCell>
                            <TableCell>{func.email}</TableCell>
                            <TableCell>{func.conta_nome}</TableCell>
                            <TableCell>
                              {func.data_criacao
                                ? new Date(func.data_criacao).toLocaleDateString('pt-BR')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={func.status === "ativo" ? "default" : "secondary"}>
                                {func.status || 'ativo'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Nenhum funcionário cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planos" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl">Gestão de Planos</CardTitle>
                    <CardDescription className="text-base">Gerencie os planos disponíveis no sistema</CardDescription>
                  </div>
                  <Dialog open={createPlanoOpen} onOpenChange={setCreatePlanoOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-12" data-testid="button-create-plan">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Criar Plano
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Plano</DialogTitle>
                        <DialogDescription>
                          Defina os detalhes do novo plano
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="plano-nome">Nome do Plano</Label>
                          <Input
                            id="plano-nome"
                            value={newPlano.nome}
                            onChange={(e) => setNewPlano({ ...newPlano, nome: e.target.value })}
                            data-testid="input-plan-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plano-preco">Preço (R$)</Label>
                          <Input
                            id="plano-preco"
                            type="number"
                            step="0.01"
                            value={newPlano.preco}
                            onChange={(e) => setNewPlano({ ...newPlano, preco: parseFloat(e.target.value) })}
                            data-testid="input-plan-price"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plano-duracao">Duração (dias)</Label>
                          <Input
                            id="plano-duracao"
                            type="number"
                            value={newPlano.duracao_dias}
                            onChange={(e) => setNewPlano({ ...newPlano, duracao_dias: parseInt(e.target.value) })}
                            data-testid="input-plan-duration"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plano-descricao">Descrição</Label>
                          <Textarea
                            id="plano-descricao"
                            value={newPlano.descricao}
                            onChange={(e) => setNewPlano({ ...newPlano, descricao: e.target.value })}
                            data-testid="textarea-plan-description"
                          />
                        </div>
                        <Button onClick={() => createPlanoMutation.mutate(newPlano)} className="w-full" data-testid="button-submit-plan">
                          Criar Plano
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Preço</TableHead>
                        <TableHead className="font-semibold">Duração</TableHead>
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planos.length > 0 ? (
                        planos.map((plano) => (
                          <TableRow key={plano.id} data-testid={`row-plan-${plano.id}`}>
                            <TableCell className="font-medium">{plano.nome}</TableCell>
                            <TableCell>R$ {plano.preco.toFixed(2)}</TableCell>
                            <TableCell>{plano.duracao_dias} dias</TableCell>
                            <TableCell>{plano.descricao || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={plano.ativo === "true" ? "default" : "secondary"}>
                                {plano.ativo === "true" ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Nenhum plano cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="asaas" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Key className="h-6 w-6" />
                  Configuração da API Asaas
                </CardTitle>
                <CardDescription className="text-base">
                  Configure a integração com a plataforma de pagamentos Asaas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-key" className="text-base">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={asaasConfig.api_key}
                    onChange={(e) => setAsaasConfig({ ...asaasConfig, api_key: e.target.value })}
                    placeholder="Insira sua chave de API"
                    className="h-12"
                    data-testid="input-asaas-api-key"
                  />
                </div>

                <div>
                  <Label htmlFor="ambiente" className="text-base">Ambiente</Label>
                  <Select
                    value={asaasConfig.ambiente}
                    onValueChange={(v) => setAsaasConfig({ ...asaasConfig, ambiente: v })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="account-id" className="text-base">ID da Conta Asaas</Label>
                  <Input
                    id="account-id"
                    value={asaasConfig.account_id}
                    onChange={(e) => setAsaasConfig({ ...asaasConfig, account_id: e.target.value })}
                    placeholder="ID da sua conta"
                    className="h-12"
                    data-testid="input-asaas-account-id"
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-url" className="text-base">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Webhook className="h-5 w-5 mt-3 text-muted-foreground" />
                    <Input
                      id="webhook-url"
                      value={asaasConfig.webhook_url}
                      onChange={(e) => setAsaasConfig({ ...asaasConfig, webhook_url: e.target.value })}
                      placeholder="https://seu-dominio.com/webhook/asaas"
                      className="h-12"
                      data-testid="input-asaas-webhook"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveAsaasMutation.mutate(asaasConfig)} className="h-12" data-testid="button-save-asaas-config">
                    <Database className="h-5 w-5 mr-2" />
                    Salvar Configuração
                  </Button>
                  <Button
                    variant="outline"
                    onClick={testAsaasConnection}
                    disabled={testingAsaas || !asaasConfig.api_key}
                    className="h-12"
                    data-testid="button-test-asaas"
                  >
                    {testingAsaas ? "Testando..." : "Testar Conexão"}
                  </Button>
                </div>

                <Alert className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base font-semibold">Importante!</AlertTitle>
                  <AlertDescription className="text-base">
                    Use o ambiente Sandbox para testes. Mude para Produção apenas quando estiver pronto
                    para processar pagamentos reais. Mantenha sua API Key em segurança.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}