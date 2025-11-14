import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Zap,
  Check
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
import { AdminLogsView } from "@/components/AdminLogsView";

// Componente de Edição/Criação de Usuário
function UserEditDialog({
  user,
  open,
  onOpenChange
}: {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    senha: "",
    plano: user?.plano || "free",
    status: user?.status || "ativo",
    cpf_cnpj: user?.cpf_cnpj || "",
    telefone: user?.telefone || "",
    endereco: user?.endereco || "",
    max_funcionarios: user?.max_funcionarios || 1,
    data_expiracao_plano: user?.data_expiracao_plano || user?.data_expiracao_trial || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || "",
        email: user.email || "",
        senha: "",
        plano: user.plano || "free",
        status: user.status || "ativo",
        cpf_cnpj: user.cpf_cnpj || "",
        telefone: user.telefone || "",
        endereco: user.endereco || "",
        max_funcionarios: user.max_funcionarios || 1,
        data_expiracao_plano: user.data_expiracao_plano || user.data_expiracao_trial || "",
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        // Atualizar usuário existente
        const updateData = { ...formData };
        if (!updateData.senha) delete updateData.senha; // Não enviar senha vazia
        const response = await apiRequest("PATCH", `/api/users/${user.id}`, updateData);
        return response.json();
      } else {
        // Criar novo usuário
        const response = await apiRequest("POST", "/api/auth/register", formData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: user ? "Usuário atualizado!" : "Usuário criado!",
        description: user ? "As informações foram atualizadas com sucesso." : "O novo usuário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user ? "Atualize as informações do usuário" : "Preencha os dados para criar um novo usuário"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={!!user} // Email não pode ser editado
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Senha {user ? "(deixe em branco para manter a atual)" : "*"}</Label>
            <Input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder={user ? "Digite para alterar a senha" : "Digite a senha"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={formData.plano} onValueChange={(value) => setFormData({ ...formData, plano: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="premium_mensal">Premium Mensal</SelectItem>
                  <SelectItem value="premium_anual">Premium Anual</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CPF/CNPJ</Label>
              <Input
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              placeholder="Endereço completo"
            />
          </div>

          <div className="space-y-2">
            <Label>Máximo de Funcionários</Label>
            <Input
              type="number"
              min="1"
              value={formData.max_funcionarios}
              onChange={(e) => setFormData({ ...formData, max_funcionarios: parseInt(e.target.value) })}
            />
          </div>

          {user && (
            <div className="space-y-2">
              <Label>Dias de Plano Restantes</Label>
              <Input
                type="number"
                min="0"
                value={
                  user.data_expiracao_plano || user.data_expiracao_trial
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(user.data_expiracao_plano || user.data_expiracao_trial!).getTime() -
                           new Date().getTime()) / (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0
                }
                onChange={(e) => {
                  const dias = parseInt(e.target.value) || 0;
                  const novaData = new Date();
                  novaData.setDate(novaData.getDate() + dias);
                  setFormData({
                    ...formData,
                    data_expiracao_plano: novaData.toISOString()
                  });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Define quantos dias o plano permanecerá ativo
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {user ? "Salvar Alterações" : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente de Gestão Avançada de Usuários
function GestaoAvancadaTab({ users }: { users: User[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroPlano, setFiltroPlano] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Estatísticas por plano
  const estatisticasPorPlano = useMemo(() => {
    const stats: Record<string, number> = {};
    users.forEach(user => {
      stats[user.plano] = (stats[user.plano] || 0) + 1;
    });
    return stats;
  }, [users]);

  // Usuários filtrados
  const usuariosFiltrados = useMemo(() => {
    return users.filter(user => {
      const passaPlano = filtroPlano === "todos" || user.plano === filtroPlano;
      const passaStatus = filtroStatus === "todos" || user.status === filtroStatus;
      return passaPlano && passaStatus;
    });
  }, [users, filtroPlano, filtroStatus]);

  const alterarPlanoEmLote = useMutation({
    mutationFn: async ({ userIds, novoPlano }: { userIds: string[], novoPlano: string }) => {
      const promises = userIds.map(id =>
        apiRequest("PATCH", `/api/users/${id}`, { plano: novoPlano })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Planos alterados!",
        description: "Os planos foram atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar planos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === 'ativo').length}
              </p>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.plano === 'premium' || u.plano === 'premium_mensal' || u.plano === 'premium_anual').length}
              </p>
              <p className="text-sm text-muted-foreground">Assinantes Premium</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.plano === 'trial').length}
              </p>
              <p className="text-sm text-muted-foreground">Em Trial</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Plano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Distribuição por Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(estatisticasPorPlano).map(([plano, quantidade]) => (
              <div key={plano} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{plano}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {((quantidade / users.length) * 100).toFixed(1)}% dos usuários
                  </span>
                </div>
                <span className="font-semibold">{quantidade}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Ações em Lote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Filtros e Ações em Lote
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filtrar por Plano</Label>
              <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Planos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="premium_mensal">Premium Mensal</SelectItem>
                  <SelectItem value="premium_anual">Premium Anual</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filtrar por Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">
              {usuariosFiltrados.length} usuários encontrados com os filtros aplicados
            </p>
            <p className="text-xs text-muted-foreground">
              Use os filtros acima para refinar a busca e realizar ações em lote
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Configuração de Email (SMTP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuração Manual Necessária</AlertTitle>
            <AlertDescription>
              <p className="mb-3">
                As configurações de SMTP devem ser editadas diretamente no arquivo <code className="bg-muted px-1 rounded">.env</code> do servidor.
              </p>
              <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                <p>SMTP_HOST=smtp.gmail.com</p>
                <p>SMTP_PORT=587</p>
                <p>SMTP_USER=seu.email@gmail.com</p>
                <p>SMTP_PASS=sua-senha-app</p>
                <p>SMTP_FROM=Pavisoft Sistemas &lt;noreply@pavisoft.com&gt;</p>
              </div>
              <p className="mt-3 text-xs">
                📝 Edite o arquivo .env na raiz do projeto e reinicie o servidor para aplicar as alterações.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Configuração Mercado Pago
function MercadoPagoConfigTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mpConfig, setMpConfig] = useState({
    access_token: "",
    public_key: "",
    webhook_url: "" // Adicionado campo webhook_url
  });

  // Carregar configuração do Mercado Pago
  const { data: mpConfigData, isLoading: isLoadingMpConfig } = useQuery({
    queryKey: ["/api/config-mercadopago"],
    retry: 1,
  });

  useEffect(() => {
    if (mpConfigData) {
      setMpConfig({
        access_token: mpConfigData.access_token || "",
        public_key: mpConfigData.public_key || "",
        webhook_url: mpConfigData.webhook_url || "" // Atualizado para carregar webhook_url
      });
    }
  }, [mpConfigData]);

  const saveMercadoPagoConfig = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/config-mercadopago", mpConfig);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva!",
        description: "As configurações do Mercado Pago foram atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/config-mercadopago"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testMercadoPagoConnection = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/config-mercadopago/test", {
        access_token: mpConfig.access_token,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "✅ Conexão bem-sucedida!" : "❌ Falha na conexão",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro ao testar conexão",
        description: error.message || "Erro desconhecido ao conectar com Mercado Pago",
        variant: "destructive",
      });
    },
  });

  // Status da integração
  const getIntegrationStatus = () => {
    if (isLoadingMpConfig) return { color: "bg-gray-500", text: "Verificando...", icon: Loader2 };
    if (!mpConfigData || !mpConfigData.access_token) return { color: "bg-red-500", text: "Não Configurado", icon: XCircle };
    if (mpConfigData.status_conexao === "conectado") return { color: "bg-green-500", text: "Conectado", icon: CheckCircle };
    return { color: "bg-yellow-500", text: "Configurado (não testado)", icon: AlertCircle };
  };

  const status = getIntegrationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Status da Integração Mercado Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Status da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${status.color} rounded-full`}>
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Mercado Pago</p>
                <p className="text-sm text-muted-foreground">Gateway de Pagamento</p>
              </div>
            </div>
            <Badge className={status.color}>{status.text}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuração Mercado Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Credenciais da API
          </CardTitle>
          <CardDescription>
            Configure as credenciais da API do Mercado Pago para processar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              value={mpConfig.access_token}
              onChange={(e) => setMpConfig({ ...mpConfig, access_token: e.target.value })}
              placeholder="APP_USR-..."
              data-testid="input-mp-access-token"
            />
          </div>
          <div className="space-y-2">
            <Label>Public Key</Label>
            <Input
              value={mpConfig.public_key}
              onChange={(e) => setMpConfig({ ...mpConfig, public_key: e.target.value })}
              placeholder="APP_USR-..."
              data-testid="input-mp-public-key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-webhook">Webhook URL</Label>
            <Input
              id="mp-webhook"
              value={mpConfig.webhook_url}
              onChange={(e) => setMpConfig({ ...mpConfig, webhook_url: e.target.value })}
              placeholder="https://seu-dominio.com/api/webhooks/mercadopago"
              data-testid="input-mp-webhook"
            />
            <p className="text-xs text-muted-foreground">
              ℹ️ URL onde o Mercado Pago enviará notificações de pagamento
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => saveMercadoPagoConfig.mutate()}
              disabled={saveMercadoPagoConfig.isPending}
              data-testid="button-save-mp-config"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveMercadoPagoConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
            <Button
              variant="outline"
              onClick={() => testMercadoPagoConnection.mutate()}
              disabled={testMercadoPagoConnection.isPending || !mpConfig.access_token}
              data-testid="button-test-mp-connection"
            >
              {testMercadoPagoConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Testar Conexão
            </Button>
          </div>

          {mpConfigData && mpConfigData.webhook_url && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-400">Webhook Configurado</p>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1 break-all">
                    {mpConfigData.webhook_url}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✅ Configure esta URL no painel do Mercado Pago quando tiver seu domínio premium
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Sistema
function SistemaTab({ users, subscriptions }: { users: User[], subscriptions: Subscription[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const assinaturasAtivas = subscriptions.filter(s => s.status === "ativo").length;
  const assinaturasPendentes = subscriptions.filter(s => s.status === "pendente").length;
  const receitaMensal = subscriptions
    .filter(s => s.status === "ativo")
    .reduce((sum, s) => sum + s.valor, 0);

  // Buscar status de saúde do sistema
  const { data: healthStatus, isLoading: isLoadingHealth, refetch: fetchHealthStatus } = useQuery({
    queryKey: ["/api/system/health"],
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  // Buscar histórico de correções automáticas
  const { data: autoFixHistory } = useQuery({
    queryKey: ["/api/system/autofix-history"],
    refetchInterval: 60000,
  });

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch("/api/system/health/check", {
        method: "POST",
        headers: {
          "x-user-id": JSON.parse(localStorage.getItem("user") || "{}").id,
          "x-is-admin": "true",
        },
      });

      if (response.ok) {
        toast({
          title: "Verificação concluída!",
          description: "Verificações de saúde executadas com sucesso",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/system/health"] });
        queryClient.invalidateQueries({ queryKey: ["/api/system/autofix-history"] });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar verificações",
        variant: "destructive",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Adjusting thresholds for system status based on the problem description
  const getSystemStatus = (checks: any[] | undefined) => {
    if (!checks) return 'degraded'; // Assume degraded if no checks data yet
    const criticalCount = checks.filter(check => check.status === 'critical').length;
    const degradedCount = checks.filter(check => check.status === 'degraded').length;

    // If there are critical issues, system is offline
    if (criticalCount > 0) return 'offline';
    // If there are degraded issues and no critical ones, system is degraded
    if (degradedCount > 0) return 'degraded';
    // Otherwise, system is online
    return 'online';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const systemStatus = getSystemStatus(healthStatus?.checks);

  return (
    <div className="space-y-6">
      {/* Status do Sistema com Auto-Healing */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Status do Sistema
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthCheck}
              disabled={isCheckingHealth}
              data-testid="button-verify-health"
            >
              {isCheckingHealth ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Agora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Geral - Melhorado */}
            <div className={`flex items-center justify-between p-6 rounded-lg border-2 ${
              systemStatus === 'online' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900' :
              systemStatus === 'degraded' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900' :
              'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  systemStatus === 'online' ? 'bg-emerald-500' :
                  systemStatus === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                }`}>
                  {systemStatus === 'online' ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : systemStatus === 'degraded' ? (
                    <AlertCircle className="h-6 w-6 text-white" />
                  ) : (
                    <XCircle className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold mb-1">
                    {systemStatus === 'online' ? 'Sistema Operacional' :
                     systemStatus === 'degraded' ? 'Sistema com Alertas' :
                     'Sistema com Problemas'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {healthStatus?.summary?.healthy || 0} serviços saudáveis, {healthStatus?.summary?.degraded || 0} com alertas, {healthStatus?.summary?.critical || 0} críticos
                  </p>
                  {healthStatus?.lastCheck && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Última verificação: {new Date(healthStatus.lastCheck).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <Badge className={`text-sm px-3 py-1 ${
                systemStatus === 'online' ? 'bg-emerald-500 hover:bg-emerald-600' :
                systemStatus === 'degraded' ? 'bg-amber-500 hover:bg-amber-600' :
                'bg-rose-500 hover:bg-rose-600'
              }`}>
                {systemStatus === 'online' ? 'Online' :
                 systemStatus === 'degraded' ? 'Degradado' : 'Offline'}
              </Badge>
            </div>

            {/* Auto-Healing Summary */}
            {healthStatus?.summary?.autoFixed > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-full">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-400">
                      🔧 Auto-Healing Ativo
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {healthStatus.summary.autoFixed} problema(s) corrigido(s) automaticamente
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Verificações Detalhadas - Melhoradas */}
            {healthStatus?.checks && healthStatus.checks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-semibold">Verificações de Saúde:</p>
                  {healthStatus.summary?.degraded > 0 || healthStatus.summary?.critical > 0 ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={runHealthCheck}
                      disabled={isCheckingHealth}
                      data-testid="button-try-fix"
                    >
                      {isCheckingHealth ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Tentar Corrigir
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3">
                  {healthStatus.checks.map((check: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all ${
                        check.status === 'healthy'
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900'
                          : check.status === 'degraded'
                          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900'
                          : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getStatusIcon(check.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base capitalize mb-1">
                            {check.service.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">{check.message}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {check.autoFixed && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" variant="outline">
                                <Check className="h-3 w-3 mr-1" />
                                Corrigido Automaticamente
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(check.timestamp).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        {check.status !== 'healthy' && check.service === 'email_service' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Redirecionar para configurações
                              const sidebar = document.querySelector('aside');
                              const configButton = Array.from(sidebar?.querySelectorAll('button') || [])
                                .find(btn => btn.textContent?.includes('Configurações'));
                              if (configButton instanceof HTMLElement) {
                                configButton.click();
                                setTimeout(() => {
                                  const emailSection = document.getElementById('smtp-config');
                                  emailSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 200);
                              }
                            }}
                            className="whitespace-nowrap"
                            data-testid="button-configure-smtp"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configurar
                          </Button>
                        )}
                        {check.status !== 'healthy' && check.service === 'memory_usage' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await fetch('/api/system/health/check', {
                                  method: 'POST',
                                  headers: {
                                    "x-user-id": JSON.parse(localStorage.getItem("user") || "{}").id,
                                    "x-is-admin": "true",
                                  },
                                });
                                await fetchHealthStatus();
                                toast({
                                  title: "Memória liberada!",
                                  description: "Garbage collection executado com sucesso",
                                });
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Erro ao tentar liberar memória",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="whitespace-nowrap"
                            data-testid="button-free-memory"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Liberar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Auto-Healing */}
      {autoFixHistory && autoFixHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Histórico de Correções Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {autoFixHistory.slice(0, 10).map((fix: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{fix.service.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{fix.message}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fix.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}



// Componente de Métricas (Placeholder - assumindo que ele existe em outro lugar)
function MetricsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Exibindo métricas detalhadas aqui...</p>
        {/* Conteúdo real das métricas */}
      </CardContent>
    </Card>
  );
}


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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'assinaturas' | 'configuracoes' | 'sistema' | 'metricas' | 'logs'>('dashboard');
  const [configTab, setConfigTab] = useState<'config' | 'mercadopago'>('config');
  const [userEditDialogOpen, setUserEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions, error: subscriptionsError } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    retry: 1,
    staleTime: 30000,
  });

  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: 1,
    staleTime: 30000,
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído!",
        description: "O usuário foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
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
      inativo: { variant: "outline", label: "Inativo", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
      bloqueado: { variant: "destructive", label: "Bloqueado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
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

  if (subscriptionsError || usersError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-bold">Erro ao carregar dados</h2>
              <p className="text-sm text-muted-foreground">
                {subscriptionsError?.message || usersError?.message || "Erro desconhecido"}
              </p>
              <Button onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              }}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-700 w-full"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'dashboard' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('dashboard');
            }}
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            {sidebarOpen && "Dashboard"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'clientes' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('clientes');
            }}
          >
            <Users className="h-5 w-5 mr-3" />
            {sidebarOpen && "Clientes"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'assinaturas' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('assinaturas');
            }}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            {sidebarOpen && "Assinaturas"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'configuracoes' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('configuracoes');
            }}
          >
            <Settings className="h-5 w-5 mr-3" />
            {sidebarOpen && "Configurações"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'sistema' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('sistema');
            }}
          >
            <Database className="h-5 w-5 mr-3" />
            {sidebarOpen && "Sistema"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'metricas' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('metricas');
            }}
          >
            <BarChart3 className="h-5 w-5 mr-3" />
            {sidebarOpen && "Métricas"}
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start hover:bg-slate-700 ${!selectedClientFor360 && activeTab === 'logs' ? 'bg-slate-700' : ''}`}
            onClick={() => {
              setSelectedClientFor360(null);
              setActiveTab('logs');
            }}
          >
            <FileText className="h-5 w-5 mr-3" />
            {sidebarOpen && "Logs Admin"}
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
              {selectedClientFor360 ? 'Cliente 360°' : activeTab === 'logs' ? 'Logs de Administradores' : 'Painel Principal'}
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
                // Invalidate logs if the logs tab is active
                if (activeTab === 'logs') {
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
                }
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

                      if (!client) {
                        return <p className="col-span-4 text-sm text-muted-foreground">Cliente não encontrado</p>;
                      }

                      return (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Plano Atual</p>
                            <p className="font-semibold">{client.plano || 'Free'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={client.status === 'ativo' ? 'default' : 'secondary'}>
                              {client.status || 'Desconhecido'}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Assinaturas</p>
                            <p className="font-semibold">{clientSubscriptions.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data Cadastro</p>
                            <p className="font-semibold">
                              {client.data_criacao
                                ? formatDate(client.data_criacao)
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
          ) : activeTab === 'clientes' ? (
            // Aba de Clientes
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Gerenciar Clientes
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Buscar clientes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button onClick={() => {
                        setEditingUser(null);
                        setUserEditDialogOpen(true);
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Button>
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
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users
                          .filter(user =>
                            (user.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                          )
                          .map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.nome || '-'}</TableCell>
                              <TableCell>{user.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.plano || 'Free'}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(user.status || 'expirado')}</TableCell>
                              <TableCell>{formatDate(user.data_criacao)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedClientFor360(user.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhum cliente encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'assinaturas' ? (
            // Aba de Assinaturas
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Gerenciar Assinaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions && subscriptions.length > 0 ? (
                        subscriptions.map((sub) => {
                          const user = users.find(u => u.id === sub.user_id);
                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{user?.nome || user?.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{sub.plano}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(sub.valor)}</TableCell>
                              <TableCell>{getStatusBadge(sub.status)}</TableCell>
                              <TableCell>{formatDate(sub.data_vencimento)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedClientFor360(sub.user_id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Cliente
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Nenhuma assinatura encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'configuracoes' ? (
            // Aba de Configurações
            <Tabs value={configTab} onValueChange={(value) => setConfigTab(value as typeof configTab)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config" data-testid="tab-configuracoes">Gestão Avançada</TabsTrigger>
                <TabsTrigger value="mercadopago" data-testid="tab-mercadopago">Mercado Pago</TabsTrigger>
              </TabsList>
              <TabsContent value="config">
                <GestaoAvancadaTab users={users} />
              </TabsContent>
              <TabsContent value="mercadopago">
                <MercadoPagoConfigTab />
              </TabsContent>
            </Tabs>
          ) : activeTab === 'sistema' ? (
            // Aba de Sistema
            <SistemaTab users={users} subscriptions={subscriptions} />
          ) : activeTab === 'metricas' ? (
            // Aba de Métricas
            <div className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                      <p className="text-3xl font-bold">{users.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total de Assinaturas</p>
                      <p className="text-3xl font-bold">{subscriptions.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                      <p className="text-3xl font-bold text-green-600">{assinaturasAtivas}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Receita Mensal</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(receitaMensal)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas Detalhadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Métricas do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Assinaturas Pendentes</p>
                        <p className="text-sm text-muted-foreground">Aguardando pagamento</p>
                      </div>
                      <Badge variant="secondary">{assinaturasPendentes}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Taxa de Conversão</p>
                        <p className="text-sm text-muted-foreground">Assinaturas ativas / total</p>
                      </div>
                      <Badge>
                        {subscriptions.length > 0
                          ? ((assinaturasAtivas / subscriptions.length) * 100).toFixed(1)
                          : 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Planos Gratuitos</p>
                        <p className="text-sm text-muted-foreground">Usuários no plano free/trial</p>
                      </div>
                      <Badge variant="outline">
                        {users.filter(u => u.plano === 'free' || u.plano === 'trial').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'logs' ? (
            // Aba de Logs de Administrador
            <AdminLogsView isPublicAdmin={true} />
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
                      {users && users.length > 0 ? (
                        users
                          .filter(user =>
                            (user.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.nome || '-'}</TableCell>
                              <TableCell>{user.email || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.plano || 'Free'}</Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(user.status || 'expirado')}</TableCell>
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
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhum cliente encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Dialog de Edição/Criação de Usuário */}
      <UserEditDialog
        user={editingUser}
        open={userEditDialogOpen}
        onOpenChange={setUserEditDialogOpen}
      />
    </div>
  );
}