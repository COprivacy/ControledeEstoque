import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/LoginForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Tenta fazer login como usuário comum primeiro
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        senha: password
      });

      if (!response.ok) {
        // Se falhar, tenta fazer login como funcionário
        const funcionarioResponse = await apiRequest("POST", "/api/auth/login-funcionario", {
          email,
          senha: password
        });
        if (!funcionarioResponse.ok) {
          throw new Error("Email ou senha inválidos");
        }
        const funcionario = await funcionarioResponse.json();
        localStorage.setItem("user", JSON.stringify(funcionario));

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${funcionario.nome}`,
        });
        
        // Aguarda um pouco para garantir que o localStorage foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        setLocation("/pdv");
        return;
      }

      const user = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      console.log("🔄 Atualizando localStorage do usuário logado:", user);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${user.nome}`,
      });

      // Aguarda um pouco para garantir que o localStorage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verifica se o usuário é admin master e redireciona
      const isAdminMaster = user.is_admin === "true";
      setLocation(isAdminMaster ? "/admin-master" : "/dashboard");

    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Email ou senha inválidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    setLocation("/register");
  };

  return <LoginForm onLogin={handleLogin} onRegisterClick={handleRegisterClick} isLoading={isLoading} />;
}