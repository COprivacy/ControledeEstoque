import { useLocation } from "wouter";
import SalesForm from "@/components/SalesForm";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function RegisterSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/produtos"],
  });

  const createSaleMutation = useMutation({
    mutationFn: async (sale: any) => {
      const produto = products.find((p: any) => p.id === sale.produtoId);
      const response = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: [{
            codigo_barras: produto.codigo_barras,
            quantidade: sale.quantidade,
          }],
        }),
      });
      if (!response.ok) throw new Error("Erro ao registrar venda");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Venda registrada!",
        description: `Total: R$ ${data.valor_total.toFixed(2)}`,
      });
      setLocation("/vendas");
    },
  });

  const handleSubmit = (sale: any) => {
    createSaleMutation.mutate(sale);
  };

  const handleCancel = () => {
    setLocation("/vendas");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registrar Venda</h1>
        <p className="text-sm text-muted-foreground">Registre uma nova venda no sistema</p>
      </div>
      
      <div className="max-w-2xl">
        <SalesForm products={products} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
