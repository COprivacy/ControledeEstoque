import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  BarChart3,
  ShoppingCart,
  Users,
  FileText,
  TrendingUp,
  Check,
  Zap,
  Shield,
  Smartphone
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Package,
      title: "Gestão de Estoque",
      description: "Controle completo de produtos, categorias e movimentações em tempo real."
    },
    {
      icon: ShoppingCart,
      title: "PDV Integrado",
      description: "Sistema de ponto de venda rápido e intuitivo para suas vendas diárias."
    },
    {
      icon: BarChart3,
      title: "Relatórios Completos",
      description: "Análises detalhadas e gráficos para tomada de decisões estratégicas."
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes e fornecedores com histórico integrado."
    },
    {
      icon: FileText,
      title: "Notas Fiscais",
      description: "Emissão de NF-e integrada com a Receita Federal de forma automatizada."
    },
    {
      icon: TrendingUp,
      title: "Controle Financeiro",
      description: "Gestão de contas a pagar e receber com DRE e fluxo de caixa."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Grátis",
      description: "Para quem está começando",
      features: [
        "Até 100 produtos",
        "1 usuário",
        "Relatórios básicos",
        "Suporte por email",
        "Dashboard básico"
      ],
      cta: "Começar Grátis",
      popular: false
    },
    {
      name: "Premium",
      price: "R$ 79",
      period: "/mês",
      description: "Para negócios em crescimento",
      features: [
        "Produtos ilimitados",
        "Usuários ilimitados",
        "Relatórios avançados",
        "Suporte prioritário 24/7",
        "Dashboard completo",
        "Emissão de NF-e",
        "Backup automático",
        "Integrações personalizadas"
      ],
      cta: "Começar Teste Grátis",
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Pavisoft Sistemas
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="link-features">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="link-pricing">
                Planos
              </a>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="link-privacy">
                Privacidade
              </Link>
              <Link href="/admin-publico" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-testid="link-admin">
                Admin
              </Link>
              <Link href="/login">
                <Button variant="outline" data-testid="button-login">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-signup">
                  Criar Conta
                </Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Link href="/login">
                <Button variant="outline" size="sm" data-testid="button-login-mobile">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight" data-testid="text-hero-title">
            Gestão empresarial simples,
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              poderosa e completa
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto" data-testid="text-hero-description">
            Pavisoft Sistema transforma a gestão do seu negócio com controle de estoque, PDV integrado, emissão de notas fiscais e relatórios completos. Tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6" data-testid="button-start-free">
                <Zap className="mr-2 h-5 w-5" />
                Começar Grátis
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-demo">
              <Smartphone className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4" data-testid="text-no-card">
            Sem cartão de crédito • Teste grátis por 14 dias
          </p>
        </div>
      </section>

      <section id="features" className="bg-white dark:bg-gray-900 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-features-title">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto" data-testid="text-features-description">
              Ferramentas profissionais que se adaptam ao seu negócio
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-blue-600 dark:hover:border-blue-400 transition-all hover:shadow-lg" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4" data-testid="text-pricing-title">
              Planos para todos os tamanhos
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300" data-testid="text-pricing-description">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-4 border-blue-600 shadow-2xl scale-105' : 'border-2'}`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold" data-testid="badge-popular">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white" data-testid={`text-price-${plan.name.toLowerCase()}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start" data-testid={`feature-${plan.name.toLowerCase()}-${featureIndex}`}>
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      data-testid={`button-cta-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Shield className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-cta-title">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl text-blue-100 mb-8" data-testid="text-cta-description">
              Junte-se a centenas de empresas que já confiam no Pavisoft Sistema
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100" data-testid="button-cta-final">
                Começar Agora - É Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-blue-400" />
                <span className="text-white font-bold">Pavisoft</span>
              </div>
              <p className="text-sm">
                Sistema completo de gestão empresarial
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors" data-testid="footer-link-features">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors" data-testid="footer-link-pricing">Preços</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors" data-testid="footer-link-login">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="footer-link-privacy">Privacidade</Link></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="footer-link-terms">Termos de Uso</a></li>
                <li><Link href="/admin-publico" className="hover:text-white transition-colors" data-testid="footer-link-admin">Painel Admin</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors" data-testid="footer-link-help">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors" data-testid="footer-link-contact">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}