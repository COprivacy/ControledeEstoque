import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/LoginForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string, isFuncionario: boolean) => {
    setIsLoading(true);
    try {
      // Escolhe a rota correta baseado no tipo de usuário
      const endpoint = isFuncionario ? "/api/auth/login-funcionario" : "/api/auth/login";
      
      const response = await apiRequest("POST", endpoint, {
        email,
        senha: password
      });

      if (!response.ok) {
        throw new Error("Email ou senha inválidos");
      }

      const userData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("🔄 Atualizando localStorage do usuário logado:", userData);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${userData.nome}`,
      });

      // Aguarda um pouco para garantir que o localStorage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Funcionários vão para PDV, donos vão para Dashboard
      if (isFuncionario) {
        setLocation("/pdv");
        return;
      }
      }

      // Donos de conta vão para o dashboard
      setLocation("/dashboard");

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