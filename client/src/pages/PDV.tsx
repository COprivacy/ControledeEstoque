import { useLocation } from "wouter";
import PDVScanner from "@/components/PDVScanner";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PDV - Ponto de Venda</h1>
          <p className="text-sm text-muted-foreground">
            Escaneie os produtos para adicionar ao carrinho
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      <PDVScanner
        onSaleComplete={handleSaleComplete}
        onProductNotFound={handleProductNotFound}
        onFetchProduct={fetchProduct}
      />
    </div>
  );
}
