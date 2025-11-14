

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Clock, User, Activity, Shield, Eye, Edit, Trash2, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLog {
  id: number;
  timestamp: string;
  admin_email?: string;
  admin_name?: string;
  action: string;
  target_user?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  session_duration?: number;
}

interface AdminLogsViewProps {
  isPublicAdmin?: boolean;
}

export function AdminLogsView({ isPublicAdmin = false }: AdminLogsViewProps) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, adminFilter]);

  const fetchAdminLogs = async () => {
    try {
      setLoading(true);
      
      // Se for admin público, usa endpoint diferente sem filtro de usuário
      const endpoint = isPublicAdmin 
        ? "/api/admin/all-logs?limit=500"
        : "/api/system-logs?level=INFO&limit=500";
      
      const response = await fetch(endpoint, {
        headers: {
          'x-user-id': localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : '',
          'x-is-admin': 'true',
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar logs");

      const data = await response.json();
      
      console.log('📊 Dados recebidos da API:', data);
      console.log('📊 Total de logs:', Array.isArray(data) ? data.length : 0);
      
      if (!Array.isArray(data)) {
        console.warn('⚠️ Dados de logs não são um array:', data);
        setLogs([]);
        return;
      }

      const processedLogs: AdminLog[] = data
        .filter((log: any) => log && (log.timestamp || log.data)) // Filtrar logs inválidos
        .map((log: any, index: number) => ({
          id: log.id || index + 1,
          timestamp: log.data || log.timestamp || new Date().toISOString(),
          admin_email: log.usuario_email || log.admin_email || log.userId || log.context || 'Sistema',
          admin_name: log.usuario_nome || log.admin_name || log.userName || 'Sistema',
          action: log.acao || log.action || log.message || 'Ação desconhecida',
          target_user: log.target_user || '',
          details: log.detalhes || log.details || '',
          ip_address: log.ip_address || '',
          user_agent: log.user_agent || '',
          session_duration: log.session_duration,
        }));

      setLogs(processedLogs);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        (log.admin_email && log.admin_email.toLowerCase().includes(search)) ||
        (log.admin_name && log.admin_name.toLowerCase().includes(search)) ||
        (log.action && log.action.toLowerCase().includes(search)) ||
        (log.details && log.details.toLowerCase().includes(search)) ||
        (log.target_user && log.target_user.toLowerCase().includes(search))
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action && log.action.includes(actionFilter));
    }

    if (adminFilter !== "all") {
      filtered = filtered.filter(log => log.admin_email && log.admin_email === adminFilter);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const uniqueAdmins = Array.from(new Set(logs.map(log => log.admin_email).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => {
    const action = log.action;
    if (!action) return null;
    const match = action.match(/^[A-Z_]+/);
    return match ? match[0] : action;
  }).filter(Boolean)));

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = ["Data/Hora", "Admin", "Email", "Ação", "Usuário Alvo", "Detalhes", "IP", "User Agent", "Duração Sessão"];
    const csvData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.admin_name || "",
      log.admin_email || "",
      log.action || "",
      log.target_user || "",
      log.details || "",
      log.ip_address || "",
      log.user_agent || "",
      log.session_duration ? `${log.session_duration}s` : "",
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Shield className="h-4 w-4 text-green-500" />;
    if (action.includes('LOGOUT')) return <LogOut className="h-4 w-4 text-gray-500" />;
    if (action.includes('VIEW') || action.includes('ACESSO')) return <Eye className="h-4 w-4 text-blue-500" />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <Edit className="h-4 w-4 text-yellow-500" />;
    if (action.includes('DELETE')) return <Trash2 className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-purple-500" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    if (action.includes('LOGOUT')) return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
    if (action.includes('VIEW') || action.includes('ACESSO')) return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    if (action.includes('UPDATE') || action.includes('EDIT')) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
    if (action.includes('DELETE')) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
    return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
  };

  const logsLast24h = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return logDate >= oneDayAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Logs de Administradores
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitore todas as ações realizadas pelos administradores do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} className="gap-2" variant="outline">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {isPublicAdmin && (
            <Button onClick={() => window.dispatchEvent(new CustomEvent('open-limpar-logs'))} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Limpar Logs
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAdmins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsLast24h}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Admins</SelectItem>
                {uniqueAdmins.map(admin => (
                  <SelectItem key={admin} value={admin || ''}>{admin}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p>Carregando logs...</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {log.admin_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{log.admin_name || 'Sistema'}</div>
                          <div className="text-xs text-muted-foreground">{log.admin_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`flex items-center gap-1 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        <span className="text-xs">{log.action}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.target_user || '—'}</TableCell>
                    <TableCell className="text-sm max-w-md truncate">{log.details}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip_address || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Exibindo {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">{currentPage} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">
          {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Use os filtros acima para refinar a busca
        </p>
      </div>
    </div>
  );
}
