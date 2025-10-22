import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  AlertTriangle, 
  Save, 
  ExternalLink,
  Check,
  Lock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConfigFiscalSchema, type InsertConfigFiscal, type ConfigFiscal as ConfigFiscalType } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ConfigFiscal() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: configFiscal, isLoading } = useQuery<ConfigFiscalType | null>({
    queryKey: ["/api/config-fiscal"],
  });

  const form = useForm<InsertConfigFiscal>({
    resolver: zodResolver(insertConfigFiscalSchema),
    defaultValues: {
      cnpj: "",
      razao_social: "",
      focus_nfe_api_key: "",
      ambiente: "homologacao",
    },
  });

  useEffect(() => {
    if (configFiscal) {
      form.reset({
        cnpj: configFiscal.cnpj || "",
        razao_social: configFiscal.razao_social || "",
        focus_nfe_api_key: "",
        ambiente: configFiscal.ambiente || "homologacao",
      });
    }
  }, [configFiscal, form]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: InsertConfigFiscal) => {
      const response = await fetch("/api/config-fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar configuração");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config-fiscal"] });
      toast({
        title: "Configuração salva!",
        description: "As configurações fiscais foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertConfigFiscal) => {
    saveConfigMutation.mutate(data);
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Configurações Fiscais</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
          Configurações Fiscais
        </h1>
        <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">
          Configure a emissão de notas fiscais com Focus NFe
        </p>
      </div>

      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 animate-in slide-in-from-top duration-700">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-200">
          Importante - Leia antes de configurar
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-300 space-y-2">
          <p>
            Para emitir notas fiscais, você precisa criar uma conta na{" "}
            <a
              href="https://focusnfe.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline inline-flex items-center gap-1 hover:text-yellow-950 dark:hover:text-yellow-100"
              data-testid="link-focus-nfe"
            >
              Focus NFe
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            e inserir sua chave API aqui.
          </p>
          <p className="font-semibold">
            ⚠️ Você será responsável pelas taxas cobradas pela Focus NFe e pela validade fiscal das
            notas emitidas.
          </p>
          <p className="text-sm">
            O sistema utiliza suas credenciais para emitir notas em seu nome. Não nos
            responsabilizamos por custos ou questões fiscais.
          </p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/80 border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/30 animate-in slide-in-from-bottom duration-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações para emissão de notas fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da sua empresa"
                        data-testid="input-razao-social"
                      />
                    </FormControl>
                    <FormDescription>
                      Nome oficial da empresa conforme CNPJ
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => {
                          const formatted = formatCNPJ(e.target.value);
                          field.onChange(formatted);
                        }}
                        data-testid="input-cnpj"
                      />
                    </FormControl>
                    <FormDescription>
                      CNPJ da empresa (somente números ou formatado)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/80 border-2 border-accent/10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-accent/30 animate-in slide-in-from-bottom duration-700 delay-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-accent" />
                Credenciais Focus NFe
              </CardTitle>
              <CardDescription>
                Configure sua integração com a API da Focus NFe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <FormField
                control={form.control}
                name="focus_nfe_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave API Focus NFe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showApiKey ? "text" : "password"}
                          placeholder={configFiscal?.focus_nfe_api_key ? "••••••••••••" : "Insira sua chave API"}
                          data-testid="input-api-key"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowApiKey(!showApiKey)}
                          data-testid="button-toggle-api-key"
                        >
                          {showApiKey ? "Ocultar" : "Mostrar"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Chave de API obtida no painel da Focus NFe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ambiente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Ambiente de Produção
                      </FormLabel>
                      <FormDescription>
                        Ativar para emitir notas fiscais reais. Deixe desativado para testes.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === "producao"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "producao" : "homologacao")
                        }
                        data-testid="switch-ambiente"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("ambiente") === "producao" && (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-900 dark:text-red-200">
                    Modo Produção Ativado
                  </AlertTitle>
                  <AlertDescription className="text-red-800 dark:text-red-300">
                    As notas emitidas terão validade fiscal e você será cobrado por cada nota.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={saveConfigMutation.isPending}
              data-testid="button-save-config"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>

          {configFiscal && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 dark:text-green-200">
                Configuração Ativa
              </AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-300">
                Sistema configurado e pronto para emitir notas fiscais.
                {configFiscal.ambiente === "homologacao" ? " (Ambiente de Homologação)" : " (Ambiente de Produção)"}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  );
}
