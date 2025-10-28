import { useLocation } from "wouter";
import RegisterForm from "@/components/RegisterForm";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: name,
          email,
          senha: password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar conta");
      }

      return response.json();
    },
    retry: false,
    onSuccess: (data) => {
      toast({
        title: "Conta criada com sucesso!",
        description: `Você ganhou 7 dias de teste grátis. Faça login para começar!`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegister = (name: string, email: string, password: string) => {
    if (!registerMutation.isPending) {
      registerMutation.mutate({ name, email, password });
    }
  };

  const handleLoginClick = () => {
    setLocation("/");
  };

  return <RegisterForm onRegister={handleRegister} onLoginClick={handleLoginClick} isLoading={registerMutation.isPending} />;
}
