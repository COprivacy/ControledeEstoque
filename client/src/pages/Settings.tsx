
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Upload, Palette, Save, RotateCcw, Monitor, Bell, Globe, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

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
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  backgroundColor: "#000000",
  storeName: "Controle de Estoque",
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
  const [isPremium] = useState(true);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

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

  const handleSave = () => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">
            Personalize seu sistema com estilo
          </p>
        </div>
        {isPremium && (
          <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-in zoom-in duration-500">
            <Crown className="h-3 w-3 mr-1 animate-pulse" />
            Premium
          </Badge>
        )}
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
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/30 animate-in slide-in-from-bottom duration-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary animate-pulse" />
                Marca e Identidade Visual
              </CardTitle>
              <CardDescription>
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
            </CardContent>
          </Card>

          {/* Cores do Sistema */}
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-accent/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-accent/30 animate-in slide-in-from-bottom duration-700 delay-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-accent animate-pulse" />
                Paleta de Cores
              </CardTitle>
              <CardDescription>
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

          <div className="flex justify-end gap-3 animate-in slide-in-from-bottom duration-700 delay-350">
            <Button onClick={handleReset} variant="outline" size="lg" className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
