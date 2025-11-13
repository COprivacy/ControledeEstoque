
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  HelpCircle, 
  BookOpen, 
  Video, 
  MessageCircle,
  ChevronRight,
  Search,
  Phone,
  Mail,
  Clock,
  FileText,
  Headphones,
  Zap,
  CheckCircle,
  ExternalLink,
  ScrollText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Ajuda() {
  const faqs = [
    {
      question: "Como faço para cadastrar produtos?",
      answer: "Acesse o menu 'Produtos' no painel lateral e clique em 'Adicionar Produto'. Preencha as informações como nome, código de barras, preço e quantidade em estoque.",
      category: "produtos"
    },
    {
      question: "Como emitir uma NFC-e?",
      answer: "Configure primeiro suas credenciais fiscais em 'Configurações Fiscais'. Depois, ao realizar uma venda no PDV, selecione a opção 'Emitir NFC-e' antes de finalizar.",
      category: "fiscal"
    },
    {
      question: "Como adicionar funcionários?",
      answer: "No menu 'Admin' (disponível apenas para administradores), acesse a aba 'Funcionários' e clique em 'Adicionar Funcionário'. Defina as permissões adequadas para cada colaborador.",
      category: "admin"
    },
    {
      question: "Como funciona o controle de estoque?",
      answer: "O sistema atualiza automaticamente o estoque a cada venda realizada. Você pode fazer ajustes manuais em 'Inventário' e receber alertas de produtos com estoque baixo.",
      category: "estoque"
    },
    {
      question: "Como visualizar relatórios de vendas?",
      answer: "Acesse a seção 'Relatórios' no menu principal. Você pode filtrar por período, produto, vendedor e muito mais para análises detalhadas.",
      category: "relatorios"
    },
    {
      question: "O que fazer se esquecer minha senha?",
      answer: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas para seu email cadastrado.",
      category: "conta"
    },
    {
      question: "Como funciona o período de teste?",
      answer: "Ao se cadastrar, você tem acesso gratuito a todos os recursos Premium por 30 dias. Após este período, você pode escolher um plano adequado.",
      category: "planos"
    },
    {
      question: "Posso usar o sistema em dispositivos móveis?",
      answer: "Sim! O Pavisoft é responsivo e funciona perfeitamente em smartphones e tablets através do navegador.",
      category: "geral"
    },
    {
      question: "Como configurar o pacote de funcionários?",
      answer: "No painel Admin, acesse 'Pacotes' e escolha a quantidade adicional de funcionários. O sistema ativará automaticamente os funcionários bloqueados quando o pagamento for confirmado.",
      category: "admin"
    },
    {
      question: "O que acontece se meu plano vencer?",
      answer: "Você receberá avisos 7, 3 e 1 dia antes do vencimento. Se o plano vencer, sua conta será bloqueada até a renovação. Todos os dados são preservados.",
      category: "planos"
    }
  ];

  const tutoriais = [
    {
      titulo: "Primeiros Passos no Pavisoft",
      descricao: "Aprenda a configurar sua conta e começar a usar o sistema",
      duracao: "8 min",
      nivel: "Iniciante",
      icon: Zap
    },
    {
      titulo: "Configuração de Notas Fiscais",
      descricao: "Passo a passo para emitir NFC-e e NF-e",
      duracao: "15 min",
      nivel: "Intermediário",
      icon: FileText
    },
    {
      titulo: "Gestão de Funcionários",
      descricao: "Como adicionar e gerenciar permissões de usuários",
      duracao: "10 min",
      nivel: "Intermediário",
      icon: Headphones
    },
    {
      titulo: "Relatórios Financeiros Completos",
      descricao: "Domine os relatórios de DRE, fluxo de caixa e contas",
      duracao: "12 min",
      nivel: "Avançado",
      icon: BookOpen
    }
  ];

  const canaisSuporte = [
    {
      icon: MessageCircle,
      titulo: "WhatsApp",
      descricao: "Atendimento rápido via WhatsApp",
      disponibilidade: "Seg-Sex: 8h às 18h",
      link: "https://wa.me/5598985085498",
      badge: "Mais Rápido",
      badgeColor: "bg-green-500"
    },
    {
      icon: Mail,
      titulo: "Email",
      descricao: "pavisoft.suporte@gmail.com",
      disponibilidade: "Resposta em até 24h",
      link: "mailto:pavisoft.suporte@gmail.com",
      badge: "Suporte Técnico",
      badgeColor: "bg-blue-500"
    },
    {
      icon: Phone,
      titulo: "Telefone",
      descricao: "(98) 98508-5498",
      disponibilidade: "Seg-Sex: 8h às 18h",
      link: "tel:+5598985085498",
      badge: "Urgências",
      badgeColor: "bg-orange-500"
    }
  ];

  const baseConhecimento = [
    {
      categoria: "🚀 Começando",
      artigos: [
        "Como criar sua primeira conta",
        "Configuração inicial do sistema",
        "Cadastro de produtos em massa",
        "Primeiras vendas no PDV"
      ]
    },
    {
      categoria: "📊 Gestão",
      artigos: [
        "Controle de estoque avançado",
        "Gerenciamento de fornecedores",
        "Sistema de devoluções",
        "Relatórios personalizados"
      ]
    },
    {
      categoria: "💰 Financeiro",
      artigos: [
        "Contas a pagar e receber",
        "Fluxo de caixa projetado",
        "DRE simplificado",
        "Controle de inadimplência"
      ]
    },
    {
      categoria: "🧾 Fiscal",
      artigos: [
        "Configuração de certificado digital",
        "Emissão de NFC-e",
        "Emissão de NF-e",
        "Cancelamento de notas"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <nav className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Package className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Pavisoft Sistemas
                </span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10">
                Voltar ao Site
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Central de Ajuda & Termos
            </h1>
            <p className="text-gray-400 text-lg">
              Suporte completo e informações legais do Pavisoft
            </p>
          </div>

          {/* Tabs Principais - Ajuda e Termos */}
          <Tabs defaultValue="ajuda" className="mb-12">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-blue-500/20 mb-8">
              <TabsTrigger value="ajuda" className="data-[state=active]:bg-blue-500/20">
                <HelpCircle className="mr-2 h-4 w-4" />
                Central de Ajuda
              </TabsTrigger>
              <TabsTrigger value="termos" className="data-[state=active]:bg-blue-500/20">
                <ScrollText className="mr-2 h-4 w-4" />
                Termos de Uso
              </TabsTrigger>
            </TabsList>

            {/* SEÇÃO DE AJUDA */}
            <TabsContent value="ajuda" className="space-y-8">
              {/* Busca */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por palavra-chave, produto, funcionalidade..."
                  className="pl-12 bg-slate-900/50 border-blue-500/20 text-white placeholder:text-gray-500 h-14 text-lg"
                />
              </div>

              {/* Canais de Suporte */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Headphones className="h-6 w-6 text-blue-400" />
                    Fale Conosco Agora
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Escolha o canal de atendimento que melhor se adequa à sua necessidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {canaisSuporte.map((canal, index) => (
                      <a
                        key={index}
                        href={canal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/60 hover:bg-slate-900/70 transition-all cursor-pointer h-full group">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <canal.icon className="h-6 w-6 text-white" />
                              </div>
                              <Badge className={`${canal.badgeColor} text-white`}>
                                {canal.badge}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {canal.titulo}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3">
                              {canal.descricao}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {canal.disponibilidade}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-blue-400 text-sm font-medium">
                              Abrir agora
                              <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sub-abas de Ajuda */}
              <Tabs defaultValue="faqs">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-blue-500/20">
                  <TabsTrigger value="faqs" className="data-[state=active]:bg-blue-500/20">
                    Perguntas Frequentes
                  </TabsTrigger>
                  <TabsTrigger value="tutoriais" className="data-[state=active]:bg-blue-500/20">
                    Tutoriais em Vídeo
                  </TabsTrigger>
                  <TabsTrigger value="base" className="data-[state=active]:bg-blue-500/20">
                    Base de Conhecimento
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="faqs">
                  <Card className="bg-slate-900/50 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">Perguntas Frequentes</CardTitle>
                      <CardDescription className="text-gray-400">
                        Respostas rápidas para as dúvidas mais comuns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                          <AccordionItem key={index} value={`item-${index}`} className="border-blue-500/20">
                            <AccordionTrigger className="text-white hover:text-blue-400">
                              <div className="flex items-start gap-3 text-left">
                                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>{faq.question}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400 pl-8">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tutoriais">
                  <Card className="bg-slate-900/50 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">Tutoriais em Vídeo</CardTitle>
                      <CardDescription className="text-gray-400">
                        Aprenda assistindo nossos guias passo a passo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {tutoriais.map((tutorial, index) => (
                          <Card key={index} className="bg-slate-800/50 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                  <tutorial.icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-white font-semibold mb-2">{tutorial.titulo}</h3>
                                  <p className="text-gray-400 text-sm mb-3">{tutorial.descricao}</p>
                                  <div className="flex items-center gap-3 text-xs">
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                                      {tutorial.nivel}
                                    </Badge>
                                    <span className="text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {tutorial.duracao}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="base">
                  <Card className="bg-slate-900/50 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">Base de Conhecimento</CardTitle>
                      <CardDescription className="text-gray-400">
                        Documentação completa organizada por categoria
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {baseConhecimento.map((secao, index) => (
                          <div key={index} className="space-y-3">
                            <h3 className="text-lg font-semibold text-white mb-3">
                              {secao.categoria}
                            </h3>
                            <ul className="space-y-2">
                              {secao.artigos.map((artigo, idx) => (
                                <li key={idx}>
                                  <a
                                    href="#"
                                    className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors group"
                                  >
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    <span className="text-sm">{artigo}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* CTA Final */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardContent className="py-8">
                  <h3 className="text-2xl font-semibold text-white mb-2 text-center">
                    Não encontrou o que procurava?
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-2xl mx-auto text-center">
                    Nossa equipe de suporte está pronta para ajudar você a resolver qualquer dúvida ou problema. 
                    Entre em contato e teremos o prazer em atendê-lo!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => window.open('https://wa.me/5598985085498', '_blank')}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Link href="/contato">
                      <Button variant="outline" className="border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10 w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar Email
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEÇÃO DE TERMOS DE USO */}
            <TabsContent value="termos">
              <Card className="bg-slate-900/50 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-3xl text-white">Termos de Uso do Pavisoft Sistemas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Última atualização: 13 de novembro de 2025
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <div className="space-y-8 text-gray-300">
                    {/* 1. Aceitação dos Termos */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
                      <p className="mb-4">
                        Ao acessar e utilizar o Pavisoft Sistemas ("Serviço"), você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com estes termos, não utilize o Serviço.
                      </p>
                      <p>
                        O Pavisoft é operado pela Pavisoft Sistemas Ltda., inscrita no CNPJ sob o nº [INSERIR CNPJ], com sede em [INSERIR ENDEREÇO].
                      </p>
                    </section>

                    {/* 2. Descrição do Serviço */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
                      <p className="mb-4">
                        O Pavisoft é um sistema de gestão empresarial completo que oferece funcionalidades incluindo, mas não limitadas a:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Gestão de produtos e estoque</li>
                        <li>Ponto de Venda (PDV)</li>
                        <li>Emissão de notas fiscais eletrônicas (NF-e e NFC-e)</li>
                        <li>Controle financeiro e relatórios</li>
                        <li>Gestão de clientes e fornecedores</li>
                        <li>Sistema de caixa e fluxo de caixa</li>
                      </ul>
                    </section>

                    {/* 3. Cadastro e Conta */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">3. Cadastro e Conta</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">3.1 Registro</h3>
                      <p className="mb-4">
                        Para utilizar o Serviço, você deve criar uma conta fornecendo informações precisas, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso.
                      </p>
                      
                      <h3 className="text-xl font-semibold text-white mb-3">3.2 Responsabilidade</h3>
                      <p className="mb-4">
                        Você é responsável por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente sobre qualquer uso não autorizado.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3">3.3 Período de Teste</h3>
                      <p>
                        Novos usuários têm direito a um período de teste gratuito de 30 dias com acesso completo aos recursos Premium. Após esse período, é necessário escolher um plano de assinatura.
                      </p>
                    </section>

                    {/* 4. Planos e Pagamentos */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">4. Planos e Pagamentos</h2>
                      <h3 className="text-xl font-semibold text-white mb-3">4.1 Planos de Assinatura</h3>
                      <p className="mb-4">
                        O Pavisoft oferece diferentes planos de assinatura (Básico, Profissional, Premium) com funcionalidades e preços variados. Os detalhes de cada plano estão disponíveis em nossa página de preços.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3">4.2 Pagamento</h3>
                      <p className="mb-4">
                        Os pagamentos são processados através do Mercado Pago. Ao assinar um plano, você autoriza cobranças recorrentes no cartão de crédito ou método de pagamento escolhido.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3">4.3 Renovação Automática</h3>
                      <p className="mb-4">
                        As assinaturas são renovadas automaticamente no final de cada período de cobrança, a menos que você cancele antes da renovação.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3">4.4 Cancelamento</h3>
                      <p className="mb-4">
                        Você pode cancelar sua assinatura a qualquer momento através do painel de administração. O cancelamento terá efeito no final do período de cobrança atual.
                      </p>

                      <h3 className="text-xl font-semibold text-white mb-3">4.5 Reembolsos</h3>
                      <p>
                        Não oferecemos reembolsos para períodos de assinatura já pagos, exceto quando exigido por lei.
                      </p>
                    </section>

                    {/* 5. Uso Aceitável */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">5. Uso Aceitável</h2>
                      <p className="mb-4">Você concorda em NÃO utilizar o Serviço para:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Violar qualquer lei ou regulamento aplicável</li>
                        <li>Realizar atividades fraudulentas ou ilegais</li>
                        <li>Transmitir vírus, malware ou qualquer código malicioso</li>
                        <li>Tentar acessar áreas restritas do sistema sem autorização</li>
                        <li>Realizar engenharia reversa, descompilar ou desmontar o software</li>
                        <li>Revender ou redistribuir o Serviço sem autorização expressa</li>
                        <li>Sobrecarregar intencionalmente nossa infraestrutura</li>
                      </ul>
                    </section>

                    {/* 6. Propriedade Intelectual */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">6. Propriedade Intelectual</h2>
                      <p className="mb-4">
                        Todo o conteúdo, funcionalidades e recursos do Pavisoft, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, código e software, são propriedade exclusiva da Pavisoft Sistemas ou de seus licenciadores.
                      </p>
                      <p>
                        Você recebe uma licença limitada, não exclusiva e revogável para usar o Serviço conforme estes Termos.
                      </p>
                    </section>

                    {/* 7. Proteção de Dados */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">7. Proteção de Dados (LGPD)</h2>
                      <p className="mb-4">
                        O tratamento de dados pessoais no Pavisoft está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Para mais detalhes, consulte nossa <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Política de Privacidade</Link>.
                      </p>
                      <p className="mb-4">
                        <strong>Seus dados:</strong> Você mantém todos os direitos sobre os dados que insere no sistema. Nós apenas processamos esses dados para fornecer o Serviço.
                      </p>
                      <p>
                        <strong>Nossos dados:</strong> Coletamos dados necessários para operação do sistema e melhorias do serviço, sempre respeitando sua privacidade.
                      </p>
                    </section>

                    {/* 8. Segurança */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">8. Segurança</h2>
                      <p className="mb-4">
                        Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger seus dados. No entanto, nenhum sistema é 100% seguro, e não podemos garantir segurança absoluta.
                      </p>
                      <p>
                        Realizamos backups regulares dos dados, mas recomendamos que você mantenha seus próprios backups de informações críticas.
                      </p>
                    </section>

                    {/* 9. Disponibilidade do Serviço */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">9. Disponibilidade do Serviço</h2>
                      <p className="mb-4">
                        Nos esforçamos para manter o Serviço disponível 24/7, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenções programadas mediante aviso prévio.
                      </p>
                      <p>
                        Não nos responsabilizamos por interrupções causadas por fatores fora de nosso controle, como falhas de internet, energia elétrica ou ataques cibernéticos.
                      </p>
                    </section>

                    {/* 10. Limitação de Responsabilidade */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">10. Limitação de Responsabilidade</h2>
                      <p className="mb-4">
                        O Serviço é fornecido "como está" e "conforme disponível". Não garantimos que o Serviço será livre de erros ou interrupções.
                      </p>
                      <p className="mb-4">
                        Em nenhuma circunstância seremos responsáveis por:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Perda de lucros, receitas ou dados</li>
                        <li>Danos indiretos, incidentais ou consequenciais</li>
                        <li>Problemas causados por uso inadequado do sistema</li>
                        <li>Decisões de negócio tomadas com base nos dados do sistema</li>
                      </ul>
                      <p className="mt-4">
                        Nossa responsabilidade total está limitada ao valor pago por você nos últimos 12 meses.
                      </p>
                    </section>

                    {/* 11. Fiscalização */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">11. Conformidade Fiscal</h2>
                      <p className="mb-4">
                        O Pavisoft oferece recursos para emissão de notas fiscais eletrônicas. Você é responsável por:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Configurar corretamente suas credenciais fiscais</li>
                        <li>Garantir a precisão das informações fiscais inseridas</li>
                        <li>Cumprir com todas as obrigações tributárias aplicáveis</li>
                        <li>Manter seus certificados digitais válidos e atualizados</li>
                      </ul>
                      <p className="mt-4">
                        Não prestamos consultoria tributária. Recomendamos consultar um contador para questões fiscais específicas.
                      </p>
                    </section>

                    {/* 12. Modificações do Serviço */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">12. Modificações do Serviço</h2>
                      <p className="mb-4">
                        Reservamos o direito de modificar, suspender ou descontinuar qualquer parte do Serviço a qualquer momento, mediante aviso prévio quando possível.
                      </p>
                      <p>
                        Podemos adicionar novas funcionalidades ou alterar recursos existentes. Funcionalidades principais nunca serão removidas sem aviso prévio de pelo menos 30 dias.
                      </p>
                    </section>

                    {/* 13. Rescisão */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">13. Rescisão</h2>
                      <p className="mb-4">
                        Podemos suspender ou encerrar sua conta se você violar estes Termos de Uso. Você pode encerrar sua conta a qualquer momento através do painel de administração.
                      </p>
                      <p>
                        Após o encerramento, seus dados serão mantidos por 90 dias para permitir reativação. Após esse período, os dados serão permanentemente excluídos, exceto quando a retenção for exigida por lei.
                      </p>
                    </section>

                    {/* 14. Alterações nos Termos */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">14. Alterações nos Termos</h2>
                      <p className="mb-4">
                        Podemos atualizar estes Termos periodicamente. Notificaremos você sobre alterações significativas com pelo menos 30 dias de antecedência via email ou notificação no sistema.
                      </p>
                      <p>
                        O uso continuado do Serviço após a entrada em vigor das alterações constitui aceitação dos novos termos.
                      </p>
                    </section>

                    {/* 15. Lei Aplicável */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">15. Lei Aplicável e Foro</h2>
                      <p className="mb-4">
                        Estes Termos são regidos pelas leis da República Federativa do Brasil.
                      </p>
                      <p>
                        Fica eleito o foro da comarca de [INSERIR CIDADE], Estado de [INSERIR ESTADO], para dirimir quaisquer controvérsias decorrentes destes Termos.
                      </p>
                    </section>

                    {/* 16. Contato */}
                    <section>
                      <h2 className="text-2xl font-semibold text-white mb-4">16. Contato</h2>
                      <p className="mb-4">
                        Para questões sobre estes Termos de Uso, entre em contato conosco:
                      </p>
                      <ul className="list-none space-y-2">
                        <li><strong>Email:</strong> termos@pavisoft.com.br</li>
                        <li><strong>Suporte:</strong> pavisoft.suporte@gmail.com</li>
                        <li><strong>WhatsApp:</strong> (98) 98508-5498</li>
                        <li><strong>Telefone:</strong> (98) 98508-5498</li>
                      </ul>
                    </section>

                    {/* Box de Aceitação */}
                    <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h3 className="text-xl font-semibold text-white mb-3">Aceitação dos Termos</h3>
                      <p className="text-gray-300">
                        Ao criar uma conta e utilizar o Pavisoft Sistemas, você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa Política de Privacidade.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-blue-400" />
            <span className="text-white font-bold">Pavisoft Sistemas</span>
          </div>
          <p className="text-sm">© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-blue-400">Privacidade</Link>
            <span>•</span>
            <a href="#termos" className="text-gray-400 hover:text-blue-400">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
