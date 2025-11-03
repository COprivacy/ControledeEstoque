import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check, CreditCard, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface EmployeePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit: number;
}

export function EmployeePurchaseDialog({
  open,
  onOpenChange,
  currentLimit,
}: EmployeePurchaseDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const pacotes = [
    {
      id: "pacote_5",
      nome: "+5 Funcionários",
      quantidade: 5,
      preco: "R$ 49,99",
      precoNumerico: 49.99,
      descricao: "Pacote Básico",
      destaque: false,
      recursos: [
        "✅ 5 funcionários adicionais",
        "✅ Ativação imediata",
        "✅ Suporte por email",
      ],
    },
    {
      id: "pacote_10",
      nome: "+10 Funcionários",
      quantidade: 10,
      preco: "R$ 89,99",
      precoNumerico: 89.99,
      descricao: "Mais Popular",
      destaque: true,
      recursos: [
        "✅ 10 funcionários adicionais",
        "✅ Ativação imediata",
        "✅ Suporte prioritário",
        "💰 Economize R$ 10",
      ],
    },
    {
      id: "pacote_20",
      nome: "+20 Funcionários",
      quantidade: 20,
      preco: "R$ 159,99",
      precoNumerico: 159.99,
      descricao: "Ótimo Custo-Benefício",
      destaque: false,
      recursos: [
        "✅ 20 funcionários adicionais",
        "✅ Ativação imediata",
        "✅ Suporte prioritário",
        "💰 Economize R$ 40",
      ],
    },
    {
      id: "pacote_50",
      nome: "+50 Funcionários",
      quantidade: 50,
      preco: "R$ 349,99",
      precoNumerico: 349.99,
      descricao: "Para Empresas",
      destaque: false,
      recursos: [
        "✅ 50 funcionários adicionais",
        "✅ Ativação imediata",
        "✅ Suporte prioritário",
        "💰 Economize R$ 150",
        "⭐ Consultoria exclusiva",
      ],
    },
  ];

  const handlePurchase = async (pacote: typeof pacotes[0]) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest("POST", "/api/purchase-employees", {
        pacoteId: pacote.id,
        quantidade: pacote.quantidade,
        valor: pacote.precoNumerico,
        nomePacote: pacote.nome,
      });

      const response = await res.json();

      if (response.payment?.invoiceUrl) {
        window.open(response.payment.invoiceUrl, "_blank");
      } else if (response.payment?.bankSlipUrl) {
        window.open(response.payment.bankSlipUrl, "_blank");
      }

      toast({
        title: "🎉 Pacote selecionado!",
        description: `Você será redirecionado para o pagamento do pacote ${pacote.nome}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao processar compra",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-purchase-employees">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Adicione Mais Funcionários
          </DialogTitle>
          <DialogDescription className="text-base">
            Seu limite atual é de <strong>{currentLimit}</strong> funcionário(s). 
            Escolha um pacote abaixo para expandir sua equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {pacotes.map((pacote) => (
            <Card
              key={pacote.id}
              className={`relative ${
                pacote.destaque
                  ? "border-primary border-2 shadow-lg"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              data-testid={`card-pacote-${pacote.id}`}
            >
              {pacote.destaque && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Mais Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <CardTitle className="text-lg font-bold" data-testid={`text-nome-${pacote.id}`}>
                  {pacote.nome}
                </CardTitle>
                <CardDescription className="text-sm" data-testid={`text-descricao-${pacote.id}`}>
                  {pacote.descricao}
                </CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-primary" data-testid={`text-preco-${pacote.id}`}>
                    {pacote.preco}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">Pagamento único</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pacote.recursos.map((recurso, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`item-recurso-${pacote.id}-${index}`}
                    >
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{recurso}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={pacote.destaque ? "default" : "outline"}
                  onClick={() => handlePurchase(pacote)}
                  disabled={isProcessing}
                  data-testid={`button-comprar-${pacote.id}`}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Comprar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Importante:</strong> O limite de funcionários é aumentado imediatamente após a confirmação do pagamento.
            Você receberá um email com os detalhes da transação.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}