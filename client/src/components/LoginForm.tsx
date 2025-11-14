import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Lock, UserPlus, Eye, EyeOff, Users, User, Sparkles, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import backgroundImage from "@assets/generated_images/Pavisoft_Sistemas_tech_background_61320ac2.png";

interface LoginFormProps {
  onLogin?: (email: string, password: string, isFuncionario: boolean) => void;
  onRegisterClick?: () => void;
  isLoading?: boolean;
}

export default function LoginForm({
  onLogin,
  onRegisterClick,
  isLoading = false,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFuncionario, setIsFuncionario] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      onLogin(email, password, isFuncionario);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForgotPassword(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      // Verificar se foi bem-sucedido
      if (response.ok && data.success === true) {
        toast({
          title: "✅ Email enviado!",
          description: "Verifique seu email e insira o código recebido",
        });
        setResetStep('code');
      } else {
        // Mostrar erro específico
        const errorMessage = data.error || data.message || "Erro ao enviar email de recuperação";
        
        toast({
          title: "❌ Erro",
          description: errorMessage,
          variant: "destructive",
        });
        
        // NÃO avançar para próxima tela quando houver erro
        console.error("Erro na recuperação de senha:", errorMessage);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast({
        title: "❌ Erro",
        description: "Erro de conexão. Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingForgotPassword(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          code: resetCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Senha alterada com sucesso. Faça login com a nova senha",
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail("");
        setResetCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setResetStep('email');
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao resetar senha",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForgotPassword(false);
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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-3" data-testid="brand-header">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Shield className="h-10 w-10 text-blue-400" data-testid="icon-shield-brand" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="text-brand-name">
              PAVISOFT
            </h1>
            <Sparkles className="h-6 w-6 text-purple-400" data-testid="icon-sparkles-brand" />
          </div>
          <p className="text-xl font-semibold text-white/90 tracking-wide" data-testid="text-brand-subtitle">SISTEMAS</p>
          <p className="text-sm text-white/70" data-testid="text-brand-slogan">Gestão Empresarial Inteligente</p>
        </div>

        <Card className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-white/20 dark:border-gray-800/50 shadow-2xl">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={!isFuncionario ? "default" : "ghost"}
                  className="flex-1 transition-all"
                  onClick={() => setIsFuncionario(false)}
                  data-testid="button-proprietario"
                >
                  <User className="h-4 w-4 mr-2" />
                  Proprietário
                </Button>
                <Button
                  type="button"
                  variant={isFuncionario ? "default" : "ghost"}
                  className="flex-1 transition-all"
                  onClick={() => setIsFuncionario(true)}
                  data-testid="button-funcionario"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Funcionário
                </Button>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                    <DialogTrigger asChild>
                      <button 
                        type="button" 
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        data-testid="button-forgot-password"
                      >
                        Esqueceu a senha?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      {resetStep === 'email' ? (
                        <form onSubmit={handleForgotPassword}>
                          <DialogHeader>
                            <DialogTitle className="text-xl">Recuperar Senha</DialogTitle>
                            <DialogDescription className="pt-2">
                              Digite seu email cadastrado e enviaremos um código para redefinir sua senha.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="forgot-email">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="seu@email.com"
                                  className="pl-10"
                                  value={forgotPasswordEmail}
                                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                  required
                                  data-testid="input-forgot-email"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              className="w-full"
                              disabled={isSubmittingForgotPassword}
                              data-testid="button-send-reset-email"
                            >
                              {isSubmittingForgotPassword ? "Enviando..." : "Enviar código"}
                            </Button>
                          </DialogFooter>
                        </form>
                      ) : (
                        <form onSubmit={handleResetPassword}>
                          <DialogHeader>
                            <DialogTitle className="text-xl">Digite o código</DialogTitle>
                            <DialogDescription className="pt-2">
                              Insira o código de 6 dígitos enviado para <strong>{forgotPasswordEmail}</strong>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-code">Código de Verificação</Label>
                              <Input
                                id="reset-code"
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                                required
                                className="text-center text-2xl tracking-widest"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">Nova Senha</Label>
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                              <Input
                                id="confirm-new-password"
                                type="password"
                                placeholder="Digite a senha novamente"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <DialogFooter className="flex-col gap-2">
                            <Button 
                              type="submit" 
                              className="w-full"
                              disabled={isSubmittingForgotPassword}
                            >
                              {isSubmittingForgotPassword ? "Alterando..." : "Alterar senha"}
                            </Button>
                            <Button 
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setResetStep('email');
                                setResetCode("");
                                setNewPassword("");
                                setConfirmNewPassword("");
                              }}
                            >
                              Voltar
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
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
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                data-testid="button-login" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>

              {onRegisterClick && (
                <>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Novo por aqui?
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={onRegisterClick}
                    data-testid="button-register"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar nova conta
                  </Button>
                </>
              )}
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-white/60 mt-6">
          © 2024 PAVISOFT SISTEMAS. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}