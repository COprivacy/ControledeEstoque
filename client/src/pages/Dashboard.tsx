import { Button } from "@/components/ui/button";
import StatsCards from "@/components/StatsCards";
import ProductCard from "@/components/ProductCard";
import { Plus, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/produtos"],
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/produtos/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar produto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do estoque",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  const lowStockProducts = products.filter((p: any) => p.quantidade < p.estoque_minimo);
  
  const today = new Date().toISOString().split('T')[0];
  const todaySales = vendas
    .filter((v: any) => v.data?.startsWith(today))
    .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu estoque</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation("/produtos/adicionar")} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
          <Button variant="outline" onClick={() => setLocation("/vendas/registrar")} data-testid="button-register-sale">
            <Package className="h-4 w-4 mr-2" />
            Registrar Venda
          </Button>
        </div>
      </div>

      <StatsCards
        totalProdutos={products.length}
        produtosBaixoEstoque={lowStockProducts.length}
        vendasHoje={todaySales}
      />

      {lowStockProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-destructive">Produtos com Estoque Baixo</h2>
            <span className="text-sm text-muted-foreground">({lowStockProducts.length} produtos)</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Todos os Produtos</h2>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto cadastrado
            </p>
          ) : (
            products.map((product: any) => (
              <ProductCard
                key={product.id}
                {...product}
                onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
