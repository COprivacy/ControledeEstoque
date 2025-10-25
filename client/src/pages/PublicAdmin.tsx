
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
import { Users, Crown, Shield, CheckCircle2, AlertCircle, Trash2, UserPlus, Key, Webhook, Database, Activity, Filter, Search } from "lucide-react";
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
    if (adminAuth === "authenticated") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "authenticated");
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

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("user");
        window.location.href = "/login";
        toast({
          title: "Sessão expirada",
          description: "Você foi desconectado por inatividade",
          variant: "destructive",
        });
      }, 15 * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timer) clearTimeout(timer);
    };
  }, [toast]);

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: planos = [] } = useQuery<Plano[]>({
    queryKey: ["/api/planos"],
  });

  const { data: configAsaasData } = useQuery<ConfigAsaas>({
    queryKey: ["/api/config-asaas"],
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado",
        description: "Novo usuário criado com sucesso!",
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

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserMutation.mutate({ id: userId, updates: { plano: newPlan } });
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
    return plan === "premium" ? "default" : "secondary";
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "ativo" ? "default" : "destructive";
  };

  const calculateDaysRemaining = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-center">
              Insira a senha para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha de administrador"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Entrar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
              >
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Painel Administrativo - Dono do Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie usuários, planos e integrações do sistema
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="usuarios" data-testid="tab-usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="planos" data-testid="tab-planos">Planos</TabsTrigger>
          <TabsTrigger value="asaas" data-testid="tab-asaas">Integração Asaas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-users">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.ativos} ativos, {stats.inativos} inativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-premium-users">{stats.premium}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.premium / stats.total) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-free-users">{stats.free}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.free / stats.total) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-admin-users">{stats.admins}</div>
              </CardContent>
            </Card>
          </div>

          {stats.expiringTrial > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                {stats.expiringTrial} usuário(s) com trial expirando em até 3 dias.
              </AlertDescription>
            </Alert>
          )}

          {configAsaasData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status da Integração Asaas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant={configAsaasData.status_conexao === "conectado" ? "default" : "secondary"}>
                    {configAsaasData.status_conexao === "conectado" ? "Conectado" : "Desconectado"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Ambiente: {configAsaasData.ambiente === "sandbox" ? "Sandbox" : "Produção"}
                  </span>
                  {configAsaasData.ultima_sincronizacao && (
                    <span className="text-sm text-muted-foreground">
                      Última sincronização: {new Date(configAsaasData.ultima_sincronizacao).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filter-plano">Plano</Label>
              <Select value={filterPlano} onValueChange={setFilterPlano}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-user">
                  <UserPlus className="h-4 w-4 mr-2" />
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

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Dias Restantes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const daysRemaining = user.plano === "free" 
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
                                  defaultValue={user.plano}
                                  onValueChange={(value) => handlePlanChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
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
                                  {user.plano === "premium" ? (
                                    <>
                                      <Crown className="h-3 w-3 mr-1" />
                                      Premium
                                    </>
                                  ) : (
                                    "Free"
                                  )}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {daysRemaining !== null ? (
                                <Badge variant={daysRemaining <= 3 ? "destructive" : "secondary"}>
                                  {daysRemaining} dias
                                </Badge>
                              ) : (
                                '-'
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
                              <Badge
                                variant={user.is_admin === "true" ? "default" : "outline"}
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
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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

        <TabsContent value="planos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gestão de Planos</h2>
              <p className="text-muted-foreground">Gerencie os planos disponíveis no sistema</p>
            </div>
            <Dialog open={createPlanoOpen} onOpenChange={setCreatePlanoOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-plan">
                  <UserPlus className="h-4 w-4 mr-2" />
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

          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
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

        <TabsContent value="asaas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configuração da API Asaas
              </CardTitle>
              <CardDescription>
                Configure a integração com a plataforma de pagamentos Asaas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={asaasConfig.api_key}
                  onChange={(e) => setAsaasConfig({ ...asaasConfig, api_key: e.target.value })}
                  placeholder="Insira sua chave de API"
                  data-testid="input-asaas-api-key"
                />
              </div>

              <div>
                <Label htmlFor="ambiente">Ambiente</Label>
                <Select
                  value={asaasConfig.ambiente}
                  onValueChange={(v) => setAsaasConfig({ ...asaasConfig, ambiente: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="account-id">ID da Conta Asaas</Label>
                <Input
                  id="account-id"
                  value={asaasConfig.account_id}
                  onChange={(e) => setAsaasConfig({ ...asaasConfig, account_id: e.target.value })}
                  placeholder="ID da sua conta"
                  data-testid="input-asaas-account-id"
                />
              </div>

              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Webhook className="h-4 w-4 mt-2 text-muted-foreground" />
                  <Input
                    id="webhook-url"
                    value={asaasConfig.webhook_url}
                    onChange={(e) => setAsaasConfig({ ...asaasConfig, webhook_url: e.target.value })}
                    placeholder="https://seu-dominio.com/webhook/asaas"
                    data-testid="input-asaas-webhook"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => saveAsaasMutation.mutate(asaasConfig)} data-testid="button-save-asaas-config">
                  <Database className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
                <Button
                  variant="outline"
                  onClick={testAsaasConnection}
                  disabled={testingAsaas || !asaasConfig.api_key}
                  data-testid="button-test-asaas"
                >
                  {testingAsaas ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Importante!</AlertTitle>
                <AlertDescription>
                  Use o ambiente Sandbox para testes. Mude para Produção apenas quando estiver pronto
                  para processar pagamentos reais. Mantenha sua API Key em segurança.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
