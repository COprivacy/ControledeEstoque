import { useState } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/LoginForm";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = (email: string, password: string) => {
    console.log("Login:", { email, password });
    toast({
      title: "Login realizado com sucesso!",
      description: `Bem-vindo, ${email}`,
    });
    setLocation("/dashboard");
  };

  const handleRegisterClick = () => {
    setLocation("/register");
  };

  return <LoginForm onLogin={handleLogin} onRegisterClick={handleRegisterClick} />;
}
