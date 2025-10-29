import { useState, useMemo } from "react";
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
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Database,
  Search,
  Filter,
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
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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
  invoice_url?: string;
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
  is_admin?: string | boolean;
  cpf_cnpj?: string;
  telefone?: string;
  endereco?: string;
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
  const queryClient = useQueryClient();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configAsaasOpen, setConfigAsaasOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [ambiente, setAmbiente] = useState<"sandbox" | "production">("sandbox");
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planoFilter, setPlanoFilter] = useState<string>("all");

  // Estados de diálogos
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [isCancelSubscriptionDialogOpen, setIsCancelSubscriptionDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [editedClientData, setEditedClientData] = useState<Cliente | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<{
    nome: string;
    email: string;
    senha: string;
    plano: string;
    is_admin: string;
    cpf_cnpj: string;
    telefone: string;
    endereco: string;
    data_expiracao_plano: string | null;
  }>({
    nome: "",
    email: "",
    senha: "",
    plano: "trial",
    is_admin: "false",
    cpf_cnpj: "",
    telefone: "",
    endereco: "",
    data_expiracao_plano: null,
  });
  const [newUserForm, setNewUserForm] = useState({
    nome: "",
    email: "",
    senha: "",
    plano: "trial",
    is_admin: "false",
    cpf_cnpj: "",
    telefone: "",
    endereco: "",
    data_expiracao_plano: null as string | null,
  });

  // Estados do formulário de criação de cliente
  const [newClientForm, setNewClientForm] = useState({
    nome: "",
    email: "",
    cpfCnpj: "",
    plano: "premium_mensal" as "premium_mensal" | "premium_anual",
    formaPagamento: "CREDIT_CARD" as "BOLETO" | "CREDIT_CARD" | "PIX"
  });


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

  const apiRequest = async (method: string, url: string, body?: any) => {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error("Erro na requisição");
    return response;
  };

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
      return apiRequest("POST", `/api/payments/${subscription.asaas_payment_id}/resend`);
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

  const testAsaasMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/config-asaas/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, ambiente }),
      });
      if (!response.ok) throw new Error("Erro ao testar conexão");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Conexão bem-sucedida!", description: data.message });
      } else {
        toast({ title: "Erro na conexão", description: data.message, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao testar conexão", variant: "destructive" });
    },
  });

  const createClientWithAsaasMutation = useMutation({
    mutationFn: async (clientData: typeof newClientForm) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar cliente");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Cliente criado com sucesso!",
        description: "O cliente foi criado e a cobrança foi gerada no Asaas.",
      });
      setIsCreateClientDialogOpen(false);
      setNewClientForm({
        nome: "",
        email: "",
        cpfCnpj: "",
        plano: "premium_mensal",
        formaPagamento: "CREDIT_CARD"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: number; reason: string }) => {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Erro ao cancelar assinatura");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
      setIsCancelSubscriptionDialogOpen(false);
      setCancelReason("");
      setSelectedSubscription(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserPlanMutation = useMutation({
    mutationFn: async ({ userId, plano }: { userId: string; plano: string }) => {
      const updates: any = { plano };

      // Calcular nova data de expiração baseada no plano
      const hoje = new Date();
      if (plano === "trial") {
        hoje.setDate(hoje.getDate() + 7);
        updates.data_expiracao_trial = hoje.toISOString();
        updates.data_expiracao_plano = hoje.toISOString();
      } else if (plano === "mensal" || plano === "premium_mensal") {
        hoje.setMonth(hoje.getMonth() + 1);
        updates.data_expiracao_plano = hoje.toISOString();
        updates.data_expiracao_trial = null;
      } else if (plano === "anual" || plano === "premium_anual") {
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
        updates.da
      }
      // Ensure status is active when plan is changed, unless it's explicitly 'free'
      if (plano !== "free") {
        updates.status = "ativo";
      }

      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas ao usuário
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });

      // Atualizar também o localStorage se o usuário logado for o que foi atualizado
      const currentUserStr = localStorage.getItem("user");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === userId) {
          // Recarregar dados do usuário atualizado
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }
      }

      toast({
        title: "Plano atualizado",
        description: "O plano do usuário foi atualizado com sucesso",
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
  const clientesComPlanos = clientes.filter((c: any) => {
    const user = users.find((u: any) => u.email === c.email);
    return user && (user.plano === "premium" || user.plano === "mensal" || user.plano === "anual");
  });

  // Filtrar usuários com busca e filtros
  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      const matchSearch = searchTerm === "" ||
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "all" || user.status === statusFilter;

      const matchPlano = planoFilter === "all" || user.plano === planoFilter;

      return matchSearch && matchStatus && matchPlano;
    });
  }, [users, searchTerm, statusFilter, planoFilter]);

  // Filtrar assinaturas
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub: any) => {
      const user = users.find((u: any) => u.id === sub.user_id);
      if (!user) return false;

      const matchSearch = searchTerm === "" ||
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSearch;
    });
  }, [subscriptions, users, searchTerm]);

  // Mutations para gerenciamento de usuários
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserForm) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...userData,
        data_criacao: new Date().toISOString(),
        status: "ativo",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado",
        description: "Novo usuário criado com sucesso!",
      });
      setCreateUserOpen(false);
      setNewUserData({
        nome: "",
        email: "",
        senha: "",
        plano: "trial",
        is_admin: "false",
        cpf_cnpj: "",
        telefone: "",
        endereco: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const calcularDataExpiracao = (plano: string): string | null => {
    const hoje = new Date();
    if (plano === "trial") {
      hoje.setDate(hoje.getDate() + 7);
      return hoje.toISOString();
    } else if (plano === "mensal") {
      hoje.setMonth(hoje.getMonth() + 1);
      return hoje.toISOString();
    } else if (plano === "anual") {
      hoje.setFullYear(hoje.getFullYear() + 1);
      return hoje.toISOString();
    }
    return null;
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "Dados atualizados com sucesso!",
      });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro",
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
        title: "Usuário removido",
        description: "Usuário excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const dataExpiracao = calcularDataExpiracao(newUserForm.plano);
    const userData = {
      ...newUserForm,
      data_expiracao_plano: dataExpiracao,
    };
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const isAdmin = user.is_admin === "true" || user.is_admin === true || user.status === "admin";
    setNewUserData({
      nome: user.nome,
      email: user.email,
      senha: "",
      plano: user.plano,
      is_admin: isAdmin ? "true" : "false",
      cpf_cnpj: (user as any).cpf_cnpj || "",
      telefone: (user as any).telefone || "",
      endereco: (user as any).endereco || "",
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updates = { ...newUserData };
      // Remove password if it's empty to avoid sending empty password
      if (!updates.senha) {
        delete updates.senha;
      }
      // Calcula a data de expiração baseada no plano
      const dataExpiracao = calcularDataExpiracao(updates.plano);
      updates.data_expiracao_plano = dataExpiracao;
      // Quando o plano é atualizado, marca o status como ativo
      updates.status = "ativo";

      updateUserMutation.mutate({ id: editingUser.id, updates });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

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

        {/* Barra de Busca e Filtros */}
        <Card className="bg-gray-900 border-gray-800 mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planoFilter} onValueChange={setPlanoFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium_mensal">Premium Mensal</SelectItem>
                  <SelectItem value="premium_anual">Premium Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="usuarios" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1 rounded-lg">
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-cyan-600" data-testid="tab-dashboard">
              <Users className="h-4 w-4 mr-2" />
              Usuários ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="planos-assinaturas" className="data-[state=active]:bg-blue-600" data-testid="tab-planos">
              <CreditCard className="h-4 w-4 mr-2" />
              Assinaturas ({filteredSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="configuracao" className="data-[state=active]:bg-orange-600" data-testid="tab-asaas">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
          </TabsList>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-cyan-900 to-cyan-950 border-cyan-800" data-testid="card-receita-total">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-cyan-200">Receita Total</p>
                        <p className="text-3xl font-bold text-cyan-100">{formatCurrency(receitaMensal + receitaPendente)}</p>
                        <p className="text-xs text-cyan-300 mt-1">Este mês</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-800" data-testid="card-clientes-ativos">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-200">Clientes Ativos</p>
                        <p className="text-3xl font-bold text-green-100">{assinaturasAtivas}</p>
                        <p className="text-xs text-green-300 mt-1">Com assinaturas ativas</p>
                      </div>
                      <CheckCircle className="h-12 w-12 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900 to-purple-950 border-purple-800" data-testid="card-total-usuarios">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-200">Total Usuários</p>
                        <p className="text-3xl font-bold text-purple-100">{users.length}</p>
                        <p className="text-xs text-purple-300 mt-1">{users.filter(u => u.status === 'ativo').length} ativos</p>
                      </div>
                      <Users className="h-12 w-12 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900 to-orange-950 border-orange-800" data-testid="card-taxa-conversao">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-200">Taxa de Conversão</p>
                        <p className="text-3xl font-bold text-orange-100">
                          {users.length > 0 ? ((assinaturasAtivas / users.length) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-orange-300 mt-1">Trial → Pago</p>
                      </div>
                      <Percent className="h-12 w-12 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Planos */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Distribuição de Planos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Trial', value: users.filter(u => u.plano === 'trial').length, color: '#3b82f6' },
                            { name: 'Mensal', value: users.filter(u => u.plano === 'mensal').length, color: '#10b981' },
                            { name: 'Anual', value: users.filter(u => u.plano === 'anual').length, color: '#8b5cf6' },
                            { name: 'Premium', value: users.filter(u => u.plano === 'premium').length, color: '#f59e0b' },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Trial', value: users.filter(u => u.plano === 'trial').length, color: '#3b82f6' },
                            { name: 'Mensal', value: users.filter(u => u.plano === 'mensal').length, color: '#10b981' },
                            { name: 'Anual', value: users.filter(u => u.plano === 'anual').length, color: '#8b5cf6' },
                            { name: 'Premium', value: users.filter(u => u.plano === 'premium').length, color: '#f59e0b' },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gráfico de Status */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Status das Assinaturas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Ativas', value: assinaturasAtivas, color: '#10b981' },
                        { name: 'Pendentes', value: assinaturasPendentes, color: '#f59e0b' },
                        { name: 'Canceladas', value: subscriptions.filter(s => s.status === 'cancelado').length, color: '#ef4444' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#f3f4f6' }}
                        />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Atividades Recentes */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Usuários Recentes
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Últimos 10 usuários cadastrados
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
                        <TableHead className="text-gray-400">Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .slice()
                        .sort((a, b) => {
                          const dateA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
                          const dateB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
                          return dateB - dateA;
                        })
                        .slice(0, 10)
                        .map((user) => (
                          <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800/50" data-testid={`user-row-${user.id}`}>
                            <TableCell className="text-white font-medium">{user.nome}</TableCell>
                            <TableCell className="text-gray-300">{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.plano === 'premium' ? 'default' :
                                  user.plano === 'anual' ? 'secondary' :
                                  'outline'
                                }
                                className={
                                  user.plano === 'trial' ? 'bg-blue-600 text-white' :
                                  user.plano === 'mensal' ? 'bg-green-600 text-white' :
                                  user.plano === 'anual' ? 'bg-purple-600 text-white' :
                                  'bg-orange-600 text-white'
                                }
                              >
                                {user.plano.charAt(0).toUpperCase() + user.plano.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'ativo' ? 'default' : 'destructive'}>
                                {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {user.data_criacao ? formatDate(user.data_criacao) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Alertas e Avisos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border-yellow-800/50">
                  <CardHeader>
                    <CardTitle className="text-yellow-200 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Assinaturas Vencendo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {users.filter(u => {
                        if (!u.data_expiracao_plano) return false;
                        const expDate = new Date(u.data_expiracao_plano);
                        const today = new Date();
                        const daysUntilExp = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilExp >= 0 && daysUntilExp <= 7;
                      }).length > 0 ? (
                        users.filter(u => {
                          if (!u.data_expiracao_plano) return false;
                          const expDate = new Date(u.data_expiracao_plano);
                          const today = new Date();
                          const daysUntilExp = Math.floor((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          return daysUntilExp >= 0 && daysUntilExp <= 7;
                        }).slice(0, 5).map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
                            <div>
                              <p className="text-white font-medium">{user.nome}</p>
                              <p className="text-xs text-yellow-200">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-600 text-white border-yellow-700">
                              {Math.floor((new Date(user.data_expiracao_plano!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4">Nenhuma assinatura vencendo nos próximos 7 dias</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-800/50">
                  <CardHeader>
                    <CardTitle className="text-blue-200 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                        <span className="text-blue-200">Receita Confirmada</span>
                        <span className="text-white font-bold text-lg">{formatCurrency(receitaMensal)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                        <span className="text-blue-200">Receita Pendente</span>
                        <span className="text-white font-bold text-lg">{formatCurrency(receitaPendente)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-900 to-cyan-900 rounded-lg">
                        <span className="text-blue-100 font-semibold">Total Esperado</span>
                        <span className="text-white font-bold text-xl">{formatCurrency(receitaMensal + receitaPendente)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

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
                      <TableHead className="text-gray-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                          Nenhuma assinatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((sub: any) => {
                        const user = users.find((u: any) => u.id === sub.user_id);
                        return (
                          <TableRow key={sub.id} className="border-gray-800">
                            <TableCell className="text-white font-medium">{user?.nome || "-"}</TableCell>
                            <TableCell className="text-gray-300">{user?.email || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="default">{sub.plano}</Badge>
                            </TableCell>
                            <TableCell className="text-white font-semibold">{formatCurrency(sub.valor)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                sub.status === "ativo" ? "default" :
                                sub.status === "cancelado" ? "destructive" :
                                "secondary"
                              }>
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                sub.status_pagamento === "RECEIVED" || sub.status_pagamento === "CONFIRMED" ? "default" :
                                sub.status_pagamento === "PENDING" ? "secondary" :
                                "destructive"
                              }>
                                {sub.status_pagamento || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{sub.forma_pagamento || "-"}</TableCell>
                            <TableCell className="text-gray-400">
                              {sub.data_vencimento ? formatDate(sub.data_vencimento) : "-"}
                            </TableCell>
                            <TableCell className="text-gray-400 font-mono text-xs">
                              {sub.asaas_payment_id ? sub.asaas_payment_id.slice(0, 12) + "..." : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {sub.invoice_url && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(sub.invoice_url, '_blank')}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                                {sub.status === "ativo" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedSubscription(sub);
                                      setIsCancelSubscriptionDialogOpen(true);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Clientes & Usuários */}
          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-6 w-6" />
                      Gestão de Usuários
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Todos os usuários cadastrados no sistema
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Cliente com Asaas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Cliente com Assinatura</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Crie um cliente e gere automaticamente a cobrança no Asaas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Nome Completo</Label>
                          <Input
                            value={newClientForm.nome}
                            onChange={(e) => setNewClientForm({ ...newClientForm, nome: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                            placeholder="Nome do cliente"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newClientForm.email}
                            onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div>
                          <Label>CPF/CNPJ</Label>
                          <Input
                            value={newClientForm.cpfCnpj}
                            onChange={(e) => setNewClientForm({ ...newClientForm, cpfCnpj: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <Label>Plano</Label>
                          <Select
                            value={newClientForm.plano}
                            onValueChange={(value: any) => setNewClientForm({ ...newClientForm, plano: value })}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="premium_mensal">Premium Mensal - R$ 79,99</SelectItem>
                              <SelectItem value="premium_anual">Premium Anual - R$ 67,99/mês</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Forma de Pagamento</Label>
                          <Select
                            value={newClientForm.formaPagamento}
                            onValueChange={(value: any) => setNewClientForm({ ...newClientForm, formaPagamento: value })}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                              <SelectItem value="BOLETO">Boleto</SelectItem>
                              <SelectItem value="PIX">PIX</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => createClientWithAsaasMutation.mutate(newClientForm)}
                          disabled={createClientWithAsaasMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {createClientWithAsaasMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            "Criar Cliente e Gerar Cobrança"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Plano</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Cadastro</TableHead>
                      <TableHead className="text-gray-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user: any) => (
                        <TableRow key={user.id} className="border-gray-800">
                          <TableCell className="text-white font-medium">{user.nome}</TableCell>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.plano === "premium" || user.plano === "mensal" || user.plano === "anual" ? "default" : "secondary"}>
                              {user.plano === "trial" && "Trial"}
                              {user.plano === "free" && "Free"}
                              {user.plano === "mensal" && "Premium Mensal"}
                              {user.plano === "anual" && "Premium Anual"}
                              {user.plano === "premium" && "Premium"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "ativo" ? "default" : "destructive"}>
                              {user.status === "ativo" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {user.data_criacao ? formatDate(user.data_criacao) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsViewUserDialogOpen(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUser(user)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
                                  <Edit2 className="h-5 w-5" />
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
          <TabsContent value="configuracao" className="mt-6">
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

                  <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
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
                              const apiKeyInput = document.getElementById("api_key") as HTMLInputElement;
                              const ambienteSelect = document.querySelector('[name="ambiente"]') as HTMLSelectElement;
                              if (apiKeyInput && ambienteSelect) {
                                testAsaasConnection(apiKeyInput.value, ambienteSelect.value);
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

        {/* Dialog para visualizar detalhes do usuário */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription className="text-gray-400">Informações completas do usuário selecionado</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Nome:</Label>
                    <p className="text-white">{selectedUser.nome}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Email:</Label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Plano:</Label>
                    <p className="text-white">{selectedUser.plano}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Status:</Label>
                    <p className="text-white">{selectedUser.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Administrador:</Label>
                    <p className="text-white">{selectedUser.is_admin ? "Sim" : "Não"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">ID Cliente Asaas:</Label>
                    <p className="text-white font-mono text-sm">{selectedUser.asaas_customer_id || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">CPF/CNPJ:</Label>
                    <p className="text-white">{selectedUser.cpf_cnpj || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Telefone:</Label>
                    <p className="text-white">{selectedUser.telefone || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Endereço:</Label>
                  <p className="text-white">{selectedUser.endereco || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Data de Cadastro:</Label>
                    <p className="text-white">{formatDate(selectedUser.data_criacao)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Expira em:</Label>
                    <p className="text-white">{formatDate(selectedUser.data_expiracao_plano || selectedUser.data_expiracao_trial)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewUserDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar usuário */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nome" className="text-gray-300">Nome Completo</Label>
                    <Input
                      id="edit-nome"
                      value={newUserData.nome}
                      onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-gray-300">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-plano" className="text-gray-300">Plano</Label>
                    <Select value={newUserData.plano} onValueChange={(value) => setNewUserData({ ...newUserData, plano: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-cpf_cnpj" className="text-gray-300">CPF/CNPJ</Label>
                    <Input
                      id="edit-cpf_cnpj"
                      value={newUserData.cpf_cnpj}
                      onChange={(e) => setNewUserData({ ...newUserData, cpf_cnpj: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-telefone" className="text-gray-300">Telefone</Label>
                    <Input
                      id="edit-telefone"
                      value={newUserData.telefone}
                      onChange={(e) => setNewUserData({ ...newUserData, telefone: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-senha" className="text-gray-300">Nova Senha (deixe em branco para não alterar)</Label>
                    <Input
                      id="edit-senha"
                      type="password"
                      value={newUserData.senha}
                      onChange={(e) => setNewUserData({ ...newUserData, senha: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Nova senha (opcional)"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-endereco" className="text-gray-300">Endereço Completo</Label>
                  <Input
                    id="edit-endereco"
                    value={newUserData.endereco}
                    onChange={(e) => setNewUserData({ ...newUserData, endereco: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is_admin"
                    checked={newUserData.is_admin === "true"}
                    onChange={(e) => setNewUserData({ ...newUserData, is_admin: e.target.checked ? "true" : "false" })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-is_admin" className="text-gray-300">Administrador</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="bg-gray-800 border-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={updateUserMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para cancelar assinatura */}
        <Dialog open={isCancelSubscriptionDialogOpen} onOpenChange={setIsCancelSubscriptionDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Cancelar Assinatura</DialogTitle>
              <DialogDescription className="text-gray-400">
                Você tem certeza que deseja cancelar esta assinatura? Por favor, informe o motivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Motivo do cancelamento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-gray-800 border-gray-700 min-h-[100px]"
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCancelSubscriptionDialogOpen(false)} className="bg-gray-800 border-gray-700">
                  Cancelar
                </Button>
                <Button
                  onClick={() => selectedSubscription && cancelSubscriptionMutation.mutate({ subscriptionId: selectedSubscription.id, reason: cancelReason })}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {cancelSubscriptionMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}