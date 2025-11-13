import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Upload, Palette, Save, RotateCcw, Monitor, Bell, Globe, Gauge, AlertTriangle, Shield, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";


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

const DEFAULT_CONFIG = {
  logoUrl: "",
  pdvBackgroundUrl: "",
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  backgroundColor: "#000000",
  storeName: "Pavisoft Sistemas",
  fontSize: "medium",
  borderRadius: "medium",
  language: "pt-BR",
  currency: "BRL",
  dateFormat: "DD/MM/YYYY",
  enableAnimations: true,
  enableSounds: false,
  compactMode: false,
  showWelcomeMessage: true,
  autoSaveInterval: 30,
  lowStockThreshold: 10,
  itemsPerPage: 10,
  enableNotifications: true,
  enableEmailAlerts: false,
  emailForAlerts: "",
};

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isPremium] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false); // Estado para controlar a abertura do modal de checkout
  const [encerrarContaOpen, setEncerrarContaOpen] = useState(false);
  const [motivoEncerramento, setMotivoEncerramento] = useState("");
  const [isEncerrando, setIsEncerrando] = useState(false);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Mock mutation for disabling button during save
  const [isSaving, setIsSaving] = useState(false);


  // Carregar configurações salvas quando o componente montar
  useEffect(() => {
    const saved = localStorage.getItem("customization");
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...savedConfig
        };
        setConfig(mergedConfig);

        // Aplicar as cores salvas imediatamente
        applyThemeColors(mergedConfig);

        // Aplicar outras customizações
        applyFontSize(mergedConfig.fontSize);
        applyBorderRadius(mergedConfig.borderRadius);
        applyInterfaceSettings();
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        toast({
          title: "Erro ao carregar configurações",
          description: "As configurações padrão foram aplicadas",
          variant: "destructive",
        });
      }
    }

    }, []);

  const applyThemeColors = (customization: any) => {
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
  };

  const applyFontSize = (size: string) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    const fontSize = sizes[size as keyof typeof sizes] || '16px';
    document.documentElement.style.setProperty('font-size', fontSize);
    document.body.style.fontSize = fontSize;
  };

  const applyBorderRadius = (radius: string) => {
    const radii = {
      none: '0rem',
      small: '0.25rem',
      medium: '0.5rem',
      large: '1rem',
      xlarge: '1.5rem'
    };
    document.documentElement.style.setProperty('--radius', radii[radius as keyof typeof radii] || '0.5rem');
  };

  const applyInterfaceSettings = () => {
    // Aplicar modo compacto
    if (config.compactMode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }

    // Aplicar animações
    if (!config.enableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logoUrl: reader.result as string });
        toast({
          title: "Logo carregada!",
          description: "A logo foi carregada com sucesso",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePDVBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, pdvBackgroundUrl: reader.result as string });
        toast({
          title: "Plano de fundo carregado!",
          description: "O plano de fundo do PDV foi carregado com sucesso",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validar email se alertas estiverem habilitados
    if (config.enableEmailAlerts && !config.emailForAlerts) {
      toast({
        title: "Atenção!",
        description: "Por favor, informe um e-mail para receber alertas.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de email
    if (config.enableEmailAlerts && config.emailForAlerts) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.emailForAlerts)) {
        toast({
          title: "E-mail inválido!",
          description: "Por favor, informe um e-mail válido.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true); // Ativa o estado de salvando

    // Salvar configurações no localStorage
    localStorage.setItem("customization", JSON.stringify(config));

    // Aplicar customizações
    applyThemeColors(config);
    applyFontSize(config.fontSize);
    applyBorderRadius(config.borderRadius);
    applyInterfaceSettings();

    toast({
      title: "Configurações salvas!",
      description: "A personalização foi aplicada com sucesso",
    });

    // Simula um atraso para a demonstração do estado de salvando
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSaving(false); // Desativa o estado de salvando
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    applyThemeColors(DEFAULT_CONFIG);
    applyFontSize(DEFAULT_CONFIG.fontSize);
    applyBorderRadius(DEFAULT_CONFIG.borderRadius);
    applyInterfaceSettings();
    localStorage.removeItem("customization");


    toast({
      title: "Configurações restauradas!",
      description: "As configurações padrão foram aplicadas",
    });
  };

  const handleEncerrarConta = async () => {
    if (!motivoEncerramento.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo do encerramento",
        variant: "destructive",
      });
      return;
    }

    setIsEncerrando(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await apiRequest("POST", "/api/encerrar-conta", {
        userId: user.id,
        userEmail: user.email,
        userName: user.nome,
        motivo: motivoEncerramento,
      });

      if (response.ok) {
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação de encerramento foi enviada ao suporte. Entraremos em contato em breve.",
        });
        setEncerrarContaOpen(false);
        setMotivoEncerramento("");
      } else {
        throw new Error("Erro ao enviar solicitação");
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsEncerrando(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 px-1">
      {/* Header Moderno */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight animate-in slide-in-from-left duration-700">
              Configurações
            </h1>
            <p className="text-lg text-white/90 animate-in slide-in-from-left duration-700 delay-100">
              Personalize cada detalhe do seu sistema
            </p>
          </div>
          {isPremium && (
            <Badge className="bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-lg px-4 py-2 text-base animate-in zoom-in duration-500">
              <Crown className="h-5 w-5 mr-2 animate-pulse" />
              Premium
            </Badge>
          )}
        </div>
      </div>

      {!isPremium && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Recursos Premium
            </CardTitle>
            <CardDescription>
              Atualize para Premium para personalizar logo, cores e mais!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-yellow-500 hover:bg-yellow-600">
              Assinar Premium
            </Button>
          </CardContent>
        </Card>
      )}

      {isPremium && (
        <>
          {/* Marca e Identidade Visual */}
          <Card className="modern-card glass-card border-0 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-700">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 backdrop-blur-sm border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Upload className="h-5 w-5" />
                </div>
                Marca e Identidade Visual
              </CardTitle>
              <CardDescription className="text-base">
                Personalize a logo e nome da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Upload da Logo</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                {config.logoUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="max-w-xs h-20 object-contain border rounded p-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-name">Nome da Empresa</Label>
                <Input
                  id="store-name"
                  type="text"
                  value={config.storeName}
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdv-background">Plano de Fundo do PDV</Label>
                <Input
                  id="pdv-background"
                  type="file"
                  accept="image/*"
                  onChange={handlePDVBackgroundUpload}
                />
                <p className="text-xs text-muted-foreground">
                  Personalize o fundo da tela de PDV com uma imagem
                </p>
                {config.pdvBackgroundUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
                    <div className="relative">
                      <img
                        src={config.pdvBackgroundUrl}
                        alt="Plano de fundo PDV"
                        className="w-full h-32 object-cover border rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setConfig({ ...config, pdvBackgroundUrl: "" })}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Upgrade para Premium */}
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Crown className="h-12 w-12 mb-4" />
                  <CardTitle className="text-3xl font-bold mb-2">
                    Desbloqueie Todo o Potencial
                  </CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    Upgrade para Premium e transforme seu negócio
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setLocation("/planos")}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Ver Planos
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Cores do Sistema */}
          <Card className="modern-card glass-card border-0 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-700 delay-100">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>
            <CardHeader className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 backdrop-blur-sm border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <Palette className="h-5 w-5" />
                </div>
                Paleta de Cores
              </CardTitle>
              <CardDescription className="text-base">
                Personalize as cores principais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-color">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-3">Prévia das cores:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded" style={{ backgroundColor: config.primaryColor }}>
                    <span className="text-white font-medium">Primária</span>
                  </div>
                  <div className="p-4 rounded" style={{ backgroundColor: config.secondaryColor }}>
                    <span className="text-white font-medium">Secundária</span>
                  </div>
                  <div className="p-4 rounded" style={{ backgroundColor: config.accentColor }}>
                    <span className="text-white font-medium">Destaque</span>
                  </div>
                  <div className="p-4 rounded border-2" style={{ backgroundColor: config.backgroundColor }}>
                    <span className="font-medium" style={{ color: config.primaryColor }}>Fundo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interface e Experiência */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-secondary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-secondary/30 animate-in slide-in-from-bottom duration-700 delay-150">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-secondary animate-pulse" />
                Interface e Experiência
              </CardTitle>
              <CardDescription>
                Ajuste a aparência e comportamento da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="font-size">Tamanho da Fonte</Label>
                  <Select
                    value={config.fontSize}
                    onValueChange={(value) => setConfig({ ...config, fontSize: value })}
                  >
                    <SelectTrigger id="font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="xlarge">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-radius">Arredondamento</Label>
                  <Select
                    value={config.borderRadius}
                    onValueChange={(value) => setConfig({ ...config, borderRadius: value })}
                  >
                    <SelectTrigger id="border-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Arredondamento</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="xlarge">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animações</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar animações e transições suaves
                    </p>
                  </div>
                  <Switch
                    checked={config.enableAnimations}
                    onCheckedChange={(checked) => setConfig({ ...config, enableAnimations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sons do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Reproduzir sons para ações importantes
                    </p>
                  </div>
                  <Switch
                    checked={config.enableSounds}
                    onCheckedChange={(checked) => setConfig({ ...config, enableSounds: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduzir espaçamentos para mais conteúdo
                    </p>
                  </div>
                  <Switch
                    checked={config.compactMode}
                    onCheckedChange={(checked) => setConfig({ ...config, compactMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mensagem de Boas-vindas</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar mensagem ao fazer login
                    </p>
                  </div>
                  <Switch
                    checked={config.showWelcomeMessage}
                    onCheckedChange={(checked) => setConfig({ ...config, showWelcomeMessage: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regionalização */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-accent/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-accent/30 animate-in slide-in-from-bottom duration-700 delay-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-accent animate-pulse" />
                Regionalização
              </CardTitle>
              <CardDescription>
                Configure idioma, moeda e formatos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={config.language}
                    onValueChange={(value) => setConfig({ ...config, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={config.currency}
                    onValueChange={(value) => setConfig({ ...config, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Data</Label>
                  <Select
                    value={config.dateFormat}
                    onValueChange={(value) => setConfig({ ...config, dateFormat: value })}
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comportamento e Desempenho */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/30 animate-in slide-in-from-bottom duration-700 delay-250">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/20 dark:to-cyan-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-primary animate-pulse" />
                Comportamento e Desempenho
              </CardTitle>
              <CardDescription>
                Configure salvamento automático e preferências de exibição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Intervalo de Salvamento Automático (segundos)</Label>
                  <span className="text-sm text-muted-foreground font-medium">{config.autoSaveInterval}s</span>
                </div>
                <Slider
                  id="auto-save"
                  min={10}
                  max={120}
                  step={10}
                  value={[config.autoSaveInterval]}
                  onValueChange={(value) => setConfig({ ...config, autoSaveInterval: value[0] })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="low-stock">Limite de Estoque Baixo</Label>
                  <span className="text-sm text-muted-foreground font-medium">{config.lowStockThreshold} unidades</span>
                </div>
                <Slider
                  id="low-stock"
                  min={1}
                  max={100}
                  step={1}
                  value={[config.lowStockThreshold]}
                  onValueChange={(value) => setConfig({ ...config, lowStockThreshold: value[0] })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="items-per-page">Itens por Página</Label>
                <Select
                  value={config.itemsPerPage.toString()}
                  onValueChange={(value) => setConfig({ ...config, itemsPerPage: parseInt(value) })}
                >
                  <SelectTrigger id="items-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 itens</SelectItem>
                    <SelectItem value="10">10 itens</SelectItem>
                    <SelectItem value="25">25 itens</SelectItem>
                    <SelectItem value="50">50 itens</SelectItem>
                    <SelectItem value="100">100 itens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notificações e Alertas */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-destructive/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-destructive/30 animate-in slide-in-from-bottom duration-700 delay-300">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-destructive animate-pulse" />
                Notificações e Alertas
              </CardTitle>
              <CardDescription>
                Configure como deseja receber alertas importantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações no Sistema</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações visuais no sistema
                  </p>
                </div>
                <Switch
                  checked={config.enableNotifications}
                  onCheckedChange={(checked) => setConfig({ ...config, enableNotifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas críticos por e-mail
                  </p>
                </div>
                <Switch
                  checked={config.enableEmailAlerts}
                  onCheckedChange={(checked) => setConfig({ ...config, enableEmailAlerts: checked })}
                />
              </div>

              {config.enableEmailAlerts && (
                <div className="space-y-2">
                  <Label htmlFor="email-alerts">E-mail para Alertas</Label>
                  <Input
                    id="email-alerts"
                    type="email"
                    value={config.emailForAlerts}
                    onChange={(e) => setConfig({ ...config, emailForAlerts: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limpeza Automática de Dados */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-purple-500/50 animate-in slide-in-from-bottom duration-700 delay-325">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-purple-600 animate-pulse" />
                Limpeza Automática de Dados
              </CardTitle>
              <CardDescription>
                Configure a limpeza automática para manter o sistema otimizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Otimização do Sistema</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                  A limpeza automática remove dados antigos para manter o banco de dados leve e rápido. 
                  Dados importantes como vendas recentes e produtos ativos nunca são excluídos.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50/50 to-violet-50/50 dark:from-purple-950/10 dark:to-violet-950/10">
                  <div className="space-y-1">
                    <Label className="font-semibold text-purple-900 dark:text-purple-100">
                      Histórico de Devoluções
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Excluir devoluções aprovadas/rejeitadas automaticamente
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue="90">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">6 meses</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10">
                  <div className="space-y-1">
                    <Label className="font-semibold text-green-900 dark:text-green-100">
                      Orçamentos Antigos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Excluir orçamentos convertidos ou rejeitados
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue="180">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">6 meses</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10">
                  <div className="space-y-1">
                    <Label className="font-semibold text-blue-900 dark:text-blue-100">
                      Logs de Auditoria
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Manter logs de ações do sistema por período limitado
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue="90">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="60">60 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">6 meses</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/10 dark:to-amber-950/10">
                  <div className="space-y-1">
                    <Label className="font-semibold text-orange-900 dark:text-orange-100">
                      Histórico de Caixas Fechados
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Limpar automaticamente caixas fechados antigos
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select defaultValue="365">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">6 meses</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50/30 dark:bg-purple-950/10">
                <div className="space-y-1">
                  <Label className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próxima Limpeza Automática
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    A limpeza é executada diariamente às 03:00 da madrugada
                  </p>
                </div>
                <Badge className="bg-purple-600 text-white">
                  Ativa
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Encerramento de Conta */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-red-500/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-red-500/50 animate-in slide-in-from-bottom duration-700 delay-350">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis relacionadas à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Encerrar Conta</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  Ao solicitar o encerramento da conta, seus dados serão preservados por 30 dias para possível recuperação.
                  Após esse período, todos os dados serão permanentemente excluídos.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setEncerrarContaOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Solicitar Encerramento de Conta
                </Button>
              </div>
            </CardContent>
          </Card>




          {/* Botões de Ação Modernos */}
          <div className="flex justify-end gap-4 animate-in slide-in-from-bottom duration-700 delay-400">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base font-semibold border-2 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:border-primary"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Restaurar Padrão
            </Button>
            <Button
              onClick={handleSave}
              size="lg"
              className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-0 animate-gradient-rotate"
              disabled={isSaving}
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>

          {/* Modal de Encerramento de Conta */}
          <Dialog open={encerrarContaOpen} onOpenChange={setEncerrarContaOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Encerramento de Conta
                </DialogTitle>
                <DialogDescription>
                  Lamentamos ver você partir. Por favor, nos conte o motivo para que possamos melhorar nossos serviços.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo-encerramento">
                    Motivo do Encerramento <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivo-encerramento"
                    placeholder="Por favor, descreva o motivo pelo qual deseja encerrar sua conta..."
                    value={motivoEncerramento}
                    onChange={(e) => setMotivoEncerramento(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Importante:</strong> Sua solicitação será enviada ao suporte. Entraremos em contato para confirmar o encerramento. Seus dados serão mantidos por 30 dias para possível recuperação.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEncerrarContaOpen(false);
                    setMotivoEncerramento("");
                  }}
                  disabled={isEncerrando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEncerrarConta}
                  disabled={isEncerrando || !motivoEncerramento.trim()}
                >
                  {isEncerrando ? "Enviando..." : "Confirmar Encerramento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Componente de Checkout (exemplo, precisa ser implementado) */}
          {/* {checkoutOpen && <CheckoutForm onClose={() => setCheckoutOpen(false)} />} */}
        </>
      )}
    </div>
  );
}