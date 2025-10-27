
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
  Smartphone,
  Sparkles,
  Rocket,
  Database,
  Lock
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Package,
      title: "Gestão de Estoque",
      description: "Controle completo de produtos, categorias e movimentações em tempo real com alertas inteligentes."
    },
    {
      icon: ShoppingCart,
      title: "PDV Integrado",
      description: "Sistema de ponto de venda rápido e intuitivo com suporte a código de barras."
    },
    {
      icon: BarChart3,
      title: "Relatórios Avançados",
      description: "Análises detalhadas, gráficos interativos e insights para decisões estratégicas."
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes e fornecedores com histórico integrado."
    },
    {
      icon: FileText,
      title: "Notas Fiscais",
      description: "Emissão de NF-e e NFC-e integrada com a Receita Federal de forma automatizada."
    },
    {
      icon: TrendingUp,
      title: "Controle Financeiro",
      description: "Gestão completa de contas a pagar/receber, DRE e fluxo de caixa projetado."
    }
  ];

  const pricingPlans = [
    {
      name: "Teste Grátis",
      price: "Grátis",
      period: "por 7 dias",
      description: "Experimente todos os recursos premium",
      features: [
        "Acesso completo por 7 dias",
        "Produtos ilimitados",
        "Usuários ilimitados",
        "Gestão de permissões",
        "PDV integrado",
        "Relatórios avançados",
        "Emissão de NF-e/NFC-e",
        "Controle financeiro completo",
        "Dashboard em tempo real",
        "Suporte por email",
        "Sem cartão de crédito"
      ],
      cta: "Começar Teste Grátis",
      popular: false,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      name: "Premium Mensal",
      price: "R$ 79,99",
      period: "/mês",
      description: "Para negócios em crescimento",
      features: [
        "Produtos ilimitados",
        "Usuários ilimitados",
        "Gestão de permissões",
        "Relatórios avançados",
        "Emissão de NF-e/NFC-e",
        "Controle financeiro completo",
        "Dashboard em tempo real",
        "Suporte prioritário 24/7",
        "Backup automático diário",
        "Integrações personalizadas"
      ],
      cta: "Assinar Agora",
      popular: true,
      gradient: "from-blue-600 to-purple-600"
    },
    {
      name: "Premium Anual",
      price: "R$ 767,04",
      period: "/ano",
      discount: "20% de desconto",
      description: "Economia máxima para seu negócio",
      features: [
        "Todos os recursos Premium",
        "20% de economia anual",
        "R$ 63,92/mês (equivalente)",
        "Produtos ilimitados",
        "Usuários ilimitados",
        "Emissão de NF-e/NFC-e",
        "Controle financeiro completo",
        "Suporte VIP prioritário",
        "Backup em tempo real",
        "Consultoria de implementação",
        "Atualizações antecipadas"
      ],
      cta: "Assinar Plano Anual",
      popular: false,
      gradient: "from-purple-600 to-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Navbar com efeito glassmorphism */}
      <nav className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 blur-xl opacity-50 animate-pulse"></div>
                <Package className="h-8 w-8 text-blue-400 relative" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pavisoft Sistemas
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
                Planos
              </a>
              <Link href="/privacy" className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
                Privacidade
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Entrar
                </Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section com animações modernas */}
      <section className="container mx-auto px-6 py-20 md:py-32 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 animate-in fade-in slide-in-from-top duration-700">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300">Sistema completo de gestão empresarial</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom duration-700">
            Gestão empresarial
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
              simples, poderosa e completa
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            Transforme a gestão do seu negócio com controle de estoque inteligente, PDV integrado, 
            emissão de notas fiscais e relatórios em tempo real. Tudo em uma plataforma moderna e segura.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300">
                <Rocket className="mr-2 h-5 w-5" />
                Começar Grátis por 7 Dias
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10 text-white">
              <Smartphone className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>

          <p className="text-sm text-gray-400 mt-6 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Sem cartão de crédito • 7 dias grátis • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Recursos Completos</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ferramentas profissionais que se adaptam ao seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-sm group"
              >
                <CardHeader>
                  <div className="h-14 w-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-blue-400" />
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <Zap className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">Planos Flexíveis</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-gray-300">
              Sem taxas escondidas, sem surpresas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative bg-slate-900/50 border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/30' 
                    : 'border-blue-500/20 hover:border-blue-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Mais Popular
                    </span>
                  </div>
                )}
                
                {plan.discount && (
                  <div className="absolute -top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
                      {plan.discount}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                    {index === 0 && <Zap className="h-8 w-8 text-white" />}
                    {index === 1 && <Rocket className="h-8 w-8 text-white" />}
                    {index === 2 && <Shield className="h-8 w-8 text-white" />}
                  </div>
                  <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-400 text-lg ml-2">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-400" />
                          </div>
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <Button
                      className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-blue-500/30'
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-gray-400 mt-12 text-sm">
            Todos os planos incluem atualizações gratuitas e suporte técnico
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Shield className="h-16 w-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Junte-se a centenas de empresas que já confiam no Pavisoft Sistema
            </p>
            <Link href="/register">
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300"
              >
                <Rocket className="mr-2 h-6 w-6" />
                Começar Agora - 7 Dias Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-blue-500/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-blue-400" />
                <span className="text-white font-bold">Pavisoft</span>
              </div>
              <p className="text-sm text-gray-400">
                Sistema completo de gestão empresarial
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-blue-400 transition-colors">Preços</a></li>
                <li><Link href="/login" className="text-gray-400 hover:text-blue-400 transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">Privacidade</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Termos de Uso</a></li>
                <li><Link href="/admin-publico" className="text-gray-400 hover:text-blue-400 transition-colors">Painel</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ajuda" className="text-gray-400 hover:text-blue-400 transition-colors">Ajuda</Link></li>
                <li><Link href="/contato" className="text-gray-400 hover:text-blue-400 transition-colors">Contato</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-500/20 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
