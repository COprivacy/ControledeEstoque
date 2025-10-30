import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import backgroundImage from "@assets/generated_images/Pavisoft_Sistemas_tech_background_61320ac2.png";

interface RegisterFormProps {
  onRegister?: (name: string, email: string, password: string) => void;
  onLoginClick?: () => void;
  isLoading?: boolean;
}

export default function RegisterForm({ onRegister, onLoginClick, isLoading }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister && name && email && password) {
      console.log("Registro tentado:", { name, email, password });
      onRegister(name, email, password);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"></div>
      <div className="w-full max-w-md space-y-4 relative z-10">
        <Link href="/">
          <Button variant="outline" className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Site
          </Button>
        </Link>
        <Card className="w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-white/20 dark:border-gray-800/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300">
            Preencha os dados para criar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  data-testid="input-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                  data-testid="password-toggle-button"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" data-testid="button-register" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={onLoginClick}
              data-testid="button-login-nav"
            >
              Já tenho conta
            </Button>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
