import { useState, useEffect } from "react";
import { Check, Shield, Lock, CheckCircle, Mail, Package, CreditCard, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Link, navigate, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

export default function Planos() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plano: "premium_mensal" | "premium_anual";
    planoNome: string;
    planoPreco: string;
  } | null>(null);

  const handleBackToSystem = () => {
    // Verifica se há um usuário autenticado
    const userStr = localStorage.getItem("user");
    if (userStr) {
      // Se estiver autenticado, vai para o dashboard
      setLocation("/dashboard");
    } else {
      // Se não estiver autenticado, vai para a página de login
      setLocation("/login");
    }
  };

  const planos = [
    {
      nome: "Plano Mensal",
      preco: "R$ 79,99",
      periodo: "/mês",
      descricao: "Ideal para começar",
      valorTotal: null,
      recursos: [
        "✅ Acesso completo ao sistema",
        "👥 Funcionários ilimitados no sistema",
        "✅ PDV e controle de caixa",
        "✅ Gestão de produtos e estoque ilimitados",
        "✅ Emissão de NFC-e",
        "✅ Relatórios e dashboards em tempo real",
        "✅ Gestão financeira completa (Contas a Pagar/Receber)",
        "✅ DRE (Demonstrativo de Resultados)",
        "✅ Controle de fornecedores e clientes",
        "✅ Suporte por email",
        "✅ Backup automático diário"
      ],
      tipo: "mensal"
    },
    {
      nome: "Plano Anual",
      preco: "R$ 67,99",
      periodo: "/mês",
      valorTotal: "R$ 815,88/ano",
      descricao: "Mais Popular - Economize 15%",
      destaque: true,
      recursos: [
        "✅ Todos os recursos do plano mensal",
        "👥 Funcionários ilimitados no sistema",
        "✅ Acesso completo ao sistema",
        "✅ PDV e controle de caixa",
        "✅ Gestão de produtos e estoque ilimitados",
        "✅ Emissão de NFC-e",
        "✅ Relatórios avançados e dashboards",
        "✅ Gestão financeira completa",
        "✅ DRE (Demonstrativo de Resultados)",
        "💰 Economize R$ 143,88 por ano",
        "⭐ Suporte prioritário",
        "⭐ Backups automáticos em tempo real",
        "⭐ Atualizações antecipadas"
      ],
      tipo: "anual"
    }
  ];

  const handleSelectPlan = (tipo: string) => {
    if (tipo === "mensal") {
      setSelectedPlan({
        plano: "premium_mensal",
        planoNome: "Plano Mensal",
        planoPreco: "R$ 79,99"
      });
    } else {
      setSelectedPlan({
        plano: "premium_anual",
        planoNome: "Plano Anual",
        planoPreco: "R$ 67,99"
      });
    }
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8" data-testid="page-planos">
      <nav className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Package className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pavisoft Sistemas
              </span>
            </div>
          </Link>
          <Button
                variant="outline"
                className="gap-2"
                onClick={handleBackToSystem}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Sistema
              </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-title">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300" data-testid="text-subtitle">
            Para continuar utilizando nossos serviços, contrate um plano
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {planos.map((plano) => (
            <Card 
              key={plano.tipo}
              className={`relative ${plano.destaque ? 'border-primary border-2 shadow-2xl scale-105' : 'border-gray-200 dark:border-gray-700'}`}
              data-testid={`card-plano-${plano.tipo}`}
            >
              {plano.destaque && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold" data-testid="badge-destaque">
                    Mais Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-10">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-nome-${plano.tipo}`}>
                  {plano.nome}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400" data-testid={`text-descricao-${plano.tipo}`}>
                  {plano.descricao}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-primary" data-testid={`text-preco-${plano.tipo}`}>
                    {plano.preco}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-lg" data-testid={`text-periodo-${plano.tipo}`}>
                    {plano.periodo}
                  </span>
                  {plano.valorTotal && (
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {plano.valorTotal}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plano.recursos.map((recurso, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3"
                      data-testid={`item-recurso-${plano.tipo}-${index}`}
                    >
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" data-testid={`icon-check-${plano.tipo}-${index}`} />
                      <span className="text-gray-700 dark:text-gray-300">{recurso}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full text-lg py-6"
                  variant={plano.destaque ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plano.tipo)}
                  data-testid={`button-contratar-${plano.tipo}`}
                >
                  Contratar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="container mx-auto px-6 py-12 mt-20">
          <Card className="bg-slate-900/50 border-blue-500/20 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-green-400" />
                Segurança no Pagamento
              </CardTitle>
              <p className="text-center text-gray-400 mt-2">
                Sua compra é 100% segura e protegida
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-blue-500/10">
                  <Lock className="h-5 w-5 text-blue-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Criptografia SSL/TLS</h3>
                    <p className="text-gray-400 text-sm">Todos os dados do pagamento são criptografados e transmitidos com segurança de ponta a ponta</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-blue-500/10">
                  <Shield className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Dados Protegidos</h3>
                    <p className="text-gray-400 text-sm">Suas informações pessoais e financeiras nunca são armazenadas em nossos servidores</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-blue-500/10">
                  <CreditCard className="h-5 w-5 text-purple-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Gateway Seguro Asaas</h3>
                    <p className="text-gray-400 text-sm">Pagamentos processados via Asaas, certificado PCI-DSS Nível 1 (máxima segurança)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-blue-500/10">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Conformidade LGPD</h3>
                    <p className="text-gray-400 text-sm">Totalmente em conformidade com a Lei Geral de Proteção de Dados Pessoais</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-green-300 font-semibold mb-2">Garantia de Segurança</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>✓ Ambiente 100% seguro para transações financeiras</li>
                      <li>✓ Não compartilhamos seus dados com terceiros</li>
                      <li>✓ Você pode cancelar sua assinatura a qualquer momento</li>
                      <li>✓ Suporte disponível para qualquer dúvida sobre pagamento</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-gray-300 mb-2">
                  Tem dúvidas sobre segurança ou pagamento?
                </p>
                <a 
                  href="mailto:pavisoft.suporte@gmail.com"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                >
                  <Mail className="h-4 w-4" />
                  pavisoft.suporte@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Package className="h-6 w-6 text-blue-400" />
              <span className="text-white font-bold">Pavisoft Sistemas</span>
            </div>
            <p className="text-sm">© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {selectedPlan && (
        <CheckoutForm
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plano={selectedPlan.plano}
          planoNome={selectedPlan.planoNome}
          planoPreco={selectedPlan.planoPreco}
        />
      )}
    </div>
  );
}