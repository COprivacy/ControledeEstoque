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
import { Checkbox } from "@/components/ui/checkbox";
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
  Percent,
  Lock,
  TrendingDown,
  Clock,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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

type PagamentoPendente = {
  id: number;
  usuario?: User;
  plano: string;
  valor: number;
  status_pagamento: string | null;
  data_vencimento: string;
  diasPendentes: number;
};

export default function AdminPublico() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [testingMercadoPago, setTestingMercadoPago] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Começa como false para exigir senha
  const setLocation = useLocation()[1];

  const [password, setPassword] = useState(""); // Estado para a senha do admin
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planoFilter, setPlanoFilter] = useState<string>("all");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [isCancelSubscriptionDialogOpen, setIsCancelSubscriptionDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [editedClientData, setEditedClientData] = useState<Cliente | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<any>({
    nome: "",
    email: "",
    senha: "",
    plano: "trial",
    is_admin: "false",
    cpf_cnpj: "",
    telefone: "",
    endereco: "",
    data_expiracao_plano: null,
    max_funcionarios: 1,
  });
  const [diasRestantes, setDiasRestantes] = useState<string>("");
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

  const [newClientForm, setNewClientForm] = useState({
    nome: "",
    email: "",
    cpfCnpj: "",
    plano: "premium_mensal" as "premium_mensal" | "premium_anual",
    formaPagamento: "CREDIT_CARD" as "BOLETO" | "CREDIT_CARD" | "PIX"
  });

  const [testEmail, setTestEmail] = useState("");

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: configMercadoPago } = useQuery({
    queryKey: ["/api/config-mercadopago"],
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
      if (!subscription || !subscription.mercadopago_payment_id) {
        throw new Error("Assinatura ou pagamento não encontrado");
      }
      return apiRequest("POST", `/api/payments/${subscription.mercadopago_payment_id}/resend`);
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

  const saveConfigMercadoPagoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/config-mercadopago", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config-mercadopago"] });
      toast({
        title: "Configuração salva",
        description: "Configuração Mercado Pago atualizada com sucesso",
      });
      setIsConfigDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    },
  });

  const testMercadoPagoConnection = async (accessToken: string) => {
    setTestingMercadoPago(true);
    try {
      const response = await apiRequest("POST", "/api/config-mercadopago/test", {
        access_token: accessToken,
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
      setTestingMercadoPago(false);
    }
  };

  const createClientWithMercadoPagoMutation = useMutation({
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Cliente criado com sucesso!",
        description: "O cliente foi criado e a preferência de pagamento foi gerada.",
      });
      if (data.preference?.init_point) {
        window.open(data.preference.init_point, '_blank');
      }
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
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/cancel`, { reason });
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
        hoje.setFullYear(hoje.getFullYear() + 10);
        updates.data_expiracao_plano = hoje.toISOString();
        updates.data_expiracao_trial = null;
      } else if (plano === "free") {
        updates.data_expiracao_plano = null;
        updates.data_expiracao_trial = null;
      }

      if (plano !== "free") {
        updates.status = "ativo";
      }

      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });

      const currentUserStr = localStorage.getItem("user");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
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
        data_expiracao_plano: null,
        max_funcionarios: 1,
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
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      const currentUserStr = localStorage.getItem("user");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === variables.id) {
          console.log("🔄 Atualizando localStorage do usuário logado:", updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));

          if (updatedUser.is_admin === "false") {
            toast({
              title: "Permissões atualizadas",
              description: "As permissões de administrador foram removidas. Você será redirecionado.",
            });
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 2000);
          }
        }
      }

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

  const deletePlanoMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/planos/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": "",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planos"] });
      toast({
        title: "Plano deletado",
        description: "Plano removido com sucesso.",
      });
    },
  });

  const sendTestEmailsMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/test/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error('Erro ao enviar emails de teste');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Emails enviados!",
        description: `${data.details?.filter((d: any) => d.status === 'enviado').length || 0} emails foram enviados para ${testEmail}`,
      });
      setTestEmail("");
    },
    onError: (error) => {
      toast({
        title: "❌ Erro ao enviar emails",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleSendTestEmails = () => {
    if (!testEmail) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para enviar os testes",
        variant: "destructive",
      });
      return;
    }
    sendTestEmailsMutation.mutate(testEmail);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const dataExpiracao = calcularDataExpiracao(newUserForm.plano);
    const userData = {
      ...newUserForm,
      data_expiracao_plano: dataExpiracao,
    };
    createUserMutation.mutate(userData);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setNewUserData({
      nome: user.nome,
      email: user.email,
      plano: user.plano,
      is_admin: user.is_admin || "false",
      cpf_cnpj: user.cpf_cnpj || "",
      telefone: user.telefone || "",
      endereco: user.endereco || "",
      status: user.status || "ativo",
      max_funcionarios: user.max_funcionarios || 1,
      senha: ""
    });

    const expirationDate = user.data_expiracao_plano || user.data_expiracao_trial;
    if (expirationDate) {
      const dias = calculateDaysRemaining(expirationDate);
      setDiasRestantes(dias > 0 ? dias.toString() : "");
    } else {
      setDiasRestantes("");
    }
  };

  const getDiasPorPlano = (plano: string): number => {
    const diasPorPlano: Record<string, number> = {
      'trial': 7,
      'mensal': 30,
      'premium_mensal': 30,
      'anual': 365,
      'premium_anual': 365,
      'premium': 3650,
      'free': 0
    };
    return diasPorPlano[plano] || 0;
  };

  const handlePlanoChange = (novoPlano: string) => {
    setNewUserData({ ...newUserData, plano: novoPlano });

    const dias = getDiasPorPlano(novoPlano);
    if (dias > 0) {
      setDiasRestantes(dias.toString());
    } else {
      setDiasRestantes("");
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updates: any = { ...newUserData };

      if (!updates.senha) {
        delete updates.senha;
      }

      updates.is_admin = newUserData.is_admin === "true" ? "true" : "false";

      if (diasRestantes && diasRestantes !== "") {
        const dias = parseInt(diasRestantes);
        if (!isNaN(dias) && dias > 0) {
          const novaDataExpiracao = new Date();
          novaDataExpiracao.setDate(novaDataExpiracao.getDate() + dias);
          updates.data_expiracao_plano = novaDataExpiracao.toISOString();
        }
      }

      updates.status = "ativo";

      console.log("📝 Atualizando usuário com:", updates);
      updateUserMutation.mutate({ id: editingUser.id, updates });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId);
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

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return <Badge variant="outline">-</Badge>;
    const methodMap: Record<string, { label: string; color: string }> = {
      BOLETO: { label: "Boleto", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      CREDIT_CARD: { label: "Cartão", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
      PIX: { label: "PIX", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
    };
    const config = methodMap[method] || { label: method, color: "bg-gray-500/10 text-gray-400 border-gray-500/20" };
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
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

  const calculateDaysRemaining = (expirationDate?: string) => {
    if (!expirationDate) return 0;
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPrazoLimiteInfo = (subscription: any) => {
    if (!subscription.prazo_limite_pagamento || subscription.status !== 'pendente') {
      return null;
    }

    const now = new Date();
    const prazoLimite = new Date(subscription.prazo_limite_pagamento);
    const diffTime = prazoLimite.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        text: `Expirou há ${Math.abs(daysRemaining)} dia(s)`,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20',
        urgent: true
      };
    } else if (daysRemaining <= 1) {
      return {
        text: `Expira em ${daysRemaining} dia`,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/20',
        urgent: true
      };
    } else if (daysRemaining <= 3) {
      return {
        text: `${daysRemaining} dias restantes`,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20',
        urgent: false
      };
    } else {
      return {
        text: `${daysRemaining} dias restantes`,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10 border-slate-500/20',
        urgent: false
      };
    }
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

  const assinaturasAtivas = subscriptions.filter(s => s.status === "ativo").length;
  const assinaturasPendentes = subscriptions.filter(s => s.status === "pendente").length;
  const receitaMensal = subscriptions
    .filter(s => s.status === "ativo")
    .reduce((sum, s) => sum + s.valor, 0);
  const receitaPendente = subscriptions
    .filter(s => s.status === "pendente")
    .reduce((sum, s) => sum + s.valor, 0);

  const clientesComPlanos = clientes.filter((c: any) => {
    const user = users.find((u: any) => u.email === c.email);
    return user && (user.plano === "premium" || user.plano === "mensal" || user.plano === "anual");
  });

  // Calcular dias pendentes para pagamentos pendentes
  const pagamentosPendentes: PagamentoPendente[] = useMemo(() => {
    const today = new Date();
    return subscriptions
      .filter(sub => sub.status === "pendente" && sub.data_vencimento)
      .map(sub => {
        const user = users.find(u => u.id === sub.user_id);
        const vencimento = new Date(sub.data_vencimento!);
        const diasPendentes = Math.ceil((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: sub.id,
          usuario: user,
          plano: sub.plano,
          valor: sub.valor,
          status_pagamento: sub.status_pagamento,
          data_vencimento: sub.data_vencimento,
          diasPendentes: diasPendentes < 0 ? 0 : diasPendentes,
        };
      });
  }, [subscriptions, users]);

  // Dados para o gráfico de distribuição de planos
  const planDistributionChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    const colors: Record<string, string> = {
      free: "#a1a1aa", // Cinza
      trial: "#60a5fa", // Azul
      mensal: "#3b82f6", // Azul mais forte
      premium_mensal: "#3b82f6", // Azul mais forte
      anual: "#10b981", // Verde
      premium_anual: "#10b981", // Verde
      premium: "#8b5cf6", // Roxo
    };

    users.forEach(user => {
      counts[user.plano] = (counts[user.plano] || 0) + 1;
    });

    return Object.entries(counts).map(([plano, value]) => ({
      name: plano.charAt(0).toUpperCase() + plano.slice(1).replace('_', ' '),
      value,
      color: colors[plano] || "#facc15", // Amarelo para planos desconhecidos
    })).sort((a, b) => b.value - a.value); // Ordena do maior para o menor
  }, [users]);

  // Dados para o gráfico de status de pagamento
  const statusPaymentChartData = useMemo(() => {
    return [
      { name: "Pagos", value: assinaturasAtivas, color: "#10b981" }, // Verde
      { name: "Pendentes", value: assinaturasPendentes, color: "#f59e0b" }, // Amarelo/Laranja
    ];
  }, [assinaturasAtivas, assinaturasPendentes]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔐 Tentando verificar senha master...");

    try {
      const response = await fetch("/api/auth/verify-master-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      console.log("📋 Resultado verificação:", result);

      if (result.valid) {
        console.log("✅ Senha master válida - Autenticando...");
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "authenticated");
        sessionStorage.setItem("admin_auth_time", Date.now().toString());
        toast({
          title: "Acesso autorizado",
          description: "Bem-vindo ao Painel Administrativo",
        });
      } else {
        console.log("❌ Senha master inválida");
        toast({
          title: "Senha incorreta",
          description: "A senha de administrador está incorreta",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao verificar senha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPassword("");
    }
  };

  if (isLoadingSubscriptions || isLoadingUsers || isLoadingClientes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-400 mx-auto" />
          <p className="text-slate-300 text-lg">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <Shield className="h-20 w-20 text-cyan-400 mx-auto" />
          <h1 className="text-4xl font-bold text-white">Acesso Restrito</h1>
          <p className="text-slate-400 text-lg">Acesso ao Painel Master requer autenticação.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Digite a senha master"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
              data-testid="input-master-password"
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
              data-testid="button-submit-password"
            >
              <Lock className="h-4 w-4 mr-2" />
              Entrar no Painel
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        {/* Header Compacto */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 via-blue-900/50 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full h-8 w-8" data-testid="button-voltar-dashboard">
                    <ArrowLeft className="h-4 w-4 text-slate-300" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                      Painel Master
                    </h1>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
                }}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
                data-testid="button-atualizar"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Compactos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-500/20 backdrop-blur-sm" data-testid="card-assinaturas-ativas">
            <CardContent className="pt-3 pb-3 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300/70 text-xs font-medium mb-0.5">Assinaturas Ativas</p>
                  <p className="text-2xl font-bold text-emerald-100">{assinaturasAtivas}</p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-500/20 backdrop-blur-sm" data-testid="card-receita-mensal">
            <CardContent className="pt-3 pb-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-blue-300/70 text-xs font-medium mb-0.5">MRR</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-blue-500/20">
                          <Edit2 className="h-3 w-3 text-blue-400" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Configurar Meta MRR</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Defina a meta de receita mensal recorrente
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="text-slate-300">Meta MRR Mensal (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 50000.00"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                              MRR atual: {formatCurrency(receitaMensal)}
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                            Salvar Meta
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-2xl font-bold text-blue-100">{formatCurrency(receitaMensal)}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-500/20 backdrop-blur-sm" data-testid="card-pendentes">
            <CardContent className="pt-3 pb-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-amber-300/70 text-xs font-medium mb-0.5">Pendentes</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-amber-500/20">
                          <Settings className="h-3 w-3 text-amber-400" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Ações em Massa - Pendentes</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Realizar ações em todos os {assinaturasPendentes} pagamentos pendentes
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Button variant="outline" className="w-full justify-start bg-slate-800 border-slate-700">
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar lembrete para todos
                          </Button>
                          <Button variant="outline" className="w-full justify-start bg-slate-800 border-slate-700 text-red-400">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender todos após X dias
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-2xl font-bold text-amber-100">{assinaturasPendentes}</p>
                </div>
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-500/20 backdrop-blur-sm" data-testid="card-total-clientes">
            <CardContent className="pt-3 pb-3 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300/70 text-xs font-medium mb-0.5">Total Clientes</p>
                  <p className="text-2xl font-bold text-purple-100">{users.length}</p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Busca e Filtros Premium */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    data-testid="input-buscar"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white" data-testid="select-status">
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
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white" data-testid="select-plano">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs com Design Premium */}
        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <TabsTrigger
              value="usuarios"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
              data-testid="tab-usuarios"
            >
              <Users className="h-4 w-4 mr-2" />
              Usuários ({filteredUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="planos-assinaturas"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
              data-testid="tab-assinaturas"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Assinaturas ({filteredSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger
              value="configuracao"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
              data-testid="tab-configuracao"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </TabsTrigger>
          </TabsList>

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-cyan-400" />
                    Gerenciamento de Usuários
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    Visualize e gerencie todos os usuários do sistema
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/api/relatorios/export/csv', '_blank')}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20" data-testid="button-criar-usuario">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl">
                        <UserPlus className="h-5 w-5 text-cyan-400" />
                        Criar Novo Usuário
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Preencha os dados para criar um novo usuário no sistema
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome" className="text-slate-300">Nome Completo</Label>
                          <Input
                            id="nome"
                            value={newUserForm.nome}
                            onChange={(e) => setNewUserForm({ ...newUserForm, nome: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                            data-testid="input-nome-novo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-slate-300">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                            data-testid="input-email-novo"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="senha" className="text-slate-300">Senha</Label>
                          <Input
                            id="senha"
                            type="password"
                            value={newUserForm.senha}
                            onChange={(e) => setNewUserForm({ ...newUserForm, senha: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            required
                            data-testid="input-senha-novo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="plano" className="text-slate-300">Plano</Label>
                          <Select value={newUserForm.plano} onValueChange={(value) => setNewUserForm({ ...newUserForm, plano: value })}>
                            <SelectTrigger id="plano" className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trial">Trial</SelectItem>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cpf_cnpj" className="text-slate-300">CPF/CNPJ</Label>
                          <Input
                            id="cpf_cnpj"
                            value={newUserForm.cpf_cnpj}
                            onChange={(e) => setNewUserForm({ ...newUserForm, cpf_cnpj: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            data-testid="input-cpf-novo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone" className="text-slate-300">Telefone</Label>
                          <Input
                            id="telefone"
                            value={newUserForm.telefone}
                            onChange={(e) => setNewUserForm({ ...newUserForm, telefone: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                            data-testid="input-telefone-novo"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="endereco" className="text-slate-300">Endereço</Label>
                        <Input
                          id="endereco"
                          value={newUserForm.endereco}
                          onChange={(e) => setNewUserForm({ ...newUserForm, endereco: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="input-endereco-novo"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateUserOpen(false)}
                          className="bg-slate-800 border-slate-700"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                          disabled={createUserMutation.isPending}
                          data-testid="button-salvar-novo-usuario"
                        >
                          {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/70 border-slate-700/50">
                        <TableHead className="text-slate-300 font-semibold">Nome</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Plano</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Expira em</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors" data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                  {user.nome?.charAt(0).toUpperCase()}
                                </div>
                                {user.nome}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{user.email}</TableCell>
                            <TableCell>
                              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 border">
                                {user.plano}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-slate-300">
                              {formatDate(user.data_expiracao_plano || user.data_expiracao_trial)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsViewUserDialogOpen(true);
                                  }}
                                  className="hover:bg-blue-500/10 hover:text-blue-400"
                                  data-testid={`button-ver-${user.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditUser(user)}
                                  className="hover:bg-cyan-500/10 hover:text-cyan-400"
                                  data-testid={`button-editar-${user.id}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="hover:bg-red-500/10 hover:text-red-400"
                                  data-testid={`button-deletar-${user.id}`}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Assinaturas */}
          <TabsContent value="planos-assinaturas" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-400" />
                  Assinaturas e Pagamentos
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Gerencie todas as assinaturas e status de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/70 border-slate-700/50">
                        <TableHead className="text-slate-300 font-semibold">Cliente</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Plano</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Valor</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Pagamento</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Prazo Limite</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Vencimento</TableHead>
                        <TableHead className="text-slate-300 font-semibold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            Nenhuma assinatura encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((sub) => {
                          const user = getUserInfo(sub.user_id);
                          const prazoInfo = getPrazoLimiteInfo(sub);
                          return (
                            <TableRow 
                              key={sub.id} 
                              className={`border-slate-800/50 hover:bg-slate-800/30 transition-colors ${prazoInfo?.urgent ? 'bg-red-500/5' : ''}`}
                              data-testid={`row-subscription-${sub.id}`}
                            >
                              <TableCell className="font-medium text-white">
                                {user?.nome || "-"}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 border">
                                  {sub.plano}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300 font-semibold">
                                {formatCurrency(sub.valor)}
                              </TableCell>
                              <TableCell>{getStatusBadge(sub.status)}</TableCell>
                              <TableCell>{getPaymentMethodBadge(sub.forma_pagamento)}</TableCell>
                              <TableCell>
                                {prazoInfo ? (
                                  <div className="flex items-center gap-2">
                                    {prazoInfo.urgent && (
                                      <AlertCircle className="h-4 w-4 text-orange-400 animate-pulse" />
                                    )}
                                    <Badge className={`${prazoInfo.bgColor} ${prazoInfo.color} border text-xs`}>
                                      {prazoInfo.text}
                                    </Badge>
                                  </div>
                                ) : sub.status === 'ativo' ? (
                                  <span className="text-emerald-400 text-sm">✓ Pago</span>
                                ) : sub.status === 'cancelado' ? (
                                  <span className="text-slate-500 text-sm">-</span>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {formatDate(sub.data_vencimento)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {sub.invoice_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(sub.invoice_url, '_blank')}
                                      className="hover:bg-purple-500/10 hover:text-purple-400"
                                      data-testid={`button-invoice-${sub.id}`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {(sub as any).init_point && sub.status === 'pendente' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open((sub as any).init_point, '_blank')}
                                      className="hover:bg-blue-500/10 hover:text-blue-400"
                                      data-testid={`button-pagar-${sub.id}`}
                                      title="Abrir link de pagamento"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedSubscription(sub);
                                      setIsCancelSubscriptionDialogOpen(true);
                                    }}
                                    className="hover:bg-red-500/10 hover:text-red-400"
                                    data-testid={`button-cancelar-${sub.id}`}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Configuração */}
          <TabsContent value="configuracao" className="space-y-6">
            {/* Métricas Financeiras em Tempo Real */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {subscriptions.length > 0 
                      ? ((assinaturasAtivas / subscriptions.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-blue-600/70 mt-1">
                    Pagamentos aprovados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                    MRR (Receita Mensal)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(receitaMensal)}
                  </div>
                  <p className="text-xs text-green-600/70 mt-1">
                    Recorrente confirmada
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                    Taxa de Churn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {users.length > 0
                      ? ((users.filter(u => u.status === "cancelado").length / users.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-red-600/70 mt-1">
                    Cancelamentos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatCurrency(assinaturasAtivas > 0 ? receitaMensal / assinaturasAtivas : 0)}
                  </div>
                  <p className="text-xs text-purple-600/70 mt-1">
                    Por cliente ativo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análise de Métodos de Pagamento */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  Métodos de Pagamento Mais Usados
                </CardTitle>
                <CardDescription>
                  Distribuição por tipo de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {['CREDIT_CARD', 'BOLETO', 'PIX'].map(metodo => {
                    const count = subscriptions.filter(s => s.forma_pagamento === metodo).length;
                    const percentage = subscriptions.length > 0 ? (count / subscriptions.length * 100).toFixed(1) : 0;
                    return (
                      <div key={metodo} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {metodo === 'CREDIT_CARD' ? 'Cartão' : metodo === 'BOLETO' ? 'Boleto' : 'PIX'}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pagamentos Pendentes */}
            <Card className="shadow-lg border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                  Pagamentos Pendentes ({assinaturasPendentes})
                </CardTitle>
                <CardDescription>
                  Clientes aguardando confirmação de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pagamentosPendentes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p>Nenhum pagamento pendente no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {pagamentosPendentes.map((pag) => (
                      <div
                        key={pag.id}
                        className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {pag.usuario?.nome || "Cliente Desconhecido"}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {pag.usuario?.email || "Email não disponível"}
                            </p>
                          </div>
                          <Badge className="bg-amber-600 text-white">
                            {pag.diasPendentes} {pag.diasPendentes === 1 ? "dia" : "dias"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Plano</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {pag.plano === "premium_mensal" ? "Mensal" : "Anual"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Valor</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              R$ {pag.valor.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Status</p>
                            <Badge variant="outline" className="text-amber-700 border-amber-700">
                              {pag.status_pagamento || "Pendente"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reenviarCobranca.mutate(pag.id)}
                            className="flex-1"
                            disabled={reenviarCobranca.isPending}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reenviar Cobrança
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (pag.usuario) {
                                updateUserPlanMutation.mutate({
                                  userId: pag.usuario.id,
                                  plano: "free"
                                });
                              }
                            }}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Suspender
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                    Distribuição de Clientes por Plano
                  </CardTitle>
                  <CardDescription>
                    Total: {users.length} clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planDistributionChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {planDistributionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Legenda detalhada */}
                  <div className="mt-4 space-y-2">
                    {planDistributionChartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="h-6 w-6 text-green-600" />
                    Status de Pagamentos
                  </CardTitle>
                  <CardDescription>
                    Assinaturas ativas vs pendentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPaymentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusPaymentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Estatísticas */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400 mb-1">Pagos</p>
                      <p className="text-2xl font-bold text-green-600">{assinaturasAtivas}</p>
                      <p className="text-xs text-green-600 mt-1">R$ {receitaMensal.toFixed(2)}/mês</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-700 dark:text-amber-400 mb-1">Pendentes</p>
                      <p className="text-2xl font-bold text-amber-600">{assinaturasPendentes}</p>
                      <p className="text-xs text-amber-600 mt-1">R$ {receitaPendente.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de linha - Histórico */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  Crescimento de Planos Pagos
                </CardTitle>
                <CardDescription>
                  Evolução de assinaturas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistributionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {planDistributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>


            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-6 w-6 text-orange-400" />
                  Integração Mercado Pago
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Configure a integração com o gateway de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(configMercadoPago as any)?.access_token && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <p className="text-emerald-300 font-semibold">Conexão Ativa</p>
                    </div>
                    <p className="text-emerald-400/70 text-sm">
                      Integração configurada e funcionando corretamente
                    </p>
                  </div>
                )}

                {(configMercadoPago as any)?.ultima_sincronizacao && (
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-slate-400 text-sm mb-1">Última Sincronização</p>
                    <p className="text-white font-medium">{formatDateTime((configMercadoPago as any).ultima_sincronizacao)}</p>
                  </div>
                )}

                <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20" data-testid="button-configurar-mercadopago">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Configurar Integração Mercado Pago
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl">
                        <DollarSign className="h-5 w-5 text-orange-400" />
                        Configuração Mercado Pago
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Configure a integração com o gateway de pagamentos Mercado Pago
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data = {
                          access_token: formData.get("access_token"),
                          public_key: formData.get("public_key"),
                          webhook_url: formData.get("webhook_url"),
                        };
                        saveConfigMercadoPagoMutation.mutate(data);
                      }}
                      className="space-y-4 py-4"
                    >
                      <div>
                        <Label htmlFor="access_token" className="text-slate-300">Access Token</Label>
                        <Input
                          id="access_token"
                          name="access_token"
                          type="text"
                          defaultValue={(configMercadoPago as any)?.access_token || ""}
                          placeholder="Seu Access Token do Mercado Pago"
                          className="bg-slate-800 border-slate-700 text-white"
                          required
                          data-testid="input-access-token"
                        />
                      </div>
                      <div>
                        <Label htmlFor="public_key" className="text-slate-300">Public Key</Label>
                        <Input
                          id="public_key"
                          name="public_key"
                          type="text"
                          defaultValue={(configMercadoPago as any)?.public_key || ""}
                          placeholder="Sua Public Key do Mercado Pago"
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="input-public-key"
                        />
                      </div>
                      <div>
                        <Label htmlFor="webhook_url" className="text-slate-300">Webhook URL</Label>
                        <Input
                          id="webhook_url"
                          name="webhook_url"
                          type="url"
                          defaultValue={(configMercadoPago as any)?.webhook_url || ""}
                          placeholder="https://seudominio.com/api/webhook/mercadopago"
                          className="bg-slate-800 border-slate-700 text-white"
                          data-testid="input-webhook-url"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const accessTokenInput = document.getElementById("access_token") as HTMLInputElement;
                            if (accessTokenInput) {
                              testMercadoPagoConnection(accessTokenInput.value);
                            }
                          }}
                          disabled={testingMercadoPago}
                          className="bg-slate-800 border-slate-700"
                          data-testid="button-testar-conexao"
                        >
                          {testingMercadoPago ? "Testando..." : "Testar Conexão"}
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                          disabled={saveConfigMercadoPagoMutation.isPending}
                          data-testid="button-salvar-config"
                        >
                          {saveConfigMercadoPagoMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {(configMercadoPago as any)?.webhook_url && (
              <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Informações da Integração</CardTitle>
                  <CardDescription className="text-slate-400">
                    Dados da sua integração com Mercado Pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400 text-sm mb-1">Webhook URL</p>
                      <p className="text-white text-sm truncate">
                        {(configMercadoPago as any).webhook_url || "Não configurado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  Testes de Email
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Envie emails de teste para verificar se o sistema de notificações está funcionando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email" className="text-slate-300">Email de Destino</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-test-email"
                  />
                </div>
                <Button
                  onClick={handleSendTestEmails}
                  disabled={sendTestEmailsMutation.isPending || !testEmail}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                  data-testid="button-send-test-emails"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendTestEmailsMutation.isPending ? "Enviando..." : "📧 Enviar Todos os Emails de Teste"}
                </Button>
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertDescription className="text-xs text-blue-300">
                    Serão enviados 8 tipos de emails: Código de Verificação, Pacote de Funcionários (aguardando/ativado),
                    Senha Redefinida, Pagamento Pendente, Aviso de Vencimento, Pagamento Atrasado e Conta Bloqueada.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para visualizar detalhes do usuário */}
        <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes do Usuário</DialogTitle>
              <DialogDescription className="text-slate-400">Informações completas do usuário selecionado</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Nome:</Label>
                    <p className="text-white font-medium">{selectedUser.nome}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Email:</Label>
                    <p className="text-white font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Plano:</Label>
                    <p className="text-white font-medium">{selectedUser.plano}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Status:</Label>
                    <p className="text-white font-medium">{selectedUser.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Administrador:</Label>
                    <p className="text-white font-medium">{selectedUser.is_admin ? "Sim" : "Não"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">ID Cliente Mercado Pago:</Label>
                    <p className="text-white font-mono text-sm">{selectedUser.mercadopago_customer_id || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">CPF/CNPJ:</Label>
                    <p className="text-white font-medium">{selectedUser.cpf_cnpj || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Telefone:</Label>
                    <p className="text-white font-medium">{selectedUser.telefone || "-"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">Endereço:</Label>
                  <p className="text-white font-medium">{selectedUser.endereco || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Data de Cadastro:</Label>
                    <p className="text-white font-medium">{formatDate(selectedUser.data_criacao)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Expira em:</Label>
                    <p className="text-white font-medium">{formatDate(selectedUser.data_expiracao_plano || selectedUser.data_expiracao_trial)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewUserDialogOpen(false)} className="bg-slate-800 border-slate-700">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar usuário */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Edit2 className="h-5 w-5 text-cyan-400" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Atualize as informações do usuário
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nome" className="text-slate-300">Nome Completo</Label>
                    <Input
                      id="edit-nome"
                      value={newUserData.nome}
                      onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                      data-testid="input-edit-nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-slate-300">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                      data-testid="input-edit-email"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-plano" className="text-slate-300">Plano</Label>
                    <Select
                      value={newUserData.plano}
                      onValueChange={handlePlanoChange}
                    >
                      <SelectTrigger id="edit-plano" className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial (7 dias grátis)</SelectItem>
                        <SelectItem value="mensal">Mensal (30 dias)</SelectItem>
                        <SelectItem value="anual">Anual (365 dias)</SelectItem>
                        <SelectItem value="premium">Premium (3650 dias)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-dias-restantes" className="text-slate-300">
                      Dias Restantes
                      <span className="ml-1 text-xs text-slate-500">(define a validade do plano)</span>
                    </Label>
                    <Input
                      id="edit-dias-restantes"
                      type="number"
                      min="0"
                      value={diasRestantes}
                      onChange={(e) => setDiasRestantes(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: 30"
                      data-testid="input-dias-restantes"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {diasRestantes && parseInt(diasRestantes) > 0
                        ? `Expira em: ${new Date(new Date().getTime() + parseInt(diasRestantes) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`
                        : "Informe os dias para calcular a data"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-max-funcionarios" className="text-slate-300">
                      Limite de Funcionários
                      <span className="ml-1 text-xs text-slate-500">(máximo que o cliente pode cadastrar)</span>
                    </Label>
                    <Input
                      id="edit-max-funcionarios"
                      type="number"
                      min="1"
                      value={newUserData.max_funcionarios}
                      onChange={(e) => setNewUserData({ ...newUserData, max_funcionarios: parseInt(e.target.value) || 1 })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: 10"
                      data-testid="input-max-funcionarios"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      O cliente poderá cadastrar até {newUserData.max_funcionarios} funcionários
                    </p>
                  </div>
                  <div className="flex items-end">
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 flex-1">
                      <p className="text-xs text-blue-300 mb-1">Controle Administrativo</p>
                      <p className="text-sm text-blue-200">
                        Altere esse valor para dar mais ou menos capacidade ao cliente
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-cpf_cnpj" className="text-slate-300">CPF/CNPJ</Label>
                    <Input
                      id="edit-cpf_cnpj"
                      value={newUserData.cpf_cnpj}
                      onChange={(e) => setNewUserData({ ...newUserData, cpf_cnpj: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="input-edit-cpf"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telefone" className="text-slate-300">Telefone</Label>
                    <Input
                      id="edit-telefone"
                      value={newUserData.telefone}
                      onChange={(e) => setNewUserData({ ...newUserData, telefone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      data-testid="input-edit-telefone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-senha" className="text-slate-300">Nova Senha (deixe em branco para não alterar)</Label>
                  <Input
                    id="edit-senha"
                    type="password"
                    value={newUserData.senha}
                    onChange={(e) => setNewUserData({ ...newUserData, senha: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Nova senha (opcional)"
                    data-testid="input-edit-senha"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endereco" className="text-slate-300">Endereço Completo</Label>
                  <Input
                    id="edit-endereco"
                    value={newUserData.endereco}
                    onChange={(e) => setNewUserData({ ...newUserData, endereco: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-endereco"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is_admin"
                    checked={newUserData.is_admin === "true"}
                    onChange={(e) => setNewUserData({ ...newUserData, is_admin: e.target.checked ? "true" : "false" })}
                    className="h-4 w-4"
                    data-testid="checkbox-is-admin"
                  />
                  <Label htmlFor="edit-is_admin" className="text-slate-300">Administrador</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="bg-slate-800 border-slate-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                    disabled={updateUserMutation.isPending}
                    data-testid="button-salvar-edicao"
                  >
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para cancelar assinatura */}
        <Dialog open={isCancelSubscriptionDialogOpen} onOpenChange={setIsCancelSubscriptionDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Cancelar Assinatura</DialogTitle>
              <DialogDescription className="text-slate-400">
                Você tem certeza que deseja cancelar esta assinatura? Por favor, informe o motivo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Motivo do cancelamento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-slate-800 border-slate-700 min-h-[100px] text-white"
                data-testid="textarea-cancel-reason"
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCancelSubscriptionDialogOpen(false)} className="bg-slate-800 border-slate-700">
                  Cancelar
                </Button>
                <Button
                  onClick={() => selectedSubscription && cancelSubscriptionMutation.mutate({ subscriptionId: selectedSubscription.id, reason: cancelReason })}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  data-testid="button-confirmar-cancelamento"
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