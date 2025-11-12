
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlayCircle, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface TestSummary {
  total: number;
  success: number;
  errors: number;
  warnings: number;
  percentage: number;
}

export default function TestSuite() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await apiRequest("POST", "/api/run-tests", {});
      const data = await response.json();

      setResults(data.results);
      setSummary(data.summary);

      toast({
        title: data.success ? "✅ Testes Concluídos" : "⚠️ Testes Finalizados com Erros",
        description: `${data.summary.success} sucessos, ${data.summary.errors} erros, ${data.summary.warnings} avisos`,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro ao executar testes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    };

    return (
      <Badge variant={variants[status] as any}>
        {status === 'success' ? 'Passou' : status === 'error' ? 'Erro' : 'Aviso'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Suite de Testes</h1>
          <p className="text-muted-foreground mt-2">
            Execute testes completos do sistema para validar funcionalidades
          </p>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <PlayCircle className="h-5 w-5 mr-2" />
              Executar Todos os Testes
            </>
          )}
        </Button>
      </div>

      {/* Resumo dos Testes */}
      {summary && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Resumo dos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {summary.total}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {summary.success}
                </div>
                <div className="text-sm text-green-600">Sucessos</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {summary.errors}
                </div>
                <div className="text-sm text-red-600">Erros</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.warnings}
                </div>
                <div className="text-sm text-yellow-600">Avisos</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.percentage}%
                </div>
                <div className="text-sm text-blue-600">Taxa de Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorias de Testes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔒 Teste 1: Fluxo de Bloqueio
            </CardTitle>
            <CardDescription>
              Valida bloqueio de usuários e funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Verificação de usuários bloqueados</li>
              <li>✓ Bloqueio automático de funcionários</li>
              <li>✓ Restrição de acesso ao sistema</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💼 Teste 2: Pacotes de Funcionários
            </CardTitle>
            <CardDescription>
              Valida compra e gerenciamento de pacotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Verificação de limites base e atuais</li>
              <li>✓ Validação de datas de expiração</li>
              <li>✓ Status dos pacotes cadastrados</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📧 Teste 3: Sistema de Emails
            </CardTitle>
            <CardDescription>
              Valida templates e configuração SMTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ 8 templates de email configurados</li>
              <li>✓ Configuração SMTP verificada</li>
              <li>✓ Serviço de envio funcional</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💳 Teste 4: Webhooks Mercado Pago
            </CardTitle>
            <CardDescription>
              Valida integração com gateway de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Verificação de credenciais</li>
              <li>✓ Teste de conexão com API</li>
              <li>✓ Validação de endpoint webhook</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Resultados Detalhados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <Alert key={index}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center justify-between">
                        <span>{result.name}</span>
                        {getStatusBadge(result.status)}
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {result.message}
                        {result.details && (
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Inicial */}
      {!isRunning && results.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PlayCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Clique no botão "Executar Todos os Testes" para iniciar a validação completa do sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
