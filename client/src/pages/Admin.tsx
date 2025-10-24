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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Crown, Shield, CheckCircle2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  nome: string;
  plano: string;
  is_admin: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUserMutation.mutate({ id: userId, updates: { plano: newPlan } });
  };

  const handleAdminToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "true" ? "false" : "true";
    updateUserMutation.mutate({ id: userId, updates: { is_admin: newStatus } });
  };

  const getPlanBadgeVariant = (plan: string) => {
    return plan === "premium" ? "default" : "secondary";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando usuários...</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-admin-title">
          Painel Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2" data-testid="text-admin-description">
          Gerencie usuários, planos e permissões do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-stat-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{stats.total}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-premium">
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

        <Card data-testid="card-stat-free">
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

        <Card data-testid="card-stat-admins">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-admin-users">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                  <TableHead data-testid="header-name">Nome</TableHead>
                  <TableHead data-testid="header-email">Email</TableHead>
                  <TableHead data-testid="header-plan">Plano</TableHead>
                  <TableHead data-testid="header-admin">Administrador</TableHead>
                  <TableHead data-testid="header-actions">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${user.id}`}>
                        {user.nome}
                      </TableCell>
                      <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                      <TableCell>
                        {editingUser === user.id ? (
                          <Select
                            defaultValue={user.plano}
                            onValueChange={(value) => handlePlanChange(user.id, value)}
                            data-testid={`select-plan-${user.id}`}
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
                        {editingUser === user.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(null)}
                            data-testid={`button-cancel-${user.id}`}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user.id)}
                            data-testid={`button-edit-${user.id}`}
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
    </div>
  );
}
