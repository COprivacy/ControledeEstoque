import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, Shield, CheckCircle2, HelpCircle } from "lucide-react";
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50 backdrop-blur-sm"></div>
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        <Link href="/">
          <Button 
            variant="outline" 
            className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>
        </Link>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2" data-testid="brand-header">
            <Shield className="h-10 w-10 text-blue-400" data-testid="icon-shield-brand" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="text-brand-name">
              PAVISOFT
            </h1>
            <Sparkles className="h-6 w-6 text-purple-400" data-testid="icon-sparkles-brand" />
          </div>
          <p className="text-xl font-semibold text-white/90 tracking-wide" data-testid="text-brand-subtitle">SISTEMAS</p>
        </div>

        <Card className="w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-white/20 dark:border-gray-800/50 shadow-2xl">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-center">
              Comece agora com 7 dias de teste grátis
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Benefícios inclusos:
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    7 dias de teste gratuito
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Acesso completo ao sistema
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Suporte técnico incluso
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    className="pl-10 h-11"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    data-testid="input-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                data-testid="button-register" 
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar conta grátis"}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Já tem uma conta?
                  </span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11" 
                onClick={onLoginClick}
                data-testid="button-login-nav"
              >
                Fazer login
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <p className="text-center text-xs text-white/60">
            © 2025 PAVISOFT SISTEMAS. Todos os direitos reservados.
          </p>
          <a 
            href="/ajuda" 
            className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            data-testid="link-help"
          >
            <HelpCircle className="h-3 w-3" />
            Ajuda e Termos
          </a>
        </div>
      </div>
    </div>
  );
}
