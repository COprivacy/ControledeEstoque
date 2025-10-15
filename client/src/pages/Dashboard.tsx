import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCards from "@/components/StatsCards";
import ProductCard from "@/components/ProductCard";
import { Plus, Package, Search, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
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

  // Filtrar produtos pela pesquisa
  const filteredProducts = products.filter((p: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(searchLower) ||
      p.codigo_barras?.toLowerCase().includes(searchLower) ||
      p.categoria?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu estoque</p>
          </div>
          <Badge className="bg-yellow-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-products"
            />
          </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Todos os Produtos</h2>
          {searchTerm && (
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto cadastrado
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum produto encontrado para "{searchTerm}"
            </p>
          ) : (
            filteredProducts.map((product: any) => (
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
