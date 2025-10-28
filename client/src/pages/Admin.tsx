import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
import { Users, UserPlus, Trash2, Shield, Building2, CreditCard, Edit, Power, Check, Crown, Zap } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
  status: string;
  data_criacao?: string;
  cargo?: string;
}

interface Permission {
  pdv: string;
  produtos: string;
  inventario: string;
  relatorios: string;
  clientes: string;
  fornecedores: string;
  financeiro: string;
  config_fiscal: string;
}

interface EmployeeFormData {
  nome: string;
  email: string;
  senha: string;
  cargo: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [editPermissionsUser, setEditPermissionsUser] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const [newEmployee, setNewEmployee] = useState<EmployeeFormData>({
    nome: "",
    email: "",
    senha: "",
    cargo: "",
  });

  const [editEmployee, setEditEmployee] = useState<EmployeeFormData>({
    nome: "",
    email: "",
    senha: "",
    cargo: "",
  });

  const [permissions, setPermissions] = useState<Record<string, Permission>>({});

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: employees = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/funcionarios", { conta_id: currentUser.id }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/funcionarios?conta_id=${currentUser.id}`);
      return response.json();
    },
  });

  const { data: allPermissions = {} } = useQuery({
    queryKey: ["/api/funcionarios/permissoes", currentUser.id],
    queryFn: async () => {
      const perms: Record<string, Permission> = {};
      for (const emp of employees) {
        const response = await apiRequest("GET", `/api/funcionarios/${emp.id}/permissoes`);
        perms[emp.id] = await response.json();
      }
      return perms;
    },
    enabled: employees.length > 0,
  });

  const accountUsers = employees;

  const createEmployeeMutation = useMutation({
    mutationFn: async (userData: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/funcionarios", {
        ...userData,
        conta_id: currentUser.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios"] });
      toast({
        title: "Funcionário adicionado",
        description: "Novo funcionário criado com sucesso!",
      });
      setCreateUserOpen(false);
      setNewEmployee({ nome: "", email: "", senha: "", cargo: "" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar funcionário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmployeeFormData> }) => {
      const cleanUpdates = { ...updates };
      if (!cleanUpdates.senha) {
        delete cleanUpdates.senha;
      }
      const response = await apiRequest("PATCH", `/api/funcionarios/${id}`, cleanUpdates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios"] });
      toast({
        title: "Funcionário atualizado",
        description: "Dados do funcionário atualizados com sucesso!",
      });
      setEditEmployeeOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/funcionarios/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios"] });
      toast({
        title: "Status atualizado",
        description: "Status do funcionário atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/funcionarios/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios"] });
      toast({
        title: "Funcionário removido",
        description: "Funcionário removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEmployee = (userId: string) => {
    if (confirm("Tem certeza que deseja remover este funcionário?")) {
      deleteEmployeeMutation.mutate(userId);
    }
  };

  const handleEditEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    setEditEmployee({
      nome: employee.nome,
      email: employee.email,
      senha: "",
      cargo: employee.cargo || "",
    });
    setEditEmployeeOpen(true);
  };

  const handleSaveEmployee = () => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({
        id: selectedEmployee.id,
        updates: editEmployee,
      });
    }
  };

  const handleToggleStatus = (employee: User) => {
    const newStatus = employee.status === "ativo" ? "inativo" : "ativo";
    toggleStatusMutation.mutate({ id: employee.id, status: newStatus });
  };

  const getDefaultPermissions = (): Permission => ({
    pdv: "false",
    produtos: "false",
    inventario: "false",
    relatorios: "false",
    clientes: "false",
    fornecedores: "false",
    financeiro: "false",
    config_fiscal: "false",
  });

  const togglePermission = (userId: string, permission: keyof Permission) => {
    setPermissions(prev => {
      const current = prev[userId] || allPermissions[userId] || getDefaultPermissions();
      return {
        ...prev,
        [userId]: {
          ...current,
          [permission]: current[permission] === "true" ? "false" : "true",
        },
      };
    });
  };

  const openPermissionsDialog = (userId: string) => {
    setEditPermissionsUser(userId);
    if (allPermissions[userId]) {
      setPermissions(prev => ({
        ...prev,
        [userId]: allPermissions[userId],
      }));
    }
  };

  const savePermissionsMutation = useMutation({
    mutationFn: async ({ userId, perms }: { userId: string; perms: Permission }) => {
      const response = await apiRequest("POST", `/api/funcionarios/${userId}/permissoes`, perms);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios/permissoes"] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões foram salvas com sucesso.",
      });
      setEditPermissionsUser(null);
      setPermissions({});
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar permissões",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const savePermissions = (userId: string) => {
    const perms = permissions[userId] || getDefaultPermissions();
    savePermissionsMutation.mutate({ userId, perms });
  };

  const handleSubscribe = async (plano: 'mensal' | 'anual', formaPagamento: 'CREDIT_CARD' | 'BOLETO' | 'PIX') => {
    try {
      const planoMap = {
        'mensal': 'premium_mensal',
        'anual': 'premium_anual'
      };

      const response = await apiRequest("POST", "/api/checkout", {
        plano: planoMap[plano],
        forma_pagamento: formaPagamento,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Assinatura criada!",
          description: `Sua assinatura ${plano} foi criada. Complete o pagamento para ativar.`,
        });

        // Redirecionar para URL de pagamento se disponível
        if (data.payment?.invoiceUrl) {
          window.open(data.payment.invoiceUrl, '_blank');
        }
      } else {
        throw new Error(data.error || "Erro ao criar assinatura");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar assinatura",
        description: error.message || "Tente novamente ou entre em contato com o suporte",
        variant: "destructive",
      });
    }
  };

  const calculateDaysRemaining = (expirationDate?: string) => {
    if (!expirationDate) return null;
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Moderno com Gradiente */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Painel de Administração
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                  Gerencie sua equipe e personalize seu plano
                </p>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 p-1 rounded-xl shadow-sm">
          <TabsTrigger 
            value="info" 
            data-testid="tab-account-info"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Informações da Conta
          </TabsTrigger>
          <TabsTrigger 
            value="funcionarios" 
            data-testid="tab-employees"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Funcionários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-blue-200/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Informações da Empresa
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nome</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentUser.nome}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{currentUser.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/20 border-purple-200/50 dark:border-purple-800/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Plano Atual
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Plano</p>
                  <Badge variant={currentUser.plano === "premium" || currentUser.plano === "mensal" || currentUser.plano === "anual" ? "default" : "secondary"} className="text-sm px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                    {currentUser.plano === "trial" && "7 Dias Free Trial"}
                    {currentUser.plano === "mensal" && "Mensal"}
                    {currentUser.plano === "anual" && "Anual"}
                    {currentUser.plano === "premium" && "Premium"}
                    {!["trial", "mensal", "anual", "premium"].includes(currentUser.plano) && "Free"}
                  </Badge>
                </div>
                {currentUser.data_expiracao_plano && (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Expira em</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {calculateDaysRemaining(currentUser.data_expiracao_plano)} <span className="text-base font-normal text-gray-600 dark:text-gray-400">dias</span>
                    </p>
                  </div>
                )}
                {currentUser.data_expiracao_trial && (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Trial</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {calculateDaysRemaining(currentUser.data_expiracao_trial)} <span className="text-base font-normal text-gray-600 dark:text-gray-400">dias restantes</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {(currentUser.plano === "trial" || currentUser.plano === "free") && (
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-0 shadow-2xl">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
              <CardContent className="relative p-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          Desbloqueie Todo o Potencial
                        </h3>
                        <p className="text-blue-100">
                          Upgrade para Premium e transforme seu negócio
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className="p-2 bg-blue-500/30 rounded-lg">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Plano Mensal</p>
                          <p className="text-blue-100 text-sm">R$ 79,99/mês</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/30">
                        <div className="p-2 bg-purple-500/30 rounded-lg">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">Plano Anual</p>
                          <p className="text-blue-100 text-sm">R$ 67,99/mês • Economize 15%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 shadow-xl font-semibold">
                          <Crown className="h-5 w-5 mr-2" />
                          Ver Planos
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Escolha seu plano</DialogTitle>
                          <DialogDescription>
                            Selecione o plano ideal para sua empresa
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {/* Plano Mensal */}
                          <Card className="border hover:shadow-md transition-all">
                            <CardHeader className="pb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">Plano Mensal</CardTitle>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Flexibilidade total</p>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">R$ 79,99</span>
                                <span className="text-gray-500 dark:text-gray-400">/mês</span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Acesso completo ao sistema</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>PDV, Estoque e NF-e</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Suporte por email</span>
                                </div>
                              </div>
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700" 
                                onClick={() => handleSubscribe('mensal', 'CREDIT_CARD')}
                                data-testid="button-plan-mensal"
                              >
                                Assinar Agora
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Plano Anual */}
                          <Card className="border-2 border-purple-200 dark:border-purple-700 shadow-md relative">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge className="bg-purple-600 text-white text-xs px-3 py-1">
                                Mais Popular - Economize 15%
                              </Badge>
                            </div>
                            <CardHeader className="pb-4 pt-6">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">Plano Anual</CardTitle>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Melhor custo-benefício</p>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">R$ 67,99</span>
                                <span className="text-gray-500 dark:text-gray-400">/mês</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                R$ 815,90/ano (12x sem juros)
                              </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span><strong>Tudo do plano mensal</strong></span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Economize R$ 143,98 por ano</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Suporte prioritário</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Backups automáticos</span>
                                </div>
                              </div>
                              <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700" 
                                onClick={() => handleSubscribe('anual', 'CREDIT_CARD')}
                                data-testid="button-plan-anual"
                              >
                                Assinar Agora
                              </Button>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Pagamento 100% seguro via Asaas
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Aceita Cartão de Crédito, Boleto e PIX • Cancele quando quiser
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/20 border-green-200/50 dark:border-green-800/30 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                  Resumo da Equipe
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {accountUsers.length}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">Funcionários cadastrados</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/30">
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-800 bg-clip-text text-transparent">
                    {accountUsers.filter(u => u.status === "ativo").length}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">Funcionários ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          </TabsContent>

        <TabsContent value="funcionarios" className="space-y-8 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Funcionários</h2>
              <p className="text-muted-foreground">Gerencie os funcionários que têm acesso ao sistema</p>
            </div>
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-employee">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Funcionário</DialogTitle>
                  <DialogDescription>
                    Crie um novo acesso para um funcionário da sua empresa
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={newEmployee.nome}
                      onChange={(e) => setNewEmployee({ ...newEmployee, nome: e.target.value })}
                      placeholder="Ex: João Silva"
                      data-testid="input-employee-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="joao@empresa.com"
                      data-testid="input-employee-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={newEmployee.cargo}
                      onChange={(e) => setNewEmployee({ ...newEmployee, cargo: e.target.value })}
                      placeholder="Ex: Vendedor, Gerente, Caixa"
                      data-testid="input-employee-cargo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="senha">Senha Inicial</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={newEmployee.senha}
                      onChange={(e) => setNewEmployee({ ...newEmployee, senha: e.target.value })}
                      placeholder="Senha para primeiro acesso"
                      data-testid="input-employee-password"
                    />
                  </div>
                  <Alert>
                    <AlertDescription>
                      O funcionário poderá fazer login com este email e senha. Recomendamos que ele altere a senha no primeiro acesso.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={() => createEmployeeMutation.mutate(newEmployee)} 
                    className="w-full"
                    disabled={createEmployeeMutation.isPending}
                    data-testid="button-submit-employee"
                  >
                    {createEmployeeMutation.isPending ? "Criando..." : "Criar Acesso"}
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
                      <TableHead>Cargo</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountUsers.length > 0 ? (
                      accountUsers.map((employee) => (
                        <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                          <TableCell className="font-medium">{employee.nome}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.cargo || "-"}</TableCell>
                          <TableCell>
                            {employee.data_criacao 
                              ? new Date(employee.data_criacao).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={employee.status === "ativo" ? "default" : "secondary"}>
                              {employee.status === "ativo" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                                data-testid={`button-edit-employee-${employee.id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPermissionsDialog(employee.id)}
                                data-testid={`button-edit-permissions-${employee.id}`}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Permissões
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(employee)}
                                data-testid={`button-toggle-status-${employee.id}`}
                              >
                                <Power className="h-4 w-4 mr-1" />
                                {employee.status === "ativo" ? "Desativar" : "Ativar"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEmployee(employee.id)}
                                data-testid={`button-delete-employee-${employee.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhum funcionário cadastrado. Adicione funcionários para gerenciar os acessos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={editEmployeeOpen} onOpenChange={setEditEmployeeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Funcionário</DialogTitle>
                <DialogDescription>
                  Atualize os dados do funcionário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-nome">Nome Completo</Label>
                  <Input
                    id="edit-nome"
                    value={editEmployee.nome}
                    onChange={(e) => setEditEmployee({ ...editEmployee, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                    data-testid="input-edit-employee-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmployee.email}
                    onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
                    placeholder="joao@empresa.com"
                    data-testid="input-edit-employee-email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cargo">Cargo</Label>
                  <Input
                    id="edit-cargo"
                    value={editEmployee.cargo}
                    onChange={(e) => setEditEmployee({ ...editEmployee, cargo: e.target.value })}
                    placeholder="Ex: Vendedor, Gerente, Caixa"
                    data-testid="input-edit-employee-cargo"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-senha">Nova Senha (deixe em branco para não alterar)</Label>
                  <Input
                    id="edit-senha"
                    type="password"
                    value={editEmployee.senha}
                    onChange={(e) => setEditEmployee({ ...editEmployee, senha: e.target.value })}
                    placeholder="Nova senha (opcional)"
                    data-testid="input-edit-employee-password"
                  />
                </div>
                <Alert>
                  <AlertDescription>
                    Preencha apenas os campos que deseja alterar. A senha será atualizada apenas se você digitar uma nova.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveEmployee} 
                    className="flex-1"
                    disabled={updateEmployeeMutation.isPending}
                    data-testid="button-save-employee"
                  >
                    {updateEmployeeMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditEmployeeOpen(false)} 
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={editPermissionsUser !== null} onOpenChange={(open) => !open && setEditPermissionsUser(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Gerenciar Permissões</DialogTitle>
                <DialogDescription>
                  Defina quais funcionalidades este funcionário pode acessar
                </DialogDescription>
              </DialogHeader>
              {editPermissionsUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'dashboard', label: 'Dashboard', description: 'Acessar página principal do sistema' },
                      { key: 'pdv', label: 'PDV / Caixa', description: 'Realizar vendas e gerenciar caixa' },
                      { key: 'produtos', label: 'Produtos', description: 'Cadastrar e editar produtos' },
                      { key: 'inventario', label: 'Inventário', description: 'Gerenciar estoque' },
                      { key: 'relatorios', label: 'Relatórios', description: 'Visualizar relatórios de vendas' },
                      { key: 'clientes', label: 'Clientes', description: 'Gerenciar cadastro de clientes' },
                      { key: 'fornecedores', label: 'Fornecedores', description: 'Gerenciar fornecedores' },
                      { key: 'financeiro', label: 'Financeiro', description: 'Acessar contas a pagar/receber' },
                      { key: 'config_fiscal', label: 'Config. Fiscal', description: 'Configurações fiscais e NF-e' },
                      { key: 'configuracoes', label: 'Configurações', description: 'Acessar configurações do sistema' },
                    ].map((perm) => (
                      <Card key={perm.key} className="cursor-pointer" onClick={() => togglePermission(editPermissionsUser, perm.key as keyof Permission)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{perm.label}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{perm.description}</p>
                            </div>
                            <div className="ml-2">
                              <input
                                type="checkbox"
                                checked={(permissions[editPermissionsUser]?.[perm.key as keyof Permission] || allPermissions[editPermissionsUser]?.[perm.key as keyof Permission] || "false") === "true"}
                                onChange={() => {}}
                                className="h-4 w-4"
                                data-testid={`checkbox-permission-${perm.key}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => savePermissions(editPermissionsUser)} 
                      className="flex-1"
                      data-testid="button-save-permissions"
                    >
                      Salvar Permissões
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditPermissionsUser(null)} 
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
