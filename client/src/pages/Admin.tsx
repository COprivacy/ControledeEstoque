import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserPlus, Trash2, Shield, Building2, CreditCard, Edit, Power, Check, Crown, Zap, FileText, Clock, Download, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
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
import { CheckoutForm } from "@/components/CheckoutForm";
import { EmployeePurchaseDialog } from "@/components/EmployeePurchaseDialog";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
  status: string;
  data_criacao?: string;
  cargo?: string;
  max_funcionarios?: number;
  data_expiracao_plano?: string;
  data_expiracao_trial?: string;
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
  dashboard: string;
  caixa: string;
  configuracoes: string;
  historico_caixas: string;
}

interface EmployeeFormData {
  nome: string;
  email: string;
  senha: string;
  cargo: string;
}

interface AuditLog {
  id: number;
  data: string;
  usuario_nome: string;
  usuario_email: string;
  acao: string;
  detalhes: string;
  ip_address?: string;
  user_agent?: string;
}

function AuditLogsSection({ logs, employees }: { logs: AuditLog[]; employees: User[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedPeriod, selectedAction]);

  const actionColors: Record<string, string> = {
    LOGIN_FUNCIONARIO: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700",
    LOGOUT_FUNCIONARIO: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700",
    PERMISSOES_ATUALIZADAS: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    FUNCIONARIO_CRIADO: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    FUNCIONARIO_ATUALIZADO: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    FUNCIONARIO_DELETADO: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700",
    PRODUTO_CRIADO: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    PRODUTO_ATUALIZADO: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700",
    PRODUTO_DELETADO: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    VENDA_REALIZADA: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
    VENDA_CANCELADA: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700",
    CAIXA_ABERTO: "bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-700",
    CAIXA_FECHADO: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    CONFIG_ATUALIZADA: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700",
    CLIENTE_CRIADO: "bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700",
    FORNECEDOR_CRIADO: "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-700",
    BACKUP_GERADO: "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-700",
    ERRO_SISTEMA: "bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-red-200 border-red-400 dark:border-red-600",
    ACESSO_NEGADO: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700",
  };

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map(log => log.acao))).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.usuario_nome?.toLowerCase().includes(search) ||
        log.usuario_email?.toLowerCase().includes(search) ||
        log.acao?.toLowerCase().includes(search) ||
        log.detalhes?.toLowerCase().includes(search)
      );
    }

    if (selectedEmployee !== "all") {
      filtered = filtered.filter(log =>
        log.usuario_email === selectedEmployee
      );
    }

    if (selectedPeriod !== "all") {
      const now = new Date();
      const logDate = (log: AuditLog) => new Date(log.data);

      filtered = filtered.filter(log => {
        const date = logDate(log);
        switch (selectedPeriod) {
          case "today":
            return date.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return date >= monthAgo;
          default:
            return true;
        }
      });
    }

    if (selectedAction !== "all") {
      filtered = filtered.filter(log => log.acao === selectedAction);
    }

    return filtered;
  }, [logs, searchTerm, selectedEmployee, selectedPeriod, selectedAction]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const paginatedLogs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, safeCurrentPage]);

  const exportToCSV = () => {
    const headers = ["Data/Hora", "Usuário", "Email", "Ação", "Detalhes", "IP", "Navegador"];
    const csvData = filteredLogs.map(log => [
      new Date(log.data).toLocaleString('pt-BR'),
      log.usuario_nome || "",
      log.usuario_email || "",
      log.acao || "",
      log.detalhes || "",
      log.ip_address || "",
      log.user_agent || ""
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Logs de Auditoria
              </CardTitle>
              <CardDescription>
                Histórico de ações dos funcionários e administradores ({filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''})
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="gap-2"
            data-testid="button-export-logs"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Label>
            <Input
              placeholder="Buscar em logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search-logs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionário
            </Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger data-testid="select-employee-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Funcionários</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.email}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Período
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger data-testid="select-period-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tipo de Ação
            </Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger data-testid="select-action-filter">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Nenhum log encontrado</AlertTitle>
            <AlertDescription>
              {logs.length === 0
                ? "As ações dos funcionários aparecerão aqui quando forem realizadas."
                : "Nenhum log corresponde aos filtros selecionados. Tente ajustar os filtros."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead className="w-[200px]">Usuário</TableHead>
                    <TableHead className="w-[180px]">Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="hover-elevate">
                      <TableCell data-testid={`text-log-timestamp-${log.id}`} className="font-mono text-sm">
                        {new Date(log.data).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </TableCell>
                      <TableCell data-testid={`text-log-user-${log.id}`}>
                        <div className="space-y-1">
                          <div className="font-medium">{log.usuario_nome}</div>
                          <div className="text-xs text-muted-foreground">{log.usuario_email}</div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-log-action-${log.id}`}>
                        <Badge
                          variant="outline"
                          className={actionColors[log.acao] || ""}
                        >
                          {log.acao}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-log-details-${log.id}`} className="max-w-md">
                        <div className="space-y-1">
                          <div className="text-sm">{log.detalhes || "Sem detalhes"}</div>
                          {(log.ip_address || log.user_agent) && (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {log.ip_address && <div>IP: {log.ip_address}</div>}
                              {log.user_agent && <div className="truncate">Navegador: {log.user_agent.substring(0, 50)}...</div>}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((safeCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(safeCurrentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="text-sm font-medium">
                    Página {safeCurrentPage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [editPermissionsUser, setEditPermissionsUser] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plano: 'premium_mensal' | 'premium_anual'; nome: string; preco: string } | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [employeePurchaseOpen, setEmployeePurchaseOpen] = useState(false);

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

  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));

  // Atualizar dados do usuário a cada 30 segundos para pegar atualizações do webhook
  useQuery({
    queryKey: ["/api/user-refresh", currentUser.id],
    queryFn: async () => {
      const response = await fetch(`/api/users`, {
        headers: {
          'x-user-id': currentUser.id,
        },
      });
      if (response.ok) {
        const users = await response.json();
        const updatedUser = users.find((u: any) => u.id === currentUser.id);
        if (updatedUser && updatedUser.max_funcionarios !== currentUser.max_funcionarios) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          toast({
            title: "✅ Limite atualizado",
            description: `Seu limite de funcionários foi atualizado para ${updatedUser.max_funcionarios}!`,
          });
        }
        return updatedUser;
      }
      return currentUser;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    enabled: !!currentUser.id,
  });

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

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/logs-admin", currentUser.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/logs-admin?conta_id=${currentUser.id}`);
      return response.json();
    },
    enabled: !!currentUser.id,
  });

  const accountUsers = employees;

  const createEmployeeMutation = useMutation({
    mutationFn: async (userData: EmployeeFormData) => {
      const response = await apiRequest("POST", "/api/funcionarios", {
        ...userData,
        conta_id: currentUser.id,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios", { conta_id: currentUser.id }] });
      toast({
        title: "Funcionário adicionado",
        description: "Novo funcionário criado com sucesso!",
      });
      setCreateUserOpen(false);
      setNewEmployee({ nome: "", email: "", senha: "", cargo: "" });
    },
    onError: (error: any) => {
      if (error.limite_atingido) {
        setCreateUserOpen(false);
        setShowPricingDialog(true);
      } else {
        toast({
          title: "Erro ao criar funcionário",
          description: error.error || (error instanceof Error ? error.message : "Erro desconhecido"),
          variant: "destructive",
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios", { conta_id: currentUser.id }] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios", { conta_id: currentUser.id }] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/funcionarios", { conta_id: currentUser.id }] });
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
    dashboard: "false",
    caixa: "false",
    configuracoes: "false",
    historico_caixas: "false",
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

  const handleSubscribe = (plano: 'mensal' | 'anual') => {
    const planoMap = {
      'mensal': { plano: 'premium_mensal' as const, nome: 'Plano Mensal', preco: 'R$ 79,99/mês' },
      'anual': { plano: 'premium_anual' as const, nome: 'Plano Anual', preco: 'R$ 67,99/mês' }
    };

    setSelectedPlan(planoMap[plano]);
    setCheckoutOpen(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
        {/* Header Compacto e Moderno */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Painel de Administração
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Gerencie sua equipe e personalize seu plano
                </p>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 p-1 rounded-xl shadow-sm">
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
          <TabsTrigger 
            value="logs" 
            data-testid="tab-logs"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Logs de Auditoria
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
                {(currentUser.data_expiracao_plano || currentUser.data_expiracao_trial) && (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {currentUser.plano === "trial" ? "Trial" : "Expira em"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {calculateDaysRemaining(
                        currentUser.data_expiracao_plano || currentUser.data_expiracao_trial
                      )} <span className="text-base font-normal text-gray-600 dark:text-gray-400">dias restantes</span>
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
                                onClick={() => handleSubscribe('mensal')}
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
                                R$ 815,88/ano (12x sem juros)
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
                                onClick={() => handleSubscribe('anual')}
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
                              Pagamento 100% seguro via Mercado Pago
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
              <div className="grid grid-cols-3 gap-4">
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
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30">
                  <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {currentUser.max_funcionarios || 1}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">Limite de funcionários</p>
                </div>
              </div>
              {accountUsers.length >= (currentUser.max_funcionarios || 1) && (
                <Alert className="mt-4 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                  <AlertTitle className="text-orange-800 dark:text-orange-200">Limite atingido!</AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-300 flex flex-col gap-3">
                    <p>Você atingiu o limite de {currentUser.max_funcionarios || 1} funcionário(s).</p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setEmployeePurchaseOpen(true)}
                      className="w-fit"
                      data-testid="button-upgrade-plan"
                    >
                      Comprar Mais Funcionários
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
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
                  <Label htmlFor="edit-senha">Nova Senha (Opcional)</Label>
                  <Input
                    id="edit-senha"
                    type="password"
                    value={editEmployee.senha}
                    onChange={(e) => setEditEmployee({ ...editEmployee, senha: e.target.value })}
                    placeholder="Digite a nova senha (deixe em branco para não alterar)"
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
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Gerenciar Permissões</DialogTitle>
                <DialogDescription>
                  Defina quais funcionalidades este funcionário pode acessar
                </DialogDescription>
              </DialogHeader>
              {editPermissionsUser && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                      {[
                        { key: 'pdv', label: 'PDV / Caixa', description: 'Realizar vendas e gerenciar caixa' },
                        { key: 'caixa', label: 'Caixa', description: 'Abrir e fechar caixa' },
                        { key: 'historico_caixas', label: 'Histórico de Caixas', description: 'Visualizar histórico de caixas anteriores' },
                        { key: 'produtos', label: 'Produtos', description: 'Cadastrar e editar produtos' },
                        { key: 'inventario', label: 'Inventário', description: 'Gerenciar estoque' },
                        { key: 'clientes', label: 'Clientes', description: 'Gerenciar cadastro de clientes' },
                        { key: 'fornecedores', label: 'Fornecedores', description: 'Gerenciar fornecedores' },
                        { key: 'financeiro', label: 'Financeiro', description: 'Acessar módulo financeiro' },
                        { key: 'config_fiscal', label: 'Config. Fiscal', description: 'Configurações fiscais e NF-e' },
                        { key: 'devolucoes', label: 'Devoluções', description: 'Gerenciar devoluções de produtos' },
                        { key: 'contas_pagar', label: 'Contas a Pagar', description: 'Gerenciar contas a pagar' },
                        { key: 'contas_receber', label: 'Contas a Receber', description: 'Gerenciar contas a receber' },
                      ].map((perm) => (
                        <Card 
                          key={perm.key} 
                          className="cursor-pointer hover-elevate transition-all" 
                          onClick={() => togglePermission(editPermissionsUser, perm.key as keyof Permission)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-tight">{perm.label}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{perm.description}</p>
                              </div>
                              <div className="flex-shrink-0">
                                <Switch
                                  checked={(permissions[editPermissionsUser]?.[perm.key as keyof Permission] || allPermissions[editPermissionsUser]?.[perm.key as keyof Permission] || "false") === "true"}
                                  onCheckedChange={() => togglePermission(editPermissionsUser, perm.key as keyof Permission)}
                                  data-testid={`switch-permission-${perm.key}`}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
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

        <TabsContent value="logs" className="space-y-6 mt-6">
          <AuditLogsSection logs={logs} employees={accountUsers} />
        </TabsContent>
      </Tabs>
      </div>

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              Limite de Funcionários Atingido
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Você atingiu o limite do seu plano. Escolha uma opção abaixo para aumentar a capacidade:
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plano 5 Funcionários */}
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-800/50 hover:border-blue-600 transition-all cursor-pointer">
                <CardHeader>
                  <div className="text-center">
                    <Crown className="h-10 w-10 text-blue-400 mx-auto mb-2" />
                    <CardTitle className="text-blue-200 text-xl">Até 5 Funcionários</CardTitle>
                    <p className="text-gray-400 text-sm mt-1">Perfeito para pequenas equipes</p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-blue-100">R$ 39,90</p>
                    <p className="text-gray-400 text-sm mt-1">por mês</p>
                  </div>
                  <ul className="text-left space-y-2 mb-6 text-sm">
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      5 acessos simultâneos
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Todas as funcionalidades
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Suporte prioritário
                    </li>
                  </ul>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-plan-5">
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Plano 10 Funcionários */}
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-800/50 hover:border-purple-600 transition-all cursor-pointer relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1">
                    🔥 Mais Popular
                  </Badge>
                </div>
                <CardHeader>
                  <div className="text-center mt-2">
                    <Zap className="h-10 w-10 text-purple-400 mx-auto mb-2" />
                    <CardTitle className="text-purple-200 text-xl">Até 10 Funcionários</CardTitle>
                    <p className="text-gray-400 text-sm mt-1">Ideal para crescimento</p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-purple-100">R$ 69,90</p>
                    <p className="text-gray-400 text-sm mt-1">por mês</p>
                    <p className="text-green-400 text-xs mt-1">💰 Economia de R$ 30/mês</p>
                  </div>
                  <ul className="text-left space-y-2 mb-6 text-sm">
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      10 acessos simultâneos
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Todas as funcionalidades
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Suporte prioritário 24/7
                    </li>
                  </ul>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-plan-10">
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>

              {/* Plano 20 Funcionários */}
              <Card className="bg-gradient-to-br from-orange-900/20 to-orange-950/20 border-orange-800/50 hover:border-orange-600 transition-all cursor-pointer">
                <CardHeader>
                  <div className="text-center">
                    <Building2 className="h-10 w-10 text-orange-400 mx-auto mb-2" />
                    <CardTitle className="text-orange-200 text-xl">Até 20 Funcionários</CardTitle>
                    <p className="text-gray-400 text-sm mt-1">Para equipes grandes</p>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-orange-100">R$ 119,90</p>
                    <p className="text-gray-400 text-sm mt-1">por mês</p>
                    <p className="text-green-400 text-xs mt-1">💰 Economia de R$ 80/mês</p>
                  </div>
                  <ul className="text-left space-y-2 mb-6 text-sm">
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      20 acessos simultâneos
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Todas as funcionalidades
                    </li>
                    <li className="flex items-center text-gray-300">
                      <Check className="h-4 w-4 text-green-400 mr-2" />
                      Suporte dedicado VIP
                    </li>
                  </ul>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-plan-20">
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg">
              <p className="text-center text-gray-400 text-sm">
                💡 <strong className="text-white">Dica:</strong> Entre em contato conosco para planos customizados com mais de 20 funcionários
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EmployeePurchaseDialog
        open={employeePurchaseOpen}
        onOpenChange={setEmployeePurchaseOpen}
        currentLimit={currentUser.max_funcionarios || 1}
      />

      {selectedPlan && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plano={selectedPlan.plano}
          planoNome={selectedPlan.nome}
          planoPreco={selectedPlan.preco}
        />
      )}
    </div>
  );
}