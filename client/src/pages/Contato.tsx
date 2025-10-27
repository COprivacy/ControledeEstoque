
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Mail, 
  MessageSquare,
  Send,
  MapPin,
  Phone
} from "lucide-react";

export default function Contato() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Mensagem enviada!",
          description: "Obrigado pelo contato. Responderemos em breve.",
        });
        setFormData({ nome: "", email: "", assunto: "", mensagem: "" });
      } else {
        throw new Error("Erro ao enviar mensagem");
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Entre em Contato
            </h1>
            <p className="text-gray-400 text-lg">
              Estamos aqui para ajudar. Envie sua mensagem e responderemos em breve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-slate-900/50 border-blue-500/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Email</CardTitle>
                <CardDescription className="text-gray-400">
                  pavisoft.suporte@gmail.com
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-blue-500/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Telefone</CardTitle>
                <CardDescription className="text-gray-400">
                  Em breve
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-900/50 border-blue-500/20">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Localização</CardTitle>
                <CardDescription className="text-gray-400">
                  São Paulo, SP - Brasil
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Envie sua Mensagem</CardTitle>
              <CardDescription className="text-gray-400">
                Preencha o formulário abaixo e entraremos em contato o mais breve possível
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-white">Nome Completo *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      placeholder="Seu nome"
                      className="bg-slate-800/50 border-blue-500/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="seu@email.com"
                      className="bg-slate-800/50 border-blue-500/20 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto" className="text-white">Assunto *</Label>
                  <Input
                    id="assunto"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleChange}
                    required
                    placeholder="Sobre o que você quer falar?"
                    className="bg-slate-800/50 border-blue-500/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem" className="text-white">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    required
                    placeholder="Escreva sua mensagem aqui..."
                    rows={6}
                    className="bg-slate-800/50 border-blue-500/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
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
