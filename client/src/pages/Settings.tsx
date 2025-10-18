
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Upload, Palette, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  primaryColor: "#2563EB",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  backgroundColor: "#FFFFFF",
  storeName: "Controle de Estoque Simples"
};

export default function Settings() {
  const { toast } = useToast();
  const [isPremium] = useState(true); // Simulando usuário premium - futuramente virá do backend
  
  const [config, setConfig] = useState({
    logoUrl: "",
    primaryColor: "#2563EB",
    secondaryColor: "#10B981",
    accentColor: "#F59E0B",
    backgroundColor: "#FFFFFF",
    storeName: "Controle de Estoque Simples"
  });

  // Carregar configurações salvas quando o componente montar
  useEffect(() => {
    const saved = localStorage.getItem("customization");
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        setConfig({
          logoUrl: savedConfig.logoUrl || "",
          primaryColor: savedConfig.primaryColor || "#2563EB",
          secondaryColor: savedConfig.secondaryColor || "#10B981",
          accentColor: savedConfig.accentColor || "#F59E0B",
          backgroundColor: savedConfig.backgroundColor || "#FFFFFF",
          storeName: savedConfig.storeName || "Controle de Estoque Simples"
        });
        
        // Aplicar as cores salvas imediatamente
        if (savedConfig.primaryColor) {
          document.documentElement.style.setProperty('--primary', hexToHSL(savedConfig.primaryColor));
        }
        if (savedConfig.secondaryColor) {
          document.documentElement.style.setProperty('--secondary', hexToHSL(savedConfig.secondaryColor));
        }
        if (savedConfig.accentColor) {
          document.documentElement.style.setProperty('--accent', hexToHSL(savedConfig.accentColor));
        }
        if (savedConfig.backgroundColor) {
          document.documentElement.style.setProperty('--background', hexToHSL(savedConfig.backgroundColor));
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }
  }, []);

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
    // Salvar configurações no localStorage (futuramente no backend)
    localStorage.setItem("customization", JSON.stringify(config));
    
    // Aplicar cores CSS convertidas para HSL
    document.documentElement.style.setProperty('--primary', hexToHSL(config.primaryColor));
    document.documentElement.style.setProperty('--secondary', hexToHSL(config.secondaryColor));
    document.documentElement.style.setProperty('--accent', hexToHSL(config.accentColor));
    document.documentElement.style.setProperty('--background', hexToHSL(config.backgroundColor));
    
    toast({
      title: "Configurações salvas!",
      description: "A personalização foi aplicada com sucesso",
    });
  };

  const handleReset = () => {
    // Restaurar configurações padrão
    setConfig(DEFAULT_CONFIG);
    
    // Aplicar cores padrão
    document.documentElement.style.setProperty('--primary', hexToHSL(DEFAULT_CONFIG.primaryColor));
    document.documentElement.style.setProperty('--secondary', hexToHSL(DEFAULT_CONFIG.secondaryColor));
    document.documentElement.style.setProperty('--accent', hexToHSL(DEFAULT_CONFIG.accentColor));
    document.documentElement.style.setProperty('--background', hexToHSL(DEFAULT_CONFIG.backgroundColor));
    
    // Remover do localStorage
    localStorage.removeItem("customization");
    
    toast({
      title: "Configurações restauradas!",
      description: "As configurações padrão foram aplicadas",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Configurações</h1>
          <p className="text-sm text-muted-foreground">Personalize seu sistema</p>
        </div>
        {isPremium && (
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Crown className="h-3 w-3 mr-1" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo da Loja
              </CardTitle>
              <CardDescription>
                Personalize a logo que aparece no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="store-name">Nome da Loja</Label>
                <Input
                  id="store-name"
                  type="text"
                  value={config.storeName}
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  placeholder="Nome da sua loja"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cores do Sistema
              </CardTitle>
              <CardDescription>
                Personalize as cores principais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <div className="flex justify-end gap-3">
            <Button onClick={handleReset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
