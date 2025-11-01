import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/CheckoutForm";

export default function Planos() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plano: "premium_mensal" | "premium_anual";
    planoNome: string;
    planoPreco: string;
  } | null>(null);

  const planos = [
    {
      nome: "Plano Mensal",
      preco: "R$ 79,99",
      periodo: "/mês",
      descricao: "Ideal para começar",
      recursos: [
        "Acesso completo ao sistema",
        "PDV e controle de caixa",
        "Gestão de produtos e estoque",
        "Emissão de NFC-e",
        "Relatórios e dashboards",
        "Gestão financeira completa",
        "Suporte por email"
      ],
      tipo: "mensal"
    },
    {
      nome: "Plano Anual",
      preco: "R$ 67,99",
      periodo: "/mês",
      descricao: "Mais Popular - Economize 15%",
      destaque: true,
      recursos: [
        "Tudo do plano mensal",
        "Economize R$ 143,98 por ano",
        "Suporte prioritário",
        "Backups automáticos"
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
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

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4" data-testid="text-duvidas">
            Tem dúvidas? Entre em contato conosco
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm" data-testid="text-contato">
            Email: pavisoft.suporte@gmail.com
          </p>
        </div>
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