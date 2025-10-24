
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
import { Users, Crown, Shield, CheckCircle2, ArrowLeft } from "lucide-react";
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
