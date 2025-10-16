import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Plus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/produtos"],
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

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Produtos</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu catálogo de produtos</p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <Button onClick={() => setLocation("/produtos/adicionar")} data-testid="button-add-product" className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:shadow-lg transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <div className="space-y-3">
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            {...product}
            onEdit={(id) => setLocation(`/produtos/editar/${id}`)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
