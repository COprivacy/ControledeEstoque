import { useLocation } from "wouter";
import RegisterForm from "@/components/RegisterForm";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegister = (name: string, email: string, password: string) => {
    console.log("Registro:", { name, email, password });
    toast({
      title: "Conta criada com sucesso!",
      description: "Faça login para acessar o sistema",
    });
    setLocation("/");
  };

  const handleLoginClick = () => {
    setLocation("/");
  };

  return <RegisterForm onRegister={handleRegister} onLoginClick={handleLoginClick} />;
}
