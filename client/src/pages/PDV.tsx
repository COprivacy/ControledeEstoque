import { useLocation } from "wouter";
import PDVScanner from "@/components/PDVScanner";
import { useToast } from "@/hooks/use-toast";

export default function PDV() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const fetchProduct = async (barcode: string) => {
    try {
      const response = await fetch(`/api/produtos/codigo/${barcode}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  const handleSaleComplete = async (sale: any) => {
    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar venda');
      }

      const result = await response.json();
      
      toast({
        title: "Venda registrada com sucesso!",
        description: `Total: R$ ${sale.valorTotal.toFixed(2)}`,
      });

      console.log("Venda registrada:", result);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: error.message,
      });
    }
  };

  const handleProductNotFound = (barcode: string) => {
    toast({
      variant: "destructive",
      title: "Produto não encontrado",
      description: `Código de barras: ${barcode}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">PDV - Ponto de Venda</h1>
        <p className="text-sm text-muted-foreground">
          Escaneie os produtos para adicionar ao carrinho
        </p>
      </div>

      <PDVScanner
        onSaleComplete={handleSaleComplete}
        onProductNotFound={handleProductNotFound}
        onFetchProduct={fetchProduct}
      />
    </div>
  );
}
