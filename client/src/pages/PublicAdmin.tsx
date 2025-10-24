
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Crown, Shield, CheckCircle2, ArrowLeft, UserPlus, CreditCard, Key, TestTube } from "lucide-react";
import { Link } from "wouter";
import backgroundImage from "@assets/generated_images/Pavisoft_Sistemas_tech_background_61320ac2.png";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
}

export default function PublicAdmin() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Aplicar modo noturno ao carregar o componente
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // Opcional: remover dark mode ao desmontar
      // document.documentElement.classList.remove('dark');
    };
  }, []);
  const [newUserData, setNewUserData] = useState({
    nome: "",
    email: "",
    senha: "",
    plano: "free",
    is_admin: "false"
  });
  
  const [asaasConfig, setAsaasConfig] = useState({
    api_key: "",
    ambiente: "sandbox" as "sandbox" | "production"
  });
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated,
  });

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
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi criado com sucesso.",
      });
      setShowCreateForm(false);
      setNewUserData({
        nome: "",
        email: "",
        senha: "",
        plano: "free",
        is_admin: "false"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.error || "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
    },
  });

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserMutation.mutate({ id: userId, updates: { plano: newPlan } });
  };

  const handleAdminToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "true" ? "false" : "true";
    updateUserMutation.mutate({ id: userId, updates: { is_admin: newStatus } });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.nome || !newUserData.email || !newUserData.senha) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  const handleTestAsaasConnection = async () => {
    if (!asaasConfig.api_key) {
      toast({
        title: "API Key necessária",
        description: "Por favor, insira a API Key da Asaas.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    
    try {
      const baseUrl = asaasConfig.ambiente === "production" 
        ? "https://api.asaas.com/v3" 
        : "https://sandbox.asaas.com/api/v3";
      
      const response = await fetch(`${baseUrl}/myAccount`, {
        headers: {
          'access_token': asaasConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conectado à conta: ${data.name || 'Conta Asaas'}`,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: "Verifique sua API Key e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar à API da Asaas.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    return plan === "premium" ? "default" : "secondary";
  };

  const handleAdminLogin = () => {
    // Senha de administrador padrão: "admin123"
    if (adminPassword === "admin123") {
      setIsAuthenticated(true);
      toast({
        title: "Acesso concedido",
        description: "Bem-vindo ao painel administrativo",
      });
    } else {
      toast({
        title: "Acesso negado",
        description: "Senha de administrador incorreta",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>
        
        <Card className="w-full max-w-md relative z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-center">
              Acesso restrito aos administradores do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha de Administrador</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Digite a senha de administrador"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Acessar Painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: users?.length || 0,
    premium: users?.filter((u) => u.plano === "premium").length || 0,
    free: users?.filter((u) => u.plano === "free").length || 0,
    admins: users?.filter((u) => u.is_admin === "true").length || 0,
  };

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Painel Administrativo Público
            </h1>
            <p className="text-gray-200 mt-2">
              Gerencie usuários, planos e permissões do sistema
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/95 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premium}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.premium / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.free}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.free / stats.total) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/95 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Criar Nova Conta</CardTitle>
                <CardDescription>
                  Adicione novos usuários ao sistema
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant={showCreateForm ? "outline" : "default"}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {showCreateForm ? "Cancelar" : "Nova Conta"}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={newUserData.nome}
                      onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="Digite o email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={newUserData.senha}
                      onChange={(e) => setNewUserData({ ...newUserData, senha: e.target.value })}
                      placeholder="Digite a senha"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plano">Plano</Label>
                    <Select
                      value={newUserData.plano}
                      onValueChange={(value) => setNewUserData({ ...newUserData, plano: value })}
                    >
                      <SelectTrigger id="plano">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="is_admin">Tipo de Usuário</Label>
                    <Select
                      value={newUserData.is_admin}
                      onValueChange={(value) => setNewUserData({ ...newUserData, is_admin: value })}
                    >
                      <SelectTrigger id="is_admin">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Usuário</SelectItem>
                        <SelectItem value="true">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Conta"}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>

        <Card className="bg-white/95 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Integração com Asaas
                </CardTitle>
                <CardDescription>
                  Configure a integração com a API da Asaas para pagamentos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Campo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        API Key
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="password"
                        placeholder="Insira sua API Key da Asaas"
                        value={asaasConfig.api_key}
                        onChange={(e) => setAsaasConfig({ ...asaasConfig, api_key: e.target.value })}
                        className="max-w-md"
                      />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Ambiente
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={asaasConfig.ambiente}
                        onValueChange={(value: "sandbox" | "production") => 
                          setAsaasConfig({ ...asaasConfig, ambiente: value })
                        }
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Sandbox</Badge>
                              <span className="text-xs text-muted-foreground">Testes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="production">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Produção</Badge>
                              <span className="text-xs text-muted-foreground">Ambiente Real</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={handleTestAsaasConnection}
                        disabled={testingConnection || !asaasConfig.api_key}
                        variant="outline"
                        size="sm"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testingConnection ? "Testando..." : "Testar Conexão"}
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Dica:</strong> Use o ambiente Sandbox para testes e Produção apenas quando estiver pronto para processar pagamentos reais. 
                Você pode obter suas chaves de API no painel da Asaas em: Configurações → Integrações → API Key.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.nome}</TableCell>
                        <TableCell>{user.email}</TableCell>
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
                          <Badge
                            variant={user.is_admin === "true" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleAdminToggle(user.id, user.is_admin)}
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
                          {editingUser === user.id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser(user.id)}
                            >
                              Editar Plano
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Nenhum usuário cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-white/80 text-sm">
          Desenvolvido por <span className="font-medium">Pavisoft Sistemas</span>
        </footer>
      </div>
    </div>
  );
}
