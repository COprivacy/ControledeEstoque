import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, User, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";


interface DashboardHeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

// Função para converter HEX para HSL
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export default function DashboardHeader({ userEmail = "usuario@email.com", onLogout }: DashboardHeaderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    logoUrl: "",
    storeName: "Pavisoft Sistemas"
  });
  const [userName, setUserName] = useState("");
  const [userCargo, setUserCargo] = useState("");
  const [userId, setUserId] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("customization");
    if (saved) {
      const customization = JSON.parse(saved);
      setConfig({
        logoUrl: customization.logoUrl || "",
        storeName: customization.storeName || "Controle de Estoque Simples"
      });

      // Aplicar cores salvas convertidas para HSL
      if (customization.primaryColor) {
        document.documentElement.style.setProperty('--primary', hexToHSL(customization.primaryColor));
      }
      if (customization.secondaryColor) {
        document.documentElement.style.setProperty('--secondary', hexToHSL(customization.secondaryColor));
      }
      if (customization.accentColor) {
        document.documentElement.style.setProperty('--accent', hexToHSL(customization.accentColor));
      }
      if (customization.backgroundColor) {
        document.documentElement.style.setProperty('--background', hexToHSL(customization.backgroundColor));
      }
    }

    // Buscar nome do usuário do localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.nome || "Usuário");
        setUserCargo(user.cargo || (user.tipo === "funcionario" ? "Funcionário" : "Administrador"));
        setUserId(user.id || "");
      } catch (e) {
        setUserName("Usuário");
        setUserCargo("Usuário");
        setUserId("");
      }
    }
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await apiRequest("POST", "/api/auth/send-verification-code", {
        userId,
        email: userEmail,
      });

      const data = await response.json();
      setSentCode(data.code);
      setIsCodeSent(true);

      toast({
        title: "Código enviado",
        description: `Um código de verificação foi enviado para ${userEmail}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar código de verificação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleChangePassword = async () => {
    if (!verificationCode || !newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (verificationCode !== sentCode) {
      toast({
        title: "Erro",
        description: "Código de verificação inválido",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
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

    try {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        senha: newPassword,
      });

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      });

      setChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setSentCode("");
      setIsCodeSent(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          )}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-300 bg-clip-text text-transparent animate-gradient-x tracking-tight">
            {config.storeName}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {userName ? getInitials(userName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium" data-testid="text-user-name">
                  {userName || "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default" disabled>
                <span className="text-xs text-muted-foreground">Cargo</span>
                <span className="text-sm font-medium">{userCargo}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 cursor-default" disabled>
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium" data-testid="text-user-email">{userEmail}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Redefinir Senha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        setChangePasswordOpen(open);
        if (!open) {
          setNewPassword("");
          setConfirmPassword("");
          setVerificationCode("");
          setSentCode("");
          setIsCodeSent(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔐 Redefinir Senha</DialogTitle>
            <DialogDescription>
              Por segurança, enviaremos um código de verificação para seu email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!isCodeSent ? (
              <>
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    <span>📧</span>
                    <span>
                      Um código será enviado para <strong>{userEmail}</strong>
                    </span>
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleSendVerificationCode} 
                  className="w-full"
                  disabled={isSendingCode}
                >
                  {isSendingCode ? "Enviando..." : "Enviar Código de Verificação"}
                </Button>
              </>
            ) : (
              <>
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <AlertDescription className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <span>✅</span>
                    <span>Código enviado para {userEmail}</span>
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="verification-code">Código de Verificação</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Digite o código recebido por email"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} className="flex-1">
                    Alterar Senha
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCodeSent(false);
                      setVerificationCode("");
                    }} 
                    className="flex-1"
                  >
                    Reenviar Código
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}