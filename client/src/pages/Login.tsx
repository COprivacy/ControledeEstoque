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
      const response = await apiRequest("POST", "/api/auth/login", { 
        email, 
        senha: password 
      });

      const user = await response.json();
      localStorage.setItem("user", JSON.stringify(user));
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${user.nome}`,
      });
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
