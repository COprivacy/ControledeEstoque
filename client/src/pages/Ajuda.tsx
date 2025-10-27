
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
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Ajuda() {
  const faqs = [
    {
      question: "Como faço para cadastrar produtos?",
      answer: "Acesse o menu 'Produtos' no painel lateral e clique em 'Adicionar Produto'. Preencha as informações como nome, código de barras, preço e quantidade em estoque."
    },
    {
      question: "Como emitir uma NFC-e?",
      answer: "Configure primeiro suas credenciais fiscais em 'Configurações Fiscais'. Depois, ao realizar uma venda no PDV, selecione a opção 'Emitir NFC-e' antes de finalizar."
    },
    {
      question: "Como adicionar funcionários?",
      answer: "No menu 'Admin' (disponível apenas para administradores), acesse a aba 'Funcionários' e clique em 'Adicionar Funcionário'. Defina as permissões adequadas para cada colaborador."
    },
    {
      question: "Como funciona o controle de estoque?",
      answer: "O sistema atualiza automaticamente o estoque a cada venda realizada. Você pode fazer ajustes manuais em 'Inventário' e receber alertas de produtos com estoque baixo."
    },
    {
      question: "Como visualizar relatórios de vendas?",
      answer: "Acesse a seção 'Relatórios' no menu principal. Você pode filtrar por período, produto, vendedor e muito mais para análises detalhadas."
    },
    {
      question: "O que fazer se esquecer minha senha?",
      answer: "Na tela de login, clique em 'Esqueci minha senha' e siga as instruções enviadas para seu email cadastrado."
    },
    {
      question: "Como funciona o período de teste?",
      answer: "Ao se cadastrar, você tem acesso gratuito a todos os recursos Premium por 30 dias. Após este período, você pode escolher um plano adequado."
    },
    {
      question: "Posso usar o sistema em dispositivos móveis?",
      answer: "Sim! O Pavisoft é responsivo e funciona perfeitamente em smartphones e tablets através do navegador."
    }
  ];

  const recursos = [
    {
      icon: BookOpen,
      title: "Documentação",
      description: "Guias completos sobre todas as funcionalidades",
      link: "#"
    },
    {
      icon: Video,
      title: "Tutoriais em Vídeo",
      description: "Assista vídeos explicativos passo a passo",
      link: "#"
    },
    {
      icon: MessageCircle,
      title: "Suporte por Email",
      description: "Entre em contato com nossa equipe",
      link: "/contato"
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Central de Ajuda
            </h1>
            <p className="text-gray-400 text-lg">
              Encontre respostas para suas dúvidas sobre o Pavisoft
            </p>
          </div>

          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por palavra-chave..."
                className="pl-10 bg-slate-900/50 border-blue-500/20 text-white placeholder:text-gray-500 h-12"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {recursos.map((recurso, index) => (
              <Link key={index} href={recurso.link}>
                <Card className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <recurso.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{recurso.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {recurso.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Perguntas Frequentes</CardTitle>
              <CardDescription className="text-gray-400">
                Respostas para as dúvidas mais comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-blue-500/20">
                    <AccordionTrigger className="text-white hover:text-blue-400">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="py-8">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Não encontrou o que procurava?
                </h3>
                <p className="text-gray-400 mb-6">
                  Nossa equipe de suporte está pronta para ajudar você
                </p>
                <Link href="/contato">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Fale Conosco
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
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
