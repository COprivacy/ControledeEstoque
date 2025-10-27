import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const checkoutSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  formaPagamento: z.enum(["BOLETO", "CREDIT_CARD", "PIX"], {
    errorMap: () => ({ message: "Selecione uma forma de pagamento" }),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: "premium_mensal" | "premium_anual";
  planoNome: string;
  planoPreco: string;
}

export function CheckoutForm({
  open,
  onOpenChange,
  plano,
  planoNome,
  planoPreco,
}: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nome: "",
      email: "",
      cpfCnpj: "",
      formaPagamento: "PIX",
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          plano,
        }),
      });

      if (response.payment?.invoiceUrl) {
        window.open(response.payment.invoiceUrl, "_blank");
      } else if (response.payment?.bankSlipUrl) {
        window.open(response.payment.bankSlipUrl, "_blank");
      }

      toast({
        title: "Cobrança criada!",
        description: response.message || "Sua cobrança foi criada com sucesso.",
      });

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Assinar {planoNome}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Preencha seus dados para finalizar a assinatura de {planoPreco}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">
                    Nome Completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Seu nome completo"
                      className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      data-testid="input-checkout-nome"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      data-testid="input-checkout-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">
                    CPF/CNPJ
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000.000.000-00"
                      className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      data-testid="input-checkout-cpfcnpj"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900 dark:text-white">
                    Forma de Pagamento
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger
                        className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        data-testid="select-forma-pagamento"
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      <SelectItem value="PIX" data-testid="option-pix">
                        PIX
                      </SelectItem>
                      <SelectItem value="BOLETO" data-testid="option-boleto">
                        Boleto Bancário
                      </SelectItem>
                      <SelectItem
                        value="CREDIT_CARD"
                        data-testid="option-credit-card"
                      >
                        Cartão de Crédito
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-cancel-checkout"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                disabled={isSubmitting}
                data-testid="button-submit-checkout"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar Assinatura"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
