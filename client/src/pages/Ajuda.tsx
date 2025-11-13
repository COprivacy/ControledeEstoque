
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
  ExternalLink
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
              Central de Ajuda
            </h1>
            <p className="text-gray-400 text-lg">
              Estamos aqui para ajudar você a tirar o máximo do Pavisoft
            </p>
          </div>

          {/* Busca */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por palavra-chave, produto, funcionalidade..."
                className="pl-12 bg-slate-900/50 border-blue-500/20 text-white placeholder:text-gray-500 h-14 text-lg"
              />
            </div>
          </div>

          {/* Canais de Suporte - Destaque */}
          <div className="mb-12">
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
          </div>

          {/* Conteúdo em Abas */}
          <Tabs defaultValue="faqs" className="mb-12">
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

            {/* FAQs */}
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

            {/* Tutoriais */}
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

            {/* Base de Conhecimento */}
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

          {/* Recursos Adicionais */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-slate-900/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Canal no YouTube</CardTitle>
                    <CardDescription className="text-gray-400">
                      Tutoriais completos e atualizações
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Video className="mr-2 h-4 w-4" />
                  Inscrever-se no Canal
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Documentação Técnica</CardTitle>
                    <CardDescription className="text-gray-400">
                      API, integrações e desenvolvimento
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-blue-400/30 hover:border-blue-400 hover:bg-blue-500/10">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Acessar Documentação
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Final */}
          <div className="text-center">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="py-8">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Não encontrou o que procurava?
                </h3>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
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
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Package className="h-6 w-6 text-blue-400" />
            <span className="text-white font-bold">Pavisoft Sistemas</span>
          </div>
          <p className="text-sm">© 2025 Pavisoft Sistemas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
